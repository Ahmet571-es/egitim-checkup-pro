/**
 * Veli Dashboard — Faz 6
 * Pink accent • Çocuk istatistikleri • Son aktiviteler timeline
 */
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/actions/auth';
import { Users, ClipboardCheck, FileText, Clock, CheckCircle, Baby } from 'lucide-react';
import ParentGrowthSection from './ParentGrowthSection';

export const dynamic = 'force-dynamic';

const TEST_LABELS: Record<string, string> = {
  enneagram: 'Enneagram Kişilik',
  vark: 'VARK Öğrenme Stilleri',
  holland: 'Holland RIASEC',
  'coklu-zeka': 'Çoklu Zekâ',
  'sinav-kaygisi': 'Sınav Kaygısı',
  'calisma-davranisi': 'Çalışma Davranışı',
  'akademik-analiz': 'Akademik Analiz',
  'hizli-okuma': 'Hızlı Okuma',
  'd2-dikkat': 'D2 Dikkat',
  'sag-sol-beyin': 'Sağ-Sol Beyin',
};
function testLabel(t: string) { return TEST_LABELS[t] ?? t; }

interface RecentActivity {
  id: string;
  student_name: string;
  test_type: string;
  completed_at: string;
}

export default async function Page() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();

  // Velinin çocuklarını getir
  const { data: parentStudents } = await supabase
    .from('parent_students')
    .select('student_id, profiles!parent_students_student_id_fkey(id, full_name)')
    .eq('parent_id', profile.id);

  const children = (parentStudents ?? []).map(ps => ({
    id: (ps.profiles as unknown as { id: string; full_name: string }).id,
    full_name: (ps.profiles as unknown as { id: string; full_name: string }).full_name,
  }));

  const childIds = children.map(c => c.id);

  // İstatistikler
  let completedTests = 0;
  let reportCount = 0;
  let recentActivities: RecentActivity[] = [];

  if (childIds.length > 0) {
    const { data: results } = await supabase
      .from('test_results')
      .select('id, student_id, test_type, completed_at, ai_report, profiles!test_results_student_id_fkey(full_name)')
      .in('student_id', childIds)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    completedTests = (results ?? []).length;
    reportCount = (results ?? []).filter(r => r.ai_report).length;

    recentActivities = (results ?? []).slice(0, 5).map(r => ({
      id: r.id,
      student_name: (r.profiles as unknown as { full_name: string })?.full_name ?? '—',
      test_type: r.test_type,
      completed_at: r.completed_at as string,
    }));
  }

  // Entegre rapor sayısı
  let integratedCount = 0;
  if (childIds.length > 0) {
    const { count } = await supabase
      .from('integrated_reports')
      .select('id', { count: 'exact', head: true })
      .in('student_id', childIds);
    integratedCount = count ?? 0;
  }

  const stats = [
    { label: 'Çocuk Sayısı', value: children.length, icon: Baby, color: 'bg-pink-100', text: 'text-pink-600' },
    { label: 'Tamamlanan Test', value: completedTests, icon: ClipboardCheck, color: 'bg-rose-100', text: 'text-rose-600' },
    { label: 'Üretilen Rapor', value: reportCount + integratedCount, icon: FileText, color: 'bg-fuchsia-100', text: 'text-fuchsia-600' },
  ];

  return (
    <div>
      {/* Başlık */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow">
            <Users className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0f2847]">Hoş Geldiniz</h1>
        </div>
        <p className="text-gray-500 text-sm ml-10">
          <span className="font-semibold text-pink-600">{profile.full_name}</span> — Çocuklarınızın gelişimini buradan takip edin.
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.text}`} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-[#0f2847]">{s.value}</p>
                  <p className="text-[13px] text-gray-500 font-medium">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Son Aktiviteler */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-pink-500" />
          <h2 className="font-extrabold text-[#0f2847] text-base">Son Aktiviteler</h2>
        </div>

        {recentActivities.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 font-semibold">Henüz tamamlanan test bulunmuyor.</p>
            {children.length === 0 && (
              <p className="text-gray-400 text-sm mt-1">Önce çocuğunuzun okul yöneticisi tarafından hesabınıza eşleştirilmesi gerekiyor.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentActivities.map((activity, idx) => (
              <div key={activity.id} className="px-6 py-4 flex items-center gap-4 hover:bg-pink-50/30 transition-colors">
                {/* Timeline nokta */}
                <div className="relative flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow ${
                    idx === 0 ? 'bg-gradient-to-br from-pink-500 to-rose-500' : 'bg-gray-200'
                  }`}>
                    {idx === 0 ? <CheckCircle className="w-4 h-4" /> : <span className="text-gray-400">{idx + 1}</span>}
                  </div>
                  {idx < recentActivities.length - 1 && (
                    <div className="w-0.5 h-6 bg-gray-100 mt-1" />
                  )}
                </div>

                {/* İçerik */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#0f2847] text-sm">{activity.student_name}</span>
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-sm text-gray-600">{testLabel(activity.test_type)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(activity.completed_at).toLocaleDateString('tr-TR', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Durum */}
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 shrink-0">
                  Tamamlandı
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gelisim Ozeti */}
      {childIds.length > 0 && (
        <div className="mt-6">
          <ParentGrowthSection childIds={childIds} />
        </div>
      )}

      {/* Hızlı Erişim */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="/parent/my-children"
          className="group bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <Baby className="w-6 h-6 mb-3 opacity-80" />
          <p className="font-extrabold text-lg">Çocuklarım</p>
          <p className="text-white/70 text-sm mt-1">Çocuklarınızın bilgilerini görüntüleyin</p>
        </a>
        <a
          href="/parent/results"
          className="group bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <FileText className="w-6 h-6 mb-3 text-pink-500" />
          <p className="font-extrabold text-lg text-[#0f2847]">Test Sonuçları</p>
          <p className="text-gray-400 text-sm mt-1">Tamamlanan testleri ve raporları görüntüleyin</p>
        </a>
      </div>
    </div>
  );
}
