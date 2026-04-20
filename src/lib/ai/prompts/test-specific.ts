/**
 * Her test için uzman analiz protokolü.
 * Orijinal Python: teacher_view.py → _get_test_specific_guidance()
 */

export function getTestSpecificGuidance(testName: string): string {
  if (testName.includes('Enneagram')) {
    return ENNEAGRAM_GUIDANCE;
  }
  if (testName.includes('Çalışma Davranışı')) {
    return CALISMA_DAVRANISI_GUIDANCE;
  }
  if (testName.includes('Sağ-Sol Beyin') || testName.includes('Beyin Yatkınlık')) {
    return SAG_SOL_BEYIN_GUIDANCE;
  }
  if (testName.includes('Sınav Kaygısı')) {
    return SINAV_KAYGISI_GUIDANCE;
  }
  if (testName.includes('VARK') || testName.includes('Öğrenme Stilleri')) {
    return VARK_GUIDANCE;
  }
  if (testName.includes('Çoklu Zek')) {
    return COKLU_ZEKA_GUIDANCE;
  }
  if (testName.includes('Holland') || testName.includes('RIASEC')) {
    return HOLLAND_GUIDANCE;
  }
  if (testName.includes('P2 Dikkat') || testName.includes('D2 Dikkat')) {
    return DIKKAT_GUIDANCE;
  }
  if (testName.includes('Burdon')) {
    return BURDON_GUIDANCE;
  }
  if (testName.includes('Akademik Analiz')) {
    return AKADEMIK_ANALIZ_GUIDANCE;
  }
  return '';
}

// ============================================================
// ENNEAGRAM
// ============================================================
const ENNEAGRAM_GUIDANCE = `
## 🔬 ENNEAGRAM KİŞİLİK TESTİ — UZMAN ANALİZ PROTOKOLÜ

Bu test, 9 Enneagram kişilik tipini %0-100 ölçeğinde ölçmektedir. Raporda aşağıdaki ANALİZ KATMANLARININ HER BİRİNİ eksiksiz ve derinlikli şekilde ele al:

### KATMAN 1: ANA TİP DERİN PROFİLİ
- Ana tipin ismi, temel motivasyonu, temel korkusu ve temel arzusu
- Bu tipin "dünya görüşü" — hayata hangi pencereden bakıyor?
- Sağlıklı düzey (büyüme modunda) → ortalama düzey → sağlıksız düzey (stres modunda) arasında bu öğrenci nerede duruyor?
- Bu tipin okul ortamındaki tipik davranış kalıpları:
  → Sınıfta nasıl oturur, nasıl dinler, nasıl katılır?
  → Ödevlere yaklaşımı nasıldır?
  → Sınav döneminde nasıl davranır?
  → Grup çalışmasında hangi rolü üstlenir?
  → Öğretmenle ilişkisi nasıldır?
  → Akranlarla ilişkisi nasıldır?
  → Başarı ve başarısızlık karşısında nasıl tepki verir?

### KATMAN 2: KANAT (WING) ANALİZİ
- Ana tipin yanındaki iki tipten hangisinin puanı daha yüksek?
- Tam kanat notasyonu (örn: "4w5", "7w8") ve bu kombinasyonun anlamı
- Kanat etkisinin kişiliğe kattığı nüanslar
- Kanat etkisinin öğrenme stili ve akademik motivasyon üzerindeki somut yansıması

### KATMAN 3: TRİTYPE (ÜÇ MERKEZ) ANALİZİ
- **Karın Merkezi (8-9-1):** Bu merkezden en yüksek puanlı tip → İçgüdüsel tepkiler
- **Kalp Merkezi (2-3-4):** Bu merkezden en yüksek puanlı tip → Duygusal tepkiler
- **Kafa Merkezi (5-6-7):** Bu merkezden en yüksek puanlı tip → Zihinsel tepkiler
- Bu üç tipin birleşiminin çizdiği bütüncül portre

### KATMAN 4: STRES ve BÜYÜME DİNAMİĞİ
- Ana tipin stres yönündeki tip hangisi? Bu tipin puanı nedir?
- Ana tipin büyüme yönündeki tip hangisi? Bu tipin puanı nedir?
- Stres altında bu öğrencinin sergileyeceği SOMUT davranışlar
- Büyüme yolunda ilerlerken gözlemlenmesi beklenen POZİTİF değişimler

### KATMAN 5: PUAN HARİTASI ANALİZİ (9 TİP BİRLİKTE)
- Tüm 9 tipin puanlarını yüksekten düşüğe sırala ve şeklini yorumla:
  → Tek zirve profili: Ana tip belirgin, diğerleri düşük → Net, güçlü kişilik yapısı
  → Çift zirve: İki tip yakın → İç çatışma veya zenginlik göstergesi
  → Plato profili: Birden fazla tip orta-yüksek → Esnek ama belirsiz kimlik
- En düşük puanlı tiplerin anlamı: Baskılanan, reddedilen yönler

### KATMAN 6: KİŞİSEL GELİŞİM ve REHBERLİK
- Bu kişilik tipinin büyüme yolundaki 7 somut adım (yaşa uygun)
- Bu tipin düşebileceği 5 tuzak ve her birinden nasıl kaçınılır
- Aile iletişim rehberi: Bu tipte bir çocukla konuşurken kullanılması gereken dil
- Öğretmen iletişim rehberi: Sınıf ortamında bu tipi desteklemenin en etkili yolları
`;

