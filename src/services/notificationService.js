import { supabase, isSupabaseConnected } from '../lib/supabase';

export async function fetchNotifications(userId) {
  if (!isSupabaseConnected()) return { data: [], error: null };

  return supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
}

export async function markNotificationRead(notifId) {
  if (!isSupabaseConnected()) return;
  return supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
}

export async function markAllRead(userId) {
  if (!isSupabaseConnected()) return;
  return supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}

export async function createNotification(notification) {
  if (!isSupabaseConnected()) return { data: null, error: 'Offline' };
  const { data, error } = await supabase.from('notifications').insert(notification).select().single();
  return { data, error };
}
