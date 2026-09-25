'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import type { Meeting } from '@/lib/types';
import { formatDateTime, minutesUntil } from '@/lib/utils';

type TriggerKind = '30min' | '5min';

type FiredKey = `${string}:${TriggerKind}`;

const STORAGE_KEY = 'sm-meeting-notifications-fired-v1';
const POLL_INTERVAL_MS = 30_000;

interface FetchedMeeting extends Meeting {
  coach?: { full_name: string | null; role: string | null } | null;
  student?: { full_name: string | null; role: string | null } | null;
}

function readFired(): Set<FiredKey> {
  try {
    if (typeof window === 'undefined') return new Set();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr as FiredKey[]);
  } catch {
    return new Set();
  }
}

function writeFired(set: Set<FiredKey>) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // noop
  }
}

function ensureBrowserNotificationPermission() {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return 'default';
}

async function requestBrowserPermissionIfNeeded(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
  const state = Notification.permission as NotificationPermission;
  if (state === 'granted' || state === 'denied') return state;
  try {
    const res = await Notification.requestPermission();
    return res;
  } catch {
    return state;
  }
}

function buildTitle(m: FetchedMeeting, mode: 'coach' | 'student' | 'any'): string {
  if (m.title) return `📅 ${m.title}`;
  if (mode === 'coach') {
    const who = m.student?.full_name || 'Öğrenci';
    return `📅 Birebir Görüşme · ${who}`;
  }
  if (mode === 'student') {
    const who = m.coach?.full_name || 'Koçun';
    return `📅 Koçun ile Görüşme`;
  }
  return '📅 Planlanmış Görüşme';
}

function buildDescription(m: FetchedMeeting, minutes: number, kind: TriggerKind): string {
  const rest = kind === '30min'
    ? `Görüşmenize 30 dakika kaldı! · ${formatDateTime(m.meeting_date)}`
    : `Görüşmenize 5 dakika kaldı, hazırlanın! · ${formatDateTime(m.meeting_date)}`;
  const extra = [];
  if (m.duration_minutes) extra.push(`${m.duration_minutes} dk`);
  if (m.title) extra.push(m.title);
  const notes = m.notes ? ` — ${m.notes.slice(0, 60)}${m.notes.length > 60 ? '…' : ''}` : '';
  return `${rest}${extra.length ? ' · ' + extra.join(' · ') : ''}${notes}`;
}

interface UseMeetingNotificationsProps {
  userId: string | null | undefined;
  mode?: 'auto' | 'coach' | 'student';
  enabled?: boolean;
  pollIntervalMs?: number;
  requestPermission?: boolean;
  windowMinutes?: number;
}

