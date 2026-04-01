/**
 * Relationship Detector — 3-pass algorithm to find related issues
 * Pass 1: Build inverted index (keyword → issueIds)
 * Pass 2: Score pairwise relationships
 * Pass 3: Union-find clustering → InsightCluster[]
 */

import { extractKeywords, type KeywordResult } from "./keywords";
import type { Severity } from "./signal";
import { SEVERITY_PRIORITY, maxSeverity } from "./signal";

// ─── Types ───────────────────────────────────────────────────────────

export interface IssueInput {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  phase?: string;
  severity?: Severity;
  project?: string;
  status?: string;
  component?: string;
}

export interface RelationshipEdge {
  issueA: string;
  issueB: string;
  score: number;
  reasons: string[];
}

export interface InsightCluster {
  id: string;
  issues: IssueInput[];
  edges: RelationshipEdge[];
  severity: Severity;
  sharedComponents: string[];
  sharedPhases: string[];
  sharedOwners: string[];
  sharedProjects: string[];
  explanation: { vi: string; en: string };
  recommendation: { vi: string; en: string };
}

export interface ScanResult {
  clusters: InsightCluster[];
  totalIssues: number;
  totalRelationships: number;
  scanTimeMs: number;
}

// ─── Weights ─────────────────────────────────────────────────────────

const WEIGHTS = {
  componentMatch: 0.35,
  keywordOverlap: 0.3,
  ownerMatch: 0.1,
  phaseMatch: 0.1,
  severityAlignment: 0.1,
  projectMatch: 0.05,
} as const;

const THRESHOLD = 0.25;

// ─── Union-Find ──────────────────────────────────────────────────────

class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
    let root = x;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    // Path compression
    let current = x;
    while (current !== root) {
      const next = this.parent.get(current)!;
      this.parent.set(current, root);
      current = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return;

    const rankA = this.rank.get(rootA)!;
    const rankB = this.rank.get(rootB)!;
    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }
  }

  getGroups(): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(key);
    }
    return groups;
  }
}

// ─── Relationship Detector ───────────────────────────────────────────

