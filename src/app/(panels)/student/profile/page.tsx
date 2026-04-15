/**
 * Öğrenci Profil Sayfası — Tüm kayıt bilgileri
 */
import {
  GraduationCap, School as SchoolIcon, BookOpen, Sparkles,
  AtSign, Phone as PhoneIcon, MapPin, Calendar, User, Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { GRADE_LABEL, ROLE_LABELS, type UserRole } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="text-gray-500 p-8">Oturum bulunamadı.</p>;

  const meta = user.user_metadata || {};

  // Profiles tablosundan oku (varsa)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Bilgileri önce user_metadata'dan, yoksa profiles'dan al
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
  const address = meta.address || '—';
  const schoolName = meta.school_name || '—';

  // Okul adı yoksa school_id ile dene
  let finalSchoolName = schoolName;
  if (finalSchoolName === '—' && profile?.school_id) {
    const { data: school } = await supabase
      .from('schools')
      .select('name')
      .eq('id', profile.school_id)
      .maybeSingle();
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

  // Doğum tarihi formatla
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

  // Telefon formatla
  let phoneFormatted = phone;
  if (phone && phone !== '—' && phone.length >= 10) {
    const d = phone.replace(/\D/g, '');
    if (d.length === 11) {
      phoneFormatted = `0${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
    } else if (d.length === 10) {
      phoneFormatted = `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
    }
  }

  // Cinsiyet gösterim
  const genderLabel = gender === 'erkek' ? 'Erkek' : gender === 'kadin' ? 'Kadın' : gender !== '—' ? gender : '—';

  // Adres birleştir
  const fullAddress = [city, district, address].filter(v => v && v !== '—').join(', ') || '—';

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0f2847] mb-1">Profilim</h1>
      <p className="text-gray-500 text-sm mb-6">Hesap bilgilerin</p>

      {/* Üst Kart — Ad, Rol, Avatar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-6 sm:p-8 mb-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-violet-500/25 shrink-0">
            {initials}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl font-extrabold text-[#0f2847]">{fullName}</h2>
              {isGraduated && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] font-bold shadow-md shadow-amber-500/30">
                  <Sparkles className="w-3 h-3" /> MEZUN
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-1">{ROLE_LABELS[role]}</p>
            <p className="text-[13px] text-violet-600 font-mono font-semibold">@{username}</p>
          </div>
        </div>
      </div>

      {/* Bilgi Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Kişisel Bilgiler */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Kişisel Bilgiler</h3>
          <div className="space-y-3">
            <InfoRow icon={Users} label="Cinsiyet" value={genderLabel} />
            <InfoRow icon={Calendar} label="Doğum Tarihi" value={birthDateFormatted} />
            <InfoRow icon={PhoneIcon} label="Telefon" value={phoneFormatted} />
          </div>
        </div>

        {/* Okul Bilgileri */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Okul Bilgileri</h3>
          <div className="space-y-3">
            <InfoRow icon={SchoolIcon} label="Okul" value={finalSchoolName} />
            <InfoRow icon={BookOpen} label="Sınıf" value={gradeLabel} />
            <InfoRow icon={GraduationCap} label="Durum" value={isGraduated ? 'Mezun' : 'Aktif Öğrenci'} />
          </div>
        </div>

        {/* Adres Bilgileri */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-5 sm:col-span-2">
          <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Adres Bilgileri</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InfoRow icon={MapPin} label="İl" value={city} />
            <InfoRow icon={MapPin} label="İlçe" value={district} />
            <InfoRow icon={MapPin} label="Açık Adres" value={address} />
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
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/70 border border-gray-100">
      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-violet-600 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-[#0f2847] truncate">{value}</p>
      </div>
    </div>
  );
}
