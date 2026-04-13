/**
 * Faz 7: QR Kod Servisi
 * Öğretmen QR oluşturur, öğrenci okutarak teste başlar
 */

/** QR kod URL'i oluştur (harici QR API kullanarak) */
export function generateQRCodeURL(testUrl: string, size = 200): string {
  const encoded = encodeURIComponent(testUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=svg`;
}

/** Test için QR URL oluştur */
export function getTestQRUrl(testType: string, schoolCode: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://egitim-checkup.com';
  return `${baseUrl}/student/my-tests/${testType}?ref=qr&school=${schoolCode}`;
}

/** Toplu test başlatma QR kodu */
export function getClassTestQRUrl(classId: string, testType: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://egitim-checkup.com';
  return `${baseUrl}/student/my-tests/${testType}?ref=qr&class=${classId}`;
}
