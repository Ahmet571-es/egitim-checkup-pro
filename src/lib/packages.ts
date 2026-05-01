/**
 * Faz 9: Paket Konfigürasyonu
 *
 * Paket tamamlanma mantığı:
 *   • Her paket "test grupları"ndan oluşur
 *   • Bir grup, kabul edilebilir test variant'ların listesidir
 *   • Bir grup için herhangi bir variant öğrenci tarafından çözülmüşse o grup OK
 *
 * Bu sayede:
 *   - underscore vs hyphen normalize edilir (d2_dikkat = d2-dikkat)
 *   - Burdon Dikkat (Mehmet'in eklediği yeni B2 formatı), D2 Dikkat'in alternatifidir
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
  test_groups: Array<{
    name: string;          // Eksik mesajları için Türkçe etiket
    variants: string[];    // Kabul edilebilir test_type değerleri
  }>;
  uses_genetic: boolean;
  audience_focus: string;
}

const ENNEAGRAM = { name: 'Enneagram Kişilik', variants: ['enneagram'] };
const VARK = { name: 'VARK Öğrenme Stilleri', variants: ['vark'] };
const HOLLAND = { name: 'Meslek Testi (Holland)', variants: ['holland'] };
const COKLU_ZEKA = { name: 'Çoklu Zekâ', variants: ['coklu-zeka', 'coklu_zeka'] };
const SINAV_KAYGISI = { name: 'Sınav Kaygısı', variants: ['sinav-kaygisi', 'sinav_kaygisi'] };
const CALISMA_DAVRANISI = { name: 'Çalışma Davranışı', variants: ['calisma-davranisi', 'calisma_davranisi'] };
const AKADEMIK_ANALIZ = { name: 'Akademik Analiz', variants: ['akademik-analiz', 'akademik_analiz'] };
const HIZLI_OKUMA = { name: 'Hızlı Okuma', variants: ['hizli-okuma', 'hizli_okuma'] };
const SAG_SOL_BEYIN = { name: 'Sağ-Sol Beyin', variants: ['sag-sol-beyin', 'sag_sol_beyin'] };
// Dikkat testi — D2 VEYA Burdon (B2). Birinin çözümü yeterli.
const DIKKAT_TESTI = {
  name: 'Dikkat Testi (D2 veya Burdon)',
  variants: ['d2-dikkat', 'd2_dikkat', 'burdon-dikkat', 'burdon_dikkat', 'b2-dikkat', 'b2_dikkat'],
};

export const PACKAGES: Record<PackageType, PackageDefinition> = {
  'potansiyel-mizac': {
    id: 'potansiyel-mizac',
    label: 'Potansiyel & Mizaç',
    description: 'Çocuğun mizaç yapısı ve genetik temelli yatkınlıklarına odaklanır.',
    test_groups: [ENNEAGRAM, COKLU_ZEKA],
    uses_genetic: true,
    audience_focus: 'Erken yaş (ilkokul-ortaokul) — kişisel yatkınlık keşfi',
  },
  'akademik-performans': {
    id: 'akademik-performans',
    label: 'Akademik Performans',
    description: 'Akademik başarıyı destekleyen bilişsel ve davranışsal alanlar.',
    test_groups: [AKADEMIK_ANALIZ, DIKKAT_TESTI, VARK, CALISMA_DAVRANISI, COKLU_ZEKA],
    uses_genetic: false,
    audience_focus: 'Ortaokul-lise — okul başarısını artırma',
  },
  'sinav-strateji': {
    id: 'sinav-strateji',
    label: 'Sınav Strateji',
    description: 'Sınav öncesi/sırası performans ve psikolojik dayanıklılık.',
    test_groups: [SINAV_KAYGISI, CALISMA_DAVRANISI, DIKKAT_TESTI, AKADEMIK_ANALIZ],
    uses_genetic: false,
    audience_focus: 'LGS-YKS hazırlığı — sınav performansı',
  },
  'kariyer-gelecek': {
    id: 'kariyer-gelecek',
    label: 'Kariyer & Gelecek',
    description: 'Mesleki yatkınlık ve kişilik temelli kariyer yönelimi.',
    test_groups: [HOLLAND, ENNEAGRAM],
    uses_genetic: true,
    audience_focus: 'Lise — meslek seçimi ve uzun vadeli yönelim',
  },
  'vip': {
    id: 'vip',
    label: 'VIP Tam Kapsamlı',
    description: 'Tüm test setinin entegre değerlendirmesi.',
    test_groups: [
      ENNEAGRAM, VARK, HOLLAND, COKLU_ZEKA,
      SINAV_KAYGISI, CALISMA_DAVRANISI,
      AKADEMIK_ANALIZ, HIZLI_OKUMA,
      DIKKAT_TESTI, SAG_SOL_BEYIN,
    ],
    uses_genetic: true,
    audience_focus: 'Tüm testler + genetik — bütüncül 360° değerlendirme',
  },
};

/**
 * Bir paketin tamamlanma durumunu kontrol eder.
 * @returns { complete, missing: eksik grup adları, covered: çözülen variant'lar }
 */
export function checkPackageCompletion(
  packageType: PackageType,
  completedTestTypes: string[],
): { complete: boolean; missing: string[]; covered: string[] } {
  const pkg = PACKAGES[packageType];
  if (!pkg) return { complete: false, missing: [], covered: [] };

  const completedSet = new Set(completedTestTypes);
  const missing: string[] = [];
  const covered: string[] = [];

  for (const group of pkg.test_groups) {
    const found = group.variants.find((v) => completedSet.has(v));
    if (found) {
      covered.push(found);
    } else {
      missing.push(group.name);
    }
  }

  return {
    complete: missing.length === 0,
    missing,
    covered,
  };
}

export const PACKAGE_LIST: PackageDefinition[] = Object.values(PACKAGES);

/** Geriye uyumluluk: eski API kullananlar için */
export function getIncludesTests(pkg: PackageDefinition): string[] {
  return pkg.test_groups.flatMap((g) => g.variants);
}
