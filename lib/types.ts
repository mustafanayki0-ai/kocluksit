export type UserRole = 'coach' | 'student';

export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled';

export type ExamType = 'TYT' | 'AYT';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  coach_id: string | null;
  created_at: string;
  updated_at: string;
  email?: string;
  phone?: string | null;
  target_university?: string | null;
  target_department?: string | null;
}

export type Student = Profile & {
  role: 'student';
  coach_id: string | null;
};

export interface WeeklyProgram {
  id: string;
  student_id: string;
  coach_id: string;
  week_start_date: string;
  week_end_date: string;
  content: string;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  student_id: string;
  coach_id: string;
  title?: string | null;
  meeting_date: string;
  duration_minutes: number;
  meeting_url: string | null;
  notes: string | null;
  status?: MeetingStatus;
  created_at: string;
  updated_at: string;
}

export interface ExamResult {
  id: string;
  student_id: string;
  coach_id?: string | null;
  exam_type: ExamType;
  exam_date: string;
  exam_name?: string | null;
  net_score: number;
  total_net?: number;
  turkish_net?: number | null;
  math_net?: number | null;
  physics_net?: number | null;
  chemistry_net?: number | null;
  biology_net?: number | null;
  history_net?: number | null;
  geography_net?: number | null;
  philosophy_net?: number | null;
  religion_net?: number | null;
  rank?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DailyTask {
  id: string;
  student_id: string;
  coach_id: string;
  task_date: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  estimated_hours?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CoachNote {
  id: string;
  student_id: string;
  coach_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ExamChartData {
  date: string;
  net: number;
  label?: string;
  exam_name?: string | null;
  exam_type?: ExamType;
  turkish?: number;
  math?: number;
}