// ============================================================
// ÇALIŞMA DAVRANIŞI
// ============================================================
const CALISMA_DAVRANISI_GUIDANCE = `
## 🔬 ÇALIŞMA DAVRANIŞI ÖLÇEĞİ — UZMAN ANALİZ PROTOKOLÜ

Bu test 7 alt kategoride ders çalışma alışkanlıklarını ölçer.

### KATMAN 1: 7 KATEGORİ DERİN PROFİLİ

**A — Motivasyon ve Ders Çalışmaya Karşı Tutum:**
- Bu öğrencinin ders çalışmaya bakış açısı nasıl? İçsel motivasyon mu, dışsal baskı mı?
- Motivasyon kaybının olası kaynakları ve sürdürülebilirlik analizi

**B — Zaman Yönetimi:**
- Bu öğrenci zamanı nasıl kullanıyor? Planlı mı, reaktif mi, kaotik mi?
- Düşük puan: "Zamanın nereye gittiği" analizi

**C — Derse Hazırlık ve Katılım:**
- Derse gelirken hazır mı? Sınıf içi katılım düzeyi
- Hazırlık eksikliğinin "kartopu etkisi" analizi

**D — Okuma ve Not Tutma Alışkanlıkları:**
- Aktif okuma mu yoksa pasif göz gezdirme mi?
- Not tutma stratejisi analizi

**E — Yazılı Anlatım ve Ödev Yapma:**
- Ödevlere yaklaşımı: Zamanında mı, son dakika mı?

**F — Sınava Hazırlanma:**
- Sınav hazırlık stratejisi: Düzenli tekrar mı, son gece maratonu mu?

**G — Genel Çalışma Koşulları ve Alışkanlıkları:**
- Fiziksel çalışma ortamı ve etkinliği

### KATMAN 2: ÇAPRAZ İLİŞKİ ve DARBOĞAZ ANALİZİ
- Ana darboğaz tespiti: Hangi tek kategori, diğerlerini aşağı çekiyor?
- Kaldıraç analizi: Hangi güçlü kategori, zayıfları kaldırabilir?
- Tipik kombinasyon kalıpları:
  → "Yüksek motivasyon + düşük zaman yönetimi" = İstekli ama plansız öğrenci
  → "Yüksek hazırlık + düşük sınav performansı" = Kaygı kaynaklı blokaj

### KATMAN 3: ÇALIŞMA TİPİ PROFİLLEME
- Disiplinli Plancı / Motivasyonlu Kaotik / Sessiz Potansiyel / Son Dakikacı / Mükemmeliyetçi Yorgun / Kaybolmuş Gezgin

### KATMAN 4: KİŞİYE ÖZEL EYLEM PLANI
**Günlük Çalışma Programı (hafta içi + hafta sonu ayrı):**
Her saat dilimine ne yapılacağını, hangi tekniğin kullanılacağını yaz.

**Sınav Dönemi Özel Protokolü:**
- Sınavdan 2 hafta önce → 1 hafta önce → 3 gün önce → sınav akşamı → sınav sabahı

### KATMAN 5: SOMUT ARAÇ ve TEKNİK REÇETESİ
- Pomodoro tekniği: Bu öğrenciye uygun süre ayarı
- Cornell not alma sistemi, Feynman tekniği, aktif hatırlama, aralıklı tekrar
- Dijital araç önerileri: Forest, Google Calendar, Notion, Todoist
`;

