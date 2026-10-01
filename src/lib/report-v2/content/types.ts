// ============================================================
// Rapor v2 — İçerik profili tipi
// ============================================================
// Raporun anlatımı "profillerden" kurulur. Bir profil, bir özelliğin
// (ör. Enneagram Tip 1, yüksek sınav kaygısı, çalışmaya başlama güçlüğü)
// raporun her bölümüne katkı verebilecek metinlerini taşır. Bütün alanlar
// isteğe bağlıdır; bölüm kurucular, öğrencinin sonuçlarına göre sıralanmış
// profillerden ilk dolu alanı alır, listeleri birleştirir.
//
// Metinlerde ad yer tutucuları kullanılır: {ad} {adın} {adı} {ada} {adda} {addan} {adla}
// (bkz. ../tr.ts). "Sen" diliyle yazılan alanlar `you` ile başlar.

export interface Profile {
  id: string;
  /** Profilin raporun öne çıkan temalarındaki ağırlığı (büyük olan önce gelir). */
  weight?: number;

  // ── Değerlendirme sonuçları bölümündeki kısa yorum (Bütünsel bölümle tekrar etmesin diye ayrı) ──
  result?: string[];

  // ── Kısaca ──
  kisaca?: string;
  strengths?: string[];
  growth?: string[];
  /** Gelişim için eylem cümleleri ("…-mek"); "Kendini Geliştirme" bölümünde kullanılır. */
  develop?: string[];
  priority?: string;

  // ── Bütünsel değerlendirme parçaları (3. şahıs) ──
  portrait?: string[];
  key?: string;
  motivates?: string;
  stops?: string;
  motivators?: string[];
  stoppers?: string[];
  resources?: string[];
  resourceBullets?: string[];
  blindspots?: string[];
  blindspotBullets?: string[];
  communication?: string[];
  commStrong?: string;
  commHard?: string;
  commStep?: string;
  stress?: string[];
  stressSigns?: string;
  stressHelps?: string;
  conflict?: string[];
  conflictTip?: string;
  interests?: string[];
  learning?: string[];
  learningBullets?: string[];
  future?: string[];
  workEnv?: string[];
  drains?: string[];
  studyNow?: string[];
  risks?: string[];
  quickWins?: string[];
  tracking?: string[];

  // ── Öğrenci için (2. şahıs) ──
  youAre?: string;
  youStrengths?: string[];
  youGrowth?: string;
  youWays?: string[];
  youComm?: string;
  youFuture?: string;
  youNow?: string;
  youTry?: string[];
  youLast?: string;

  // ── Aile için ──
  familyOneLine?: string;
  approaches?: { do: string; why: string }[];
  doList?: string[];
  dontList?: string[];
  dialog?: { instead: string; tryThis: string }[];
  homeEnv?: string[];
  gradeTalk?: string[];
  compare?: string;
  supportSigns?: string[];
  plan?: [string, string, string];

  // ── Uzman için ──
  caseTheme?: string;
  findings?: string[];
  cognitive?: string[];
  emotional?: string[];
  academicSupport?: string[];
  questions?: string[];
  verify?: [string, string][];
  priorities?: [string, string][];
  referral?: string;
  monitoring?: string;
}
