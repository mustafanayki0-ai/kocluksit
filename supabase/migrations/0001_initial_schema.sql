create extension if not exists "pgcrypto";

create type user_role as enum ('coach', 'student');
create type meeting_status as enum ('scheduled', 'completed', 'cancelled');
create type exam_type as enum ('TYT', 'AYT');

create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text not null,
    role user_role not null default 'student',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.students (
    id uuid primary key default gen_random_uuid(),
    coach_id uuid not null references public.profiles(id) on delete cascade,
    user_id uuid unique references auth.users(id) on delete set null,
    full_name text not null,
    email text not null unique,
    phone text,
    target_university text,
    target_department text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.weekly_programs (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.students(id) on delete cascade,
    coach_id uuid not null references public.profiles(id) on delete cascade,
    week_start_date date not null,
    week_end_date date not null,
    content text not null,
    pdf_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.meetings (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.students(id) on delete cascade,
    coach_id uuid not null references public.profiles(id) on delete cascade,
    meeting_date timestamptz not null,
    duration_minutes integer not null default 60,
    meeting_url text,
    notes text,
    status meeting_status not null default 'scheduled',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.exam_results (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.students(id) on delete cascade,
    exam_type exam_type not null,
    exam_date date not null,
    total_net numeric(5,2) not null,
    turkish_net numeric(5,2),
    math_net numeric(5,2),
    physics_net numeric(5,2),
    chemistry_net numeric(5,2),
    biology_net numeric(5,2),
    history_net numeric(5,2),
    geography_net numeric(5,2),
    philosophy_net numeric(5,2),
    religion_net numeric(5,2),
    rank integer,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.daily_tasks (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.students(id) on delete cascade,
    task_date date not null default current_date,
    title text not null,
    description text,
    is_completed boolean not null default false,
    estimated_hours numeric(3,1),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.coach_notes (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.students(id) on delete cascade,
    coach_id uuid not null references public.profiles(id) on delete cascade,
    content text not null,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists idx_students_coach_id on public.students(coach_id);
create index if not exists idx_students_user_id on public.students(user_id);
create index if not exists idx_weekly_programs_student_id on public.weekly_programs(student_id);
create index if not exists idx_meetings_student_id on public.meetings(student_id);
create index if not exists idx_meetings_meeting_date on public.meetings(meeting_date);
create index if not exists idx_exam_results_student_id on public.exam_results(student_id);
create index if not exists idx_exam_results_exam_date on public.exam_results(exam_date);
create index if not exists idx_daily_tasks_student_date on public.daily_tasks(student_id, task_date);
create index if not exists idx_coach_notes_student_id on public.coach_notes(student_id);

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.weekly_programs enable row level security;
alter table public.meetings enable row level security;
alter table public.exam_results enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.coach_notes enable row level security;

create policy "Kullanıcı kendi profilini görebilir"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Kullanıcı kendi profilini güncelleyebilir"
    on public.profiles for update
    using (auth.uid() = id);

create policy "Koç kendi öğrencilerini görebilir"
    on public.students for select
    using (
        coach_id = auth.uid()
        or user_id = auth.uid()
    );

create policy "Koç öğrenci ekleyebilir"
    on public.students for insert
    with check (
        coach_id = auth.uid()
        and exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'coach'
        )
    );

create policy "Koç kendi öğrencilerini güncelleyebilir"
    on public.students for update
    using (coach_id = auth.uid());

create policy "Koç kendi öğrencilerini silebilir"
    on public.students for delete
    using (coach_id = auth.uid());

create policy "Haftalık programları görme"
    on public.weekly_programs for select
    using (
        coach_id = auth.uid()
        or exists (
            select 1 from public.students s
            where s.id = weekly_programs.student_id and s.user_id = auth.uid()
        )
    );

create policy "Koç program ekleyebilir"
    on public.weekly_programs for insert
    with check (coach_id = auth.uid());

create policy "Koç program güncelleyebilir"
    on public.weekly_programs for update
    using (coach_id = auth.uid());

create policy "Koç program silebilir"
    on public.weekly_programs for delete
    using (coach_id = auth.uid());

create policy "Görüşmeleri görme"
    on public.meetings for select
    using (
        coach_id = auth.uid()
        or exists (
            select 1 from public.students s
            where s.id = meetings.student_id and s.user_id = auth.uid()
        )
    );

create policy "Koç görüşme ekleyebilir"
    on public.meetings for insert
    with check (coach_id = auth.uid());

create policy "Koç görüşme güncelleyebilir"
    on public.meetings for update
    using (coach_id = auth.uid());

create policy "Koç görüşme silebilir"
    on public.meetings for delete
    using (coach_id = auth.uid());

create policy "Deneme sonuçlarını görme"
    on public.exam_results for select
    using (
        exists (
            select 1 from public.students s
            where s.id = exam_results.student_id
            and (s.coach_id = auth.uid() or s.user_id = auth.uid())
        )
    );

create policy "Deneme sonucu ekleme"
    on public.exam_results for insert
    with check (
        exists (
            select 1 from public.students s
            where s.id = exam_results.student_id
            and (s.coach_id = auth.uid() or s.user_id = auth.uid())
        )
    );

create policy "Deneme sonucu güncelleme"
    on public.exam_results for update
    using (
        exists (
            select 1 from public.students s
            where s.id = exam_results.student_id
            and (s.coach_id = auth.uid() or s.user_id = auth.uid())
        )
    );

create policy "Deneme sonucu silme"
    on public.exam_results for delete
    using (
        exists (
            select 1 from public.students s
            where s.id = exam_results.student_id
            and s.coach_id = auth.uid()
        )
    );

create policy "Günlük görevleri görme"
    on public.daily_tasks for select
    using (
        exists (
            select 1 from public.students s
            where s.id = daily_tasks.student_id
            and (s.coach_id = auth.uid() or s.user_id = auth.uid())
        )
    );

create policy "Günlük görev ekleme"
    on public.daily_tasks for insert
    with check (
        exists (
            select 1 from public.students s
            where s.id = daily_tasks.student_id
            and (s.coach_id = auth.uid() or s.user_id = auth.uid())
        )
    );

create policy "Günlük görev güncelleme"
    on public.daily_tasks for update
    using (
        exists (
            select 1 from public.students s
            where s.id = daily_tasks.student_id
            and (s.coach_id = auth.uid() or s.user_id = auth.uid())
        )
    );

create policy "Günlük görev silme"
    on public.daily_tasks for delete
    using (
        exists (
            select 1 from public.students s
            where s.id = daily_tasks.student_id
            and (s.coach_id = auth.uid() or s.user_id = auth.uid())
        )
    );

create policy "Koç notlarını görme"
    on public.coach_notes for select
    using (
        coach_id = auth.uid()
        or exists (
            select 1 from public.students s
            where s.id = coach_notes.student_id and s.user_id = auth.uid()
        )
    );

create policy "Koç not ekleyebilir"
    on public.coach_notes for insert
    with check (coach_id = auth.uid());

create policy "Koç not güncelleyebilir"
    on public.coach_notes for update
    using (coach_id = auth.uid());

create policy "Koç not silebilir"
    on public.coach_notes for delete
    using (coach_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, full_name, role)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', new.email),
        coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
    );
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