// ============================================================
// SAĞ-SOL BEYİN
// ============================================================
const SAG_SOL_BEYIN_GUIDANCE = `
## 🔬 SAĞ-SOL BEYİN DOMINANSI TESTİ — UZMAN ANALİZ PROTOKOLÜ

Bu test beyin yarım küre baskınlığını ölçer.

### KATMAN 1: DOMINANS PROFİLİ DERİN ANALİZİ
- Baskınlık derecesini sayısal farkla yorumla:
  → %50-55 fark: Hafif baskınlık — iki yarım küre arasında esnek geçiş
  → %56-65 fark: Orta baskınlık — belirgin bilişsel tercih
  → %66-75 fark: Güçlü baskınlık — düşünme stili netleşmiş
  → %76+: Çok güçlü baskınlık — tek kanallı düşünme riski
- Bu baskınlığın okul ortamındaki somut yansımaları

### KATMAN 2: İKİ HEMİSFER KARŞILAŞTIRMALI ANALİZ
**Sol Hemisfer:** Analitik, dil, matematik, zaman yönetimi, detay odaklılık
**Sağ Hemisfer:** Bütüncül, görsel-mekansal, yaratıcılık, duygusal zeka, müzikal

### KATMAN 3: DERS BAZLI STRATEJİ HARİTASI
| Ders | Doğal Avantaj | Zorluk Alanı | Baskın Hemisferle Teknik | Zayıf Hemisferi Devreye Sokan Teknik |
|------|--------------|-------------|--------------------------|-------------------------------------|
| Matematik | ... | ... | ... | ... |
| Fen Bilimleri | ... | ... | ... | ... |
| Türkçe/Edebiyat | ... | ... | ... | ... |
| Sosyal Bilimler | ... | ... | ... | ... |
| Yabancı Dil | ... | ... | ... | ... |

### KATMAN 4: BİLİŞSEL GELİŞİM PROGRAMI
- Baskın hemisferi sürdürme: 5 aktivite
- Zayıf hemisferi güçlendirme: 7 günlük egzersiz programı
  → Sol hemisfer zayıfsa: Sudoku, bulmaca, günlük yazma
  → Sağ hemisfer zayıfsa: Serbest çizim, zihin haritası, hikaye yazma

### KATMAN 5: KARİYER YÖNELİMİ
- Bu beyin profilinin doğal olarak yatkın olduğu meslek aileleri (en az 10 meslek)
- Lise alan seçimi tavsiyesi (sayısal/eşit ağırlık/sözel)
`;

