import { useState, useEffect, useCallback } from 'react';
import { isSupabaseConnected, withTimeout, warmUpSupabase, getConnectionStatus } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtime';
import {
  fetchProjects,
  fetchMilestones,
  fetchGateConditions,
  toggleGateCondition,
  updateProject,
} from '../services/projectService';
import {
  fetchIssues,
  createIssue as createIssueService,
  updateIssueStatus as updateIssueStatusService,
} from '../services/issueService';
import {
  fetchNotifications,
  markNotificationRead,
  markAllRead,
} from '../services/notificationService';

// ═══ Transform Supabase → App.jsx shape ═══

// Milestones: rows → { phase: { target, actual, adjusted, status } }
function buildMilestonesMap(milestoneRows) {
  const map = {};
  for (const m of milestoneRows) {
    const statusMap = { DONE: 'COMPLETED', DELAYED: 'IN_PROGRESS' };
    map[m.phase] = {
      target: m.target_date,
      actual: m.actual_date,
      adjusted: m.adjusted_date || null,
      status: statusMap[m.status] || m.status,
    };
  }
  return map;
}

// Gate conditions: rows → { phase: { condId: boolean } }
// Also returns the full conditions list for GATE_CONFIG replacement
function buildGateChecksMap(gateRows) {
  const checks = {};
  const configByPhase = {};
  for (const g of gateRows) {
    if (!checks[g.phase]) checks[g.phase] = {};
    // Use the gate row's own id as key
    checks[g.phase][g.id] = !!g.is_checked;

    if (!configByPhase[g.phase]) configByPhase[g.phase] = { conditions: [] };
    configByPhase[g.phase].conditions.push({
      id: g.id,
      label: g.label,
      label_vi: g.label_vi,
      required: g.is_required,
      cat: g.category || 'general',
    });
  }
  return { checks, config: configByPhase };
}

// Transform issue from Supabase → App.jsx shape
function transformIssue(row) {
  return {
    ...row,
    pid: row.project_id,
    titleVi: row.title_vi,
    desc: row.description,
    sev: row.severity,
    src: row.source,
    owner: row.owner_name,
    owner_id: row.owner_id,
    created_by: row.created_by,
    rootCause: row.root_cause,
    created: row.created_at?.split('T')[0],
    due: row.due_date,
    impacts: (row.issue_impacts || []).map(imp => ({
      ...imp,
      phase: imp.affected_phase,
      days: (imp.delay_weeks || 0) * 7,
      desc: imp.description,
      descVi: imp.description_vi,
    })),
    updates: (row.issue_updates || []).map(upd => ({
      ...upd,
      date: upd.created_at?.split('T')[0],
      author: upd.author_name,
      text: upd.content,
    })),
  };
}

// Transform project from Supabase → App.jsx shape
function transformProject(row, milestones, gateData) {
  return {
    ...row,
    desc: row.description,
    descVi: row.description_vi,
    phaseOwner: row.phase_owner_name,
    startDate: row.start_date,
    targetMP: row.target_mp,
    milestones,
    gateChecks: gateData.checks,
    _gateConfig: gateData.config,
  };
}

// ═══ HOOKS ═══

