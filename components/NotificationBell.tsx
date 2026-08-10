'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function NotificationBell() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('id, type, body, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data || []);
  }

  useEffect(() => {
    load();
    // Light polling — good enough without building a realtime subscription tonight.
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div ref={ref} style={{ position: 'relative', marginLeft: 'auto' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ background: 'none', border: 'none', color: 'var(--paper)', fontSize: 17, cursor: 'pointer', position: 'relative', padding: 4 }}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2, background: 'var(--gold)', color: '#241A08',
            fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '130%', right: 0, width: 320, maxHeight: 400, overflowY: 'auto',
          background: '#fff', color: 'var(--ink)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-raised)',
          border: '1px solid var(--line)', zIndex: 50,
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 13.5 }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--gold-deep)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--slate)' }}>No notifications yet.</div>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              style={{
                padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: 13, cursor: n.read ? 'default' : 'pointer',
                background: n.read ? 'transparent' : 'var(--gold-soft)', lineHeight: 1.5,
              }}
            >
              <div>{n.body}</div>
              <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