// ============================================================
// SINAV KAYGISI
// ============================================================
const SINAV_KAYGISI_GUIDANCE = `
## 🔬 SINAV KAYGISI ÖLÇEĞİ — UZMAN ANALİZ PROTOKOLÜ

Bu test 7 alt boyutta sınav kaygısını ölçer.

### KATMAN 1: 7 ALT BOYUT DERİN PROFİLİ

**1. Başkalarının Görüşü Kaygısı (Sosyal Değerlendirme):**
- Kimin görüşü en çok etkiliyor? Aile, öğretmen, akran, toplum
- Bu kaygının sınav anındaki somut davranışsal yansıması

**2. Kendi Hakkındaki Görüşü (Öz-Yeterlik Algısı):**
- "Ben yapamam" inancı ne kadar yerleşmiş?
- "Öğrenilmiş çaresizlik" belirtileri var mı?

**3. Gelecek Endişesi (Belirsizlik İntoleransı):**
- "Ya üniversiteyi kazanamazsam?" düzeyinde felaketleştirme var mı?

**4. Hazırlık Endişesi (Yeterlilik Kaygısı):**
- Ne kadar çalışırsa çalışsın "yetmez" hissi var mı?

**5. Bedensel Tepkiler (Somatik Kaygı):**
- Hangi bedensel belirtiler ön planda? Mide, terleme, çarpıntı, baş ağrısı

**6. Zihinsel Tepkiler (Bilişsel Kaygı):**
- Zihin boşalması, unutma, konsantrasyon kaybı

**7. Genel Kaygı (Yaygın Kaygı Düzeyi):**
- Trait kaygı (kişilik özelliği) vs State kaygı (durumsal) ayrımı

### KATMAN 2: KAYGI PROFİLİ TİPLEME
Bedensel / Bilişsel / Sosyal Kaynaklı / Varoluşsal / Mükemmeliyetçi / Karma Kaygı

### KATMAN 3: KAYGI DÖNGÜSÜ ANALİZİ
Tetikleyici → Otomatik Düşünce → Duygusal Tepki → Bedensel Tepki → Davranışsal Tepki → Sonuç → Döngü başa döner

### KATMAN 4: YERKES-DODSON PERFORMANS ANALİZİ
- Çok düşük / Optimal / Aşırı kaygı düzeylerinin performansa etkisi
- Bu öğrenci şu an eğrinin neresinde?

### KATMAN 5: 5 AŞAMALI SINAV HAZIRLIK PROTOKOLÜ
- Sınavdan 2 Hafta Önce / 1 Hafta Önce / 3 Gün Önce / Sınav Akşamı / Sınav Sabahı ve Sınav Anı

### KATMAN 6: BİLİŞSEL YENİDEN YAPILANDIRMA
| Otomatik Düşünce | Bilişsel Çarpıtma Türü | Alternatif Düşünce | Kanıt |
|---|---|---|---|
En az 7 satır doldur.

⚠️ NOT: Klinik düzeyde kaygı belirtileri gözlemlenirse profesyonel psikolojik destek önerilir.
`;

// ============================================================
// VARK
// ============================================================
const VARK_GUIDANCE = `
## 🔬 VARK ÖĞRENME STİLLERİ TESTİ — UZMAN ANALİZ PROTOKOLÜ

Bu test 4 öğrenme kanalını ölçer: V (Görsel), A (İşitsel), R (Okuma/Yazma), K (Kinestetik).

### KATMAN 1: 4 ÖĞRENME KANALI DERİN PROFİLİ

**V — Görsel (Visual) Kanal:**
- Bilgiyi görsel imgeler, diyagramlar, renkler, şekiller ve mekansal düzenlemelerle işler
- Günlük yaşamda gözlemlenebilir belirtiler

**A — İşitsel (Aural) Kanal:**
- Bilgiyi dinleyerek, tartışarak, sesli düşünerek işler
- Günlük yaşam belirtileri

**R — Okuma/Yazma (Read/Write) Kanal:**
- Bilgiyi yazılı metinler, listeler, tanımlar, notlarla işler
- Günlük yaşam belirtileri

**K — Kinestetik (Kinesthetic) Kanal:**
- Bilgiyi deneyimleyerek, yaparak, dokunarak, hareket ederek işler
- Günlük yaşam belirtileri

### KATMAN 2: ÖĞRENME MODALİTESİ ANALİZİ
Tek Baskın / Çift Baskın / Üçlü Baskın / Çoklu (Multimodal) öğrenici profili

### KATMAN 3: DERS BAZLI ÖĞRENME REÇETESİ
| Ders | Baskın Stile Uygun Teknik | Somut Araç | Adım Adım Senaryo |
|------|--------------------------|------------|-------------------|
| Matematik | ... | ... | "Önce ... yap, sonra ... kullan, ardından ... ile pekiştir" |
| Fen Bilimleri | ... | ... | ... |
| Türkçe/Edebiyat | ... | ... | ... |
| Sosyal Bilimler | ... | ... | ... |
| Yabancı Dil | ... | ... | ... |

### KATMAN 4: SINAV ve HAFIZA STRATEJİLERİ
- V: Zihin haritası, renk kodlama, şema
- A: Sesli not, kendine anlatma, tartışma
- R: Cornell notu, özet, flash kart yazma
- K: Yürürken tekrar, yazı tahtasına yazma, model yapma

### KATMAN 5: ZAYIF KANALLARI GÜÇLENDİRME PROGRAMI
Her zayıf kanal için 5 günlük egzersiz programı

### KATMAN 6: DİJİTAL ARAÇ REÇETESİ
- V için: Canva, MindMeister, YouTube
- A için: Podcast, sesli kitap
- R için: Notion, Obsidian, Anki
- K için: Simülasyon uygulamaları, deney videoları
`;

