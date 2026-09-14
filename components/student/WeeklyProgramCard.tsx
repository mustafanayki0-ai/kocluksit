'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  FileText,
  CalendarRange,
  Download,
  ExternalLink,
  Bookmark,
  CheckSquare,
  Sparkles,
  BookOpen,
  Target,
} from 'lucide-react';
import type { WeeklyProgram } from '@/lib/types';
import { cn, formatDate, getWeekDates } from '@/lib/utils';

interface WeeklyProgramCardProps {
  program?: WeeklyProgram;
}

const programTemplate = {
  Pazartesi: [
    { time: '09:00 - 11:00', title: 'Matematik - Türev', desc: 'Konu anlatımı + 40 soru', color: 'brand' },
    { time: '11:30 - 13:00', title: 'Türkçe - Paragraf', desc: '20 paragraf + çözüm', color: 'accent' },
    { time: '14:30 - 16:30', title: 'Fen - Fizik', desc: 'Kuvvet ve Hareket konu', color: 'fire' },
    { time: '17:00 - 18:00', title: 'Günlük tekrar', desc: 'Günün notları + kelime', color: 'ink' },
  ],
  Salı: [
    { time: '09:00 - 11:00', title: 'Sosyal - Tarih', desc: 'Kurtuluş Savaşı dönemi', color: 'brand' },
    { time: '11:30 - 13:00', title: 'Matematik - Limit', desc: 'Problem çözümü 30 soru', color: 'accent' },
    { time: '14:30 - 16:00', title: 'Fen - Kimya', desc: 'Mol kavramı soru', color: 'fire' },
    { time: '16:30 - 17:30', title: 'Türkçe - Dil Bilgisi', desc: 'Sözcük türleri test', color: 'ink' },
  ],
  Çarşamba: [
    { time: '09:00 - 11:30', title: 'Deneme - TYT', desc: 'Tam zamanlı 150 soru', color: 'fire' },
    { time: '13:30 - 15:30', title: 'Deneme Analizi', desc: 'Yanlışlar ve eksikler', color: 'brand' },
    { time: '16:00 - 17:30', title: 'Eksik konu kapatma', desc: 'Hatalı konuların tekrarı', color: 'accent' },
  ],
  Perşembe: [
    { time: '09:00 - 11:00', title: 'Matematik - İntegral', desc: 'Temel konu + 30 soru', color: 'brand' },
    { time: '11:30 - 13:00', title: 'Fen - Biyoloji', desc: 'Hücre bölünmesi', color: 'accent' },
    { time: '14:30 - 16:30', title: 'Türkçe - Cümle', desc: 'Paragraf + cümle soruları', color: 'fire' },
    { time: '17:00 - 18:00', title: 'Sosyal - Coğrafya', desc: 'Harita tekrarı', color: 'ink' },
  ],
  Cuma: [
    { time: '09:00 - 11:00', title: 'Konu tekrar maratonu', desc: 'Tüm dersler haftalık', color: 'fire' },
    { time: '11:30 - 13:00', title: 'Soru çözüm', desc: 'Karışık 50 soru', color: 'brand' },
    { time: '14:30 - 16:00', title: 'Saat 15:00 Koç görüşmesi', desc: 'Hazırlık + notlar', color: 'accent' },
    { time: '16:30 - 17:30', title: 'Hafta Değerlendirme', desc: 'Plan + hedef', color: 'ink' },
  ],
  Cumartesi: [
    { time: '10:00 - 13:00', title: 'Tam Deneme', desc: 'TYT + AYT tam zamanlı', color: 'fire' },
    { time: '14:00 - 16:00', title: 'Deneme analizi', desc: 'Tüm sorular gözden', color: 'brand' },
  ],
  Pazar: [
    { time: '10:00 - 12:00', title: 'Hafif tekrar', desc: 'Yanlışlar defteri', color: 'accent' },
    { time: '12:30 - 13:00', title: 'Haftalık hedef koyma', desc: 'Gelecek hafta planı', color: 'fire' },
    { time: 'Dinlenme', title: 'Kendine zaman ayır 💜', desc: 'Yürüyüş, film, aile', color: 'ink' },
  ],
};

type DayKey = keyof typeof programTemplate;
const dayKeys: DayKey[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const colorMap = {
  brand: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  accent: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  fire: 'bg-fire-500/10 text-fire-300 border-fire-500/20',
  ink: 'bg-slate-800 text-slate-300 border-slate-700',
} as const;

const dotMap = {
  brand: 'bg-emerald-400',
  accent: 'bg-emerald-400',
  fire: 'bg-fire-400',
  ink: 'bg-slate-400',
} as const;

export function WeeklyProgramCard({ program }: WeeklyProgramCardProps) {
  const { start, end } = getWeekDates();
  const coachName = 'Koçun';

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-emerald-500/8 blur-3xl" />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-500/8 blur-3xl" />
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/30 flex items-center justify-center">
              <FileText className="w-5.5 h-5.5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarRange className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {formatDate(start)} – {formatDate(end)}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold">
                Bu Haftaki <span className="gradient-text">Programın</span>
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {program?.pdf_url && (
              <Button variant="secondary" size="sm" asLink href={program.pdf_url}>
                <Download className="w-4 h-4" /> PDF
              </Button>
            )}
            <Badge variant="brand" className="gap-1.5">
              <Bookmark className="w-3 h-3" />
              {coachName} tarafından
            </Badge>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Ders Saati', value: '42+', icon: BookOpen },
            { label: 'Hedef Soru', value: '750', icon: Target },
            { label: 'Deneme', value: '2', icon: CheckSquare },
            { label: 'Görüşme', value: '1', icon: Sparkles },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    {s.label}
                  </div>
                  <div className="font-display text-xl font-bold text-slate-100 tabular-nums">
                    {s.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid md:grid-cols-2 gap-4 max-h-[540px] overflow-y-auto pr-1">
          {dayKeys.map((day, idx) => {
            const items = programTemplate[day];
            const todayIdx = (new Date().getDay() + 6) % 7;
            const isToday = idx === todayIdx;
            return (
              <div
                key={day}
                className={cn(
                  'rounded-2xl border p-4 transition-all duration-300 relative',
                  isToday
                    ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-slate-900/70 to-transparent shadow-glow'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display text-lg font-bold text-slate-100">
                      {day}
                    </h4>
                    {isToday && (
                      <Badge variant="fire" size="sm" className="gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-fire-400 animate-pulse" />
                        Bugün
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {items.length} oturum
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((it, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border p-2.5',
                        colorMap[it.color as keyof typeof colorMap]
                      )}
                    >
                      <div
                        className={cn(
                          'w-1.5 mt-1.5 rounded-full flex-shrslate-0',
                          dotMap[it.color as keyof typeof dotMap]
                        )}
                        style={{ height: 'calc(100% - 12px)' }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[13px] font-semibold text-slate-100">
                            {it.title}
                          </span>
                          <span className="text-[10px] font-mono opacity-75">
                            {it.time}
                          </span>
                        </div>
                        <p className="text-[12px] opacity-80 mt-0.5 leading-relaxed">
                          {it.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {program?.content && (
          <div className="mt-6 rounded-xl bg-slate-900/60 border border-slate-800 p-5">
            <h5 className="font-display font-semibold text-slate-100 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-fire-400" />
              Koçun Özel Notu
            </h5>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {program.content}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
