// ═══════════════════════════════════════════════════════════
// RtR Control Tower — AI Advisor Client Service
// Calls ai-advisor Edge Function with in-memory session cache
// ═══════════════════════════════════════════════════════════

import { supabase, isSupabaseConnected } from '../lib/supabase';

// In-memory session cache (cleared on page refresh)
const sessionCache = new Map();

function getCacheKey(issue, lang) {
  return `${issue.id}:${issue.status}:${issue.sev || issue.severity}:${issue.impacts?.length || 0}:${issue.updates?.length || 0}:${lang}`;
}

export async function fetchAIAdvisory(issue, context, lang = 'vi') {
  if (!issue?.id) return null;

  const key = getCacheKey(issue, lang);

  // Check session cache first
  if (sessionCache.has(key)) {
    return { ...sessionCache.get(key), cached: true };
  }

  if (!isSupabaseConnected()) {
    return { error: 'offline', summary: lang === 'vi' ? 'Không có kết nối' : 'No connection' };
  }

  const { data, error } = await supabase.functions.invoke('ai-advisor', {
    body: {
      issue: {
        id: issue.id,
        title: issue.title,
        titleVi: issue.titleVi,
        description: issue.desc || issue.description,
        status: issue.status,
        severity: issue.sev || issue.severity,
        source: issue.src || issue.source,
        owner: issue.owner,
        phase: issue.phase,
        rootCause: issue.rootCause,
        due: issue.due,
        created: issue.created,
        impacts: issue.impacts || [],
        updates: (issue.updates || []).slice(0, 5), // Send last 5 updates only
      },
      context: context || {},
      lang,
    },
  });

  if (error) {
    console.warn('[aiAdvisor] Edge function error:', error.message);
    return { error: error.message };
  }

  // Store in session cache
  if (data && !data.error) {
    sessionCache.set(key, data);
  }

  return data;
}

export function clearAdvisoryCache() {
  sessionCache.clear();
}
