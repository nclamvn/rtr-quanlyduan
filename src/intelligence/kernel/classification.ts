/**
 * SignalHub Kernel — Classification Engine (Two-stage)
 */

import type { Signal, Severity, SignalInput } from './signal';

// ─── Rule Config ─────────────────────────────────────────────────────

export type MatchCondition =
  | { field: 'title' | 'body'; op: 'contains'; values: string[] }
  | { field: 'title' | 'body'; op: 'regex'; pattern: string }
  | { field: 'signalType'; op: 'equals'; value: string }
  | { field: 'value'; op: 'gt' | 'lt' | 'gte' | 'lte'; threshold: number }
  | { field: 'dimension'; key: string; op: 'equals'; value: string | number }
  | { field: 'dimension'; key: string; op: 'in'; values: (string | number)[] }
  | { field: 'sourceTier'; op: 'lte'; value: number }
  | { field: 'any' };

export interface ClassificationRule {
  id: string;
  priority: number;
  conditions: MatchCondition[];
  assign: {
    severity: Severity;
    categories: string[];
  };
  confidence: number;
  terminal: boolean;
}

// ─── Classification Result ───────────────────────────────────────────

export interface ClassificationResult {
  severity: Severity;
  categories: string[];
  confidence: number;
  source: 'rule' | 'ai' | 'default';
  ruleId?: string;
}

// ─── Engine ──────────────────────────────────────────────────────────

export class ClassificationEngine {
  private rules: ClassificationRule[];
  private feedback = new Map<string, { correct: number; incorrect: number }>();

  constructor(rules: ClassificationRule[]) {
    this.rules = [...rules].sort((a, b) => a.priority - b.priority);
  }

  classifyByRules(input: SignalInput): ClassificationResult {
    for (const rule of this.rules) {
      if (this.matchesRule(input, rule)) {
        let adjustedConfidence = rule.confidence;
        const fb = this.feedback.get(rule.id);
        if (fb && fb.correct + fb.incorrect > 5) {
          const accuracy = fb.correct / (fb.correct + fb.incorrect);
          adjustedConfidence = rule.confidence * (0.5 + 0.5 * accuracy);
        }

        return {
          severity: rule.assign.severity,
          categories: rule.assign.categories,
          confidence: adjustedConfidence,
          source: 'rule',
          ruleId: rule.id,
        };
      }
    }

    return {
      severity: 'info',
      categories: ['uncategorized'],
      confidence: 0.1,
      source: 'default',
    };
  }

  classify(
    input: SignalInput,
    _signal: Signal,
    _onAIOverride?: (result: ClassificationResult) => void,
  ): ClassificationResult {
    // No AI classifier in client-side mode — just return rule result
    return this.classifyByRules(input);
  }

  recordFeedback(ruleId: string, wasCorrect: boolean): void {
    const fb = this.feedback.get(ruleId) ?? { correct: 0, incorrect: 0 };
    if (wasCorrect) fb.correct++;
    else fb.incorrect++;
    this.feedback.set(ruleId, fb);
  }

  reconfigure(rules: ClassificationRule[]): void {
    this.rules = [...rules].sort((a, b) => a.priority - b.priority);
  }

  // ── Private ────────────────────────────────────────────────────────

  private matchesRule(input: SignalInput, rule: ClassificationRule): boolean {
    return rule.conditions.every((cond) => this.matchesCondition(input, cond));
  }

  private matchesCondition(input: SignalInput, cond: MatchCondition): boolean {
    switch (cond.field) {
      case 'any':
        return true;

      case 'title':
      case 'body': {
        const text = (cond.field === 'title' ? input.title : input.body ?? '').toLowerCase();
        if (cond.op === 'contains') {
          return cond.values.some((v) => text.includes(v.toLowerCase()));
        }
        if (cond.op === 'regex') {
          try {
            return new RegExp(cond.pattern, 'i').test(text);
          } catch {
            return false;
          }
        }
        return false;
      }

      case 'signalType':
        return input.signalType === cond.value;

      case 'value': {
        const v = input.value ?? 0;
        switch (cond.op) {
          case 'gt': return v > cond.threshold;
          case 'lt': return v < cond.threshold;
          case 'gte': return v >= cond.threshold;
          case 'lte': return v <= cond.threshold;
        }
        return false;
      }

      case 'dimension': {
        const dimVal = input.dimensions?.[cond.key];
        if (dimVal === undefined) return false;
        if (cond.op === 'equals') return dimVal === cond.value;
        if (cond.op === 'in') return cond.values.includes(dimVal);
        return false;
      }

      case 'sourceTier':
        return (input.sourceTier ?? 3) <= cond.value;

      default:
        return false;
    }
  }
}
