-- =============================================================
-- SIGMA MENTÖRLÜK / SUPABASE KURULUM ŞEMASI
-- ADIM 1: Tablolar + Tipler + RLS Politikaları
-- Doğrudan Supabase SQL Editor içinde çalıştırılabilir.
-- =============================================================

-- extensions
create extension if not exists "pgcrypto";

-- =============================================================
-- 1. TİPLER (ENUMLAR)
-- =============================================================
do $$ begin
  create type user_role as enum ('coach', 'student');
exception when duplicate_object then null; end $$;

do $$ begin
  create type exam_type as enum ('TYT', 'AYT');
exception when duplicate_object then null; end $$;

-- =============================================================
-- 2. TABLOLAR
-- =============================================================

-- profiles: auth.users ile birebir ilişkili, kullanıcı rolü + öğrenci ise coach_id
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'student',
  coach_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- tasks: koç tarafından öğrenciye atanan görevler
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  is_completed boolean not null default false,
  task_date date default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- exam_results: öğrenci deneme sonuçları
create table if not exists public.exam_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  exam_type exam_type not null,
  net_score numeric(5,2) not null,
  exam_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- meetings: haftalık görüşme tarihlerini tutalım (koç panelde form ile güncellenir)
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade unique,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  meeting_date timestamptz,
  duration_minutes integer not null default 60,
  meeting_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- indexler
create index if not exists idx_profiles_coach_id on public.profiles(coach_id);
create index if not exists idx_tasks_student_date on public.tasks(student_id, task_date desc);
create index if not exists idx_tasks_coach_id on public.tasks(coach_id);
create index if not exists idx_exam_results_student on public.exam_results(student_id, exam_date desc);
create index if not exists idx_exam_results_coach on public.exam_results(coach_id);

-- =============================================================
-- 3. ROW LEVEL SECURITY (RLS) ETKİNLEŞTİR
-- =============================================================
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.exam_results enable row level security;
alter table public.meetings enable row level security;

-- =============================================================
-- 4. POLİTİKALAR (YARDIMCI FONKSİYON)
--    her yerde kullanmak için bir "benim öğrencilerim/benim koçum" helper'ı yazalım
-- =============================================================
create or replace function public.is_owner_of_student(student_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case
    when auth.uid() = student_id then true
    when exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'coach'
        and exists (select 1 from public.profiles s where s.id = student_id and s.coach_id = auth.uid())
    ) then true
    else false
  end;
$$;

create or replace function public.can_modify_as_coach(student_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'coach'
      and exists (select 1 from public.profiles s where s.id = student_id and s.coach_id = auth.uid())
  ) or auth.uid() = student_id;
$$;

-- =============================================================
-- 5. PROFILES POLİTİKALARI
-- =============================================================
drop policy if exists "Kendini gör" on public.profiles;
create policy "Kendini gör" on public.profiles for select using (
  auth.uid() = id
  or (select role from public.profiles where id = auth.uid()) = 'coach' and coach_id = auth.uid()
);

drop policy if exists "Kendini güncelle" on public.profiles;
create policy "Kendini güncelle" on public.profiles for update using (
  auth.uid() = id
);

drop policy if exists "Koç kendi öğrencisinin profilini görür" on public.profiles;
-- Yukarıdaki "Kendini gör" ile zaten kapsanıyor, ama tekrar emin olalım:
create policy "Koç kendi öğrencisinin profilini görür" on public.profiles for select using (
  exists (select 1 from public.profiles s where s.id = profiles.id and s.coach_id = auth.uid())
);

-- =============================================================
-- 6. TASKS POLİTİKALARI
-- =============================================================
drop policy if exists "Tasks görünürlük" on public.tasks;
create policy "Tasks görünürlük" on public.tasks for select using (
  -- Öğrenci kendi görevlerini görür, koç kendi öğrencilerinin
  student_id = auth.uid()
  or (
    (select role from public.profiles where id = auth.uid()) = 'coach'
    and exists (select 1 from public.profiles s where s.id = tasks.student_id and s.coach_id = auth.uid())
  )
);

drop policy if exists "Öğrenci kendi görevini sadece tamamlar (is_completed)" on public.tasks;
create policy "Öğrenci kendi görevini sadece tamamlar" on public.tasks for update using (
  student_id = auth.uid()
) with check (
  -- öğrencinin title/description/değiştirmesine izin VERME, sadece is_completed
  student_id = auth.uid()
  and title = (select title from public.tasks where id = tasks.id)
  and (description is not distinct from (select description from public.tasks where id = tasks.id))
  and (task_date is not distinct from (select task_date from public.tasks where id = tasks.id))
);

