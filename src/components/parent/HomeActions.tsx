'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { extractNormalizedScore } from '@/lib/services/correlation';
import { Home, Coffee, BookOpen, MessageCircle, Lightbulb, Loader2 } from 'lucide-react';

// ── Tipler ──────────────────────────────────────────────────
interface HomeAction {
  title: string;
  description: string;
  category: 'günlük-rutin' | 'çalışma-ortamı' | 'iletişim';
}

interface TestResult {
  test_type: string;
  scores: Record<string, unknown>;
}

interface HomeActionsProps {
  childId: string;
}

// ── Kategori konfigürasyonu ─────────────────────────────────
const CATEGORY_CONFIG: Record<string, { label: string; Icon: React.ElementType; color: string; bg: string }> = {
  'günlük-rutin': { label: 'Günlük Rutinler', Icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50' },
  'çalışma-ortamı': { label: 'Çalışma Ortamı', Icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
  'iletişim': { label: 'İletişim İpuçları', Icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

// ── Test etiketleri ─────────────────────────────────────────
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

// ── Statik öneriler (AI yedeği) ─────────────────────────────
function getStaticActions(testType: string, score: number): HomeAction[] {
  const actions: HomeAction[] = [];

  if (testType === 'sinav-kaygisi') {
    if (score < 40) {
      actions.push(
        { title: 'Nefes egzersizleri yapın', description: 'Her gün yatmadan önce 5 dakika derin nefes egzersizi yapın. Bu, sınav öncesi sakinleşmeye yardımcı olur.', category: 'günlük-rutin' },
        { title: 'Sınav simülasyonu', description: 'Evde sessiz bir ortamda zamanlı mini sınavlar yaparak çocuğunuzun sınav ortamına alışmasını sağlayın.', category: 'çalışma-ortamı' },
        { title: '"Hata yapmak normaldir" mesajı', description: 'Çocuğunuza hata yapmanın öğrenmenin bir parçası olduğunu sık sık hatırlatın.', category: 'iletişim' },
      );
    } else {
      actions.push(
        { title: 'Olumlu geri bildirim', description: 'Sınav sonuçlarından bağımsız olarak çocuğunuzun çabasını takdir edin.', category: 'iletişim' },
        { title: 'Düzenli çalışma planı', description: 'Birlikte haftalık bir çalışma planı oluşturun. Planlı çalışmak kaygıyı azaltır.', category: 'günlük-rutin' },
      );
    }
  } else if (testType === 'calisma-davranisi') {
    actions.push(
      { title: 'Sabit çalışma saati', description: 'Her gün aynı saatte çalışma alışkanlığı oluşturun. 30 dakika çalışma + 10 dakika mola formülü uygulayın.', category: 'günlük-rutin' },
      { title: 'Düzenli çalışma köşesi', description: 'Çocuğunuza özel, düzenli ve sessiz bir çalışma alanı oluşturun. Telefon ve tablet çalışma alanından uzakta olsun.', category: 'çalışma-ortamı' },
      { title: 'Hedef belirleyin', description: 'Her hafta birlikte küçük hedefler koyun ve hedefe ulaşıldığında birlikte kutlayın.', category: 'iletişim' },
    );
  } else if (testType === 'vark') {
    actions.push(
      { title: 'Öğrenme stiline uygun materyal', description: 'Çocuğunuzun öğrenme stiline göre ders çalışma yöntemlerini çeşitlendirin: görsel → şemalar, işitsel → sesli tekrar, kinestetik → yaparak öğrenme.', category: 'çalışma-ortamı' },
      { title: 'Aktif tekrar yapın', description: 'Akşam yemeğinde o gün okulda ne öğrendiğini sorun. Anlatması, öğrendiklerini pekiştirir.', category: 'günlük-rutin' },
      { title: 'Merakını destekleyin', description: 'Çocuğunuzun ilgi alanlarına yönelik kitap, video veya aktiviteler önerin.', category: 'iletişim' },
    );
  } else if (testType === 'd2-dikkat') {
    actions.push(
      { title: 'Dikkat oyunları oynayın', description: 'Puzzle, yapboz, hafıza kartları gibi dikkat geliştiren oyunları birlikte oynayın.', category: 'günlük-rutin' },
      { title: 'Sessiz çalışma ortamı', description: 'Çalışma sırasında TV, müzik ve telefon gibi dikkat dağıtıcıları kaldırın.', category: 'çalışma-ortamı' },
      { title: 'Kısa molalar verin', description: 'Uzun çalışma süreleri yerine kısa ama odaklı çalışma periyotları tercih edin.', category: 'iletişim' },
    );
  } else {
    // Genel öneriler
    actions.push(
      { title: 'Birlikte okuma saati', description: 'Her gün 15-20 dakika birlikte kitap okuma alışkanlığı oluşturun.', category: 'günlük-rutin' },
      { title: 'Organize çalışma alanı', description: 'Çocuğunuzun masasını birlikte düzenleyin ve ihtiyaç duyduğu malzemelerin kolay ulaşılabilir olmasını sağlayın.', category: 'çalışma-ortamı' },
      { title: 'Süreci takdir edin', description: 'Sadece sonucu değil, çocuğunuzun gösterdiği çabayı da takdir edin. "Çok çalıştığını görüyorum" gibi ifadeler kullanın.', category: 'iletişim' },
    );
  }

  return actions;
}

export default function HomeActions({ childId }: HomeActionsProps) {
  const [actions, setActions] = useState<HomeAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [availableTests, setAvailableTests] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('test_results')
        .select('test_type, scores')
        .eq('student_id', childId)
        .not('completed_at', 'is', null)
        .order('created_at', { ascending: false });

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      // Her test tipinden son sonuç
      const latestByType = new Map<string, TestResult>();
      for (const row of data) {
        if (!latestByType.has(row.test_type)) {
          latestByType.set(row.test_type, {
            test_type: row.test_type,
            scores: row.scores as Record<string, unknown>,
          });
        }
      }

      const tests = Array.from(latestByType.keys());
      setAvailableTests(tests);

      // İlk testi seç
      const firstTest = tests[0];
      setActiveTest(firstTest);

      const result = latestByType.get(firstTest)!;
      const score = extractNormalizedScore(firstTest, result.scores) ?? 50;
      setActions(getStaticActions(firstTest, score));
      setLoading(false);
    }
    load();
  }, [childId]);

  const handleTestChange = (testType: string) => {
    setActiveTest(testType);
    const supabase = createClient();
    supabase
      .from('test_results')
      .select('test_type, scores')
      .eq('student_id', childId)
      .eq('test_type', testType)
      .not('completed_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const score = extractNormalizedScore(testType, data[0].scores as Record<string, unknown>) ?? 50;
          setActions(getStaticActions(testType, score));
        }
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
      </div>
    );
  }

  if (availableTests.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
      {/* Başlık */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Home className="w-4 h-4 text-pink-500" />
        <h2 className="font-extrabold text-[#0f2847] text-base">Evde Ne Yapabilirim?</h2>
      </div>

      {/* Test seçimi */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex flex-wrap gap-2">
          {availableTests.map((t) => (
            <button
              key={t}
              onClick={() => handleTestChange(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTest === t
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {TEST_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {/* Öneriler */}
      <div className="px-6 py-4 space-y-3">
        {actions.map((action, idx) => {
          const catConfig = CATEGORY_CONFIG[action.category] ?? CATEGORY_CONFIG['günlük-rutin'];
          const { Icon } = catConfig;
          return (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg ${catConfig.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${catConfig.color}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-[#0f2847]">{action.title}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${catConfig.bg} ${catConfig.color}`}>
                    {catConfig.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{action.description}</p>
              </div>
            </div>
          );
        })}

        {actions.length === 0 && (
          <div className="text-center py-4">
            <Lightbulb className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Bu test için henüz öneri bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
