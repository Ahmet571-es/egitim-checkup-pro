/**
 * Öğrenci Profil Sayfası — Premium
 */
import {
  GraduationCap, School as SchoolIcon, BookOpen, Sparkles,
  Phone as PhoneIcon, MapPin, Calendar, Users, User as UserIcon, AtSign,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { GRADE_LABEL, ROLE_LABELS, type UserRole } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="text-gray-500 p-8">Oturum bulunamadı.</p>;

  const meta = user.user_metadata || {};

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  const fullName = meta.full_name || profile?.full_name || '—';
  const role = (meta.role || profile?.role || 'student') as UserRole;
  const grade = meta.grade || profile?.grade || null;
  const isGraduated = meta.is_graduated ?? profile?.is_graduated ?? false;
  const username = meta.username || '—';
  const phone = meta.phone || profile?.phone || '—';
  const gender = meta.gender || '—';
  const birthDate = meta.birth_date || '—';
  const age = meta.age || null;
  const city = meta.city || '—';
  const district = meta.district || '—';
  const schoolName = meta.school_name || '—';

  let finalSchoolName = schoolName;
  if (finalSchoolName === '—' && profile?.school_id) {
    const { data: school } = await supabase.from('schools').select('name').eq('id', profile.school_id).maybeSingle();
    if (school?.name) finalSchoolName = school.name;
  }

  const initials =
    fullName
      .split(' ')
      .map((p: string) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  const gradeLabel = grade ? GRADE_LABEL[grade] || `${grade}. Sınıf` : 'Belirtilmemiş';

  let birthDateFormatted = '—';
  if (birthDate && birthDate !== '—') {
    try {
      const d = new Date(birthDate);
      birthDateFormatted = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
      if (age) birthDateFormatted += ` (${age} yaş)`;
    } catch {
      birthDateFormatted = birthDate;
    }
  }

  let phoneFormatted = phone;
  if (phone && phone !== '—' && phone.length >= 10) {
    const d = phone.replace(/\D/g, '');
    if (d.length === 11) {
      phoneFormatted = `0${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
    } else if (d.length === 10) {
      phoneFormatted = `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
    }
  }

  const genderLabel = gender === 'erkek' ? 'Erkek' : gender === 'kadin' ? 'Kadın' : gender !== '—' ? gender : '—';

  return (
    <div>
      {/* Premium Header Card */}
      <div className="relative mb-6 rounded-3xl overflow-hidden shadow-xl shadow-violet-500/30 profile-enter">
        <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 p-6 sm:p-9 relative">
          {/* Aurora */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/10 blur-3xl profile-aurora-1" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 rounded-full bg-fuchsia-200/20 blur-3xl profile-aurora-2" />
          {/* Grid pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-3xl bg-white/25 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-white text-[36px] font-extrabold shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                <span className="relative drop-shadow-md">{initials}</span>
              </div>
              {/* Online dot */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                <div className="relative w-4 h-4 rounded-full bg-emerald-500">
                  <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left text-white min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold drop-shadow-sm">{fullName}</h1>
                {isGraduated && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] font-extrabold shadow-md shadow-amber-500/40 border border-white/20">
                    <Sparkles className="w-3 h-3" /> MEZUN
                  </span>
                )}
              </div>
              <p className="text-[13px] sm:text-sm text-white/85 mb-2">{ROLE_LABELS[role]}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-[12px] font-mono font-bold">
                <AtSign className="w-3 h-3" />
                {username}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes profile-enter {
            from { opacity: 0; transform: translateY(-12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .profile-enter {
            animation: profile-enter 500ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
          }
          @keyframes profile-aurora-1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-20px, 20px) scale(1.1); }
          }
          @keyframes profile-aurora-2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, -15px) scale(1.08); }
          }
          .profile-aurora-1 { animation: profile-aurora-1 9s ease-in-out infinite; }
          .profile-aurora-2 { animation: profile-aurora-2 11s ease-in-out infinite 1s; }
        `}</style>
      </div>

      {/* Bilgi Kartları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 grid-stagger">
        {/* Kişisel Bilgiler */}
        <InfoCard
          title="Kişisel Bilgiler"
          icon={UserIcon}
          gradient="from-violet-500 to-purple-600"
        >
          <InfoRow icon={Users} label="Cinsiyet" value={genderLabel} accentColor="violet" />
          <InfoRow icon={Calendar} label="Doğum Tarihi" value={birthDateFormatted} accentColor="violet" />
          <InfoRow icon={PhoneIcon} label="Telefon" value={phoneFormatted} accentColor="violet" />
        </InfoCard>

        {/* Okul Bilgileri */}
        <InfoCard
          title="Okul Bilgileri"
          icon={SchoolIcon}
          gradient="from-sky-500 to-blue-600"
        >
          <InfoRow icon={SchoolIcon} label="Okul" value={finalSchoolName} accentColor="sky" />
          <InfoRow icon={BookOpen} label="Sınıf" value={gradeLabel} accentColor="sky" />
          <InfoRow icon={GraduationCap} label="Durum" value={isGraduated ? 'Mezun' : 'Aktif Öğrenci'} accentColor="sky" />
        </InfoCard>

        {/* Adres Bilgileri */}
        <InfoCard
          title="Adres Bilgileri"
          icon={MapPin}
          gradient="from-emerald-500 to-teal-600"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow icon={MapPin} label="İl" value={city} accentColor="emerald" />
            <InfoRow icon={MapPin} label="İlçe" value={district} accentColor="emerald" />
          </div>
        </InfoCard>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  icon: Icon,
  gradient,
  children,
  className = '',
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5 overflow-hidden ${className}`}>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-[0.07] blur-2xl pointer-events-none`} />

      <div className="relative">
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-[13px] font-extrabold text-[#0f2847] uppercase tracking-wider">{title}</h3>
        </div>
        <div className="space-y-2.5">{children}</div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  accentColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accentColor: 'violet' | 'sky' | 'emerald';
}) {
  const iconBg = {
    violet: 'bg-violet-100 text-violet-600',
    sky: 'bg-sky-100 text-sky-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  }[accentColor];

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-gray-50/80 to-white border border-gray-100 hover:border-gray-200 transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-[13.5px] font-bold text-[#0f2847] truncate">{value}</p>
      </div>
    </div>
  );
}
