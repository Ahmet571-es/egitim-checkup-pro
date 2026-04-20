/**
 * Yaş hesaplama yardımcıları
 *
 * Doğum tarihinden yaş hesabı, gün/ay hassasiyetinde.
 * Yaş tabanlı test süreleri ve norm değerleri için kullanılır.
 */

/**
 * Doğum tarihinden bugünkü yaşı hesaplar (tam yıl).
 * @param birthDate ISO 8601 tarih string'i (YYYY-MM-DD) veya Date
 * @returns Tam yaş (yıl) — geçersiz tarih için null
 *
 * @example
 * calculateAge('2010-03-15')  // bugün 2026-04-20 ise → 16
 * calculateAge('2010-05-20')  // bugün 2026-04-20 ise → 15 (doğum günü geçmedi)
 */
export function calculateAge(birthDate: string | Date | null | undefined): number | null {
  if (!birthDate) return null;

  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  // Doğum günü henüz gelmediyse yaştan 1 düş
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  // Makul aralık kontrolü (3-100 yaş)
  if (age < 3 || age > 100) return null;

  return age;
}

/**
 * Doğum tarihinden yaşı hassas şekilde hesaplar (ondalık yıl).
 * Bilimsel/akademik raporlamada daha hassas yaş referansı için.
 * @param birthDate ISO 8601 tarih string'i veya Date
 * @returns Ondalık yaş (örn: 14.7) — geçersiz tarih için null
 */
export function calculateAgePrecise(birthDate: string | Date | null | undefined): number | null {
  if (!birthDate) return null;

  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  const diffMs = today.getTime() - birth.getTime();
  const yearMs = 365.25 * 24 * 60 * 60 * 1000;
  const age = diffMs / yearMs;

  if (age < 3 || age > 100) return null;
  return Math.round(age * 10) / 10;
}

/**
 * Yaştan Burdon test süresini (saniye cinsinden) belirler.
 * Orijinal MEB uyarlaması:
 *   - 10-13 yaş (ortaokul): 180 saniye (3 dakika) / bölüm
 *   - 14-20 yaş (lise): 120 saniye (2 dakika) / bölüm
 * @param age Öğrencinin yaşı
 * @returns Bölüm başına saniye
 */
export function getBurdonTimeByAge(age: number | null | undefined): number {
  if (age == null || age < 10) return 180; // Varsayılan: ortaokul
  if (age >= 14) return 120;                // Lise ve üstü
  return 180;                                // Ortaokul (10-13)
}

/**
 * Yaştan eğitim seviyesi etiketi
 * @param age
 * @returns 'ortaokul' | 'lise' | 'yetiskin' | 'cocuk'
 */
export function getEducationLevel(age: number | null | undefined): 'cocuk' | 'ortaokul' | 'lise' | 'yetiskin' {
  if (age == null) return 'ortaokul'; // Varsayılan
  if (age < 10) return 'cocuk';
  if (age <= 13) return 'ortaokul';
  if (age <= 18) return 'lise';
  return 'yetiskin';
}

/**
 * Doğum tarihinin geçerli aralıkta olup olmadığını kontrol eder
 * @param birthDate ISO tarih veya Date
 * @returns Geçerliyse true, yoksa hata mesajı
 */
export function validateBirthDate(birthDate: string | Date | null | undefined): { valid: boolean; error?: string } {
  if (!birthDate) return { valid: false, error: 'Doğum tarihi gereklidir.' };

  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (isNaN(birth.getTime())) return { valid: false, error: 'Geçersiz tarih formatı.' };

  const today = new Date();
  if (birth > today) return { valid: false, error: 'Doğum tarihi gelecekte olamaz.' };

  const age = calculateAge(birthDate);
  if (age == null) return { valid: false, error: 'Geçerli bir yaş hesaplanamadı.' };
  if (age < 3) return { valid: false, error: 'Bu sistem 3 yaş altı öğrenciler için tasarlanmamıştır.' };
  if (age > 100) return { valid: false, error: 'Lütfen geçerli bir doğum tarihi girin.' };

  return { valid: true };
}
