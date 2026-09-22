'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import type { ExamType } from '@/lib/types';
import { PlusCircle, FileText } from 'lucide-react';

interface ExamAddFormProps {
  studentId: string;
  onAdded: () => Promise<void>;
  mode?: 'student' | 'coach';
}

export function ExamAddForm({ studentId, onAdded, mode = 'student' }: ExamAddFormProps) {
  const supabase = createClient();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    exam_type: 'TYT' as ExamType,
    exam_date: new Date().toISOString().slice(0, 10),
    total_net: '',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const net = Number(form.total_net);
    if (!form.exam_date || Number.isNaN(net) || net < 0) {
      toast.warning('Lütfen geçerli bir tarih ve net sayısı gir');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('exam_results').insert({
        student_id: studentId,
        exam_type: form.exam_type,
        exam_date: form.exam_date,
        total_net: net,
      });
      if (error) throw error;
      toast.success('Deneme sonucu kaydedildi', `${form.exam_type} · ${net.toFixed(2)} net`);
      setForm({ exam_type: 'TYT', exam_date: new Date().toISOString().slice(0, 10), total_net: '' });
      await onAdded();
    } catch (err: any) {
      toast.error('Deneme eklenemedi', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden relative">
      <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-sky-500/15 blur-3xl" />
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-sky-600" />
              <h3 className="font-display font-bold text-lg text-slate-900">
                {mode === 'student' ? 'Yeni Deneme Ekle' : 'Deneme Ekle'}
              </h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              TYT veya AYT denemenin net sonucunu hızlıca sisteme kaydet.
            </p>
          </div>
          <Badge variant="accent" size="md" className="gap-1.5">
            <PlusCircle className="w-3 h-3" />
            Hızlı Ekle
          </Badge>
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={submit} className="grid sm:grid-cols-4 gap-3 items-end">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Sınav Türü</span>
            <select
              value={form.exam_type}
              onChange={(e) => setForm((f) => ({ ...f, exam_type: e.target.value as ExamType }))}
              className="input mt-1.5"
            >
              <option value="TYT">TYT</option>
              <option value="AYT">AYT</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Deneme Tarihi</span>
            <input
              type="date"
              value={form.exam_date}
              onChange={(e) => setForm((f) => ({ ...f, exam_date: e.target.value }))}
              className="input mt-1.5"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Toplam Net</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={form.total_net}
              onChange={(e) => setForm((f) => ({ ...f, total_net: e.target.value }))}
              placeholder="örn. 95.25"
              className="input mt-1.5"
            />
          </label>
          <Button type="submit" loading={submitting} size="md" className="sm:h-[42px] gap-1.5 w-full">
            <PlusCircle className="w-4 h-4" />
            Kaydet
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
