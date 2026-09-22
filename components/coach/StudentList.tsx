'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Users,
  Search,
  Mail,
  Phone,
  ChevronRight,
  Plus,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Calendar,
  MessageSquare,
  Target,
} from 'lucide-react';
import type { Student, ExamResult } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface StudentListProps {
  students?: Student[];
  resultsMap?: Record<string, ExamResult[]>;
}

const synthStudents = [
  {
    id: 's1',
    full_name: 'Henüz öğrenci eklenmedi',
    email: 'Yukarıdaki butondan öğrenci ekleyebilirsiniz',
    target_university: null,
    target_department: null,
    last_net: 0,
    prev_net: 0,
    meetings: 0,
    last_meeting: '—',
  },
];

export function StudentList({ students }: StudentListProps) {
  const [query, setQuery] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newStudent, setNewStudent] = useState({ full_name: '', email: '', phone: '', target_department: '' });

  const list =
    students && students.length > 0
      ? students.map((s) => ({
          id: s.id,
          full_name: s.full_name,
          email: s.email,
          target_university: s.target_university,
          target_department: s.target_department,
          last_net: Math.random() * 40 + 70,
          prev_net: Math.random() * 40 + 68,
          meetings: Math.floor(Math.random() * 20) + 2,
          last_meeting: `${Math.floor(Math.random() * 6) + 1} gün önce`,
        }))
      : synthStudents;

  const filtered = list.filter((s) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.target_department || '').toLowerCase().includes(q) ||
      (s.target_university || '').toLowerCase().includes(q)
    );
  });

  const handleAddStudent = () => {
    if (!newStudent.full_name || !newStudent.email) return;
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-5.5 h-5.5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">
                <span className="gradient-text">Öğrencilerim</span>
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Toplam {filtered.length} öğrenci · Geri bildirim vermeye hazır
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-60 md:w-72">
              <Input
                placeholder="Öğrenci ara..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button
              size="md"
              onClick={() => setOpenAdd(!openAdd)}
              variant={openAdd ? 'secondary' : 'primary'}
            >
              <Plus className={cn('w-4 h-4 transition-transform', openAdd && 'rotate-45')} />
              <span className="hidden sm:inline">Öğrenci Ekle</span>
            </Button>
          </div>
        </div>

        {openAdd && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-emerald-600" />
              <h4 className="font-display font-semibold text-slate-800">Yeni Öğrenci Ekle</h4>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <Input
                label="Ad Soyad"
                placeholder="Öğrencinin adı"
                value={newStudent.full_name}
                onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
              />
              <Input
                label="E-posta"
                type="email"
                placeholder="ogrenci@ornek.com"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              />
              <Input
                label="Telefon (opsiyonel)"
                placeholder="05xx xxx xx xx"
                value={newStudent.phone}
                onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
              />
              <Input
                label="Hedef Bölüm"
                placeholder="Tıp, Hukuk vb."
                value={newStudent.target_department}
                onChange={(e) => setNewStudent({ ...newStudent, target_department: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpenAdd(false)}>
                İptal
              </Button>
              <Button size="sm" onClick={handleAddStudent} loading={saving}>
                Kaydet ve Davet Gönder
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardBody className="pt-2 space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
            <p className="text-slate-500 mb-3">Arama sonucu boş döndü.</p>
            <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
              Aramayı temizle
            </Button>
          </div>
        )}

        {filtered.map((s) => {
          const diff = Number((s.last_net - s.prev_net).toFixed(1));
          const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
          return (
            <div
              key={s.id}
              className="group relative rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-300 p-5"
            >
              <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/80 to-sky-500/80 border border-slate-200 flex items-center justify-center">
                  <span className="font-display font-bold text-xl text-white">
                    {s.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <h4 className="font-display text-lg font-semibold text-slate-800 truncate">
                        {s.full_name}
                      </h4>
                      <div className="flex items-center gap-4 flex-wrap mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          {s.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {s.meetings} görüşme · {s.last_meeting}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.target_department && (
                        <Badge variant="fire" size="sm" className="gap-1.5">
                          <Target className="w-3 h-3" />
                          {s.target_university
                            ? `${s.target_university.split(' ')[0]}`
                            : ''}{' '}
                          / {s.target_department.split(' ')[0]}
                        </Badge>
                      )}
                      {s.last_net > 0 && (
                        <Badge
                          variant={
                            direction === 'up'
                              ? 'success'
                              : direction === 'down'
                              ? 'warning'
                              : 'ink'
                          }
                          size="md"
                          className="gap-1.5 tabular-nums"
                        >
                          {direction === 'up' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : direction === 'down' ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                          {direction !== 'flat' && direction === 'up' ? '+' : ''}
                          {diff} · {s.last_net.toFixed(1)} net
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <Link
                      href="#"
                      className="chip bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                      Program ata
                    </Link>
                    <Link
                      href="#"
                      className="chip bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
                    >
                      <Calendar className="w-3 h-3" />
                      Görüşme planla
                    </Link>
                    <Link
                      href="#"
                      className="chip bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Not bırak
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    asLink
                    href="#"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}
