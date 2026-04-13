/**
 * Faz 5: Lisans durum yardımcıları
 */
import { createClient } from '@/lib/supabase/server';
import type { LicenseStatus, School } from '@/types';

export interface LicenseState {
  status: LicenseStatus;
  endDate: string | null;
  daysLeft: number;
  isTrial: boolean;
  isExpired: boolean;
  maxStudents: number;
  studentCount: number;
  canAddStudent: boolean;
  school: School | null;
}

function diffDays(endIso: string | null): number {
  if (!endIso) return 0;
  const end = new Date(endIso).getTime();
  const now = Date.now();
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

export async function checkLicense(
  schoolId: string | null,
): Promise<LicenseState> {
  const empty: LicenseState = {
    status: 'expired',
    endDate: null,
    daysLeft: 0,
    isTrial: false,
    isExpired: true,
    maxStudents: 0,
    studentCount: 0,
    canAddStudent: false,
    school: null,
  };
  if (!schoolId) return empty;

  const supabase = await createClient();
  const { data: school } = await supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .single();

  if (!school) return empty;

  const endDate: string | null = school.license_end_date || null;
  let status: LicenseStatus = (school.license_status as LicenseStatus) || 'trial';
  const daysLeft = diffDays(endDate);

  // Yumuşak expire: tarih geçtiyse trial/active bile olsa expired say
  if (endDate && daysLeft <= 0) {
    status = 'expired';
  }

  const { count: studentCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('is_active', true);

  const maxStudents: number = school.max_students || 0;
  const sc = studentCount || 0;
  const canAddStudent = status !== 'expired' && sc < maxStudents;

  return {
    status,
    endDate,
    daysLeft: Math.max(0, daysLeft),
    isTrial: status === 'trial',
    isExpired: status === 'expired',
    maxStudents,
    studentCount: sc,
    canAddStudent,
    school: school as School,
  };
}

export function isTrialExpired(school: Pick<School, 'license_status' | 'license_end_date'>): boolean {
  if (school.license_status === 'expired') return true;
  if (!school.license_end_date) return false;
  return new Date(school.license_end_date).getTime() < Date.now();
}

export async function getStudentCount(schoolId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('is_active', true);
  return count || 0;
}

export async function canAddStudent(schoolId: string): Promise<{
  ok: boolean;
  reason?: string;
  state: LicenseState;
}> {
  const state = await checkLicense(schoolId);
  if (state.isExpired) {
    return { ok: false, reason: 'Lisansınız sona ermiş. Lütfen yenileyin.', state };
  }
  if (state.studentCount >= state.maxStudents) {
    return {
      ok: false,
      reason: `Öğrenci kapasiteniz doldu (${state.studentCount}/${state.maxStudents}). Planınızı yükseltin.`,
      state,
    };
  }
  return { ok: true, state };
}