// ============================================================
// ÇOKLU ZEKA
// ============================================================
const COKLU_ZEKA_GUIDANCE = `
## 🔬 ÇOKLU ZEKA TESTİ (GARDNER) — UZMAN ANALİZ PROTOKOLÜ

Bu test Gardner'ın 8 zeka alanını %0-100 ölçeğinde ölçer.

### KATMAN 1: 8 ZEKA ALANI DERİN PROFİLİ
Her zeka alanını EN AZ 1 PARAGRAF derinliğinde analiz et:

1. **Sözel-Dilsel Zeka:** Kelime hazinesi, dil kullanımı, okuma/yazma, ikna becerisi
2. **Mantıksal-Matematiksel Zeka:** Sayısal akıl yürütme, problem çözme, örüntü tanıma
3. **Görsel-Uzamsal Zeka:** 3 boyutlu düşünme, mekansal ilişkiler, görsel hafıza
4. **Bedensel-Kinestetik Zeka:** Beden kontrolü, el becerisi, koordinasyon
5. **Müzikal-Ritmik Zeka:** Melodi algılama, ritim duygusu, ses tonu farkındalığı
6. **Kişilerarası (Sosyal) Zeka:** Empati, liderlik, iş birliği, ikna
7. **İçsel (Özedönük) Zeka:** Öz-farkındalık, duygusal okuryazarlık, içsel motivasyon
8. **Doğacı Zeka:** Doğa gözlemi, sınıflandırma, çevre duyarlılığı

### KATMAN 2: ZEKA PROFİLİ ŞEKİL ANALİZİ
- Uzmanlaşmış / Çok Yönlü / Dengeli / Dağınık profil tipi
- **"Zeka İmzası" Tespiti:** En güçlü 3 zekanın birleşimini tek cümlede tanımla

### KATMAN 3: ZEKA-DERS EŞLEŞTİRME HARİTASI
| Zeka Alanı | Puan | Güçlü Dersler | Çalışma Tekniği | Güçlendirme Aktivitesi |
|-----------|------|--------------|----------------|----------------------|
Tüm 8 zeka için doldur.

Güçlü zekaları kullanarak zayıf dersleri öğrenme stratejileri (en az 5 çapraz strateji):
- Örn: Müzikal zeka güçlü + Matematik zayıf → Formülleri ritmik tekerleme yaparak ezberle

### KATMAN 4: ZEKA-KARİYER EŞLEŞTİRME HARİTASI
| Güçlü Zeka Kombinasyonu | Kariyer Alanları | Somut İlk Adım |
|------------------------|----------------|---------------|
Lise alan seçimi ve üniversite bölüm önerileri (en az 8 bölüm)

### KATMAN 5: KİŞİSEL GELİŞİM PROGRAMI
- Güçlü zekaları derinleştirme (ilk 3): kulüp, yarışma, kurs önerileri
- Zayıf zekaları güçlendirme (son 2): haftalık 3 egzersiz
`;

