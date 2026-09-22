'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  MessageSquareHeart,
  Sparkles,
  Flame,
  MessageCircle,
  Clock,
} from 'lucide-react';
import type { CoachNote } from '@/lib/types';
import { cn, formatDateTime, getMotivationalQuote } from '@/lib/utils';

interface CoachNotesProps {
  notes?: CoachNote[];
  coachName?: string;
}

export function CoachNotes({
  notes: initial,
  coachName = 'Koçun',
}: CoachNotesProps) {
  const notes = initial && initial.length > 0 ? initial : [];
  const quote = getMotivationalQuote();
  const unreadCount = notes.filter((n) => !n.is_read).length;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-orange-500/5 blur-3xl" />
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 via-orange-50 to-sky-50 border border-slate-200 flex items-center justify-center">
                <MessageSquareHeart className="w-5.5 h-5.5 text-emerald-600" />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 border-2 border-white text-[10px] font-bold flex items-center justify-center text-white shadow-sm">
                  {unreadCount}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  {coachName} Notları
                </span>
              </div>
              <h3 className="font-display text-xl font-bold">
                Sana özel <span className="gradient-text">motivasyon</span>
              </h3>
            </div>
          </div>
          {unreadCount > 0 && (
            <Badge variant="fire" size="md" className="gap-1.5">
              <MessageCircle className="w-3 h-3" />
              {unreadCount} okunmamış
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        <div className="relative rounded-2xl p-5 border border-emerald-200 bg-gradient-to-br from-emerald-50 via-orange-50/50 to-sky-50 overflow-hidden">
          <div className="absolute top-3 right-3 opacity-30">
            <Flame className="w-8 h-8 text-orange-500" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-600 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Günün Sözü
          </div>
          <p className="font-display text-lg md:text-xl font-semibold text-slate-800 leading-relaxed">
            &quot;{quote.text}&quot;
          </p>
          <p className="text-sm text-slate-500 mt-2">— {quote.author}</p>
        </div>

        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {notes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-medium mb-1">
                Henüz bir koç notun yok
              </p>
              <p className="text-sm text-slate-400">
                Yakında burada özel mesajların olacak ✨
              </p>
            </div>
          ) : (
            notes.map((note, idx) => (
              <div
                key={note.id}
                className={cn(
                  'relative rounded-xl border p-4 transition-all duration-300',
                  !note.is_read
                    ? 'bg-emerald-50/60 border-emerald-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-display',
                        idx === 0
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      )}
                    >
                      {(coachName[0] || 'K').toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        {coachName}
                        {!note.is_read && (
                          <span className="chip bg-orange-100 text-orange-700 border border-orange-200 text-[9px] py-0.5 px-2 rounded-full font-bold">
                            YENİ
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(note.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm md:text-[15px] leading-relaxed text-slate-700 pl-10">
                  {note.content}
                </p>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}
