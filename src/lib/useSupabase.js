import { useState, useEffect } from 'react';
import { supabase } from './supabase';

// Generic hook for Supabase queries
export function useSupabaseQuery(table, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { select = '*', filter, orderBy, limit } = options;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        let query = supabase.from(table).select(select);
        if (filter) query = filter(query);
        if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.asc ?? true });
        if (limit) query = query.limit(limit);

        const { data: result, error: err } = await query;
        if (err) throw err;
        setData(result || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [table, select]);

  return { data, loading, error, refetch: () => setLoading(true) };
}

// Auth hook
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