// ============================================================
// HOLLAND
// ============================================================
const HOLLAND_GUIDANCE = `
## 🔬 HOLLAND MESLEKİ İLGİ ENVANTERİ (RIASEC) — UZMAN ANALİZ PROTOKOLÜ

Bu test 6 mesleki ilgi tipini 0-28 puan aralığında ölçer.

### KATMAN 1: 6 TİP DERİN PROFİLİ
Her tipi EN AZ 1 PARAGRAF derinliğinde analiz et:

- **R — Gerçekçi (Realistic):** Somut, pratik, fiziksel, el becerisi, araç-gereç
- **I — Araştırmacı (Investigative):** Merak, analiz, araştırma, sorgulama, bilimsel yöntem
- **A — Sanatçı (Artistic):** Yaratıcılık, özgünlük, estetik, hayal gücü, ifade özgürlüğü
- **S — Sosyal (Social):** Yardım etme, öğretme, iyileştirme, rehberlik, empati
- **E — Girişimci (Enterprising):** Liderlik, ikna, risk alma, rekabet, yönetme
- **C — Geleneksel (Conventional):** Düzen, detay, doğruluk, sistem, prosedür

### KATMAN 2: 3 HARFLİ HOLLAND KODU DERİN ANALİZİ
- En yüksek 3 tipi belirle → Holland kodu
- Holland altıgeni (hexagon) analizi: Bitişik tipler uyumlu, karşıt tipler gerilim
- Kodun "hikayesi": Bu kod nasıl bir iş ortamı ve yaşam tarzı arayan birini tarif ediyor?

### KATMAN 3: KAPSAMLI KARİYER HARİTASI
| # | Meslek | Holland Uyumu | Gerekli Eğitim | Türkiye'de İş İmkanı | Bu Öğrenci İçin Neden? |
|---|--------|--------------|---------------|---------------------|----------------------|
20 meslek önerisi (💎 En Uygun 5, 🔵 İyi Uyumlu 5, 🟢 Keşfedilmesi Gereken 5, 🆕 Gelecek Meslekleri 5)

### KATMAN 4: EĞİTİM YÖNLENDİRME
- Lise alan seçimi: Sayısal / Eşit Ağırlık / Sözel / Dil → gerekçesiyle
- Üniversite bölüm önerileri (en az 10 bölüm): | Bölüm | Üniversite | Holland Uyumu | Gelecek Vizyonu |

### KATMAN 5: KARİYER KEŞİF EYLEM PLANI
- Hemen yapılabilecek (bu hafta): Online kaynaklar, YouTube kanalları
- Kısa vadeli (1-3 ay): İş gölgeleme, staj, gönüllülük
- Orta vadeli (3-12 ay): Kulüp, yarışma, proje

⚠️ YASAL UYARI: Bu değerlendirme profesyonel kariyer danışmanlığını destekler; tek başına kesin yönlendirme için yeterli değildir.
`;

