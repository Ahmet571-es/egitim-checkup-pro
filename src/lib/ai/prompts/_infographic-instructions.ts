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

## GÖRSEL İNFOGRAFİK BLOKLARI (ÖNEMLİ)

Rapor, web panelinde **görsel kartlar** ve **grafikler** olarak render edilir; ayrıca PDF/Word export'unda da aynı görsel öğeler üretilir. Raporun uygun yerlerinde aşağıdaki blokları kullan:

### [!stat] — Sayısal özet kartı
Tek bir metrik için (yüzde, puan, seviye). Kısa ve çarpıcı.
\`\`\`
[!stat label="Öğrenme Stili" value="72" unit="%" theme="primary" icon="brain"]
\`\`\`
- \`value\`: sayı (opsiyonel unit)
- \`theme\`: "primary" | "success" (güçlü yön) | "warning" (dikkat) | "danger" (risk) | "info"
- \`icon\`: brain, target, award, eye (görsel), ear (işitsel), hand (kinestetik), book, heart, star, compass, activity, lightbulb, shield, sparkles, trending

### [!ring] — Skor halkası (dairesel ilerleme)
Bir ölçeğin o anki konumunu tek bakışta göstermek için.
\`\`\`
[!ring label="Dikkat Skoru" value="65" max="100" caption="Yaş normuna göre orta-üst"]
\`\`\`

### [!insight] — Vurgulu içgörü kartı
Tek bir bulguyu veya tavsiyeyi öne çıkarmak için. type'a göre renklenir.
\`\`\`
[!insight type="strength" title="Analitik Düşünme"]
Matematiksel akıl yürütme skoru yaş grubunun üst %20'sinde. Bu güçlü yön mühendislik ve araştırma odaklı alanlara yatkınlığı düşündürüyor.
[/!insight]
\`\`\`
- \`type\`: "strength" (güçlü yön) | "risk" (dikkat) | "action" (önerilen aksiyon) | "note" (not)

### [!bars] — Çoklu metrik karşılaştırması
2-6 madde arasında karşılaştırmalı skor.
\`\`\`
[!bars title="VARK Öğrenme Stilleri"]
Görsel: 72
İşitsel: 45
Kinestetik: 88
Okuma-yazma: 62
[/!bars]
\`\`\`

### [!grid] — Stat kartlarını yanyana diz
2-4 stat kartını ızgara biçiminde sunmak için.
\`\`\`
[!grid cols="3"]
[!stat label="Potansiyel" value="Yüksek" theme="success"]
[!stat label="Aksiyon" value="3 madde" theme="primary"]
[!stat label="Takip" value="1 ay" theme="info"]
[/!grid]
\`\`\`

## KULLANIM İLKELERİ
1. **Her rapora toplam 4–8 blok yeterli.** Görsel gürültüyü önle.
2. Raporun **giriş özetinde** bir [!grid] veya 2-3 [!stat]; **her büyük bölümde** en fazla 1-2 blok.
3. [!bars] özellikle **çoklu skor karşılaştırmalarında** çok etkili (VARK, çoklu zekâ, RIASEC).
4. [!ring] tek bir ölçeğin **genel seviyesini** göstermek için ideal (dikkat skoru, sınav kaygısı vb.).
5. [!insight] **kritik bulgular ve öneriler** için — rapor sonuç bölümünde 2-3 tanesi uygun.
6. Blokların içeriği raporun metniyle **tekrar olmamalı** — bloklar özet, metin derinlik sağlar.
7. **Değerleri veriden üret** — uydurma yok. Ölçek maksimumları testin kendi maksimumu.
8. Blokları düz paragraflarla **ikame etme**; görsel özet olarak metne **ekle**.
9. Yumuşak tavsiye dili korunmalı: [!insight action] içinde "deneyebilirsin", "faydalı olabilir" — imperative değil.

Bu bloklar raporu zayıflatmaz; **bilimsel derinliği ve metnin akıcılığını korurken** hızlı tarama için görsel çapalar sağlar.
`;
