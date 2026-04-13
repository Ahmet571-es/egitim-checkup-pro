/**
 * Entegre 3'lü Rapor Sistemi — Öğretmen, Öğrenci, Ebeveyn.
 * Orijinal Python: teacher_view.py → build_integrated_report_prompt()
 */

export type IntegratedReportType = 'ogretmen' | 'ogrenci' | 'ebeveyn';

interface IntegratedReportParams {
  studentName: string;
  studentAge: number | string;
  studentGender: string;
  testDataList: Array<{ test_name: string; scores: Record<string, unknown>; date?: string }>;
  reportType: IntegratedReportType;
  studentGrade?: number | string | null;
}

// Testlerin doğru sıralaması (Potansiyel Analiz → Mevcut Durum)
const INTEGRATED_TEST_ORDER = [
  'VARK Öğrenme Stilleri',           // 1 — Potansiyel Analiz
  'Öğrenme Stilleri Testi',           // alias
  'Sağ-Sol Beyin',                    // 2
  'Beyin Yatkınlıkları Testi',        // alias
  'Çoklu Zekâ',                       // 3
  'Çoklu Zeka',                       // alias
  'Enneagram',                         // 4
  'Holland',                           // 5
  'Çalışma Davranışı',                // 6 — Mevcut Durum
  'Akademik Analiz',                   // 7
  'Sınav Kaygısı',                    // 8
  'D2 Dikkat',                         // 9
  'P2 Dikkat',                         // alias
];

export function buildIntegratedReportPrompt(params: IntegratedReportParams): string {
  const { studentName, studentAge, studentGender, testDataList, reportType, studentGrade } = params;
  const gradeText = studentGrade ? `, ${studentGrade}. sınıf öğrencisi` : '';

  const audienceConfig = {
    ogretmen: {
      title: 'ÖĞRETMEN / KOÇ',
      perspective: `Raporu okuyan kişi öğretmen veya eğitim koçudur. Tavsiyeleri sınıf içi uygulamalar, ders planlama, bireysel rehberlik ve akademik koçluk perspektifinden yaz.`,
      hitap: 'Öğretmene ve Koça Tavsiyeler',
    },
    ogrenci: {
      title: 'ÖĞRENCİ',
      perspective: `Raporu okuyan kişi öğrencinin kendisidir. Öğrencinin yaşına uygun, samimi ve motive edici bir dil kullan. Tavsiyeleri öğrencinin kendi başına uygulayabileceği somut adımlar olarak yaz. 'Sen' diye hitap et.`,
      hitap: 'Öğrenciye Tavsiyeler',
    },
    ebeveyn: {
      title: 'EBEVEYN',
      perspective: `Raporu okuyan kişi öğrencinin anne/babasıdır. Bilimsel terimleri basit Türkçeyle açıkla. Tavsiyeleri ebeveynin evde uygulayabileceği somut adımlar olarak yaz. Çocuğun adını kullan, 'çocuğunuz' yerine ismini tercih et.`,
      hitap: 'Ebeveynlere Tavsiyeler',
    },
  };

  const aud = audienceConfig[reportType];

  return `Sen deneyimli bir eğitim psikoloğu ve psikometri uzmanısın. ${studentName} (${studentAge} yaşında, ${studentGender}${gradeText}) adlı öğrencinin test sonuçlarını analiz edeceksin.

# RAPOR TÜRÜ: ${aud.title} RAPORU
${aud.perspective}

# KRİTİK RAPORLAMA KURALLARI

## SIRALAMAYA UYMA ZORUNLULUĞU
Testleri aşağıdaki KESIN sıra ile raporla. Öğrenci testleri karışık sırayla çözmüş olsa bile SEN bu sırayı takip et:

**POTANSİYEL ANALİZ (İlk 5 Test):**
1. Öğrenme Stilleri Testi (VARK)
2. Sağ-Sol Beyin Yatkınlıkları Testi
   → 1 ve 2'yi birleştirip KISA bir entegre yorum yaz
3. Çoklu Zekâ Testi
   → 1, 2 ve 3'ü birleştirip KISA bir entegre yorum yaz
4. Enneagram Kişilik Testi
   → 1, 2, 3 ve 4'ü birleştirip KISA bir entegre yorum yaz
5. Holland Mesleki İlgi Envanteri
   → 5 testin tamamını "POTANSİYEL ANALİZ ÖZETİ" başlığı altında birleştir

**MEVCUT DURUM TESPİTİ (Son 4 Test):**
6. Çalışma Davranışı Ölçümü
7. Akademik Analiz
8. Sınav Kaygısı Testi
9. D2/P2 Dikkat Testi
   → 4 testin tamamını "MEVCUT DURUM ÖZETİ" başlığı altında birleştir

**FİNAL: POTANSİYEL + MEVCUT DURUM SENTEZ**
→ Potansiyel analiz ile mevcut durumu ilişkilendirerek kapsamlı bir ÖNERİ bölümü yaz
→ Meslek yönelimi tavsiyeleri ekle

## FORMAT KURALLARI
- Her test için: Veri tablosu özeti → Kısa bilimsel yorum → ${aud.hitap}
- Birleştirme yorumları: Önceki testlerle tutarlılık/çelişki analizi, maksimum 4-5 cümle
- Potansiyel ile mevcut durumu ilişkilendirirken somut örnekler ver
- Tavsiyeler somut, uygulanabilir ve küçük küçük olsun
- Markdown formatında yaz (başlıklar, tablolar, madde işaretleri)
- Rapor bir A4 dosya olarak düşünüldüğünde 12-15 sayfa civarında olsun
- TIBBİ TANI YASAĞI: DEHB, depresyon, anksiyete bozukluğu gibi klinik terimler kullanma

## VAROLAN TEST VERİLERİ
Aşağıdaki listede sadece öğrencinin ÇÖZÜMÜŞ olduğu testler var. Eğer sıralamada belirtilen bir test listede yoksa o testi ATLA ve bir sonrakine geç.

\`\`\`json
${JSON.stringify(testDataList, null, 2)}
\`\`\`

Şimdi ${studentName} için ${aud.title} RAPORUNU yukarıdaki sıralama ve kurallara uygun olarak oluştur.`;
}

// Test adı normalleştirme (DB'deki ad → standart ad)
const TEST_NAME_ALIASES: Record<string, string> = {
  'vark': 'VARK Öğrenme Stilleri',
  'sag-sol-beyin': 'Sağ-Sol Beyin',
  'sag_sol_beyin': 'Sağ-Sol Beyin',
  'coklu-zeka': 'Çoklu Zekâ',
  'coklu_zeka': 'Çoklu Zekâ',
  'enneagram': 'Enneagram Kişilik',
  'holland': 'Holland RIASEC',
  'calisma-davranisi': 'Çalışma Davranışı',
  'calisma_davranisi': 'Çalışma Davranışı',
  'akademik-analiz': 'Akademik Analiz',
  'akademik_analiz': 'Akademik Analiz',
  'sinav-kaygisi': 'Sınav Kaygısı',
  'sinav_kaygisi': 'Sınav Kaygısı',
  'd2-dikkat': 'D2 Dikkat',
  'd2_dikkat': 'D2 Dikkat',
};

export function normalizeTestName(testType: string): string {
  return TEST_NAME_ALIASES[testType.toLowerCase()] ?? testType;
}
