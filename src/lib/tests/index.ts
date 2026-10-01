// ============================================================
// Test Registry — Tüm Testlerin Merkezi Listesi
// ============================================================
import type { RegisteredTest } from './types';
import { TEST_COLOR_BASE } from './colors';

export const ALL_TESTS: RegisteredTest[] = [
  {
    id: 'enneagram',
    name: 'Enneagram Kişilik Testi',
    shortName: 'Enneagram',
    description: '9 temel kişilik tipini keşfeden derinlemesine kişilik analizi. 180 soru ile güçlü yönlerin, korku ve arzularını ortaya çıkarır.',
    icon: '🔮',
    color: TEST_COLOR_BASE['enneagram'],
    category: 'kisilik',
    level: 'hepsi',
    estimatedMinutes: 25,
    questionCount: 180,
    tags: ['kişilik', 'öz-farkındalık', 'kariyer', 'ilişkiler'],
  },
  {
    id: 'vark',
    name: 'VARK Öğrenme Stilleri',
    shortName: 'VARK',
    description: 'Görsel, İşitsel, Okuma/Yazma ve Kinestetik öğrenme stillerinden hangisinin sende baskın olduğunu keşfeder. 16 soru.',
    icon: '📚',
    color: TEST_COLOR_BASE['vark'],
    category: 'ogrenme',
    level: 'hepsi',
    estimatedMinutes: 8,
    questionCount: 16,
    tags: ['öğrenme stili', 'çalışma teknikleri', 'akademik başarı'],
  },
  {
    id: 'holland',
    name: 'Holland Mesleki İlgi Envanteri',
    shortName: 'Holland RIASEC',
    description: "RIASEC modeli ile mesleki ilgi alanlarını belirler. 84 soru ile kariyer yönelimini ve en uygun meslek gruplarını ortaya koyar.",
    icon: '🧭',
    color: TEST_COLOR_BASE['holland'],
    category: 'kariyer',
    level: 'hepsi',
    estimatedMinutes: 15,
    questionCount: 84,
    tags: ['kariyer', 'meslek seçimi', 'ilgi alanları'],
  },
  {
    id: 'coklu-zeka',
    name: 'Çoklu Zekâ Testi',
    shortName: 'Çoklu Zekâ',
    description: "Howard Gardner'ın 8 zekâ kuramına dayalı test. Sözel, Mantıksal, Görsel, Müziksel, Doğacı, Sosyal, Bedensel ve İçsel zekâ alanlarını ölçer.",
    icon: '🧠',
    color: TEST_COLOR_BASE['coklu-zeka'],
    category: 'ogrenme',
    level: 'hepsi',
    estimatedMinutes: 12,
    questionCount: 80,
    tags: ['zekâ', 'öğrenme', 'güçlü yönler'],
  },
  {
    id: 'sinav-kaygisi',
    name: 'Sınav Kaygısı Ölçeği',
    shortName: 'Sınav Kaygısı',
    description: '50 soruluk klinisyen onaylı ölçek ile sınav kaygısını 7 alt boyutta ölçer. Bedensel, bilişsel ve sosyal kaygı tiplerini analiz eder.',
    icon: '😰',
    color: TEST_COLOR_BASE['sinav-kaygisi'],
    category: 'psikolojik',
    level: 'hepsi',
    estimatedMinutes: 10,
    questionCount: 50,
    tags: ['kaygı', 'sınav', 'psikoloji', 'stres'],
  },
  {
    id: 'calisma-davranisi',
    name: 'Çalışma Davranışı Ölçeği',
    shortName: 'Çalışma Davranışı',
    description: 'Baltaş Çalışma Davranışı Ölçeği (73 soru) ile çalışma alışkanlıklarını 7 kategoride analiz eder.',
    icon: '📖',
    color: TEST_COLOR_BASE['calisma-davranisi'],
    category: 'akademik',
    level: 'hepsi',
    estimatedMinutes: 15,
    questionCount: 73,
    tags: ['çalışma alışkanlıkları', 'verimlilik', 'akademik başarı'],
  },
  {
    id: 'akademik-analiz',
    name: 'Akademik Analiz Testi',
    shortName: 'Akademik Analiz',
    description: 'Sınıf seviyesine uyarlanmış Okuma Anlama, Matematiksel Muhakeme, Mantıksal Düşünme ve Öz-Değerlendirme bölümlerini içerir.',
    icon: '🎓',
    color: TEST_COLOR_BASE['akademik-analiz'],
    category: 'akademik',
    level: 'hepsi',
    estimatedMinutes: 30,
    questionCount: 54,
    tags: ['akademik', 'okuma anlama', 'matematik', 'mantık'],
  },
  {
    id: 'hizli-okuma',
    name: 'Hızlı Okuma Testi',
    shortName: 'Hızlı Okuma',
    description: 'Okuma hızını (kelime/dakika) ve anlama düzeyini ölçer. 4 kademe metni ile WPM hesaplaması ve 10 anlama sorusu içerir.',
    icon: '⚡',
    color: TEST_COLOR_BASE['hizli-okuma'],
    category: 'akademik',
    level: 'hepsi',
    estimatedMinutes: 10,
    questionCount: 10,
    tags: ['okuma hızı', 'anlama', 'WPM'],
  },
  {
    id: 'd2-dikkat',
    name: 'D2 Dikkat Testi',
    shortName: 'D2 Dikkat',
    description: "Orijinal Brickenkamp D2 formatı: 14 satır × 47 sembol. 'd' harfli ve 2 çizgili hedefleri bulup işaretle. Dikkat ve konsantrasyon kapasitesini ölçer.",
    icon: '🎯',
    color: TEST_COLOR_BASE['d2-dikkat'],
    category: 'dikkat',
    level: 'hepsi',
    estimatedMinutes: 8,
    questionCount: 658,
    tags: ['dikkat', 'konsantrasyon', 'hız', 'doğruluk'],
  },
  {
    id: 'sag-sol-beyin',
    name: 'Sağ-Sol Beyin Testi',
    shortName: 'Sağ-Sol Beyin',
    description: 'Hangi beyin yarımküresinin baskın olduğunu keşfeder. 30 soru ile analitik veya yaratıcı düşünce eğilimini belirler.',
    icon: '🧩',
    color: TEST_COLOR_BASE['sag-sol-beyin'],
    category: 'kisilik',
    level: 'hepsi',
    estimatedMinutes: 8,
    questionCount: 30,
    tags: ['beyin', 'yaratıcılık', 'analitik düşünme'],
  },
  {
    id: 'burdon-dikkat',
    name: 'Burdon Dikkat Testi',
    shortName: 'Burdon Dikkat',
    description: "Orijinal Benjamin Bourdon (1895) formatı. MEB uyarlaması: 3 paragraf × 10 satır × 22 harf. Sayfadaki b, c, d, g harflerinin altını çiz. Paragraf-bazlı dikkat dağılımı örüntüsünü (başta/ortada/sonda) tespit eder.",
    icon: '🔍',
    color: TEST_COLOR_BASE['burdon-dikkat'],
    category: 'dikkat',
    level: 'hepsi',
    estimatedMinutes: 10,
    questionCount: 660,
    tags: ['dikkat', 'konsantrasyon', 'harf tarama', 'dağılım örüntüsü'],
  },
];

export const TEST_MAP: Record<string, RegisteredTest> = Object.fromEntries(
  ALL_TESTS.map(t => [t.id, t])
);

export function getTestById(id: string): RegisteredTest | undefined {
  return TEST_MAP[id];
}

export function getTestsByCategory(category: string): RegisteredTest[] {
  return ALL_TESTS.filter(t => t.category === category);
}

export function getTestsByLevel(level: 'ilkogretim' | 'lise' | 'hepsi'): RegisteredTest[] {
  return ALL_TESTS.filter(t => t.level === 'hepsi' || t.level === level);
}
