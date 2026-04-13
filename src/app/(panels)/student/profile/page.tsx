/**
 * Öğrenci Profil — Faz C: grade + Mezun rozeti
 */
import { GraduationCap, Mail, School as SchoolIcon, BookOpen, Sparkles } from 'lucide-react';
import { getCurrentProfile } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { GRADE_LABEL, ROLE_LABELS, type UserRole } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const profile = await getCurrentProfile();

  let schoolName = '—';
  if (profile?.school_id) {
    const supabase = await createClient();
    const { data: school } = await supabase
      .from('schools')
      .select('name')
      .eq('id', profile.school_id)
      .single();
    if (school?.name) schoolName = school.name;
  }

  const initials =
    (profile?.full_name || '?')
      .split(' ')
      .map((p: string) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  const gradeLabel = profile?.grade ? GRADE_LABEL[profile.grade] || profile.grade : null;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0f2847] mb-1">Profilim</h1>
      <p className="text-gray-500 text-sm mb-6">Hesap bilgilerin</p>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-violet-500/25 shrink-0">
            {initials}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <h2 className="text-xl font-extrabold text-[#0f2847]">
                {profile?.full_name || '—'}
              </h2>
              {profile?.is_graduated && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] font-bold shadow-md shadow-amber-500/30">
                  <Sparkles className="w-3 h-3" /> MEZUN
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {ROLE_LABELS[(profile?.role || 'student') as UserRole]}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              <InfoRow icon={Mail} label="E-posta" value={profile?.email || '—'} />
              <InfoRow icon={SchoolIcon} label="Okul" value={schoolName} />
              <InfoRow
                icon={BookOpen}
                label="Sınıf"
                value={gradeLabel || 'Belirtilmemiş'}
              />
              <InfoRow
                icon={GraduationCap}
                label="Durum"
                value={profile?.is_graduated ? 'Mezun' : 'Aktif Öğrenci'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/70 border border-gray-100">
      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-violet-600 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </p>
        <p className="text-sm font-semibold text-[#0f2847] truncate">{value}</p>
      </div>
    </div>
  );
}
