/**
 * Admin Dashboard — Platform genel istatistikleri
 *
 * Tüm sorgular try-catch ile sarmalanmış: tek bir tablo erişim hatası
 * sayfayı 500'e düşürmez, etkilenen kart "—" gösterir.
 */
import {
  Building2, Users, GraduationCap, BookOpen, FileText, UserCheck,
  Lock, AlertCircle, Clock, Crown,
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { listAllAuthUsers } from '@/lib/auth/admin-users';
import TiltStatCard from '@/components/ui/TiltStatCard';
import PageHeader from '@/components/ui/PageHeader';
import PendingResetBanner from '@/components/PendingResetBanner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  // Admin paneli olduğu için service role client (RLS bypass) güvenli.
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error('[admin/dashboard] admin client init failed:', e);
    return (
      <div>
        <PageHeader role="admin" title="Yönetici Paneli" subtitle="Bağlantı hatası" icon={AlertCircle} />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800">
          <p className="font-bold mb-1">Bağlantı kurulamadı</p>
          <p className="text-sm">Supabase admin client başlatılamadı. Vercel ortam değişkenlerini kontrol edin.</p>
        </div>
      </div>
    );
  }

  // ── Auth user'ları çek (rol başına sayım için) ──
  const usersByRole = {
    admin: 0, school_admin: 0, teacher: 0, student: 0, parent: 0,
    pending_student: 0, pending_teacher: 0, pending_parent: 0, total: 0,
  };
  try {
    const users = await listAllAuthUsers(admin);
    (users || []).forEach((u) => {
      const role = (u.user_metadata?.role as string) || '';
      const isApproved = u.user_metadata?.is_approved !== false;
      usersByRole.total += 1;
      if (role in usersByRole && isApproved) {
        (usersByRole as Record<string, number>)[role] += 1;
      }
      if (!isApproved) {
        if (role === 'student') usersByRole.pending_student += 1;
        else if (role === 'teacher') usersByRole.pending_teacher += 1;
        else if (role === 'parent') usersByRole.pending_parent += 1;
      }
    });
  } catch (e) {
    console.error('[admin/dashboard] listUsers failed:', e instanceof Error ? e.message : e);
  }

  // ── Yardımcı: güvenli count sorgusu ──
  const tryCount = async (
    runner: () => Promise<{ count: number | null; error: { message: string } | null }>,
    label: string,
  ): Promise<number | null> => {
    try {
      const { count, error } = await runner();
      if (error) {
        console.error(`[admin/dashboard] ${label} error:`, error.message);
        return null;
      }
      return count ?? 0;
    } catch (e) {
      console.error(`[admin/dashboard] ${label} exception:`, e instanceof Error ? e.message : e);
      return null;
    }
  };

  const [
    schoolsCount,
    testsCount,
    reportsCount,
    integratedReportsCount,
    pendingPasswordRequests,
  ] = await Promise.all([
    tryCount(async () => await admin.from('schools').select('*', { count: 'exact', head: true }), 'schools'),
    tryCount(async () => await admin.from('test_results').select('*', { count: 'exact', head: true }), 'test_results'),
    tryCount(async () => await admin.from('test_results').select('*', { count: 'exact', head: true }).not('ai_report', 'is', null), 'test_results+ai'),
    tryCount(async () => await admin.from('integrated_reports').select('*', { count: 'exact', head: true }), 'integrated_reports'),
    tryCount(async () => await admin.from('password_reset_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'), 'password_reset_requests'),
  ]);

  const fmt = (n: number | null) => (n === null ? '—' : n.toLocaleString('tr-TR'));

  const totalPending =
    usersByRole.pending_student + usersByRole.pending_teacher + usersByRole.pending_parent;

  // ── Kart gruplandırması ──
  const userStats = [
    { label: 'Öğretmen', value: fmt(usersByRole.teacher), icon: BookOpen, gradient: 'from-emerald-500 to-teal-600', helperText: 'Onaylı öğretmen sayısı' },
    { label: 'Öğrenci', value: fmt(usersByRole.student), icon: GraduationCap, gradient: 'from-violet-500 to-purple-600', helperText: 'Onaylı öğrenci sayısı' },
    { label: 'Veli', value: fmt(usersByRole.parent), icon: Users, gradient: 'from-pink-500 to-rose-600', helperText: 'Onaylı veli sayısı' },
    { label: 'Toplam Kullanıcı', value: fmt(usersByRole.total), icon: UserCheck, gradient: 'from-amber-500 to-orange-600', helperText: 'Tüm hesaplar' },
  ];

  const platformStats = [
    { label: 'Okul Sayısı', value: fmt(schoolsCount), icon: Building2, gradient: 'from-sky-500 to-blue-600', helperText: 'Lisanslı kurumlar' },
    { label: 'Tamamlanan Test', value: fmt(testsCount), icon: BookOpen, gradient: 'from-indigo-500 to-blue-700', helperText: 'Tüm test_results kayıtları' },
    { label: 'AI Tekil Rapor', value: fmt(reportsCount), icon: FileText, gradient: 'from-amber-500 to-orange-600', helperText: 'ai_report üretilen testler' },
    { label: 'Entegre 3\'lü Rapor', value: fmt(integratedReportsCount), icon: Crown, gradient: 'from-purple-500 to-pink-600', helperText: 'integrated_reports kayıtları' },
  ];

  const operationsStats = [
    { label: 'Onay Bekleyen', value: fmt(totalPending), icon: Clock, gradient: 'from-amber-500 to-yellow-600', helperText: `${usersByRole.pending_student} öğrenci · ${usersByRole.pending_teacher} öğretmen · ${usersByRole.pending_parent} veli` },
    { label: 'Şifre Talebi', value: fmt(pendingPasswordRequests), icon: Lock, gradient: 'from-orange-500 to-red-600', helperText: 'Bekleyen sıfırlama talepleri' },
  ];

  return (
    <div>
      <PageHeader
        role="admin"
        title="Yönetici Paneli"
        subtitle="Platform genel istatistikleri"
        icon={UserCheck}
      />

      <PendingResetBanner role="admin" />

      {/* Kullanıcı istatistikleri */}
      <h2 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
        Kullanıcılar
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {userStats.map((s, idx) => (
          <TiltStatCard
            key={s.label}
            label={s.label}
            value={s.value}
            gradient={s.gradient}
            icon={s.icon}
            delay={100 + idx * 80}
            helperText={s.helperText}
            disableCountUp
          />
        ))}
      </div>

      {/* Platform istatistikleri */}
      <h2 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
        Platform
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {platformStats.map((s, idx) => (
          <TiltStatCard
            key={s.label}
            label={s.label}
            value={s.value}
            gradient={s.gradient}
            icon={s.icon}
            delay={400 + idx * 80}
            helperText={s.helperText}
            disableCountUp
          />
        ))}
      </div>

      {/* Operasyonel istatistikler */}
      <h2 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
        Operasyon
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {operationsStats.map((s, idx) => (
          <TiltStatCard
            key={s.label}
            label={s.label}
            value={s.value}
            gradient={s.gradient}
            icon={s.icon}
            delay={700 + idx * 80}
            helperText={s.helperText}
            disableCountUp
          />
        ))}
      </div>

      {/* Bilgi kutusu */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-[13px] text-amber-900 dark:text-amber-200">
        <p className="font-bold mb-1">İpucu</p>
        <p>
          Hesabın <strong>admin</strong> rolünde — tüm okulları, öğretmenleri, öğrencileri ve velileri buradan yönetebilirsin.
          Daha kapsamlı ve hızlı yönetim için <a href="/yonetici" className="font-bold underline">/yonetici</a> master şifre paneli (ANKA_KUSU2026) tek sayfada her şeyi sunar.
        </p>
      </div>
    </div>
  );
}
