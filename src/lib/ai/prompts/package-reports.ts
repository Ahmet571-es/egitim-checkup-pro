/**
 * Faz 9: Paket Bazlı Bütüncül Rapor Prompt'ları (3 versiyon)
 *
 * KVKK + Çocuk güvenliği matrisi:
 *   • teacher → tam veri + akademik dil + sınıf-içi pratik
 *   • parent  → skorlar + tavsiye, ham cevap yok, kesin teşhis yok
 *   • student → SKOR YOK, etiketleme YOK, "henüz" çerçeve, ben dili,
 *               tıbbi terim YASAK, karşılaştırma YASAK
 */

import type { PackageDefinition } from '@/lib/packages';

interface TestDataItem {
  test_label: string;
  test_type: string;
  scores: Record<string, unknown>;     // ham skor objesi
  ai_report?: string | null;           // mevcut tekil AI raporu (varsa referans)
  date?: string;
}

export interface PackageReportContext {
  studentName: string;
  studentAge?: number;                 // yaşa uygun dil için (özellikle öğrenci versiyonunda)
  studentGrade?: number | string | null;
  packageDef: PackageDefinition;
  testData: TestDataItem[];
}

// ═══════════════════════════════════════════════════════════════
//   ÖĞRETMEN VERSİYONU — tam veri + akademik
// ═══════════════════════════════════════════════════════════════
export function buildTeacherPackageReport(ctx: PackageReportContext, hasGeneticPdf: boolean = false): string {
  const { studentName, studentGrade, packageDef, testData } = ctx;

  const gradeText = studentGrade ? `${studentGrade}. sınıf` : 'sınıf bilgisi yok';
  const ageText = ctx.studentAge ? `${ctx.studentAge} yaş` : '';

  const testBlocks = testData.map((t, i) => {
    const scoreLines = Object.entries(t.scores || {})
      .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
      .map(([k, v]) => `  - ${k}: ${v}`)
      .join('\n');

    return `### Test ${i + 1}: ${t.test_label}
${t.date ? `Tarih: ${t.date}` : ''}
Skor detayı:
${scoreLines || '  (skor verisi yok)'}
${t.ai_report ? `\nMevcut AI yorumu özeti: ${t.ai_report.slice(0, 400)}...` : ''}`;
  }).join('\n\n');

  return `Sen Türkiye'de bir okul psikolojik danışmanısın. ${studentName} (${gradeText}${ageText ? ', ' + ageText : ''}) adlı öğrenci için **${packageDef.label}** paketi kapsamında ÖĞRETMEN için detaylı bir bütüncül rapor üret.

═══ Paket Tanımı ═══
${packageDef.description}
Hedef: ${packageDef.audience_focus}

═══ Test Verileri ═══

${testBlocks}
${hasGeneticPdf ? `

═══ 🧬 Genetik Analiz (DMIT) — Bu Mesajda Ekli PDF ═══

Bu öğrencinin **DMIT (Dermatoglifik Çoklu Zekâ) raporu** bu mesajda PDF eki olarak ekli. PDF'in TAM İÇERİĞİNE erişebiliyorsun. DMIT, parmak izi desenlerinden doğuştan gelen beyin lateralitesi, çoklu zekâ alanları, öğrenme stili ve mesleki yatkınlık eğilimlerini ortaya koyar.

DMIT'i raporda kullanma biçimin:
- "DMIT Genetik Profili Bulguları" alt başlığı altında PDF'teki spesifik sayılara (yüzdeler, lateralite oranı, baskın zekâ alanları) atıfta bulun
- "Bütüncül Yorum" bölümünde DMIT bulgularını yapılan psikometrik testlerle ÇAPRAZ analiz et: hangileri uyumlu, hangileri çelişkili
- Doğuştan yatkınlık (DMIT) vs gelişmiş profil (psikometrik) ayrımını kullanarak öğrencinin doğal güçlü alanını ve gelişim potansiyelini yorumla
- Olasılıksal dil zorunlu: "yatkınlığını işaret ediyor", "...eğilim olarak görünüyor"` : ''}

═══ Yazım Kuralları (Sıkı) ═══

1. **Hedef okuyucu:** Öğretmen ve okul psikolojik danışmanı.
2. **Dil:** Profesyonel akademik Türkçe. Pedagojik literatür referansları (kavramsal, kaynak uydurma).
3. **Yapı:**
   ## Genel Değerlendirme (1-2 paragraf)
   ## Test Bazlı Bulgular (her test için 1 paragraf, skor detayları + yorum)
   ${hasGeneticPdf ? '## DMIT Genetik Profili Bulguları (PDF\'ten okunan spesifik veriler)\n   ' : ''}## Bütüncül Yorum (paketin amacına göre testler arası bağlantı${hasGeneticPdf ? ' + DMIT çapraz analizi' : ''}, 2-3 paragraf)
   ## Sınıf İçi Pratik Tavsiyeler (madde halinde 5-7 öneri)
   ## Önerilen Takip ve Değerlendirme (madde halinde 3-5)
4. **Ton:**
   - Soft modal: "değerlendirilebilir", "uygulanması düşünülebilir".
   - "Yapın", "olmalı" YASAK.
5. **Skor referansları:** Tam veri sende, sayısal skorlara doğrudan referans ver.
6. **Kesin teşhis YASAK:** "X bozukluğu var" demek yerine "Test bulguları X yönünde işaretler veriyor, profesyonel değerlendirme önerilir".
7. **Norm referans:** Standart ölçek norm değerleri varsa istatistiksel referans ver.
8. **Uzunluk:** ${hasGeneticPdf ? '1000-1500' : '800-1200'} kelime.

Markdown başlıkları (## ###) kullan, akıcı Türkçe yaz.`;
}

