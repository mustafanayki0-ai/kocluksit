import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FileText, Plus, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CoachProgramsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'coach') redirect('/dashboard/student');

  const { data: students } = await supabase.from('students').select('id, full_name').eq('coach_id', user.id);
  const studentIds = (students || []).map(s => s.id);

  let programs: any[] = [];
  if (studentIds.length > 0) {
    try {
      const { data: p } = await supabase
        .from('weekly_programs')
        .select('*, students(full_name)')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })
        .limit(20);
      programs = p || [];
    } catch (e) {
      console.error('Programs sayfası veri hatası:', e);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">
            <span className="gradient-text">Haftalık Programlar</span>
          </h1>
          <p className="text-slate-500">Öğrencilere program atama ve yönetme.</p>
        </div>
        <Button><Plus className="w-4 h-4" /> Yeni Program Ata</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <FileText className="w-5.5 h-5.5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">Tüm Programlar</h3>
              <p className="text-sm text-slate-500 mt-0.5">{programs.length} program listelendi</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-2.5 pt-2">
          {programs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium mb-1">Henüz atanmış program yok</p>
              <p className="text-sm text-slate-400">Yeni bir haftalık program oluşturmak için yukarıdaki butonu kullan.</p>
            </div>
          ) : (
            programs.map(p => (
              <div key={p.id} className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 transition-all duration-300 p-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{(p as any).students?.full_name}</span>
                    <Badge variant="brand" size="sm">{formatDate(p.week_start_date)} Haftası</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Oluşturulma ve detay bilgisi</p>
                </div>
                <Button variant="ghost" size="sm" className="!p-2"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
