'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Sparkles, ChevronDown, ChevronRight, CheckCircle2, BookOpen,
  Brain, Target, BarChart3, Users, MessageSquare, Layers, Flame,
  AlertCircle, Clock, FileText, ClipboardList, Eye, ArrowRight,
  Lightbulb, Zap, Heart, Star, GraduationCap, TrendingUp, Loader2,
} from 'lucide-react';

// ── Adım tanımları ──
interface StepInfo {
  id: string;
  number: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  bgGradient: string;
  chipBg: string;
  details: string[];
  tips: string[];
  action: { label: string; href: string; icon: React.ReactNode } | null;
}

const STEPS: StepInfo[] = [
  {
    id: 'test-uygulama',
    number: 1,
    icon: <ClipboardList className="w-6 h-6" />,
    title: 'Testleri Uygulayın',
    subtitle: 'Önce öğrencilerinize psikometrik testleri atayın ve uygulatın.',
    color: 'text-emerald-700',
    bgGradient: 'from-emerald-50 to-teal-50',
    chipBg: 'bg-emerald-100 text-emerald-700',
    details: [
      '"Test Ata" menüsünden sınıfınıza test atayın. Enneagram, VARK, Çoklu Zekâ, Sınav Kaygısı gibi 10 farklı test mevcuttur.',
      'Öğrenciler kendi panellerinden testleri tamamlar. Tamamlama durumunu "Sonuçlar" sayfasından takip edebilirsiniz.',
      'En az 2 test tamamlandığında AI koçluk sistemi otomatik olarak devreye girer.',
      'Daha fazla test = daha isabetli AI analizi. İdeal olarak 4-5 farklı test uygulatmanız önerilir.',
    ],
    tips: [
      'İlk hafta Enneagram + VARK ile başlayın — öğrencinin kişiliğini ve öğrenme stilini hızla anlamanızı sağlar.',
      'Sınav kaygısı testi, risk altındaki öğrencileri erken tespit etmenize yardımcı olur.',
      'QR kod ile test başlatabilirsiniz — öğrenciler telefonlarından anında erişir.',
    ],
    action: { label: 'Test Atama Sayfasına Git', href: '/teacher/assign-test', icon: <ClipboardList className="w-4 h-4" /> },
  },
  {
    id: 'rapor-uretme',
    number: 2,
    icon: <Brain className="w-6 h-6" />,
    title: 'AI Raporları Üretin',
    subtitle: 'Her test için AI destekli detaylı analiz raporu üretin.',
    color: 'text-violet-700',
    bgGradient: 'from-violet-50 to-purple-50',
    chipBg: 'bg-violet-100 text-violet-700',
    details: [
      '"Raporlar" menüsünden öğrenci seçin ve "Tekil Raporlar" sekmesinden her test için AI raporu üretin.',
      'AI, her testin skorlarını derinlemesine analiz eder: güçlü yönler, gelişim alanları, aksiyon planı ve strateji önerileri sunar.',
      'Raporlar otomatik olarak veritabanına kaydedilir. İstediğiniz zaman PDF veya Word olarak indirebilirsiniz.',
      'Rapor üretimi 30-60 saniye sürer. Rapor zaten üretilmişse "Yenile" butonu ile güncelleyebilirsiniz.',
    ],
    tips: [
      'Önce tekil raporları üretin, sonra "Bütüncül Rapor" ile tüm testlerin çapraz analizini yapın.',
      'Rapor PDF\'lerini veli toplantılarında ve BEP hazırlarken kullanabilirsiniz.',
      'AI raporları klinik tanı içermez — öğretmen rehberliği için destek aracıdır.',
    ],
    action: { label: 'Raporlar Sayfasına Git', href: '/teacher/reports', icon: <FileText className="w-4 h-4" /> },
  },
  {
    id: 'entegre-rapor',
    number: 3,
    icon: <Layers className="w-6 h-6" />,
    title: 'Entegre 3\'lü Rapor Sistemi',
    subtitle: 'Tek seferde 3 farklı perspektiften profesyonel raporlar üretin.',
    color: 'text-indigo-700',
    bgGradient: 'from-indigo-50 to-blue-50',
    chipBg: 'bg-indigo-100 text-indigo-700',
    details: [
      '"Raporlar" → "📊 Entegre Rapor (3\'lü)" sekmesine gidin. Bu sistemin en güçlü özelliğidir.',
      '👩‍🏫 Öğretmen/Koç Raporu: Teknik, detaylı, stratejik. Sınıf içi müdahale planı, risk analizi, öğrenme profili.',
      '🎓 Öğrenci Raporu: Motive edici, anlaşılır dil. Öğrencinin kendini keşfetmesine yardımcı olur.',
      '👨‍👩‍👦 Ebeveyn Raporu: Sade, yapın/yapmayın formatında. Veli toplantılarında paylaşıma hazır.',
      'Her 3 rapor tek PDF veya Word dosyasında indirilebilir — kapak sayfası ile profesyonel görünüm.',
    ],
    tips: [
      'En az 2 test tamamlanmış olmalıdır. İdeal olarak 4+ test ile en zengin analiz elde edilir.',
      'Ebeveyn raporunu veli panelinden de paylaşabilirsiniz — veli otomatik olarak görür.',
      '3\'lü rapor üretimi 5-8 dakika sürebilir çünkü her perspektif ayrı ayrı analiz edilir.',
    ],
    action: { label: 'Entegre Rapor Üret', href: '/teacher/reports', icon: <Layers className="w-4 h-4" /> },
  },
  {
    id: 'kocluk-gorevleri',
    number: 4,
    icon: <Target className="w-6 h-6" />,
    title: 'Koçluk Görevleri (Otomatik)',
    subtitle: 'AI, her öğrenci için kişiselleştirilmiş haftalık görevler oluşturur.',
    color: 'text-amber-700',
    bgGradient: 'from-amber-50 to-orange-50',
    chipBg: 'bg-amber-100 text-amber-700',
    details: [
      'Öğrenci en az bir testi tamamladığında, AI otomatik olarak haftalık 5 görev oluşturur.',
      'Görevler 5 kategoride gelir: 🧘 Nefes & Gevşeme, 📚 Çalışma Tekniği, 🎯 Dikkat Egzersizi, 💪 Motivasyon, 🤝 Sosyal Beceri.',
      'Her görev, öğrencinin test sonuçlarına göre kişiselleştirilmiştir. Sınav kaygısı yüksek öğrenciye nefes egzersizi, dikkat skoru düşük olana dikkat alıştırması atanır.',
      'Öğrenci kendi panelinde görevleri görür, tamamladığında "streak" (seri) oluşur ve puan kazanır.',
      'Görevler her pazartesi otomatik yenilenir.',
    ],
    tips: [
      'Hafta başında sınıfta "Bu haftaki görevlerinize baktınız mı?" diye hatırlatma yapın.',
      'Streak\'i (seriyi) sınıf içi motivasyon aracı olarak kullanın — en uzun seri ile rekabet.',
      'Görev tamamlama oranı düşük öğrencilere bireysel görüşme planlayın.',
    ],
    action: null,
  },
  {
    id: 'takip-paneli',
    number: 5,
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Koçluk Takip Paneli',
    subtitle: 'Öğrencilerin haftalık görev tamamlama durumlarını canlı olarak izleyin.',
    color: 'text-sky-700',
    bgGradient: 'from-sky-50 to-cyan-50',
    chipBg: 'bg-sky-100 text-sky-700',
    details: [
      'Dashboard\'daki "Koçluk Takip" bölümü tüm öğrencilerin haftalık durumunu gösterir.',
      'Her öğrenci için: bu haftaki görev sayısı, tamamlanan görev, aktif seri (streak) ve son aktivite tarihi.',
      'Öğrenciler tamamlama oranına göre otomatik sıralanır — en düşük performans üstte.',
      '🔴 Kırmızı: Hiç görev tamamlanmamış. ⏳ Sarı: Kısmen tamamlanmış. ✅ Yeşil: Tümü tamamlanmış.',
      'Bu tabloyu haftalık olarak kontrol edin ve risk altındaki öğrenciler için erken müdahale planlayın.',
    ],
    tips: [
      'Her cuma son 5 dakikada "Koçluk Takip"e bakın — pazartesi bireysel görüşme planı çıkarın.',
      'Seri (streak) 0 olan öğrenciler motivasyon problemi yaşıyor olabilir — nedenini araştırın.',
      '"Risk Altındaki Öğrenciler" dashboard kartı ile koçluk verisini çapraz değerlendirin.',
    ],
    action: { label: 'Dashboard\'a Git', href: '/teacher/dashboard', icon: <BarChart3 className="w-4 h-4" /> },
  },
  {
    id: 'ai-asistan',
    number: 6,
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'AI Asistan ile Soru Sorun',
    subtitle: 'Sınıfınız ve öğrencileriniz hakkında doğal dilde sorular sorun.',
    color: 'text-teal-700',
    bgGradient: 'from-teal-50 to-emerald-50',
    chipBg: 'bg-teal-100 text-teal-700',
    details: [
      'Dashboard\'daki "AI Asistan" bölümüne sınıfınızla ilgili herhangi bir soru yazabilirsiniz.',
      'Örnek sorular: "En kaygılı 5 öğrenci kimler?", "Dikkat skoru düşen öğrenciler var mı?", "Bu sınıfın en güçlü alanı ne?"',
      'AI, gerçek test verilerinize bakarak yanıt verir. Günde 10 sorgu hakkınız bulunur.',
      'Yanıtlar veritabanınızdaki gerçek verilere dayanır — tahmin değil, analiz sonucudur.',
    ],
    tips: [
      'Veli toplantısı öncesi "X öğrencisinin güçlü ve zayıf yönleri neler?" diye sorun.',
      'Dönem başında "Hangi öğrenciler risk altında?" sorusuyla erken tespit yapın.',
      'Sınıf strateji önerisi de AI desteklidir — dashboard\'daki kartı kullanın.',
    ],
    action: { label: 'Dashboard\'daki AI Asistana Git', href: '/teacher/dashboard', icon: <MessageSquare className="w-4 h-4" /> },
  },
  {
    id: 'rehberlik-plani',
    number: 7,
    icon: <FileText className="w-6 h-6" />,
    title: 'Yıllık Rehberlik Planı',
    subtitle: 'AI destekli yıllık rehberlik planı oluşturun ve indirin.',
    color: 'text-rose-700',
    bgGradient: 'from-rose-50 to-pink-50',
    chipBg: 'bg-rose-100 text-rose-700',
    details: [
      '"Rehberlik Planı" menüsünden AI destekli yıllık plan oluşturabilirsiniz.',
      'Plan, sınıflarınızdaki test verilerine göre kişiselleştirilir. Aylık aktiviteler ve öneriler içerir.',
      'Planı Markdown formatında indirebilirsiniz.',
      'BEP (Bireyselleştirilmiş Eğitim Programı) hazırlarken bu planı referans olarak kullanabilirsiniz.',
    ],
    tips: [
      'Dönem başında bir plan oluşturun, dönem ortasında güncelleyin.',
      'Planı okul yönetimiyle paylaşarak kurumsal rehberlik çalışmalarına entegre edin.',
    ],
    action: { label: 'Rehberlik Planına Git', href: '/teacher/guidance-plan', icon: <FileText className="w-4 h-4" /> },
  },
];

