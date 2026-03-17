import { useState, useEffect } from 'react';
import { isSupabaseConnected, withTimeout, warmUpSupabase } from '../lib/supabase';
import { supabase } from '../lib/supabase';

export function useTeamData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isSupabaseConnected()) {
        setLoading(false);
        return;
      }

      try {
        await warmUpSupabase();
        const { data: members, error } = await withTimeout(
          supabase
            .from('project_members')
            .select('project_id, profiles(id, full_name, role, avatar_initials, department)')
        );

        if (error || !members || cancelled) {
          setLoading(false);
          return;
        }

        // Group by profile → { name, role, projects: [...] }
        const byProfile = {};
        for (const row of members) {
          const p = row.profiles;
          if (!p) continue;
          if (!byProfile[p.id]) {
            byProfile[p.id] = {
              id: p.id,
              name: p.full_name,
              role: p.role,
              avatar: p.avatar_initials,
              department: p.department,
              projects: [],
            };
          }
          if (row.project_id) {
            byProfile[p.id].projects.push(row.project_id);
          }
        }

        if (!cancelled) {
          setData(Object.values(byProfile));
        }
      } catch {
        // fallback to empty → App.jsx will use static TEAM
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading };
}
