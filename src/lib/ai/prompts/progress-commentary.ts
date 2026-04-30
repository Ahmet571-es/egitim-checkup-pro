/**
 * Faz 7: Gelişim Değerlendirmesi — Claude prompt'u
 *
 * Öğrencinin aynı testten çoklu sonuçları üzerinden gelişim yorumu üretir.
 * Mehmet'in kuralları (memory'den):
 *   • claude-sonnet-4-6 modeli
 *   • Plain Türkçe + akademik temellendirme + advisory ton
 *   • Soft öneriler (point-referenced reasoning)
 *   • İmperatif (emir kipi) kullanma
 *   • Kesin teşhis koymama
 */

interface ProgressTrendInput {
  testType: string;
  testLabel: string;
  attempts: Array<{
    date: string;          // ISO veya formatlı tarih
    score: number;
    attemptNumber: number;
  }>;
  direction: 'improving' | 'declining' | 'stable';
  averageChange: number;
  firstScore: number;
  latestScore: number;
}

interface BuildProgressPromptParams {
  studentName: string;
  studentGrade?: number | string | null;
  trends: ProgressTrendInput[];
}

export function buildProgressCommentaryPrompt(params: BuildProgressPromptParams): string {
  const { studentName, studentGrade, trends } = params;

  const gradeText = studentGrade ? `${studentGrade}. Sınıf` : 'sınıf bilgisi belirtilmemiş';

  // Trend verilerini okunaklı tablo formatına çevir
  const trendBlocks = trends.map((t) => {
    const attempts = t.attempts
      .map((a) => `  • ${a.date} → Skor: ${a.score}`)
      .join('\n');

    const directionLabel =
      t.direction === 'improving' ? 'iyileşme yönünde' :
      t.direction === 'declining' ? 'düşüş yönünde' : 'sabit seyir';

    return `### ${t.testLabel} (${t.attempts.length} ölçüm)

${attempts}

İlk skor: ${t.firstScore} → Son skor: ${t.latestScore}
Ortalama değişim: %${t.averageChange.toFixed(1)} (${directionLabel})`;
  }).join('\n\n');

  return `Bir okul psikolojik danışmanı için, ${studentName} adlı öğrencinin (${gradeText}) zaman içindeki test gelişimini akademik temellendirmeli, advisory tonda yorumlayan bir metin üret.

═══ Öğrenci Verileri ═══

${trendBlocks}

═══ Yazım Kuralları (Sıkı) ═══

1. **Dil ve ton:**
   - Plain (sade, akıcı) Türkçe kullan. Süslü dil, retorik soru, "kesinlikle", "mutlaka" gibi keskin ifadelerden kaçın.
   - Advisory (tavsiye) tonu: "değerlendirilebilir", "düşünülebilir", "yararlı olabilir" gibi soft modal ifadeler.
   - **Emir kipi kullanma:** "Yap", "olmalı", "uygulanmalı" yasak.
   - Bunun yerine: "uygulanması düşünülebilir", "değerlendirmek faydalı olabilir".

2. **Yapı:**
   - Açılış paragrafı: genel gelişim manzarası (1-2 cümle).
   - Test bazlı paragraflar: her testin trendi ve olası anlamlandırması (2-3 cümle her biri).
   - Kapanış paragrafı: genel sentez ve velkişi/öğretmen için tavsiye (2-3 cümle).
   - Toplam: 200-280 kelime.

3. **Akademik temellendirme:**
   - Skor değişimlerine sayısal referans ver: "%12.5 artış" gibi.
   - Trend yönünü adlandır ama tek başına değerlendirme — bağlamla zenginleştir.
   - "Bu test ölçeğinde", "psikometrik literatürde" gibi tarafsız temellendirmeler.

4. **Yapılmayacaklar:**
   - Kesin teşhis koyma ("dikkat eksikliği vardır" gibi).
   - Çocuk hakkında yargı bildirimi yapma.
   - Veli veya öğretmen için iş listesi (madde madde) yazma.
   - Markdown başlıkları (#) kullanma — düz paragraf akışı.
   - "Önemle belirtmek gerekir ki" gibi gereksiz dolgular.

5. **Belirsizlik:**
   - 2'den az ölçümü olan testleri yorumlama, sadece referans ver.
   - "Veri seti küçük" gibi sınırlamaları nazikçe belirt.

Sadece yorum metnini ver, başka bir şey yazma. Markdown başlığı veya alt başlık kullanma. Düz akıcı paragraflar yaz.`;
}