export class RelationshipDetector {
  /**
   * Scan issues and return clusters of related issues
   */
  scan(issues: IssueInput[]): ScanResult {
    const start = performance.now();

    if (issues.length < 2) {
      return { clusters: [], totalIssues: issues.length, totalRelationships: 0, scanTimeMs: 0 };
    }

    // Build issue map and keyword data
    const issueMap = new Map<string, IssueInput>();
    const keywordMap = new Map<string, KeywordResult>();

    for (const issue of issues) {
      issueMap.set(issue.id, issue);
      keywordMap.set(issue.id, extractKeywords(issue.title, issue.description));
    }

    // ── Pass 1: Build inverted index ──
    const invertedIndex = new Map<string, Set<string>>();
    for (const [issueId, kw] of keywordMap) {
      for (const keyword of kw.keywords) {
        if (!invertedIndex.has(keyword)) invertedIndex.set(keyword, new Set());
        invertedIndex.get(keyword)!.add(issueId);
      }
      for (const comp of kw.components) {
        const key = `component:${comp}`;
        if (!invertedIndex.has(key)) invertedIndex.set(key, new Set());
        invertedIndex.get(key)!.add(issueId);
      }
    }

    // ── Pass 2: Score pairwise relationships ──
    // Only check pairs that share at least one keyword/dimension
    const candidatePairs = new Set<string>();
    for (const issueIds of invertedIndex.values()) {
      if (issueIds.size < 2 || issueIds.size > 50) continue; // skip too-common terms
      const ids = Array.from(issueIds);
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const pairKey = ids[i] < ids[j] ? `${ids[i]}|${ids[j]}` : `${ids[j]}|${ids[i]}`;
          candidatePairs.add(pairKey);
        }
      }
    }

    const edges: RelationshipEdge[] = [];
    const uf = new UnionFind();

    // Initialize all issues in union-find
    for (const issue of issues) {
      uf.find(issue.id);
    }

    for (const pairKey of candidatePairs) {
      const [idA, idB] = pairKey.split("|");
      const issueA = issueMap.get(idA)!;
      const issueB = issueMap.get(idB)!;
      const kwA = keywordMap.get(idA)!;
      const kwB = keywordMap.get(idB)!;

      const { score, reasons } = this.scorePair(issueA, issueB, kwA, kwB);

      if (score > THRESHOLD) {
        edges.push({ issueA: idA, issueB: idB, score, reasons });
        uf.union(idA, idB);
      }
    }

    // ── Pass 3: Cluster via union-find ──
    const groups = uf.getGroups();
    const clusters: InsightCluster[] = [];
    let clusterId = 0;

    for (const [, memberIds] of groups) {
      if (memberIds.length < 2) continue;

      const clusterIssues = memberIds.map((id) => issueMap.get(id)!);
      const clusterEdges = edges.filter((e) => memberIds.includes(e.issueA) && memberIds.includes(e.issueB));

      // Aggregate shared dimensions
      const allKw = memberIds.map((id) => keywordMap.get(id)!);
      const sharedComponents = this.findShared(allKw.map((k) => k.components));
      const sharedPhases = this.findShared(allKw.map((k) => k.phases));
      const sharedOwners = this.findSharedField(clusterIssues, "owner");
      const sharedProjects = this.findSharedField(clusterIssues, "project");

      // Determine cluster severity (max of all issues)
      let severity: Severity = "info";
      for (const issue of clusterIssues) {
        if (issue.severity) {
          severity = maxSeverity(severity, issue.severity);
        }
      }

      const cluster: InsightCluster = {
        id: `cluster_${++clusterId}`,
        issues: clusterIssues,
        edges: clusterEdges,
        severity,
        sharedComponents,
        sharedPhases,
        sharedOwners,
        sharedProjects,
        explanation: this.generateExplanation(
          clusterIssues,
          sharedComponents,
          sharedOwners,
          sharedProjects,
          sharedPhases,
        ),
        recommendation: this.generateRecommendation(clusterIssues, clusterEdges, severity),
      };

      clusters.push(cluster);
    }

    // Sort clusters by severity then size
    clusters.sort((a, b) => {
      const sevDiff = SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity];
      if (sevDiff !== 0) return sevDiff;
      return b.issues.length - a.issues.length;
    });

    const scanTimeMs = Math.round((performance.now() - start) * 100) / 100;

    return {
      clusters,
      totalIssues: issues.length,
      totalRelationships: edges.length,
      scanTimeMs,
    };
  }

  // ── Pairwise Scoring ───────────────────────────────────────────────

  private scorePair(
    a: IssueInput,
    b: IssueInput,
    kwA: KeywordResult,
    kwB: KeywordResult,
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Component match (0.35)
    const compOverlap = this.setIntersection(kwA.components, kwB.components);
    if (compOverlap.length > 0) {
      score += WEIGHTS.componentMatch;
      reasons.push(`component: ${compOverlap.join(", ")}`);
    }
    // Also check explicit component field
    if (a.component && b.component && a.component === b.component && compOverlap.length === 0) {
      score += WEIGHTS.componentMatch;
      reasons.push(`component: ${a.component}`);
    }

    // Keyword overlap - Jaccard similarity (0.30)
    const kwIntersect = this.setIntersection(kwA.keywords, kwB.keywords);
    const kwUnion = new Set([...kwA.keywords, ...kwB.keywords]).size;
    if (kwUnion > 0) {
      const jaccard = kwIntersect.length / kwUnion;
      if (jaccard > 0.1) {
        score += WEIGHTS.keywordOverlap * Math.min(1, jaccard * 3); // scale up, cap at 1
        if (kwIntersect.length > 0) {
          reasons.push(`keywords: ${kwIntersect.slice(0, 5).join(", ")}`);
        }
      }
    }

    // Owner match (0.10)
    if (a.owner && b.owner && a.owner === b.owner) {
      score += WEIGHTS.ownerMatch;
      reasons.push(`owner: ${a.owner}`);
    }

    // Phase match (0.10)
    const phaseOverlap = this.setIntersection(kwA.phases, kwB.phases);
    if (phaseOverlap.length > 0 || (a.phase && b.phase && a.phase === b.phase)) {
      score += WEIGHTS.phaseMatch;
      reasons.push(`phase: ${phaseOverlap.join(", ") || a.phase}`);
    }

    // Severity alignment (0.10)
    if (a.severity && b.severity && a.severity === b.severity && a.severity !== "info") {
      score += WEIGHTS.severityAlignment;
      reasons.push(`severity: ${a.severity}`);
    }

    // Project match (0.05)
    if (a.project && b.project && a.project === b.project) {
      score += WEIGHTS.projectMatch;
      reasons.push(`project: ${a.project}`);
    }

    return { score: Math.round(score * 100) / 100, reasons };
  }

  // ── Helpers ────────────────────────────────────────────────────────

  private setIntersection(a: string[], b: string[]): string[] {
    const setB = new Set(b);
    return a.filter((x) => setB.has(x));
  }

  private findShared(arrays: string[][]): string[] {
    if (arrays.length === 0) return [];
    const counts = new Map<string, number>();
    for (const arr of arrays) {
      const unique = new Set(arr);
      for (const item of unique) {
        counts.set(item, (counts.get(item) || 0) + 1);
      }
    }
    // Items appearing in at least 2 issues
    return Array.from(counts.entries())
      .filter(([, count]) => count >= 2)
      .map(([item]) => item);
  }

  private findSharedField(issues: IssueInput[], field: keyof IssueInput): string[] {
    const counts = new Map<string, number>();
    for (const issue of issues) {
      const val = issue[field];
      if (typeof val === "string" && val) {
        counts.set(val, (counts.get(val) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .filter(([, count]) => count >= 2)
      .map(([item]) => item);
  }

  // ── Explanation Generation ─────────────────────────────────────────

  private generateExplanation(
    issues: IssueInput[],
    components: string[],
    owners: string[],
    projects: string[],
    phases: string[],
  ): { vi: string; en: string } {
    const count = issues.length;
    const parts_vi: string[] = [];
    const parts_en: string[] = [];

    if (components.length > 0) {
      parts_vi.push(`component ${components.join(", ")}`);
      parts_en.push(`component ${components.join(", ")}`);
    }
    if (owners.length > 0) {
      parts_vi.push(`owner ${owners.join(", ")}`);
      parts_en.push(`owner ${owners.join(", ")}`);
    }
    if (projects.length > 0) {
      parts_vi.push(`dự án ${projects.join(", ")}`);
      parts_en.push(`project ${projects.join(", ")}`);
    }
    if (phases.length > 0) {
      parts_vi.push(`giai đoạn ${phases.join(", ")}`);
      parts_en.push(`phase ${phases.join(", ")}`);
    }

    const via_vi = parts_vi.length > 0 ? ` qua ${parts_vi.join(" và ")}` : "";
    const via_en = parts_en.length > 0 ? ` via ${parts_en.join(" and ")}` : "";

    return {
      vi: `${count} issues liên quan${via_vi}`,
      en: `${count} related issues${via_en}`,
    };
  }

  private generateRecommendation(
    issues: IssueInput[],
    edges: RelationshipEdge[],
    severity: Severity,
  ): { vi: string; en: string } {
    // Find the most connected issue (potential blocker)
    const connectionCount = new Map<string, number>();
    for (const edge of edges) {
      connectionCount.set(edge.issueA, (connectionCount.get(edge.issueA) || 0) + 1);
      connectionCount.set(edge.issueB, (connectionCount.get(edge.issueB) || 0) + 1);
    }

    let topIssueId = "";
    let topCount = 0;
    for (const [id, count] of connectionCount) {
      if (count > topCount) {
        topCount = count;
        topIssueId = id;
      }
    }

    const topIssue = issues.find((i) => i.id === topIssueId);
    const othersCount = issues.length - 1;

    if (topIssue && topCount >= 2) {
      const titleShort = topIssue.title.length > 40 ? topIssue.title.slice(0, 40) + "..." : topIssue.title;
      return {
        vi: `Giải quyết "${titleShort}" trước sẽ mở khóa ${othersCount} issues khác`,
        en: `Resolving "${titleShort}" first will unblock ${othersCount} other issues`,
      };
    }

    if (severity === "critical" || severity === "high") {
      return {
        vi: `Nhóm ${issues.length} issues có mức độ ${severity} — cần xử lý đồng thời`,
        en: `Group of ${issues.length} ${severity} issues — address simultaneously`,
      };
    }

    return {
      vi: `Xem xét ${issues.length} issues cùng nhau để tìm nguyên nhân gốc`,
      en: `Review ${issues.length} issues together to identify root cause`,
    };
  }
}