// ═══════════════════════════════════════════════════════════════
//   VELİ VERSİYONU — skorlar var, ham cevap yok, kesin teşhis yok
// ═══════════════════════════════════════════════════════════════
export function buildParentPackageReport(ctx: PackageReportContext, parentName?: string): string {
  const { studentName, studentGrade, packageDef, testData } = ctx;
  const gradeText = studentGrade ? `${studentGrade}. sınıf` : '';
  const parentNameText = parentName || 'Sayın veli';

  // Veli için skor genel + AI yorum özeti var
  const testBlocks = testData.map((t) => {
    // Skorların sade gösterimi (ana skor varsa)
    const scoresArr = Object.values(t.scores || {}).filter((v) => typeof v === 'number') as number[];
    const avgScore = scoresArr.length > 0
      ? Math.round((scoresArr.reduce((a, b) => a + b, 0) / scoresArr.length) * 10) / 10
      : null;

    return `### ${t.test_label}
${avgScore !== null ? `Genel skor: ${avgScore}` : ''}
${t.ai_report ? `Bulgu özeti: ${t.ai_report.slice(0, 250)}...` : ''}`;
  }).join('\n\n');

  return `Sen Türkiye'de bir okul psikolojik danışmanısın. ${studentName} (${gradeText}) adlı öğrencinin velisi ${parentNameText}'e **${packageDef.label}** paketinin VELİ ÖZET RAPORU'nu hazırla.

═══ Paket Tanımı ═══
${packageDef.description}

═══ Test Verileri (özetlenmiş) ═══

${testBlocks}

═══ Yazım Kuralları (Sıkı) ═══

1. **Hedef okuyucu:** Çocuğun velisi. Akademik geçmişi yok varsay.
2. **Dil:** Sade Türkçe, jargon az, gerekirse açıklamalı.
3. **Hitap:** "Siz" dilinde, sıcak ama profesyonel.
4. **Yapı:**
   ## Çocuğunuzun Profili (1 paragraf, hoş giriş)
   ## Güçlü Yönleri (1-2 paragraf, somut örneklerle)
   ## Gelişim Alanları (1-2 paragraf, "henüz" çerçevesinde, yargısız)
   ## Velinin Nasıl Destek Olabileceği (madde halinde 5-8 somut tavsiye)
   ## Genel Değerlendirme (1 paragraf kapanış)

5. **Skor sunumu:** Genel skorlardan bahsedebilirsin ama:
   - "Çocuğunuzun X testi skoru 67'dir" YERİNE
   - "X testinde orta seviye bir performans gözleniyor"
   gibi anlatımsal ifade kullan.

6. **Ham cevaplar PAYLAŞILMAZ.** Sadece test özetleri.

7. **YASAK ifadeler:**
   - "Çocuğunuzda X bozukluğu var" — kesin teşhis
   - "Çocuğunuz tembel/dikkatsiz" — yargı
   - "DEHB belirtisi", "öğrenme güçlüğü" gibi tıbbi terimler

8. **YERİNE:**
   - "Bu testte gelişim alanı olarak görünüyor"
   - "Profesyonel değerlendirme yararlı olabilir"

9. **Velinin yapabilecekleri:**
   - Çalışma ortamı düzeni
   - Ekran süresi, uyku, beslenme (sağlıklı çerçeve)
   - Çocukla iletişim önerileri
   - Okulla işbirliği

10. **Genetik analiz NOTU:** Eğer paket genetik içeriyorsa, en sona şu cümleyi ekle:
    "Genetik analiz raporunuz okul psikolojik danışmanı tarafından ayrıca değerlendirilmiştir; detaylar için okulla iletişime geçebilirsiniz."

11. **Uzunluk:** 600-900 kelime.

Markdown başlıkları (##) kullan, akıcı paragraflar yaz.${packageDef.uses_genetic ? '\n\n**ÖNEMLİ:** Bu paket genetik analiz içeriyor. Veli versiyonuna genetik raporun KENDİSİ eklenmez, sadece yukarıdaki not yer alır.' : ''}`;
}

