'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Video,
  Clock,
  MapPin,
  Sparkles,
  Calendar,
  Zap,
} from 'lucide-react';
import { getCountdownParts, formatDateTime } from '@/lib/utils';
import type { Meeting } from '@/lib/types';

interface MeetingCountdownProps {
  meeting?: Meeting;
}

export function MeetingCountdown({ meeting }: MeetingCountdownProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!meeting) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Birebir Görüşme
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-slate-100">
                Yaklaşan görüşmen{' '}
                <span className="gradient-text">yok</span>
              </h3>
            </div>
            <Badge variant="ink">Beklemede</Badge>
          </div>
        </CardHeader>
        <CardBody>
          <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-slate-300 font-medium mb-1">
              Henüz bir görüşme planlanmamış
            </p>
            <p className="text-sm text-slate-500">
              Koçun seninle en kısa sürede iletişime geçecektir. Sabırsızlanma! 🔥
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const target = new Date(meeting.meeting_date);
  const { days, hours, minutes, seconds } = getCountdownParts(target);
  const parts = [
    { label: 'Gün', value: days },
    { label: 'Saat', value: hours },
    { label: 'Dakika', value: minutes },
    { label: 'Saniye', value: seconds },
  ];

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-orange-400 animate-pulse-slow" />
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                Sıradaki Görüşme
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-slate-100">
              Koçunla buluşmaya <span className="gradient-text-fire">kalan</span>
            </h3>
          </div>
          <Badge variant="fire" size="md">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            {meeting.duration_minutes} dk
          </Badge>
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {parts.map((p) => (
            <div
              key={p.label}
              className="relative rounded-2xl bg-gradient-to-b from-slate-800/70 to-slate-900/70 border border-slate-700 p-3 md:p-4 text-center overflow-hidden group"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
              <div className="font-display text-2xl md:text-4xl font-bold gradient-text tabular-nums">
                {String(p.value).padStart(2, '0')}
              </div>
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-slate-400 mt-1 font-medium">
                {p.label}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-2.5">
          <div className="flex items-center gap-2.5 text-sm">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Tarih & Saat:</span>
            <span className="font-semibold text-slate-100">
              {formatDateTime(meeting.meeting_date)}
            </span>
          </div>
          {meeting.meeting_url && (
            <div className="flex items-center gap-2.5 text-sm">
              <Video className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">Görüşme Linki:</span>
              <a
                href={meeting.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-400 hover:text-emerald-300 truncate underline-offset-4 hover:underline"
              >
                Bağlantıyı aç
              </a>
            </div>
          )}
          {meeting.notes && (
            <div className="flex items-start gap-2.5 text-sm">
              <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrslate-0" />
              <div>
                <span className="text-slate-400">Koç Notu: </span>
                <span className="text-slate-200">{meeting.notes}</span>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