export function useMeetingNotifications({
  userId,
  mode = 'auto',
  enabled = true,
  pollIntervalMs = POLL_INTERVAL_MS,
  requestPermission = true,
  windowMinutes = 12 * 60,
}: UseMeetingNotificationsProps) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const firedRef = useRef<Set<FiredKey>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentUserRoleRef = useRef<'coach' | 'student' | null>(null);
  const initializedRef = useRef(false);

  const [permission, setPermission] = useState<
    NotificationPermission | 'unsupported' | 'unknown'
  >(() => (typeof window !== 'undefined' ? ensureBrowserNotificationPermission() : 'unknown'));

  const [meetings, setMeetings] = useState<FetchedMeeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [firedCount, setFiredCount] = useState(0);

  // 1) Boot: Restore fired + read current user role once + ask permission
  useEffect(() => {
    firedRef.current = readFired();
    setFiredCount(firedRef.current.size);
  }, []);

  useEffect(() => {
    if (!enabled || !userId) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', userId)
          .maybeSingle();
        const r = (data?.role ?? 'student') === 'coach' ? 'coach' : 'student';
        currentUserRoleRef.current = r;
      } catch {
        currentUserRoleRef.current = 'student';
      }
    })();
    if (requestPermission) {
      (async () => {
        const p = await requestBrowserPermissionIfNeeded();
        setPermission(p);
      })();
    } else if (typeof window !== 'undefined') {
      setPermission(ensureBrowserNotificationPermission());
    }
    initializedRef.current = true;
  }, [enabled, userId, requestPermission, supabase]);

  // 2) Fetch meetings (polling seed)
  const loadRelevantMeetings = useCallback(async () => {
    if (!userId) return;
    const role = currentUserRoleRef.current ?? (mode === 'coach' ? 'coach' : mode === 'student' ? 'student' : null);
    setLoading(true);
    try {
      const windowStartIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const windowEndIso = new Date(Date.now() + windowMinutes * 60 * 1000).toISOString();

      let q = supabase
        .from('meetings')
        .select(`
          id, student_id, coach_id, title, meeting_date, duration_minutes,
          meeting_url, notes, status, created_at, updated_at,
          coach:profiles!meetings_coach_id_fkey(full_name, role),
          student:profiles!meetings_student_id_fkey(full_name, role)
        `)
        .gte('meeting_date', windowStartIso)
        .lte('meeting_date', windowEndIso);

      if (role === 'coach') q = q.eq('coach_id', userId);
      else if (role === 'student') q = q.eq('student_id', userId);

      const { data, error } = await q.order('meeting_date', { ascending: true });
      if (error) throw error;
      const list = ((data ?? []) as unknown as FetchedMeeting[]) || [];
      setMeetings(list);
      setLastCheck(new Date());
    } catch (err: any) {
      console.warn('[useMeetingNotifications] fetch failed:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [userId, mode, windowMinutes, supabase]);

  // 3) Evaluate firing
  const fireOnce = useCallback(
    (m: FetchedMeeting, kind: TriggerKind, mins: number, effectiveMode: 'coach' | 'student') => {
      const key: FiredKey = `${m.id}:${kind}`;
      if (firedRef.current.has(key)) return;
      firedRef.current.add(key);
      writeFired(firedRef.current);
      setFiredCount(firedRef.current.size);

      const title = buildTitle(m, effectiveMode);
      const description = buildDescription(m, mins, kind);

      const toastVariant = kind === '5min' ? 'warning' : 'info';
      toast[toastVariant](title, description);

      if (typeof window !== 'undefined' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          const n = new Notification(title, {
            body: description,
            tag: key,
            requireInteraction: kind === '5min',
            silent: false,
          });
          n.onclick = () => {
            window.focus();
            n.close();
          };
          setTimeout(() => n.close(), kind === '5min' ? 15000 : 8000);
        } catch {
          // noop
        }
      }
    },
    [toast]
  );

  const evaluate = useCallback(
    (now = new Date()) => {
      if (!userId) return;
      const effectiveMode: 'coach' | 'student' =
        currentUserRoleRef.current ??
        (mode === 'coach' ? 'coach' : mode === 'student' ? 'student' : 'student');

      const list = meetings.length ? meetings : [];
      list.forEach((m) => {
        const mins = minutesUntil(m.meeting_date, now);
        // Only fire for upcoming meetings (negative mins already started)
        if (mins < -10) return;
        // 30 min trigger (between 29..31 min).  Allow ~1 min tolerance
        if (mins >= 29 && mins <= 31) {
          fireOnce(m, '30min', mins, effectiveMode);
        }
        if (mins >= 4 && mins <= 6) {
          fireOnce(m, '5min', mins, effectiveMode);
        }
      });
    },
    [userId, mode, meetings, fireOnce]
  );

  // Initial fetch + loop
  useEffect(() => {
    if (!enabled || !userId) return;
    if (!initializedRef.current) return;
    // Immediate
    loadRelevantMeetings();
    // Refresh data every 5 minutes (so long meetings added later are picked)
    const dataRefresh = setInterval(() => loadRelevantMeetings(), 5 * 60 * 1000);
    // Poll every pollIntervalMs for firing
    intervalRef.current = setInterval(() => {
      evaluate(new Date());
    }, pollIntervalMs);
    // Try firing shortly after mount with fetched data
    const first = setTimeout(() => evaluate(new Date()), 1200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(dataRefresh);
      clearTimeout(first);
    };
  }, [enabled, userId, loadRelevantMeetings, evaluate, pollIntervalMs]);

  const triggerTest = useCallback(
    (kind: TriggerKind = '30min') => {
      if (meetings.length === 0) {
        toast.info('Bildirim testi için planlanmış bir görüşme gerekli');
        return;
      }
      const m = meetings[0];
      const effectiveMode: 'coach' | 'student' =
        currentUserRoleRef.current ?? (mode === 'coach' ? 'coach' : 'student');
      const key: FiredKey = `test-${m.id}-${Date.now()}:${kind}`;
      const title = buildTitle(m, effectiveMode) + ' (TEST)';
      const description = buildDescription(m, kind === '30min' ? 30 : 5, kind);
      toast[kind === '5min' ? 'warning' : 'info'](title, description);
      if (typeof window !== 'undefined' && typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') {
          try {
            const n = new Notification(title, { body: description, tag: key });
            setTimeout(() => n.close(), 8000);
          } catch {
            // noop
          }
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().then(() => {
            if (Notification.permission === 'granted') {
              try {
                const n = new Notification(title, { body: description, tag: key });
                setTimeout(() => n.close(), 8000);
              } catch {
                // noop
              }
            }
          });
        }
      }
    },
    [meetings, mode, toast]
  );

  const clearFiredCache = useCallback(() => {
    firedRef.current = new Set();
    writeFired(firedRef.current);
    setFiredCount(0);
    toast.info('Bildirim geçmişi temizlendi');
  }, [toast]);

  const refresh = useCallback(async () => {
    await loadRelevantMeetings();
    evaluate(new Date());
  }, [loadRelevantMeetings, evaluate]);

  return {
    meetings,
    loading,
    lastCheck,
    permission,
    firedCount,
    refresh,
    triggerTest,
    clearFiredCache,
    requestPermission: () =>
      requestBrowserPermissionIfNeeded().then((p) => {
        setPermission(p);
        return p;
      }),
  };
}