drop policy if exists "Koç görev ekleyebilir" on public.tasks;
create policy "Koç görev ekleyebilir" on public.tasks for insert with check (
  (select role from public.profiles where id = auth.uid()) = 'coach'
  and exists (select 1 from public.profiles s where s.id = tasks.student_id and s.coach_id = auth.uid())
  and coach_id = auth.uid()
);

drop policy if exists "Koç görevi güncelleyebilir" on public.tasks;
create policy "Koç görevi güncelleyebilir" on public.tasks for update using (
  (select role from public.profiles where id = auth.uid()) = 'coach'
  and exists (select 1 from public.profiles s where s.id = tasks.student_id and s.coach_id = auth.uid())
) with check (
  (select role from public.profiles where id = auth.uid()) = 'coach'
  and coach_id = auth.uid()
);

drop policy if exists "Koç görevi silebilir" on public.tasks;
create policy "Koç görevi silebilir" on public.tasks for delete using (
  (select role from public.profiles where id = auth.uid()) = 'coach'
  and exists (select 1 from public.profiles s where s.id = tasks.student_id and s.coach_id = auth.uid())
);

-- =============================================================
-- 7. EXAM_RESULTS POLİTİKALARI
-- =============================================================
drop policy if exists "Exam görünürlük" on public.exam_results;
create policy "Exam görünürlük" on public.exam_results for select using (
  student_id = auth.uid()
  or (
    (select role from public.profiles where id = auth.uid()) = 'coach'
    and exists (select 1 from public.profiles s where s.id = exam_results.student_id and s.coach_id = auth.uid())
  )
);

drop policy if exists "Öğrenci kendi denemesini ekleyebilir" on public.exam_results;
create policy "Öğrenci kendi denemesini ekleyebilir" on public.exam_results for insert with check (
  student_id = auth.uid()
);

drop policy if exists "Koç deneme ekleyebilir/güncelleyebilir" on public.exam_results;
create policy "Koç deneme ekleyebilir/güncelleyebilir" on public.exam_results for insert with check (
  (select role from public.profiles where id = auth.uid()) = 'coach'
  and exists (select 1 from public.profiles s where s.id = exam_results.student_id and s.coach_id = auth.uid())
  and coach_id = auth.uid()
);

drop policy if exists "Koç denemesini güncelleyebilir" on public.exam_results;
create policy "Koç denemesini güncelleyebilir" on public.exam_results for update using (
  (select role from public.profiles where id = auth.uid()) = 'coach'
  and exists (select 1 from public.profiles s where s.id = exam_results.student_id and s.coach_id = auth.uid())
);

drop policy if exists "Koç denemesini silebilir" on public.exam_results;
create policy "Koç denemesini silebilir" on public.exam_results for delete using (
  (select role from public.profiles where id = auth.uid()) = 'coach'
  and exists (select 1 from public.profiles s where s.id = exam_results.student_id and s.coach_id = auth.uid())
);

-- =============================================================
-- 8. MEETINGS POLİTİKALARI
-- =============================================================
drop policy if exists "Meetings görünürlük" on public.meetings;
create policy "Meetings görünürlük" on public.meetings for select using (
  student_id = auth.uid()
  or (
    (select role from public.profiles where id = auth.uid()) = 'coach'
    and exists (select 1 from public.profiles s where s.id = meetings.student_id and s.coach_id = auth.uid())
  )
);

drop policy if exists "Koç görüşme oluştur/güncelle" on public.meetings;
create policy "Koç görüşme oluştur/güncelle" on public.meetings for insert with check (
  (select role from public.profiles where id = auth.uid()) = 'coach'
  and exists (select 1 from public.profiles s where s.id = meetings.student_id and s.coach_id = auth.uid())
  and coach_id = auth.uid()
);

drop policy if exists "Koç görüşme güncelle (update)" on public.meetings;
create policy "Koç görüşme güncelle (update)" on public.meetings for update using (
  (select role from public.profiles where id = auth.uid()) = 'coach'
  and exists (select 1 from public.profiles s where s.id = meetings.student_id and s.coach_id = auth.uid())
) with check (
  coach_id = auth.uid()
);

-- =============================================================
-- 9. AUTH.USER OLUŞUNCA PROFİLİ OTOMATİK OLUŞTURAN TRIGGER
-- =============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, coach_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student'),
    (
      case when new.raw_user_meta_data->>'coach_id' is not null
      then (new.raw_user_meta_data->>'coach_id')::uuid else null end
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