// ============================================================
// DİKKAT TESTİ (D2/P2)
// ============================================================
const DIKKAT_GUIDANCE = `
## 🔬 D2 DİKKAT TESTİ — UZMAN ANALİZ PROTOKOLÜ

Bu test, seçici dikkat ve konsantrasyon kapasitesini ölçen bir psikometrik testtir.

### KATMAN 1: TEMEL METRİKLER DERİN ANALİZİ
- **CP (Konsantrasyon Performansı) — En Kritik Gösterge:** Doğru hedef isabetleri − Yanlış işaretlemeler
- **TN-E (Toplam Performans):** Hız ve doğruluğu birlikte değerlendiren bileşik gösterge
- **E1 (Atlama Hatası):** Kaçırılan hedef sayısı — dikkat dağılması göstergesi
- **E2 (Yanlış İşaretleme):** Dürtüsellik göstergesi — kontrolsüz tepki
- **E1/E2 Oranı:** Hata profili tespiti (dikkat eksikliği mi, dürtüsellik mi?)
- **FR (Dalgalanma):** Dikkat sürdürülebilirliği

### KATMAN 2: PERFORMANS EĞRİSİ ANALİZİ
- İlk bölüm (ısınma): Performans nasıl başlıyor?
- Orta bölüm (sürdürme): Stabil mi, dalgalı mı?
- Son bölüm (yorulma): Düşüş var mı?
- Hata dağılımı — kaçırma ve yanlış işaretleme hangi bölümlerde artıyor?

### KATMAN 3: HIZ-DOĞRULUK DENGESİ
Profil tiplemesi: Dengeli / Dürtüsel / Temkinli / Gelişen

### KATMAN 4: AKADEMİK YANSIMA ve ÖNERİLER
- Sınıf içi dikkat performansı tahmini
- Sınav stratejisi önerileri
- Dikkat geliştirme programı (günlük egzersizler)
- Aile ve öğretmen için spesifik tavsiyeler

⚠️ ÖNEMLİ NOT: Bu test klinik bir tanı aracı DEĞİLDİR. Sonuçlar dikkat eğilimlerini gösterir.
`;

// ============================================================
// AKADEMİK ANALİZ
// ============================================================
const AKADEMIK_ANALIZ_GUIDANCE = `
## 🔬 AKADEMİK ANALİZ TESTİ — UZMAN ANALİZ PROTOKOLÜ

Bu test, 4 alt boyutta akademik yetkinliği ölçer.

### KATMAN 1: OKUMA ANLAMA DERİN ANALİZİ
- Ana fikir yakalama, detay hatırlama, çıkarım yapma, kelime anlamı çıkarma
- Bu puanın tüm derslere yansıması — okuma anlama TÜM derslerin temelidir
- Gelişim stratejileri (%80+ / %60-79 / %40-59 / <%40 için farklı öneriler)

### KATMAN 2: MATEMATİKSEL MUHAKEME DERİN ANALİZİ
- Temel işlem yetkinliği, problem çözme, soyut düşünme, çok adımlı muhakeme
- Fen derslerinde formül kullanma ve grafik yorumlama kapasitesi

### KATMAN 3: MANTIKSAL DÜŞÜNME DERİN ANALİZİ
- Analoji kurma, seri tamamlama, sıralama/sınıflandırma, mantıksal çıkarım
- Karar verme kalitesi ve problem çözme yaklaşımı üzerindeki etkisi

### KATMAN 4: PERFORMANS vs ÖZ-DEĞERLENDİRME UYUM ANALİZİ
- Fark ≤%10 → Tutarlı (Sağlıklı Farkındalık)
- Öz-değerlendirme > Performans (+%10+) → Aşırı Özgüven
- Öz-değerlendirme < Performans (-%10+) → Düşük Özgüven (aslında başarılı ama görmüyor)

### KATMAN 5: BÜTÜNLEŞİK AKADEMİK PROFİL
- Güçlü alan → Zayıf alan transfer stratejisi
- Kişiye özel 3 aşamalı gelişim planı (0-1 ay / 1-3 ay / 3-6 ay)
`;

