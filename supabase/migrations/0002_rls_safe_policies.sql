-- =============================================================
-- SIGMA MENTÖRLÜK - RLS GÜVENLİK DÜZELTME MIGRATION
-- Problemler:
--   1) Eski policy'ler subquery'ler üzerinden public.profiles tablosuna
--      erişiyordu, ancak profiles RLS aktif olduğu için subquery'ler
--      ya sonsuz döngüye giriyor ya da yanlış FALSE dönüyordu.
--   2) exam_results, tasks, meetings policy'lerinde koç, öğrencisini
--      göremiyordu.
--
-- Çözüm:
--   Güvenilir (SECURITY DEFINER) helper fonksiyonları kullanarak
--   policy'leri yeniden yazıyoruz. SECURITY DEFINER fonksiyonları
--   RLS'ten etkilenmeden çalışır, bu yüzden döngü yoktur.
-- =============================================================

-- =============================================================
-- 1) HELPER FONKSIYONLAR (SECURITY DEFINER)
--    Daha önce tanımlıysa drop + recreate
-- =============================================================

create or replace function public.is_owner_of_student(student_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when auth.uid() = student_id then true
    when exists (
      select 1 from public.profiles coach
      where coach.id = auth.uid()
        and coach.role = 'coach'
        and exists (
          select 1 from public.profiles stud
          where stud.id = student_id and stud.coach_id = auth.uid()
        )
    ) then true
    else false
  end;
$$;

create or replace function public.can_modify_as_coach(student_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when auth.uid() = student_id then true
    when exists (
      select 1 from public.profiles coach
      where coach.id = auth.uid()
        and coach.role = 'coach'
        and exists (
          select 1 from public.profiles stud
          where stud.id = student_id and stud.coach_id = auth.uid()
        )
    ) then true
    else false
  end;
$$;

create or replace function public.is_coach_of(student_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles coach
    where coach.id = auth.uid()
      and coach.role = 'coach'
      and exists (
        select 1 from public.profiles stud
        where stud.id = student_id and stud.coach_id = auth.uid()
      )
  );
$$;

create or replace function public.my_role()
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce((select role::text from public.profiles where id = auth.uid() limit 1), 'student');
$$;

grant execute on function public.is_owner_of_student(uuid) to authenticated;
grant execute on function public.can_modify_as_coach(uuid) to authenticated;
grant execute on function public.is_coach_of(uuid) to authenticated;
grant execute on function public.my_role() to authenticated;

-- =============================================================
-- 2) PROFILES POLICY'LERI
-- =============================================================
drop policy if exists "Kendini gör" on public.profiles;
drop policy if exists "Koç kendi öğrencisinin profilini görür" on public.profiles;
drop policy if exists "Kendini güncelle" on public.profiles;

-- Profile görünürlük: kendini + koç kendi öğrencisini görebilir
create policy "Profile görünürlük" on public.profiles for select using (
  auth.uid() = id
  or public.is_coach_of(id)
);

-- Profile güncelleme: sadece kendisi
create policy "Profile güncelleme" on public.profiles for update using (
  auth.uid() = id
);

-- =============================================================
-- 3) TASKS POLICY'LERI
-- =============================================================
drop policy if exists "Tasks görünürlük" on public.tasks;
drop policy if exists "Öğrenci kendi görevini sadece tamamlar" on public.tasks;
drop policy if exists "Koç görev ekleyebilir" on public.tasks;
drop policy if exists "Koç görevi güncelleyebilir" on public.tasks;
drop policy if exists "Koç görevi silebilir" on public.tasks;
-- 0001 migration uyumluluk:
drop policy if exists "Günlük görevleri görme" on public.tasks;
drop policy if exists "Günlük görev ekleme" on public.tasks;
drop policy if exists "Günlük görev güncelleme" on public.tasks;
drop policy if exists "Günlük görev silme" on public.tasks;

create policy "Tasks görünürlük" on public.tasks for select using (
  public.is_owner_of_student(student_id)
);

create policy "Öğrenci görevi sadece tamamlar" on public.tasks for update using (
  auth.uid() = student_id
) with check (
  -- Öğrenci title/description/task_date değiştiremez, sadece is_completed
  auth.uid() = student_id
  and title = (select title from public.tasks where id = tasks.id)
  and (description is not distinct from (select description from public.tasks where id = tasks.id))
  and (task_date is not distinct from (select task_date from public.tasks where id = tasks.id))
  and (student_id is not distinct from (select student_id from public.tasks where id = tasks.id))
  and (coach_id is not distinct from (select coach_id from public.tasks where id = tasks.id))
);

create policy "Koç görev ekleyebilir" on public.tasks for insert with check (
  public.is_coach_of(student_id)
  and coach_id = auth.uid()
);

