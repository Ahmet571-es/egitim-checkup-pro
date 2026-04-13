export type UserRole = 'admin' | 'school_admin' | 'teacher' | 'student' | 'parent';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  school_id: string | null;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  city: string;
  license_status: 'active' | 'trial' | 'expired';
  license_end_date: string;
  created_at: string;
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

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}
