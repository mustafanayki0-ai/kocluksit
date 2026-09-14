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

function buildSyntheticNotes(): CoachNote[] {
  const now = Date.now();
  return [
    {
      id: 'n1',
      student_id: 's1',
      coach_id: 'c1',
      content:
        'Merhaba! Geçen haftaki çalışma disiplinini gerçekten çok beğendim. Bu hafta matematikte türev konusuna odaklanırsan büyük sıçrama yaparsın. Sabırsızlanma, başarı hemen gelmez ama sen geliyorsun! 🔥',
      is_read: false,
      created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'n2',
      student_id: 's1',
      coach_id: 'c1',
      content:
        'Son denemendeki Türkçe netini gördüm - 37 ile efsane bir iş çıkarmışsın! Harika gidiyorsun. Sıradaki hedefin fen bilimlerinde 30+ net olsun. Yanındayım 💪',
      is_read: true,
      created_at: new Date(now - 1000 * 60 * 60 * 36).toISOString(),
    },
    {
      id: 'n3',
      student_id: 's1',
      coach_id: 'c1',
      content:
        'Unutma: Yorulduğunda dinlen, ama asla pes etme. Bugün yapacağın 5 ekstra soru, bir yıl sonra sana fark olarak geri dönecek. Güzel bir hafta olsun ✨',
      is_read: true,
      created_at: new Date(now - 1000 * 60 * 60 * 84).toISOString(),
    },
  ];
}

export function CoachNotes({
  notes: initial,
  coachName = 'Koçun',
}: CoachNotesProps) {
  const notes =
    initial && initial.length > 0 ? initial : buildSyntheticNotes();
  const quote = getMotivationalQuote();
  const unreadCount = notes.filter((n) => !n.is_read).length;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-emerald-500/8 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-fire-500/8 blur-3xl" />
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/30 via-fire-500/30 to-emerald-500/30 flex items-center justify-center">
                <MessageSquareHeart className="w-5.5 h-5.5 text-emerald-300" />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-fire-500 border-2 border-slate-900 text-[10px] font-bold flex items-center justify-center text-white">
                  {unreadCount}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
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
        <div className="relative rounded-2xl p-5 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-fire-500/5 to-emerald-500/10 overflow-hidden">
          <div className="absolute top-3 right-3 opacity-20">
            <Flame className="w-8 h-8 text-fire-400" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fire-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Günün Sözü
          </div>
          <p className="font-display text-lg md:text-xl font-semibold text-slate-100 leading-relaxed">
            "{quote.text}"
          </p>
          <p className="text-sm text-slate-400 mt-2">— {quote.author}</p>
        </div>

        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {notes.map((note, idx) => (
            <div
              key={note.id}
              className={cn(
                'relative rounded-xl border p-4 transition-all duration-300',
                !note.is_read
                  ? 'bg-emerald-500/8 border-emerald-500/30 shadow-glow'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-display',
                      idx === 0
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    )}
                  >
                    {(coachName[0] || 'K').toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      {coachName}
                      {!note.is_read && (
                        <span className="chip bg-fire-500/15 text-fire-400 border border-fire-500/25 text-[9px] py-0.5 px-2">
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
              <p className="text-sm md:text-[15px] leading-relaxed text-slate-200 pl-10.5">
                {note.content}
              </p>
            </div>
          ))}

          {notes.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <p className="text-slate-400">
                Henüz bir koç notun yok. Yakında burada özel mesajların olacak ✨
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