// ── Koçluk takip verisi (dashboard'daki ile aynı) ──
interface StudentCoachingInfo {
  student_id: string;
  student_name: string;
  tasks_this_week: number;
  completed_this_week: number;
  current_streak: number;
  last_activity: string | null;
}

// ── Hızlı istatistikler ──
interface QuickStats {
  totalStudents: number;
  completedTests: number;
  activeStreaks: number;
  atRiskCount: number;
}

export default function TeacherCoachingPage() {
  const supabase = useMemo(() => createClient(), []);
  const [expandedStep, setExpandedStep] = useState<string | null>('test-uygulama');
  const [coachingData, setCoachingData] = useState<StudentCoachingInfo[]>([]);
  const [stats, setStats] = useState<QuickStats>({ totalStudents: 0, completedTests: 0, activeStreaks: 0, atRiskCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showAllStudents, setShowAllStudents] = useState(false);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Sınıfları getir
      const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', user.id);
      const classIds = (classes || []).map(c => c.id);
      if (classIds.length === 0) { setLoading(false); return; }

      // Öğrenciler
      const { data: classStudents } = await supabase
        .from('class_students')
        .select('student_id, student:profiles!class_students_student_id_fkey(full_name)')
        .in('class_id', classIds);
      if (!classStudents) { setLoading(false); return; }

      const studentIds = [...new Set(classStudents.map(cs => cs.student_id))];

      // Test sonuçları sayısı
      const { count: testCount } = await supabase
        .from('test_results')
        .select('id', { count: 'exact', head: true })
        .in('student_id', studentIds)
        .not('completed_at', 'is', null);

      // Hafta numarası
      const now = new Date();
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

      // Görevler
      const { data: tasks } = await supabase
        .from('coaching_tasks')
        .select('student_id, is_completed')
        .in('student_id', studentIds)
        .eq('week_number', weekNumber);

      // Streak'ler
      const { data: streaks } = await supabase
        .from('coaching_streaks')
        .select('student_id, current_streak, last_completed_date')
        .in('student_id', studentIds);

      const taskMap = new Map<string, { total: number; completed: number }>();
      for (const t of (tasks || [])) {
        const e = taskMap.get(t.student_id) || { total: 0, completed: 0 };
        e.total += 1;
        if (t.is_completed) e.completed += 1;
        taskMap.set(t.student_id, e);
      }

      const streakMap = new Map<string, { streak: number; lastDate: string | null }>();
      for (const s of (streaks || [])) {
        streakMap.set(s.student_id, { streak: s.current_streak, lastDate: s.last_completed_date });
      }

      // Unique student names
      const nameMap = new Map<string, string>();
      for (const cs of classStudents) {
        const sd = cs.student as unknown as { full_name: string } | null;
        if (!nameMap.has(cs.student_id)) {
          nameMap.set(cs.student_id, sd?.full_name || 'Bilinmeyen');
        }
      }

      const result: StudentCoachingInfo[] = studentIds.map(sid => {
        const ti = taskMap.get(sid) || { total: 0, completed: 0 };
        const si = streakMap.get(sid) || { streak: 0, lastDate: null };
        return {
          student_id: sid,
          student_name: nameMap.get(sid) || 'Bilinmeyen',
          tasks_this_week: ti.total,
          completed_this_week: ti.completed,
          current_streak: si.streak,
          last_activity: si.lastDate,
        };
      });

      result.sort((a, b) => {
        const rateA = a.tasks_this_week > 0 ? a.completed_this_week / a.tasks_this_week : -1;
        const rateB = b.tasks_this_week > 0 ? b.completed_this_week / b.tasks_this_week : -1;
        return rateA - rateB;
      });

      setCoachingData(result);
      setStats({
        totalStudents: studentIds.length,
        completedTests: testCount || 0,
        activeStreaks: (streaks || []).filter(s => s.current_streak > 0).length,
        atRiskCount: result.filter(s => s.tasks_this_week > 0 && s.completed_this_week === 0).length,
      });
    } catch (err) {
      console.error('Koçluk verisi yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(s: StudentCoachingInfo): string {
    if (s.tasks_this_week === 0) return 'text-gray-400';
    const rate = s.completed_this_week / s.tasks_this_week;
    if (rate === 0) return 'text-red-500';
    if (rate < 1) return 'text-amber-500';
    return 'text-emerald-500';
  }

  function getStatusIcon(s: StudentCoachingInfo) {
    if (s.tasks_this_week === 0) return <Clock className="w-4 h-4 text-gray-300" />;
    const rate = s.completed_this_week / s.tasks_this_week;
    if (rate === 0) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (rate < 1) return <Clock className="w-4 h-4 text-amber-500" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  }

  const visibleStudents = showAllStudents ? coachingData : coachingData.slice(0, 8);

  return (
    <div className="min-h-screen pb-10">
      {/* ── HERO ── */}
      <div className="relative mb-8 bg-gradient-to-br from-[#0f2847] via-[#1a3d6e] to-emerald-700 rounded-3xl p-7 sm:p-10 text-white shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">AI Koçluk Merkezi</h1>
              <p className="text-white/60 text-sm font-medium mt-0.5">Yapay zeka destekli öğrenci koçluk ve takip sistemi</p>
            </div>
          </div>

          <p className="text-white/80 text-sm leading-relaxed max-w-2xl mb-6">
            Eğitim Check-Up Pro&apos;nun AI Koçluk sistemi, her öğrencinin test sonuçlarına göre
            kişiselleştirilmiş haftalık görevler oluşturur, gelişimini takip eder ve size
            stratejik öneriler sunar. Aşağıdaki rehberi adım adım takip ederek sistemi en verimli şekilde kullanın.
          </p>

          {/* Hızlı İstatistikler */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Toplam Öğrenci', value: stats.totalStudents, icon: <Users className="w-4 h-4" />, color: 'bg-white/10' },
              { label: 'Tamamlanan Test', value: stats.completedTests, icon: <BookOpen className="w-4 h-4" />, color: 'bg-white/10' },
              { label: 'Aktif Seri', value: stats.activeStreaks, icon: <Flame className="w-4 h-4 text-orange-400" />, color: 'bg-orange-500/20' },
              { label: 'Risk Altında', value: stats.atRiskCount, icon: <AlertCircle className="w-4 h-4 text-red-400" />, color: 'bg-red-500/20' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl ${s.color} backdrop-blur-sm p-3.5`}>
                <div className="flex items-center gap-2 mb-1.5">
                  {s.icon}
                  <span className="text-white/60 text-[11px] font-semibold uppercase tracking-wide">{s.label}</span>
                </div>
                <p className="text-2xl font-extrabold">{loading ? '—' : s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ADIM ADIM REHBER ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#0f2847]">Nasıl Kullanılır? — Adım Adım Rehber</h2>
            <p className="text-gray-500 text-xs">Her adıma tıklayarak detayları görün ve ilgili sayfaya yönlenin.</p>
          </div>
        </div>

        <div className="space-y-3">
          {STEPS.map(step => {
            const isOpen = expandedStep === step.id;
            return (
              <div
                key={step.id}
                className={`rounded-2xl border overflow-hidden transition-all duration-300 shadow-sm ${
                  isOpen ? 'border-gray-200 shadow-md' : 'border-white/40'
                }`}
              >
                {/* Başlık */}
                <button
                  onClick={() => setExpandedStep(isOpen ? null : step.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 transition-all bg-gradient-to-br ${step.bgGradient} hover:brightness-95`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${step.chipBg}`}>
                    {step.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${step.chipBg} px-2 py-0.5 rounded-full`}>
                        Adım {step.number}
                      </span>
                      <h3 className={`font-extrabold text-sm ${step.color}`}>{step.title}</h3>
                    </div>
                    <p className="text-gray-600 text-xs mt-0.5">{step.subtitle}</p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* İçerik */}
                {isOpen && (
                  <div className="px-5 py-5 bg-white border-t border-gray-100">
                    {/* Detaylar */}
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Ne Yapmalısınız?</p>
                      <div className="space-y-2.5">
                        {step.details.map((d, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className={`w-5 h-5 rounded-full ${step.chipBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <span className="text-[10px] font-bold">{i + 1}</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{d}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* İpuçları */}
                    <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pratik İpuçları</p>
                      </div>
                      <div className="space-y-1.5">
                        {step.tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Star className="w-3 h-3 text-amber-500 flex-shrink-0 mt-1" />
                            <p className="text-xs text-amber-700 leading-relaxed">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Aksiyon Butonu */}
                    {step.action && (
                      <Link
                        href={step.action.href}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                          step.id === 'test-uygulama' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
                          step.id === 'rapor-uretme' ? 'bg-gradient-to-r from-violet-500 to-purple-600' :
                          step.id === 'entegre-rapor' ? 'bg-gradient-to-r from-indigo-500 to-blue-600' :
                          step.id === 'takip-paneli' ? 'bg-gradient-to-r from-sky-500 to-cyan-600' :
                          step.id === 'ai-asistan' ? 'bg-gradient-to-r from-teal-500 to-emerald-600' :
                          'bg-gradient-to-r from-rose-500 to-pink-600'
                        }`}
                      >
                        {step.action.icon}
                        {step.action.label}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── HIZLI ERİŞİM BUTONLARI ── */}
      <div className="mb-8">
        <h2 className="text-base font-extrabold text-[#0f2847] mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Hızlı Erişim
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Test Ata', href: '/teacher/assign-test', icon: <ClipboardList className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-600' },
            { label: 'Raporlar', href: '/teacher/reports', icon: <FileText className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-600' },
            { label: 'Sonuçlar', href: '/teacher/results', icon: <BarChart3 className="w-5 h-5" />, gradient: 'from-sky-500 to-blue-600' },
            { label: 'Rehberlik Planı', href: '/teacher/guidance-plan', icon: <FileText className="w-5 h-5" />, gradient: 'from-rose-500 to-pink-600' },
          ].map(q => (
            <Link
              key={q.label}
              href={q.href}
              className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${q.gradient} text-white flex items-center justify-center shadow-lg`}>
                {q.icon}
              </div>
              <div>
                <p className="font-bold text-sm text-[#0f2847]">{q.label}</p>
                <p className="text-[11px] text-gray-400">Sayfaya git →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── CANLI KOÇLUK TAKİP TABLOSU ── */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-[#0f2847] to-[#1a3d6e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-white font-extrabold text-base">Canlı Koçluk Takip</h2>
              <p className="text-white/50 text-xs">Bu haftanın görev tamamlama durumu</p>
            </div>
          </div>
          {coachingData.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-300"><CheckCircle2 className="w-3 h-3" /> Tamamladı</span>
              <span className="flex items-center gap-1 text-amber-300"><Clock className="w-3 h-3" /> Devam Ediyor</span>
              <span className="flex items-center gap-1 text-red-300"><AlertCircle className="w-3 h-3" /> Başlamadı</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : coachingData.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Target className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold mb-1">Henüz koçluk verisi yok</p>
            <p className="text-gray-400 text-xs mb-4">Öğrencileriniz testleri tamamladığında burada görev takibini göreceksiniz.</p>
            <Link
              href="/teacher/assign-test"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              İlk Testi Atayarak Başlayın
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left py-3 px-5">Öğrenci</th>
                    <th className="text-center py-3 px-3">Bu Hafta</th>
                    <th className="text-center py-3 px-3">Tamamlama</th>
                    <th className="text-center py-3 px-3">Seri</th>
                    <th className="text-center py-3 px-3">Son Aktivite</th>
                    <th className="text-center py-3 px-3">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleStudents.map(s => {
                    const rate = s.tasks_this_week > 0 ? Math.round((s.completed_this_week / s.tasks_this_week) * 100) : 0;
                    return (
                      <tr key={s.student_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0f2847] to-[#1a3d6e] flex items-center justify-center text-white text-xs font-bold">
                              {s.student_name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-700">{s.student_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`font-bold ${getStatusColor(s)}`}>
                            {s.completed_this_week}/{s.tasks_this_week}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {s.tasks_this_week > 0 ? (
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    rate === 100 ? 'bg-emerald-500' : rate > 0 ? 'bg-amber-400' : 'bg-red-400'
                                  }`}
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{rate}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {s.current_streak > 0 ? (
                            <span className="inline-flex items-center gap-1 text-orange-500 font-bold text-sm">
                              <Flame className="w-3.5 h-3.5" /> {s.current_streak}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-xs text-gray-400">
                          {s.last_activity || '—'}
                        </td>
                        <td className="py-3 px-3 text-center">{getStatusIcon(s)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {coachingData.length > 8 && (
              <div className="px-5 py-3 border-t border-gray-100 text-center">
                <button
                  onClick={() => setShowAllStudents(!showAllStudents)}
                  className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors flex items-center gap-1 mx-auto"
                >
                  {showAllStudents ? 'Daha az göster' : `Tümünü göster (${coachingData.length} öğrenci)`}
                  <ChevronRight className={`w-4 h-4 transition-transform ${showAllStudents ? 'rotate-90' : ''}`} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── ALT NOT ── */}
      <div className="mt-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-3">
        <Heart className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-emerald-800 text-sm font-bold mb-1">AI Koçluk İle İlgili Önemli Not</p>
          <p className="text-emerald-700 text-xs leading-relaxed">
            AI koçluk sistemi, öğretmenin rehberlik çalışmasını desteklemek için tasarlanmıştır.
            Yapay zeka tarafından üretilen görevler ve raporlar klinik tanı içermez ve profesyonel
            psikolojik değerlendirmenin yerini almaz. Endişe verici durumlar için lütfen okul
            rehberlik servisine yönlendirme yapınız.
          </p>
        </div>
      </div>
    </div>
  );
}
