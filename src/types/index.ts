export type UserRole = 'admin' | 'school_admin' | 'teacher' | 'student' | 'parent';
export type LicenseStatus = 'trial' | 'active' | 'expired';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  school_id: string | null;
  phone: string;
  is_active: boolean;
  grade: string | null;
  is_graduated: boolean;
  created_at: string;
  updated_at: string;
}

export const STUDENT_GRADES: { value: string; label: string }[] = [
  { value: '1', label: '1. Sınıf' },
  { value: '2', label: '2. Sınıf' },
  { value: '3', label: '3. Sınıf' },
  { value: '4', label: '4. Sınıf' },
  { value: '5', label: '5. Sınıf' },
  { value: '6', label: '6. Sınıf' },
  { value: '7', label: '7. Sınıf' },
  { value: '8', label: '8. Sınıf' },
  { value: '9', label: '9. Sınıf' },
  { value: '10', label: '10. Sınıf' },
  { value: '11', label: '11. Sınıf' },
  { value: '12', label: '12. Sınıf' },
  { value: 'mezun', label: 'Mezun' },
];

export const GRADE_LABEL: Record<string, string> = STUDENT_GRADES.reduce(
  (acc, g) => ({ ...acc, [g.value]: g.label }),
  {} as Record<string, string>,
);

export interface School {
  id: string;
  name: string;
  code: string;
  city: string;
  phone: string;
  email: string;
  license_status: LicenseStatus;
  license_end_date: string;
  max_students: number;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  name: string;
  grade: number | null;
  section: string;
  teacher_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  teacher?: Profile;
  student_count?: number;
}

export interface ClassStudent {
  id: string;
  class_id: string;
  student_id: string;
  created_at: string;
  student?: Profile;
}

export interface ParentStudent {
  id: string;
  parent_id: string;
  student_id: string;
  created_at: string;
}

export interface License {
  id: string;
  school_id: string;
  plan_name: string;
  max_students: number;
  start_date: string;
  end_date: string;
  status: LicenseStatus;
  payment_ref: string | null;
  created_at: string;
  school?: School;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Platform Yöneticisi',
  school_admin: 'Okul Yöneticisi',
  teacher: 'Öğretmen',
  student: 'Öğrenci',
  parent: 'Veli',
};

export const ROLE_PATHS: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  school_admin: '/school/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
  parent: '/parent/dashboard',
};

export const ROLE_COLORS: Record<UserRole, { accent: string; bg: string; border: string }> = {
  admin: { accent: 'amber', bg: 'bg-amber-50', border: 'border-amber-400' },
  school_admin: { accent: 'sky', bg: 'bg-sky-50', border: 'border-sky-400' },
  teacher: { accent: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-400' },
  student: { accent: 'violet', bg: 'bg-violet-50', border: 'border-violet-400' },
  parent: { accent: 'pink', bg: 'bg-pink-50', border: 'border-pink-400' },
};

export const TEST_TYPES = [
  { key: 'enneagram', label: 'Enneagram Kişilik', questions: 180 },
  { key: 'vark', label: 'VARK Öğrenme Stilleri', questions: 16 },
  { key: 'holland', label: 'Holland RIASEC', questions: 84 },
  { key: 'coklu_zeka', label: 'Çoklu Zekâ', questions: 80 },
  { key: 'sinav_kaygisi', label: 'Sınav Kaygısı', questions: 50 },
  { key: 'calisma_davranisi', label: 'Çalışma Davranışı', questions: 73 },
  { key: 'akademik_analiz', label: 'Akademik Analiz', questions: 54 },
  { key: 'hizli_okuma', label: 'Hızlı Okuma', questions: 0 },
  { key: 'd2_dikkat', label: 'D2 Dikkat Testi', questions: 658 },
  { key: 'sag_sol_beyin', label: 'Sağ-Sol Beyin Dominansı', questions: 30 },
] as const;