export function useProjectsData() {
  const [projects, setProjects] = useState([]);
  const [gateConfig, setGateConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      setLoading(false);
      return; // App.jsx will use static fallback
    }

    try {
      const { data: projData } = await withTimeout(fetchProjects());
      if (!projData?.length) {
        setLoading(false);
        return;
      }

      // Fetch milestones and gates for all projects in parallel
      const allMilestones = {};
      const allGateData = {};
      const mergedConfig = {};

      await withTimeout(Promise.all(projData.map(async (proj) => {
        const [milRes, gateRes] = await Promise.all([
          fetchMilestones(proj.id),
          fetchGateConditions(proj.id),
        ]);
        allMilestones[proj.id] = buildMilestonesMap(milRes.data || []);
        const gd = buildGateChecksMap(gateRes.data || []);
        allGateData[proj.id] = gd;
        Object.entries(gd.config).forEach(([phase, cfg]) => {
          if (!mergedConfig[phase]) mergedConfig[phase] = cfg;
        });
      })), 8000);

      const transformed = projData.map(p =>
        transformProject(p, allMilestones[p.id] || {}, allGateData[p.id] || { checks: {}, config: {} })
      );

      setProjects(transformed);
      setGateConfig(mergedConfig);
    } catch (err) {
      console.warn('Projects fetch timeout/error, using static fallback:', err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  // Toggle gate condition (Supabase)
  const toggleGate = useCallback(async (gateId, isChecked, userId) => {
    if (!isSupabaseConnected()) return;
    await toggleGateCondition(gateId, isChecked, userId);
    // Optimistic update
    setProjects(prev => prev.map(p => {
      const newGateChecks = { ...p.gateChecks };
      for (const phase of Object.keys(newGateChecks)) {
        if (gateId in (newGateChecks[phase] || {})) {
          newGateChecks[phase] = { ...newGateChecks[phase], [gateId]: isChecked };
        }
      }
      return { ...p, gateChecks: newGateChecks };
    }));
  }, []);

  // Realtime: gate condition toggled by another user
  useRealtimeSubscription('gate_conditions', {
    onUpdate: (newRow) => {
      setProjects(prev => prev.map(p => {
        if (p.id !== newRow.project_id) return p;
        const newGateChecks = { ...p.gateChecks };
        if (newGateChecks[newRow.phase]) {
          newGateChecks[newRow.phase] = { ...newGateChecks[newRow.phase], [newRow.id]: !!newRow.is_checked };
        }
        return { ...p, gateChecks: newGateChecks };
      }));
    },
  });

  // Realtime: project phase/status changed
  useRealtimeSubscription('projects', {
    onUpdate: () => refetch(),
  });

  return { projects, gateConfig, loading, refetch, setProjects, toggleGate };
}

export function useIssuesData() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    if (getConnectionStatus() !== 'online') {
      setLoading(false);
      return; // App.jsx will use static fallback
    }

    try {
      const { data } = await withTimeout(fetchIssues());
      setIssues((data || []).map(transformIssue));
    } catch (err) {
      console.warn('Issues fetch timeout/error, using static fallback:', err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  // Create issue via Supabase
  const createIssue = useCallback(async (issueData) => {
    if (!isSupabaseConnected()) return null;
    const { data } = await createIssueService(issueData);
    if (data) {
      // Refetch to get the full issue with relations
      refetch();
    }
    return data;
  }, [refetch]);

  // Update issue status via Supabase
  const updateStatus = useCallback(async (issueId, newStatus) => {
    if (!isSupabaseConnected()) return;
    await updateIssueStatusService(issueId, newStatus);
    // Optimistic update
    setIssues(prev => prev.map(i =>
      i.id === issueId ? { ...i, status: newStatus } : i
    ));
  }, []);

  // Realtime: auto-refresh on changes from other users
  useRealtimeSubscription('issues', {
    onInsert: () => refetch(),
    onUpdate: (newRow) => {
      setIssues(prev => prev.map(i =>
        i.id === newRow.id ? { ...i, status: newRow.status, owner_name: newRow.owner_name, owner: newRow.owner_name } : i
      ));
    },
    onDelete: (oldRow) => {
      setIssues(prev => prev.filter(i => i.id !== oldRow.id));
    },
  });

  return { issues, loading, refetch, setIssues, createIssue, updateStatus };
}

export function useNotificationsData(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (getConnectionStatus() !== 'online' || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await withTimeout(fetchNotifications(userId));
      setNotifications((data || []).map(n => ({
        ...n,
        titleVi: n.title_vi,
        time: n.time_ago || formatTimeAgo(n.created_at),
        timeVi: n.time_ago_vi || formatTimeAgo(n.created_at, 'vi'),
        read: n.is_read,
        ref: n.reference_id,
      })));
    } catch (err) {
      console.warn('Notifications fetch timeout/error:', err.message);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { warmUpSupabase().then(() => refetch()); }, [refetch]);

  const markRead = useCallback(async (notifId) => {
    if (!isSupabaseConnected()) return;
    await markNotificationRead(notifId);
    setNotifications(prev => prev.map(n =>
      n.id === notifId ? { ...n, read: true, is_read: true } : n
    ));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!isSupabaseConnected() || !userId) return;
    await markAllRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true, is_read: true })));
  }, [userId]);

  // Realtime: new notifications arrive in real-time
  useRealtimeSubscription('notifications', {
    onInsert: (newRow) => {
      if (newRow.user_id === userId) {
        setNotifications(prev => [{
          ...newRow,
          titleVi: newRow.title_vi,
          time: formatTimeAgo(newRow.created_at),
          timeVi: formatTimeAgo(newRow.created_at, 'vi'),
          read: newRow.is_read,
          ref: newRow.reference_id,
        }, ...prev]);
      }
    },
    filter: userId ? { column: 'user_id', value: userId } : undefined,
  });

  return { notifications, loading, refetch, setNotifications, markRead, markAllAsRead };
}

// ═══ Utility ═══
function formatTimeAgo(dateStr, lang = 'en') {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (lang === 'vi') {
    if (mins < 60) return `${mins} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  }
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
