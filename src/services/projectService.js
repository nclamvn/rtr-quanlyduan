import { query, update } from './supabaseService';
import { supabase, isSupabaseConnected } from '../lib/supabase';

export async function fetchProjects() {
  return query('projects', {
    order: { column: 'phase_index', asc: true },
  });
}

export async function fetchMilestones(projectId) {
  return query('milestones', {
    eq: { project_id: projectId },
    order: { column: 'phase', asc: true },
  });
}

export async function fetchGateConditions(projectId) {
  return query('gate_conditions', {
    eq: { project_id: projectId },
    order: { column: 'sort_order', asc: true },
  });
}

export async function fetchProjectMembers(projectId) {
  if (!isSupabaseConnected()) return { data: [], error: 'Offline' };
  const { data, error } = await supabase
    .from('project_members')
    .select('*, profiles(full_name, role, avatar_initials, department)')
    .eq('project_id', projectId);
  return { data: data || [], error };
}

export async function fetchProjectWithDetails(projectId) {
  if (!isSupabaseConnected()) return { data: null, error: 'Offline' };

  const [projRes, milRes, gateRes, memberRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('milestones').select('*').eq('project_id', projectId).order('phase'),
    supabase.from('gate_conditions').select('*').eq('project_id', projectId).order('phase').order('sort_order'),
    supabase.from('project_members').select('*, profiles(full_name, role, avatar_initials)').eq('project_id', projectId),
  ]);

  return {
    data: {
      ...projRes.data,
      milestones: milRes.data || [],
      gateConditions: gateRes.data || [],
      members: memberRes.data || [],
    },
    error: projRes.error || milRes.error || gateRes.error,
  };
}

export async function toggleGateCondition(gateId, isChecked, userId) {
  return update('gate_conditions', gateId, {
    is_checked: isChecked,
    checked_by: isChecked ? userId : null,
    checked_at: isChecked ? new Date().toISOString() : null,
  });
}

export async function updateProject(projectId, updates) {
  return update('projects', projectId, updates);
}