// ═══════════════════════════════════════════════════════════════
//   ÖĞRENCİ VERSİYONU — pedagojik çerçeve sıkı
//   (Yol haritası 9.5 — sayısız yasak/zorunlu kural)
// ═══════════════════════════════════════════════════════════════
export function buildStudentPackageReport(ctx: PackageReportContext): string {
  const { studentName, packageDef, testData } = ctx;

  // Çocuğa SKOR YOK — sadece test isimleri ve yorum özeti
  const testHints = testData.map((t) => {
    return `- ${t.test_label}${t.ai_report ? `: ${t.ai_report.slice(0, 200)}...` : ''}`;
  }).join('\n');

  // Yaşa göre dil tonu
  const ageText = ctx.studentAge
    ? ctx.studentAge < 10
      ? 'küçük yaş (ilkokul) — sade, samimi, sıcak'
      : ctx.studentAge < 14
      ? 'ortaokul — samimi ama olgun'
      : 'lise — saygılı eşitlikçi, biraz daha entelektüel'
    : 'genel ergen tonu';

  return `Sen ${studentName} adlı çocuk/genç için doğrudan ona hitap eden bir gelişim koçusun. **${packageDef.label}** paketinin ÖĞRENCİ versiyonunu hazırla.

═══ Paket Tanımı ═══
${packageDef.description}
Hedef: ${packageDef.audience_focus}

═══ Test Bulgularının Özeti (referans için, RAPORDA SKOR YAZMA) ═══

${testHints}

═══ ZORUNLU PEDAGOJİK ÇERÇEVE (Sıkı) ═══

1. **Hitap:** "Sen" dilinde, samimi ve sıcak.
2. **Yaş tonu:** ${ageText}.
3. **Yapı:**
   ## Sana Bir Şeyler Söylemek İstiyorum (1 paragraf, hoş açılış)
   ## Senin Güçlü Yönlerin (2-3 paragraf, somut örneklerle)
   ## Birlikte Geliştirebileceğin Alanlar (2-3 paragraf, "henüz" çerçeve)
   ## Senin İçin 3-5 Somut Öneri (madde halinde, eyleme dönük)
   ## Son Söz (kısa, gelişim mesajı)

4. **HEM güçlü yönler HEM gelişim alanları olmalı.** Sadece pozitif değil, sadece negatif değil — DENGELİ.

5. **"Henüz" çerçevesi:**
   ❌ "Bunu yapamıyorsun"
   ✅ "Bunu HENÜZ tam yapamıyorsun, çalıştıkça gelişecek"

6. **Etiket değil, davranış:**
   ❌ "Sen dikkatsizsin"
   ✅ "Bazen dikkatin dağılıyor olabilir, bunu güçlendirebilirsin"

7. **Sıfat değil, durum:**
   ❌ "Sen kaygılı bir çocuksun"
   ✅ "Sınav öncesi heyecanlanıyorsun — bu çoğu öğrenci için doğal"

8. **Ben dili:**
   ❌ "Sen şöylesin"
   ✅ "Şunu fark ettim, sence nasıl?" (iç gözlem)

9. **Eyleme dönük tavsiye:** Her gelişim alanı için somut bir öneri.
   Örnek: "Çalışmalarda 25 dakikada bir 5 dakika ara vermeyi denersen, dikkatini taze tutabilirsin."

═══ KESİN YASAKLAR ═══

❌ **Skorlar, sayısal değerler, percentile.** "X testinde 67 aldın" YASAK.
❌ **Negatif sıfatlar:** "zayıf", "kötü", "yetersiz", "başarısız".
❌ **Tıbbi/psikolojik terim:** "kaygı bozukluğu", "DEHB", "öğrenme güçlüğü".
❌ **Karşılaştırma:** "akranlarına göre", "sınıfının %30'unda".
❌ **Kesin öngörü:** "İleride X meslekte başarılı olamazsın", "X olamayacaksın".
❌ **Aile/öğretmen hakkında yorum.**
❌ **Damgalama:** "Sen bu tipsin", "Sen şöyle bir kişiliksin".

═══ KAPANIŞ CÜMLE ═══

Raporun en son cümlesi şu olmalı (ya da çok yakın bir varyant):
"Bu rapor seni anlatmıyor, sadece şu an nerede olduğunu gösteriyor. Her şey gelişebilir."

═══ Uzunluk ═══

400-600 kelime. Çok uzun rapor çocuğu yormaz, kısa ve etkili olsun.

Markdown başlıkları (##) kullan, akıcı sıcak paragraflar yaz.`;
}