create policy "Koç görevi güncelleyebilir" on public.tasks for update using (
  public.is_coach_of(student_id)
) with check (
  public.is_coach_of(student_id)
  and coach_id = auth.uid()
);

create policy "Koç görevi silebilir" on public.tasks for delete using (
  public.is_coach_of(student_id)
);

-- =============================================================
-- 4) EXAM_RESULTS POLICY'LERI
--    En kritik kısım: Koç kendi öğrencisinin sınavlarını görebilmeli
-- =============================================================
drop policy if exists "Exam görünürlük" on public.exam_results;
drop policy if exists "Öğrenci kendi denemesini ekleyebilir" on public.exam_results;
drop policy if exists "Koç deneme ekleyebilir/güncelleyebilir" on public.exam_results;
drop policy if exists "Koç denemesini güncelleyebilir" on public.exam_results;
drop policy if exists "Koç denemesini silebilir" on public.exam_results;
-- 0001 migration uyumluluk:
drop policy if exists "Deneme sonuçlarını görme" on public.exam_results;
drop policy if exists "Deneme sonucu ekleme" on public.exam_results;
drop policy if exists "Deneme sonucu güncelleme" on public.exam_results;
drop policy if exists "Deneme sonucu silme" on public.exam_results;

create policy "Exam görünürlük" on public.exam_results for select using (
  public.is_owner_of_student(student_id)
);

create policy "Öğrenci kendi denemesini ekleyebilir" on public.exam_results for insert with check (
  student_id = auth.uid()
);

create policy "Koç deneme ekleyebilir" on public.exam_results for insert with check (
  public.is_coach_of(student_id)
);

create policy "Deneme güncelleme" on public.exam_results for update using (
  public.is_owner_of_student(student_id)
);

create policy "Koç denemesini silebilir" on public.exam_results for delete using (
  public.is_coach_of(student_id)
);

-- =============================================================
-- 5) MEETINGS POLICY'LERI
-- =============================================================
drop policy if exists "Meetings görünürlük" on public.meetings;
drop policy if exists "Koç görüşme oluştur/güncelle" on public.meetings;
drop policy if exists "Koç görüşme güncelle (update)" on public.meetings;
-- 0001 migration uyumluluk:
drop policy if exists "Görüşmeleri görme" on public.meetings;
drop policy if exists "Koç görüşme ekleyebilir" on public.meetings;
drop policy if exists "Koç görüşme güncelleyebilir" on public.meetings;
drop policy if exists "Koç görüşme silebilir" on public.meetings;

create policy "Meetings görünürlük" on public.meetings for select using (
  public.is_owner_of_student(student_id)
);

create policy "Koç görüşme ekleyebilir" on public.meetings for insert with check (
  public.is_coach_of(student_id)
  and coach_id = auth.uid()
);

create policy "Koç görüşme güncelleyebilir" on public.meetings for update using (
  public.is_coach_of(student_id)
) with check (
  public.is_coach_of(student_id)
  and coach_id = auth.uid()
);

create policy "Koç görüşme silebilir" on public.meetings for delete using (
  public.is_coach_of(student_id)
);

-- =============================================================
-- 6) ESKI 0001_MIGRATION TABLOLARI (students / weekly_programs /
--    coach_notes) POLICY'LERI (uyumluluk için tutuyoruz)
-- =============================================================
drop policy if exists "Koç kendi öğrencilerini görebilir" on public.students;
drop policy if exists "Koç öğrenci ekleyebilir" on public.students;
drop policy if exists "Koç kendi öğrencilerini güncelleyebilir" on public.students;
drop policy if exists "Koç kendi öğrencilerini silebilir" on public.students;

drop policy if exists "Haftalık programları görme" on public.weekly_programs;
drop policy if exists "Koç program ekleyebilir" on public.weekly_programs;
drop policy if exists "Koç program güncelleyebilir" on public.weekly_programs;
drop policy if exists "Koç program silebilir" on public.weekly_programs;

drop policy if exists "Koç notlarını görme" on public.coach_notes;
drop policy if exists "Koç not ekleyebilir" on public.coach_notes;
drop policy if exists "Koç not güncelleyebilir" on public.coach_notes;
drop policy if exists "Koç not silebilir" on public.coach_notes;

-- students (eski şema) görünürlük
create policy "Eski students görünürlük" on public.students for select using (
  coach_id = auth.uid()
  or user_id = auth.uid()
);

-- weekly_programs görünürlük
create policy "Eski weekly_programs görünürlük" on public.weekly_programs for select using (
  coach_id = auth.uid()
  or exists (select 1 from public.students s where s.id = weekly_programs.student_id and s.user_id = auth.uid())
);

-- coach_notes görünürlük
create policy "Eski coach_notes görünürlük" on public.coach_notes for select using (
  coach_id = auth.uid()
  or exists (select 1 from public.students s where s.id = coach_notes.student_id and s.user_id = auth.uid())
);
