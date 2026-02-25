import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConnected } from '../lib/supabase';

/**
 * Subscribe to Supabase Realtime changes on a table.
 * @param {string} table - Table name
 * @param {Object} callbacks - { onInsert, onUpdate, onDelete }
 * @param {Object} filter - Optional { column, value }
 */
export function useRealtimeSubscription(table, { onInsert, onUpdate, onDelete, filter } = {}) {
  const channelRef = useRef(null);
  // Store callbacks in refs to avoid re-subscribing
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete });
  callbacksRef.current = { onInsert, onUpdate, onDelete };

  useEffect(() => {
    if (!isSupabaseConnected()) return;

    const config = {
      event: '*',
      schema: 'public',
      table,
    };
    if (filter) {
      config.filter = `${filter.column}=eq.${filter.value}`;
    }

    const channel = supabase
      .channel(`${table}_${filter?.value || 'all'}_changes`)
      .on('postgres_changes', config, (payload) => {
        switch (payload.eventType) {
          case 'INSERT':
            callbacksRef.current.onInsert?.(payload.new);
            break;
          case 'UPDATE':
            callbacksRef.current.onUpdate?.(payload.new, payload.old);
            break;
          case 'DELETE':
            callbacksRef.current.onDelete?.(payload.old);
            break;
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, filter?.column, filter?.value]);
}