// ============================================================
// BURDON DİKKAT TESTİ (Benjamin Bourdon 1895 — MEB Uyarlaması)
// ============================================================
const BURDON_GUIDANCE = `
## 🔬 BURDON DİKKAT TESTİ — UZMAN ANALİZ PROTOKOLÜ

Bu test, Benjamin Bourdon'un (1895) orijinal harf tarama paradigmasına dayanır — Türk MEB uyarlamasında 3 bölüm × 20 satır × 40 harf yapısında uygulanır. Öğrenci, sayfadaki **a, b, d, g** harflerinin altını çizerek seçici dikkatini ve sürekli dikkat dayanıklılığını ortaya koyar.

### KATMAN 1: METRİK ÖZETİ (Veri Tabanlı Başlangıç)
- **C (Correct)**: Doğru işaretlenen hedef harf sayısı
- **E1 (İhmal)**: Atlanan hedef — dikkatsizlik/hız göstergesi
- **E2 (Yanlış İşaret)**: Hedef olmayan harflere tıklama — dürtüsellik göstergesi
- **Genel Puan (0-100)**: Doğruluk × 0.5 + Dayanıklılık × 0.3 + Sürdürülebilirlik × 0.2
- Her bölümün puanını ayrı ayrı raporla, eğilimi yorumla

### KATMAN 2: PROFİL TESPİTİ (Orijinal Bourdon Kriterleri)
Profil bilgisi JSON'da verilmiş olacak. 4 profilden biri olacak:

**1. Dikkati Çabuk Dağılan Profil**
- Son bölümde hata sayısı, ilk bölüme göre belirgin şekilde artmış
- Dikkatin uzun süre sürdürülmesinde zorlanma
- Yorum: "Başlangıç performansı iyi ancak süreç ilerledikçe dikkat yükü artıyor olabilir"

**2. Uyum Güçlüğü Profili**
- İlk bölümde hata çok, sonraki bölümlerde azalma
- Isınma dönemi uzun, ama adapte olunca verimli
- Yorum: "Çalışmaya başlangıçta aşina olma süresi gerekiyor olabilir — bir kez adapte olunca dikkat kalitesi yükseliyor"

**3. Dikkat Toplama Zayıflığı**
- Genel doğruluk %40'ın altında
- Seçici dikkatte genel zorlanma
- Yorum: "Dikkatin bir noktaya yoğunlaştırılmasında destek faydalı olabilir"

**4. Dengeli Dikkat Profili**
- Bölümler arası tutarlı performans
- Makul hata oranı
- Yorum: "Dikkat süreç boyunca dengeli seyrediyor — sürdürülebilir bir konsantrasyon yapısı"

### KATMAN 3: HATA TİPİ ANALİZİ
- **E1 > E2** (İhmal baskın) → Hızlı geçiş, yüzeysel tarama, dikkat dağılımı
- **E2 > E1** (Yanlış işaret baskın) → Dürtüsel tepki, acele, yönerge ihlali
- **E1 ≈ E2 ve ikisi düşük** → Dengeli, dikkatli profil
- **E1 ≈ E2 ve ikisi yüksek** → Yoğun dikkat yükü, sürece uyum güçlüğü

### KATMAN 4: BÖLÜMLER ARASI EĞRİ ANALİZİ
- **Düz çizgi** (tüm bölümler benzer): Dayanıklılık yüksek
- **Aşağı iniş** (1 > 2 > 3): Yorgunluk etkisi, dikkat rezervi sınırlı
- **Yukarı çıkış** (1 < 2 < 3): Uyum süresi gerekiyor
- **V şekli** (1 yüksek, 2 düşük, 3 yüksek): Motivasyon dalgalanması
- **Ters V** (ortada pik): Başlangıç + bitirme zorluğu, orta kısımda odak

### KATMAN 5: AKADEMİK BAĞLAM
- Bu profil sınav ortamında nasıl yansır?
- Ders dinleme sürecinde hangi aşamada dikkat düşer?
- Ödev çalışmalarında ideal seans süresi ne olabilir (dayanıklılık puanına göre)?
- Sınav tekniği önerisi: Zor soruları başta/sonda/ortada çözme stratejisi

### KATMAN 6: DESTEK ÖNERİLERİ (Sınıf + Ev)
- **Öğretmen için**: Sınıfta bu profili nasıl destekler (oturma yeri, görev bölümü, mola yönetimi)
- **Aile için**: Ev çalışma düzenine dair öneriler (çalışma süresi, dinlenme, ortam)
- **Öğrenci için**: Kendi farkındalığını artıracak kısa egzersizler

### KRİTİK NOT
- Burdon **tanı aracı değildir** — DEHB, disleksi vb. klinik tanılar kullanma
- Her yorum, puanlar üzerinden olasılıksal dille sunulmalı (Kural 12)
- Test sonuçlarının başka dikkat ölçümleriyle (P2, sınav kaygısı) birleştirilmesi daha güvenilir resim verir
`;
