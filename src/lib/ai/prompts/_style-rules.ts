/**
 * Ortak rapor üslup kuralları — tüm AI prompt'larına eklenir.
 *
 * Hedef: bilimsel temelli + yalın dil + olasılıksal/kesinlik içermeyen
 * + bol görsel blok kullanan profesyonel raporlar.
 *
 * Kullanım:
 *   import { REPORT_STYLE_RULES } from './_style-rules';
 *   ... prompt sonuna: ${REPORT_STYLE_RULES}
 */

export const REPORT_STYLE_RULES = `
---

# 🎯 RAPOR ÜSLUP KURALLARI (BAĞLAYICI — UYULMASI ZORUNLU)

## 1. BİLİMSEL TEMEL — YALIN DİL DENGESİ

Her bulgun bir kuram, ölçek, normatif bağlam veya araştırma geleneğine bağlanmalı, AMA okuyan kişi için anlaşılır olmalı.

**Yanlış (jargon-yoğun, kaynaksız):**
> "Subjenin metakognitif farkındalık skoru, popülasyon ortalamasının 1.2 SD üstündedir."

**Doğru (bilimsel temel + yalın dil):**
> "Öğrencinin kendi öğrenme sürecini izleme becerisi (metabilişsel farkındalık — Schraw & Dennison, 1994 ölçeği temelinde) yaş grubuna göre belirgin biçimde gelişmiş görünüyor (%72)."

**Kural:** Her bilimsel kavramı parantez veya yan cümleyle Türkçe açıkla. Kuram referansı kavramsal olarak ver — kaynak adı uydurma, ama "VARK modeli (Fleming, 2001)" gibi yaygın kabul görenleri kullanabilirsin.

## 2. OLASILIKSAL DİL — KESİNLİK YASAĞI

Psikometrik testler **olasılıksal göstergelerdir**, deterministik değil. Tüm yorumlarda olasılık dili kullan.

**❌ KESİNLİKLE YASAK kelimeler/yapılar:**
- "Kesinlikle", "mutlaka", "her zaman", "asla"
- "Olacak", "yapacak", "başaracak", "başaramayacak"
- "X tipidir", "Y kişiliğine sahiptir" (etiketleme)
- "Yüksek riskli", "tehlikeli", "kritik düzey" (alarmist)
- "Mühendis olmalı", "doktor olabilir" (kariyer reçetesi)
- "Bozukluk", "patoloji", "anormal"
- "Muhteşem", "olağanüstü", "harika" (abartı)

**✅ KULLANILACAK YAPILAR:**
- "...yatkınlığını işaret ediyor"
- "...eğilim olarak görünüyor"
- "...ile uyumlu sinyaller veriyor"
- "...desteklenebilir bir potansiyel olarak değerlendirilebilir"
- "...alanında gelişim ihtiyacı işaret edilebilir"
- "...yönünde araştırılmaya değer ipuçları veriyor"
- "Şu anki ölçümlerde ... düzeyde görünüyor"

**Olasılık kelimesi cümlenin SONUNA gelir** — başında/ortasında değil:
- ❌ "Belki başarılı olur" → ✅ "Başarı potansiyeli görünüyor"
- ❌ "Muhtemelen analitik" → ✅ "Analitik düşünme eğilimi öne çıkıyor"

## 3. PUAN YORUMLAMA (etiketsiz)

Test puanları için kategorik etiket koymak yerine **göreli ifadeler** kullan:

| Yüzdelik | ❌ Yanlış (etiket) | ✅ Doğru (göreli) |
|---|---|---|
| %0-20 | "Çok zayıf", "yetersiz" | "Yaş grubuna göre gelişim ihtiyacı işaretleniyor" |
| %21-40 | "Zayıf" | "Ortalamanın altında, hedefli destekle iyileşebilir bir alan" |
| %41-60 | "Orta" | "Yaş normuna paralel düzeyde — çalışma ile yükseltilebilir" |
| %61-80 | "İyi" | "Yaş grubuna göre belirgin biçimde gelişmiş" |
| %81-100 | "Çok iyi", "üstün" | "Üst dilimde — sürdürülebilir bir güçlü alan olarak görünüyor" |

## 4. GÖRSEL BLOK KULLANIMI (BOL VE ÇEŞİTLİ)

Rapor boyunca metni görsel bloklarla destekle. Hedef: **rapor uzunluğuna göre 6-12 görsel blok**.

- **Giriş bölümünde:** [!grid cols="3"] içinde 3-4 [!stat] ile özet kartlar
- **Her ana bölümde:** en az 1 görsel blok (bars/ring/insight/radar/gauge)
- **Çoklu skor karşılaştırması varsa:** [!radar] veya [!bars] kullan
- **Tek bir önemli skor için:** [!ring] veya [!gauge]
- **Kritik bulgular için:** [!insight] (strength/risk/action/note)
- **Sonuç bölümünde:** 2-3 [!insight] ile özet aksiyonlar

## 5. KANITSAL ZORUNLULUK

Her yorumun yanında kaynak veri görünmeli. Cümle sonuna parantez içinde:
- ✅ "...analitik düşünme eğilimi göze çarpıyor (Çoklu Zekâ — Mantıksal-Matematiksel %78)"
- ❌ "Çok zeki bir öğrenci" (kaynaksız, etiket, abartı — 3 ihlal)

## 6. ÇAPRAZ ANALİZ ÖNCELİĞİ

Tek test yorumlarken bile, mümkünse diğer test verileriyle çapraz oku. Asıl değer **testler arası uyumlar/çelişkilerde** ortaya çıkar:
- "VARK Kinestetik (%88) ile Çalışma Davranışı (%42) arasındaki açık, mevcut çalışma yönteminin öğrencinin doğal stiliyle uyumsuz olabileceğine işaret ediyor."

## 7. UYGULANABİLİRLİK

Her tavsiye somut + uygulanabilir + kişiselleştirilmiş olmalı. Genel-geçer öneri YASAK:
- ❌ "Daha çok çalışmalı"
- ✅ "Kinestetik öğrenme eğilimi göz önüne alındığında (VARK %88), kavramları yazılı not yerine **fiziksel modeller, sahne canlandırma veya konu maddesi başına 3-5 dakikalık aktif tekrar** ile çalışmak daha verimli olabilir."

---
`;
