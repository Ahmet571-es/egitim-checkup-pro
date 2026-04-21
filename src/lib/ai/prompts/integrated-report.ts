/**
 * Entegre 3'lü Rapor Sistemi — Öğretmen, Öğrenci, Ebeveyn.
 * Orijinal Python: teacher_view.py → build_integrated_report_prompt()
 */

import { INFOGRAPHIC_INSTRUCTIONS } from './_infographic-instructions';

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
  'Burdon Dikkat',                     // 10 — Yeni
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
- TIBBİ TANI YASAĞI: DEHB, depresyon, anksiyete bozukluğu gibi klinik terimler kullanma

## UZUNLUK DİSİPLİNİ (KRİTİK — BU KURALLARA KESİN UYUN)
- **Toplam rapor:** 2000-3000 kelime (katı sınır, aşma)
- **Her test bölümü:** 200-350 kelime
- **Birleştirme yorumları:** 80-150 kelime
- **POTANSİYEL ÖZETİ:** 200-300 kelime
- **MEVCUT DURUM ÖZETİ:** 200-300 kelime
- **FİNAL SENTEZ:** 300-500 kelime
- Her cümle bilgi vermeli — dolgu yok, tekrar yok
- Aynı bilgiyi farklı yerlerde tekrarlama, çapraz referans ver
- Raporu MUTLAKA "SONUÇ VE KAPANIŞ" bölümüyle tamamla — yarıda bırakma

## CÜMLE UZUNLUĞU ve DESEN (KRİTİK)
- Her paragraf **maksimum 3-4 cümle**
- Her cümle **maksimum 15-18 kelime**
- Uzun sarmal cümleler YASAK — fikri bölüp kısa vuruşlu ifade et
- **Açılış deseni**: Somut sayısal bulgu (bold puan) ile başla
- Sonra kısa yorum (1-2 cümle), sonra tek cümlelik tavsiye

## OLASILIKSAL DİL (KRİTİK — KESİN TANI YASAĞI)
Kesin tanı, tahmin veya yargı ifadelerinden mutlak kaçın:
- ❌ "Başarılı OLACAK" → ✅ "Başarı gösterebilir"
- ❌ "Kesin mühendis olmalı" → ✅ "Mühendislik alanı araştırılmaya değer"
- ❌ "Risk YÜKSEK" → ✅ "Dikkat alanı olabilir"
- ❌ "YAPAMAZ" → ✅ "Şu an için gelişim alanı"
- ❌ "Muhteşem/olağanüstü" → ✅ "Anlamlı/dikkat çekici"

Olasılık kelimesinin yeri: **Cümlenin sonunda** — "olabilir / işaret edebilir / düşündürüyor / görünüyor". Cümle ortasında değil.

**Amaç**: Okuyucuyu (${aud.title.toLowerCase()}) **düşündürmeye yönelt, karar verdirme**. Rapor bir karar mekanizması değil, düşünme aracıdır.

## VAROLAN TEST VERİLERİ
Aşağıdaki listede sadece öğrencinin ÇÖZÜMÜŞ olduğu testler var. Eğer sıralamada belirtilen bir test listede yoksa o testi ATLA ve bir sonrakine geç.

\`\`\`json
${JSON.stringify(testDataList, null, 2)}
\`\`\`

## ÇAPRAZ KORELASYON VERİLERİ (FAZ 2)
Eğer birden fazla test çözülmüşse, testler arası şu bağlantıları kontrol et ve raporuna dahil et:
- Sınav Kaygısı ↑ + Dikkat ↓ → kaygı-dikkat bağlantısı (kaygı dikkat süresini kısaltıyor olabilir)
- VARK Kinestetik + Çalışma Davranışı ↓ → öğrenme stili uyumsuzluğu
- Akademik ↓ + Çalışma ↓ → temel akademik risk alanı
- Çoklu Zekâ ↑ + Akademik ↓ → potansiyel-performans açığı
- Holland + Çoklu Zekâ → kariyer yönlendirmesi sentezi
Bu korelasyonları FİNAL SENTEZ bölümünde vurgula.

Şimdi ${studentName} için ${aud.title} RAPORUNU yukarıdaki sıralama ve kurallara uygun olarak oluştur.
${INFOGRAPHIC_INSTRUCTIONS}`;
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
