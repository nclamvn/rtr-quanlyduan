import { query, insert, update } from './supabaseService';
import { supabase, isSupabaseConnected } from '../lib/supabase';

export async function fetchIssues(projectId = null, limit = 500) {
  const options = {
    select: '*, issue_impacts(*), issue_updates(*)',
    order: { column: 'created_at', asc: false },
    limit,
  };
  if (projectId) options.eq = { project_id: projectId };
  return query('issues', options);
}

export async function fetchIssueById(issueId) {
  if (!isSupabaseConnected()) return { data: null, error: 'Offline' };
  const { data, error } = await supabase
    .from('issues')
    .select('*, issue_impacts(*), issue_updates(*)')
    .eq('id', issueId)
    .single();
  return { data, error };
}

export async function createIssue(issueData) {
  if (!isSupabaseConnected()) return { data: null, error: 'Offline' };

  // Generate unique ID using timestamp + random suffix to avoid race conditions
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  const newId = `ISS-${ts}${rand}`.toUpperCase();

  const record = {
    id: newId,
    project_id: issueData.projectId || issueData.pid,
    title: issueData.title,
    title_vi: issueData.titleVi,
    description: issueData.description || issueData.desc,
    severity: issueData.severity || issueData.sev,
    source: issueData.source || issueData.src || 'INTERNAL',
    status: issueData.status,
    owner_id: issueData.ownerId || null,
    owner_name: issueData.ownerName || issueData.owner,
    phase: issueData.phase,
    root_cause: issueData.rootCause,
    due_date: issueData.dueDate || issueData.due,
    created_by: issueData.createdById || null,
    created_by_name: issueData.createdByName,
  };

  const result = await insert('issues', record);

  // Insert impacts if provided
  if (issueData.impacts?.length && result.data) {
    const impacts = issueData.impacts.map(imp => ({
      issue_id: newId,
      affected_phase: imp.phase,
      delay_weeks: imp.days ? Math.ceil(imp.days / 7) : (imp.delay_weeks || 0),
      description: imp.desc || imp.description,
      description_vi: imp.descVi || imp.description_vi,
    }));
    await supabase.from('issue_impacts').insert(impacts);
  }

  return result;
}

export async function updateIssueStatus(issueId, newStatus) {
  const updates = { status: newStatus };
  if (newStatus === 'CLOSED') updates.closed_at = new Date().toISOString();
  return update('issues', issueId, updates);
}

export async function addIssueUpdate(issueId, content, authorId, authorName) {
  return insert('issue_updates', {
    issue_id: issueId,
    author_id: authorId || null,
    author_name: authorName,
    content,
  });
}
