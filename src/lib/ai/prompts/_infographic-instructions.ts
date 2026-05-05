/**
 * FAZ 2C — Infografik Blok Talimatları (ortak prompt fragmanı)
 *
 * Bu fragman, AI raporlarında görsel infografik blokları üretmesi için
 * sisteme verilen talimatları içerir. Web/PDF/DOCX render yolları bu blokları
 * parse edip tutarlı görsel öğelere çevirir.
 *
 * single-test, holistic, parent-report, integrated-report prompt'larının
 * sonuna eklenir.
 */

export const INFOGRAPHIC_INSTRUCTIONS = `
---

## GÖRSEL İNFOGRAFİK BLOKLARI (ÖNEMLİ — RAPORUN BEL KEMİĞİ)

Rapor, web panelinde **görsel kartlar** ve **grafikler** olarak render edilir; ayrıca PDF/Word export'unda da aynı görsel öğeler üretilir. **Hedef: rapora 8-14 görsel blok**. Görseller metnin içine serpiştirilmeli, sonuna yığılmamalı.

### [!stat] — Sayısal özet kartı (single-line)
Tek bir metrik için (yüzde, puan, seviye). Kısa ve çarpıcı.
\`\`\`
[!stat label="Öğrenme Stili" value="72" unit="%" theme="primary" icon="brain"]
\`\`\`
- \`value\`: sayı (opsiyonel unit)
- \`theme\`: "primary" | "success" (güçlü yön) | "warning" (dikkat) | "danger" (risk) | "info"
- \`icon\`: brain, target, award, eye, ear, hand, book, heart, star, compass, activity, lightbulb, shield, sparkles, trending

### [!ring] — Skor halkası (single-line)
Bir ölçeğin o anki konumunu tek bakışta göstermek için.
\`\`\`
[!ring label="Dikkat Skoru" value="65" max="100" caption="Yaş normuna göre orta-üst"]
\`\`\`

### [!gauge] — Akrep göstergesi / yarım daire (single-line) — YENİ
Tek bir skor için **renkli kuşaklı** dial. Sınav kaygısı, dikkat, kaygı düzeyleri vb. için ideal — değerin **hangi bölgede** olduğunu gösterir.
\`\`\`
[!gauge label="Sınav Kaygısı" value="42" max="100" zones="düşük:0-40,orta:40-70,yüksek:70-100" caption="Orta düzey sınav kaygısı"]
\`\`\`
- \`zones\`: "etiket:başlangıç-bitiş,etiket:başlangıç-bitiş,..." formatında 2-4 dilim
- Verilmezse 3 eşit dilim (Düşük/Orta/Yüksek) otomatik üretilir

### [!insight] — Vurgulu içgörü kartı (multi-line)
Tek bir bulguyu veya tavsiyeyi öne çıkarmak için.
\`\`\`
[!insight type="strength" title="Analitik Düşünme"]
Matematiksel akıl yürütme skoru yaş grubunun üst %20'sinde (Çoklu Zekâ — Mantıksal-Matematiksel %78). Bu güçlü yön mühendislik ve araştırma odaklı alanlara yatkınlığı işaret edebilir.
[/!insight]
\`\`\`
- \`type\`: "strength" (güçlü yön) | "risk" (dikkat) | "action" (önerilen aksiyon) | "note" (not)

### [!bars] — Yatay çubuk grafik (multi-line)
2-6 madde arasında karşılaştırmalı skor.
\`\`\`
[!bars title="Çoklu Zekâ Profili"]
Mantıksal-Matematiksel: 78
Sözel-Dilsel: 65
Görsel-Uzamsal: 82
Müziksel-Ritmik: 45
Bedensel-Kinestetik: 70
[/!bars]
\`\`\`

### [!radar] — Radar / örümcek grafik (multi-line) — YENİ
3-8 boyutlu profil görselleştirmesi. **Çok güçlü** bir araç: VARK, Çoklu Zekâ, Holland RIASEC, kişilik profilleri için **bars'tan daha iyi**.
\`\`\`
[!radar title="VARK Öğrenme Stili Profili"]
Görsel: 72
İşitsel: 45
Kinestetik: 88
Okuma-Yazma: 62
[/!radar]
\`\`\`
**Not:** Radar 3'ten az noktada otomatik bars'a düşer. 4-6 nokta optimum.

### [!grid] — Stat kartlarını yanyana diz (multi-line)
2-4 stat kartını ızgara biçiminde. Genellikle giriş özetinde.
\`\`\`
[!grid cols="3"]
[!stat label="Potansiyel" value="Yüksek" theme="success"]
[!stat label="Aksiyon" value="3 madde" theme="primary"]
[!stat label="Takip" value="1 ay" theme="info"]
[/!grid]
\`\`\`

## KULLANIM İLKELERİ

1. **Hedef: rapor başına 8-14 blok** — daha az ise rapor görsel açıdan zayıf görünür.
2. **Giriş özetinde** mutlaka [!grid cols="3"] içinde 3-4 stat veya 2-3 [!stat] art arda.
3. **Her ana bölümde** en az 1 görsel blok bulunmalı.
4. **Çoklu skor karşılaştırmasında** önce [!radar] (4+ boyut), sonra [!bars] tercih et.
5. **Tek skor + bağlam (norm/seviye) için** [!gauge] kullan — kaygı/dikkat/risk skorlarında çok güçlü.
6. **Tek skor + basit yüzde için** [!ring].
7. **Kritik bulgular ve aksiyonlar için** [!insight] (strength/risk/action/note).
8. **Sonuç bölümünde** 2-3 [!insight] ile özet aksiyonlar.
9. Blokların içeriği raporun metniyle **tekrar olmamalı** — bloklar özet, metin derinlik sağlar.
10. **Değerleri veriden üret** — uydurma yok. Ölçek maksimumları testin kendi maksimumu.
11. Yumuşak tavsiye dili korunmalı: [!insight] içinde "deneyebilirsin", "faydalı olabilir" — imperative değil.

Bu bloklar raporu zayıflatmaz; **bilimsel derinliği ve metnin akıcılığını korurken** hızlı tarama için görsel çapalar sağlar.
`;
