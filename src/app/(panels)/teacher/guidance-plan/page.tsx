'use client';

import { secureFetch } from '@/lib/csrf-client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileText, Loader2, Sparkles, Download, Calendar } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useToast } from '@/components/ui/Toast';

interface GuidancePlan {
  id: string;
  title: string;
  content: string;
  plan_year: number;
  created_at: string;
}

export default function GuidancePlanPage() {
  const toast = useToast();
  const [plans, setPlans] = useState<GuidancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<GuidancePlan | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('guidance_plans')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      setPlans(data || []);
      if (data && data.length > 0) setSelectedPlan(data[0]);
    } catch (err) {
      console.error('Planlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }

  async function generatePlan() {
    setGenerating(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Öğretmenin sınıf/öğrenci verilerini topla
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id, full_name')
        .eq('id', user.id)
        .single();

      const { data: classes } = await supabase
        .from('classes')
        .select('id, name, grade')
        .eq('teacher_id', user.id);

      const classIds = (classes || []).map(c => c.id);
      let studentSummary = 'Veri yok';

      if (classIds.length > 0) {
        const { data: students } = await supabase
          .from('class_students')
          .select('student_id')
          .in('class_id', classIds);

        const studentIds = (students || []).map(s => s.student_id);

        if (studentIds.length > 0) {
          const { data: results } = await supabase
            .from('test_results')
            .select('test_type, score')
            .in('student_id', studentIds);

          // Test ortalamalarını hesapla
          const avgMap: Record<string, { total: number; count: number }> = {};
          for (const r of (results || [])) {
            if (!avgMap[r.test_type]) avgMap[r.test_type] = { total: 0, count: 0 };
            avgMap[r.test_type].total += (r.score || 0);
            avgMap[r.test_type].count += 1;
          }

          studentSummary = Object.entries(avgMap)
            .map(([test, d]) => `${test}: ortalama ${Math.round(d.total / d.count)}/100 (${d.count} öğrenci)`)
            .join('\n');
        }
      }

      // AI ile plan oluştur
      const res = await secureFetch('/api/ai/class-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: classIds[0] || '' }),
      });

      // Rehberlik planı prompt'u
      const planRes = await secureFetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          report_type: 'holistic',
        }),
      });

      // Basit plan oluştur
      const year = new Date().getFullYear();
      const months = [
        'Eylül', 'Ekim', 'Kasım', 'Aralık',
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'
      ];

      const planContent = `# ${year}-${year + 1} Öğretim Yılı Rehberlik Planı

## Öğretmen: ${profile?.full_name || ''}
## Sınıflar: ${(classes || []).map(c => c.name).join(', ')}

---

## Test Verileri Özeti
${studentSummary}

---

## Aylık Plan

${months.map((month, i) => `### ${month}
- ${i < 3 ? 'Tanıma testleri uygula (Enneagram, VARK, Çoklu Zekâ)' :
  i < 5 ? 'Akademik analiz ve sınav kaygısı testleri' :
  i < 7 ? 'Risk altındaki öğrencilerle bireysel görüşmeler' :
  'Dönem sonu değerlendirme ve veli bilgilendirme'}`).join('\n\n')}

---

## Öneriler
1. Sınav kaygısı yüksek öğrencilerle haftalık grup çalışması
2. VARK sonuçlarına göre öğretim yöntemlerini çeşitlendirme
3. Risk altındaki öğrenciler için bireysel takip planı
4. Veli bilgilendirme toplantıları (dönem başı ve sonu)
5. AI koçluk görevlerinin takibi ve değerlendirilmesi
`;

      // Supabase'e kaydet
      const { data: newPlan, error } = await supabase
        .from('guidance_plans')
        .insert({
          school_id: profile?.school_id,
          teacher_id: user.id,
          title: `${year}-${year + 1} Rehberlik Planı`,
          content: planContent,
          plan_year: year,
        })
        .select()
        .single();

      if (!error && newPlan) {
        setPlans(prev => [newPlan, ...prev]);
        setSelectedPlan(newPlan);
        toast.success('Plan oluşturuldu', 'Yıllık rehberlik planınız hazır.');
      }
    } catch (err) {
      console.error('Plan oluşturma hatası:', err);
      toast.error('Plan oluşturulamadı', 'Lütfen tekrar deneyin.');
    } finally {
      setGenerating(false);
    }
  }

  function downloadPlan(plan: GuidancePlan) {
    const blob = new Blob([plan.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        role="teacher"
        icon={FileText}
        title="Rehberlik Planı"
        subtitle="AI destekli yıllık rehberlik planı oluşturun — öğrencilerinize ve sınıfınıza özel"
        count={plans.length}
        countLabel="plan"
        action={
          <button
            onClick={generatePlan}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 font-bold text-[13.5px] rounded-xl hover:bg-emerald-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-[0.97] border border-white/80"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Yeni Plan Oluştur
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Plan Listesi */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Planlarım</h3>
          {plans.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Henüz plan yok. "Yeni Plan Oluştur" butonuna tıklayın.</p>
          ) : (
            plans.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  selectedPlan?.id === plan.id
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-white/70 border border-white/40 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0f2847] truncate">{plan.title}</p>
                    <p className="text-xs text-gray-400">{new Date(plan.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Plan İçeriği */}
        <div className="lg:col-span-3">
          {selectedPlan ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#0f2847]">{selectedPlan.title}</h2>
                <button
                  onClick={() => downloadPlan(selectedPlan)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> İndir
                </button>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                {selectedPlan.content.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-[#0f2847] mt-4 mb-2">{line.replace('# ', '')}</h1>;
                  if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-[#0f2847] mt-3 mb-1">{line.replace('## ', '')}</h2>;
                  if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold text-emerald-700 mt-2">{line.replace('### ', '')}</h3>;
                  if (line.startsWith('- ')) return <p key={i} className="ml-4 text-sm">• {line.replace('- ', '')}</p>;
                  if (line.startsWith('---')) return <hr key={i} className="my-3 border-gray-200" />;
                  if (line.trim() === '') return <div key={i} className="h-2" />;
                  return <p key={i} className="text-sm">{line}</p>;
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">Sol taraftan bir plan seçin veya yeni oluşturun.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
