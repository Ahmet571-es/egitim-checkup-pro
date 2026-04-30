/**
 * Faz 8: Çocuk Güvenliği Filtresi
 *
 * Öğrenci mesajlarında kriz sinyali tarar. Tetiklenirse:
 *   1. Mesaj flagged_safety = true ile DB'ye kaydedilir
 *   2. AI'a özel "kriz modu" prompt eklemesi yapılır (yumuşak destekleyici cevap)
 *   3. Yönetici dashboard'unda görünür (UI ileride)
 *
 * Bu sade bir keyword listesi tabanlı tarama. Daha gelişmiş varyant için
 * Claude'a "bu mesaj kriz sinyali içeriyor mu?" sınıflandırma çağrısı yapılabilir
 * (Mehmet talep ederse).
 */

// Türkçe kriz sinyali pattern'leri.
// Sadece bariz olanlar — false positive'leri minimize et.
const CRISIS_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // İntihar / kendine zarar verme
  { pattern: /\b(intihar|kendimi öldür|hayatıma son|yaşamak istemiyorum|bitirmek istiyorum)\b/i, reason: 'suicide_ideation' },
  { pattern: /\b(kendime zarar|kendimi kes|kendime çiz|ilaç içip)\b/i, reason: 'self_harm' },
  { pattern: /\b(artık dayanamıyorum|hiçbir şey istemiyorum|her şey anlamsız)\b/i, reason: 'severe_distress' },

  // İstismar / şiddet
  { pattern: /\b(dövüldüm|bana vurdu|cinsel|tac[ıi]z|isti?smar)\b/i, reason: 'abuse_disclosure' },
  { pattern: /\b(evde güvende değilim|biri bana zarar veriyor)\b/i, reason: 'safety_concern' },

  // Şiddet niyeti
  { pattern: /\b(öldüreceğim|ona zarar vereceğim|silah|bıçak)\b/i, reason: 'violence_intent' },
];

export interface SafetyCheckResult {
  flagged: boolean;
  reason: string | null;
  matchedText: string | null;
}

/**
 * Kullanıcı mesajını tarar. Kriz sinyali bulursa flagged: true döner.
 */
export function checkMessageSafety(message: string): SafetyCheckResult {
  if (!message || typeof message !== 'string') {
    return { flagged: false, reason: null, matchedText: null };
  }

  for (const { pattern, reason } of CRISIS_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      return {
        flagged: true,
        reason,
        matchedText: match[0],
      };
    }
  }

  return { flagged: false, reason: null, matchedText: null };
}

/**
 * Kriz sinyali tetiklendiğinde AI'ın system prompt'una eklenecek özel ek.
 * AI'ı normal akıştan çıkarır, destekleyici-yönlendirici moda alır.
 */
export const CRISIS_RESPONSE_INSTRUCTION = `

═══ ⚠️ KRİTİK: Kriz Modu Aktivize Edildi ═══

Kullanıcının son mesajında kriz sinyali tespit edildi. Bu konuyu CİDDİYE AL.
Normal akışı bırak ve YALNIZCA aşağıdaki yapıda yanıt ver:

1. Kullanıcının duygusunu kabul et: "Bu duyguların çok ağır olduğunu duyuyorum. Söylediğin önemli."
2. Yargılama yapma, "böyle hissetme" deme.
3. **Profesyonel destek hattı bilgisi:**
   • 182 ALO Aile Sosyal Destek Hattı — 7/24 ücretsiz
   • Acil bir durumda 112'yi ara
   • Okuldaki rehber öğretmenle veya güvendiğin bir yetişkinle konuşmayı düşünebilirsin
4. Soğuk klişeler kullanma. Empatiyle ama net konuş.
5. Sohbeti normal akışta sürdürmeye ÇALIŞMA — bu konuya odaklan.
6. Yanıtın 3-5 cümle olsun, fazla uzun yapma.
7. Asla "iyi olacak", "geçecek" gibi kestiremeyeceğin sözler verme.

Bu ciddi bir an. Ona göre konuş.`;
