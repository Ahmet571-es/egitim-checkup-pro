// ============================================================
// Test Registry — Tüm Testlerin Merkezi Listesi
// ============================================================
import type { RegisteredTest } from './types';

export const ALL_TESTS: RegisteredTest[] = [
  {
    id: 'enneagram',
    name: 'Enneagram Kişilik Testi',
    shortName: 'Enneagram',
    description: '9 temel kişilik tipini keşfeden derinlemesine kişilik analizi. 180 soru ile güçlü yönlerin, korku ve arzularını ortaya çıkarır.',
    icon: '🔮',
    color: '#8b5cf6',
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
    color: '#10b981',
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
    color: '#f59e0b',
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
    color: '#6366f1',
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
    color: '#ef4444',
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
    color: '#0ea5e9',
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
    color: '#059669',
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
    color: '#f97316',
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
    color: '#dc2626',
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
    color: '#7c3aed',
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
    description: "Orijinal Benjamin Bourdon (1895) formatı. MEB uyarlaması: 3 bölüm × 20 satır × 40 harf. Sayfadaki a, b, d, g harflerinin altını çiz. Dikkat dayanıklılığı ve seçici dikkat performansını ölçer.",
    icon: '🔍',
    color: '#0891b2',
    category: 'dikkat',
    level: 'hepsi',
    estimatedMinutes: 10,
    questionCount: 2400,
    tags: ['dikkat', 'konsantrasyon', 'harf tarama', 'dayanıklılık'],
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
