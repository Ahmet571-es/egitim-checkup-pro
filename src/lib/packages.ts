/**
 * Faz 9: Paket Konfigürasyonu
 *
 * Excel'deki 5 paket ve içerdikleri testler.
 * Test type'lar DB'de kullanılan key'ler ile eşleşir.
 *
 * Paketin "tamamlandığı" → tüm includes_tests testlerinin sonucu mevcut.
 * Genetik (PDF) opsiyonel — yüklendiyse rapora eklenir, yüklenmediyse atlanır.
 */

export type PackageType =
  | 'potansiyel-mizac'
  | 'akademik-performans'
  | 'sinav-strateji'
  | 'kariyer-gelecek'
  | 'vip';

export interface PackageDefinition {
  id: PackageType;
  label: string;
  description: string;
  /** Paketin değerlendirildiği test_type DB key'leri */
  includes_tests: string[];
  /** Genetik PDF kullanılır mı (öğretmen versiyonunda) */
  uses_genetic: boolean;
  /** Hedef kitle açıklaması (prompt için) */
  audience_focus: string;
}

export const PACKAGES: Record<PackageType, PackageDefinition> = {
  'potansiyel-mizac': {
    id: 'potansiyel-mizac',
    label: 'Potansiyel & Mizaç',
    description: 'Çocuğun mizaç yapısı ve genetik temelli yatkınlıklarına odaklanır.',
    includes_tests: ['enneagram', 'coklu_zeka', 'coklu-zeka'],
    uses_genetic: true,
    audience_focus: 'Erken yaş (ilkokul-ortaokul) — kişisel yatkınlık keşfi',
  },
  'akademik-performans': {
    id: 'akademik-performans',
    label: 'Akademik Performans',
    description: 'Akademik başarıyı destekleyen bilişsel ve davranışsal alanlar.',
    includes_tests: [
      'akademik_analiz', 'akademik-analiz',
      'd2_dikkat', 'd2-dikkat',
      'vark',
      'calisma_davranisi', 'calisma-davranisi',
      'coklu_zeka', 'coklu-zeka',
    ],
    uses_genetic: false,
    audience_focus: 'Ortaokul-lise — okul başarısını artırma',
  },
  'sinav-strateji': {
    id: 'sinav-strateji',
    label: 'Sınav Strateji',
    description: 'Sınav öncesi/sırası performans ve psikolojik dayanıklılık.',
    includes_tests: [
      'sinav_kaygisi', 'sinav-kaygisi',
      'calisma_davranisi', 'calisma-davranisi',
      'd2_dikkat', 'd2-dikkat',
      'akademik_analiz', 'akademik-analiz',
    ],
    uses_genetic: false,
    audience_focus: 'LGS-YKS hazırlığı — sınav performansı',
  },
  'kariyer-gelecek': {
    id: 'kariyer-gelecek',
    label: 'Kariyer & Gelecek',
    description: 'Mesleki yatkınlık ve kişilik temelli kariyer yönelimi.',
    includes_tests: ['holland', 'enneagram'],
    uses_genetic: true,
    audience_focus: 'Lise — meslek seçimi ve uzun vadeli yönelim',
  },
  'vip': {
    id: 'vip',
    label: 'VIP Tam Kapsamlı',
    description: 'Tüm test setinin entegre değerlendirmesi.',
    includes_tests: [
      'enneagram', 'vark', 'holland',
      'coklu_zeka', 'coklu-zeka',
      'sinav_kaygisi', 'sinav-kaygisi',
      'calisma_davranisi', 'calisma-davranisi',
      'akademik_analiz', 'akademik-analiz',
      'hizli_okuma', 'hizli-okuma',
      'd2_dikkat', 'd2-dikkat',
      'sag_sol_beyin', 'sag-sol-beyin',
    ],
    uses_genetic: true,
    audience_focus: '11 testin tamamı + genetik — bütüncül 360° değerlendirme',
  },
};

/**
 * Bir paketin "tamamlanma durumunu" kontrol eder.
 * @param completedTestTypes — bu öğrencinin tamamladığı test_type'lar
 * @returns { complete: bool, missing: string[] }
 */
export function checkPackageCompletion(
  packageType: PackageType,
  completedTestTypes: string[],
): { complete: boolean; missing: string[]; covered: string[] } {
  const pkg = PACKAGES[packageType];
  if (!pkg) return { complete: false, missing: [], covered: [] };

  const completedSet = new Set(completedTestTypes);

  // Test_type varyantları (underscore vs hyphen) — biri yeterli
  const testGroups: Record<string, string[]> = {};
  for (const t of pkg.includes_tests) {
    const baseKey = t.replace(/[_-]/g, ''); // normalize
    if (!testGroups[baseKey]) testGroups[baseKey] = [];
    testGroups[baseKey].push(t);
  }

  const missing: string[] = [];
  const covered: string[] = [];
  for (const [baseKey, variants] of Object.entries(testGroups)) {
    const found = variants.find((v) => completedSet.has(v));
    if (found) {
      covered.push(found);
    } else {
      // Eksik testin ana ismini ekle (ilk variant)
      missing.push(variants[0]);
    }
  }

  return {
    complete: missing.length === 0,
    missing,
    covered,
  };
}

export const PACKAGE_LIST: PackageDefinition[] = Object.values(PACKAGES);
