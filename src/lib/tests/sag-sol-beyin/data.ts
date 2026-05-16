// ============================================================
// Sağ-Sol Beyin Testi — Veri
// ============================================================

export interface SagSolQuestion {
  id: number;
  text: string;
  a: string;
  b: string;
  rightBrain: 'a' | 'b';
}

export const SAG_SOL_BEYIN_QUESTIONS: SagSolQuestion[] = [
  { id: 1,  text: "Aşağıdakilerden hangisi sana daha çok uyuyor?", a: "Risk almak eğlencelidir, heyecan verir.", b: "Risk almadan da gayet iyi eğlenebilirim.", rightBrain: "a" },
  { id: 2,  text: "Bir işi yaparken nasıl davranırsın?", a: "Eski işleri yapmak için sürekli yeni yollar ararım.", b: "Bir yol iyi çalışıyorsa onu değiştirmem, aynen devam ederim.", rightBrain: "a" },
  { id: 3,  text: "İşlerini bitirme konusunda hangisi seni daha iyi tanımlar?", a: "Birçok işe başlarım ama hepsini bitiremeyebilirim.", b: "Bir işi bitirmeden kesinlikle yenisine başlamam.", rightBrain: "a" },
  { id: 4,  text: "Hayal gücünü kullanma konusunda nasılsın?", a: "İşlerimde çok fazla hayal gücü kullanmam, gerçekçiyimdir.", b: "Her işimde mutlaka hayal gücümü kullanırım.", rightBrain: "b" },
  { id: 5,  text: "Gelecekte ne olacağını tahmin ederken hangisini kullanırsın?", a: "Olayları analiz ederek ne olacağını tahmin ederim.", b: "İçimden gelen hisle ne olacağını hissederim.", rightBrain: "b" },
  { id: 6,  text: "Bir problemle karşılaştığında nasıl çözersin?", a: "En iyi tek çözümü bulmaya çalışırım.", b: "Birden fazla farklı çözüm yolu ararım.", rightBrain: "b" },
  { id: 7,  text: "Düşüncelerin kafanın içinde nasıl akar?", a: "Düşüncelerim resimler ve görüntüler gibi akar.", b: "Düşüncelerim kelimeler ve cümleler gibi akar.", rightBrain: "a" },
  { id: 8,  text: "Yeni fikirler karşısında nasıl tepki verirsin?", a: "Yeni fikirleri başkalarından önce kabul ederim.", b: "Yeni fikirleri başkalarından çok sorgularım.", rightBrain: "a" },
  { id: 9,  text: "Düzenin hakkında ne derler?", a: "Başkaları benim düzenimi anlamaz ama bana göre düzenlidir.", b: "Başkaları benim çok düzenli olduğumu söyler.", rightBrain: "a" },
  { id: 10, text: "Disiplin konusunda kendini nasıl tanımlarsın?", a: "İyi bir öz disiplinim vardır, kendimi kontrol ederim.", b: "Genellikle duygularıma ve içgüdülerime göre hareket ederim.", rightBrain: "b" },
  { id: 11, text: "İş yaparken zamanı nasıl kullanırsın?", a: "Zamanımı önceden planlarım.", b: "İş yaparken zamanı pek düşünmem, akar gider.", rightBrain: "b" },
  { id: 12, text: "Zor bir karar vermek gerektiğinde ne yaparsın?", a: "Doğru bildiğimi, mantığıma uygun olanı seçerim.", b: "Kalbimin ve hislerimin söylediğini seçerim.", rightBrain: "b" },
  { id: 13, text: "İşlerini hangi sırayla yaparsın?", a: "Kolay işleri önce, önemli işleri sonra yaparım.", b: "Önemli işleri önce, kolay işleri sonra yaparım.", rightBrain: "a" },
  { id: 14, text: "Yeni bir durumla karşılaştığında ne olur?", a: "Kafamda çok fazla fikir uçuşur, hangisini seçeceğimi bilemem.", b: "Bazen hiç fikrim olmaz, ne yapacağımı düşünmem gerekir.", rightBrain: "a" },
  // ID 15 — kaldırıldı: #8 ile yeni fikirleri sorgulama çakışması
  // ID 16 — kaldırıldı: #2 ile değişiklik/çeşitlilik çakışması
  { id: 17, text: "Haklı olduğunu nasıl bilirsin?", a: "Haklı olduğumu bilirim çünkü iyi nedenlerim ve kanıtlarım vardır.", b: "Haklı olduğumu hissederim, bazen nedenim olmasa bile.", rightBrain: "b" },
  { id: 18, text: "İşlerini zamana nasıl yayarsın?", a: "İşlerimi zamana eşit olarak yayarım.", b: "İşlerimi son dakikada yapmayı tercih ederim.", rightBrain: "b" },
  { id: 19, text: "Eşyalarını nereye koyarsın?", a: "Her şeyi belirli bir yere koyarım, hep aynı yer.", b: "Eşyalarımın yeri o an ne yaptığıma göre değişir.", rightBrain: "b" },
  // ID 20 — kaldırıldı: #18 ve #19 ile spontane/tutarlı çakışması
  { id: 21, text: "Çalışma ortamın nasıl olmalı?", a: "Düzenli ve tertipli bir ortamda çalışmalıyım.", b: "Rahat hissettiğim, esnek bir ortamda çalışırım.", rightBrain: "b" },
  { id: 22, text: "Okulda hangi tür dersleri daha çok seversin?", a: "Türkçe, resim, müzik gibi sözel ve sanatsal dersler.", b: "Matematik, fen bilgisi gibi sayısal dersler.", rightBrain: "a" },
  { id: 23, text: "Hangi tür sporları tercih edersin?", a: "Tek başına yapılan sporlar (yüzme, koşu, bisiklet).", b: "Takım sporları (basketbol, voleybol, futbol).", rightBrain: "a" },
  { id: 24, text: "Gördüğün rüyaları hatırlar mısın?", a: "Evet, rüyalarımı çoğu zaman canlı ve detaylı hatırlarım.", b: "Hayır, rüyalarımı nadiren hatırlarım.", rightBrain: "a" },
  { id: 25, text: "Konuşurken ellerini ve yüz ifadelerini nasıl kullanırsın?", a: "Çok fazla el kol hareketi ve mimik kullanırım.", b: "Çok az hareket yaparım, sakin konuşurum.", rightBrain: "a" },
  { id: 26, text: "Bir hikaye anlatırken nasıl anlatırsın?", a: "Olayları sırasıyla, baştan sona düzgünce anlatırım.", b: "Aklıma geldiği gibi, renkli detaylar ve duygular katarak anlatırım.", rightBrain: "b" },
  { id: 27, text: "İnsanları tanırken neyi daha çabuk hatırlarsın?", a: "İnsanların yüzlerini ve görünüşlerini hatırlarım.", b: "İnsanların isimlerini ve söylediklerini hatırlarım.", rightBrain: "a" },
  { id: 28, text: "Bir şey öğrenirken hangisini tercih edersin?", a: "Resim, grafik, şema gibi görsellerle öğrenmek.", b: "Yazılı metin okuyarak ve not alarak öğrenmek.", rightBrain: "a" },
  { id: 29, text: "Odanın düzeni hakkında ne düşünürsün?", a: "Odamdaki eşyaların her zaman aynı yerde ve düzenli durmasını isterim.", b: "Odamda yaratıcı bir dağınıklık vardır, ama ben nereye ne koyduğumu bilirim.", rightBrain: "b" },
  { id: 30, text: "Birinin yalan söylediğini nasıl anlarsın?", a: "Söylediklerindeki çelişkileri ve mantık hatalarını yakalarım.", b: "Yüz ifadesinden ve ses tonundan hissederim, sezgilerime güvenirim.", rightBrain: "b" },
  // ═══ Yeni klasik sağ-sol beyin göstergeleri (ID 31-35) ═══
  { id: 31, text: "Sevdiğin bir şarkıyı dinlerken neyi daha çok takip edersin?", a: "Sözleri ve şarkının mesajını dinlerim.", b: "Melodi, ritim ve enstrümanları daha çok hissederim.", rightBrain: "b" },
  { id: 32, text: "Alışveriş yaparken toplam tutarı nasıl hesaplarsın?", a: "Kafadan kabaca tahmin ederim, yaklaşık değer benim için yeter.", b: "Kalemle, telefonla veya hesap makinesiyle tam hesaplarım.", rightBrain: "a" },
  { id: 33, text: "Tanımadığın bir yere giderken nasıl yön bulursun?", a: "Sokak adlarını, yön tariflerini ve adres bilgilerini takip ederim.", b: "Çevremdeki binaları, ağaçları ve görsel işaretleri referans alırım.", rightBrain: "b" },
  { id: 34, text: "İzlediğin bir filmi sonradan anlatırken neyi daha çok hatırlarsın?", a: "Çarpıcı sahneleri, görselleri ve filmin atmosferini hatırlarım.", b: "Diyalogları, replikleri ve hikayenin sırasını hatırlarım.", rightBrain: "a" },
  { id: 35, text: "Birini bir konuda ikna etmek istediğinde nasıl yaparsın?", a: "Mantık, veri ve somut örneklerle açıklarım.", b: "Duygularımı paylaşır, hikayelerle ve örneklerle anlatırım.", rightBrain: "b" },
];

export interface SagSolBeyinProfile {
  title: string;
  icon: string;
  description: string;
  strengths: string[];
  developmentAreas: string[];
  studyTips: string[];
  careerAreas: string[];
}

export const SAG_SOL_BEYIN_DATA: Record<string, SagSolBeyinProfile> = {
  sag: {
    title: "Sağ Beyin Baskın",
    icon: "🎨",
    description: "Sen dünyaya daha çok duygularınla, sezgilerinle ve hayal gücünle bakan birisin. Yaratıcılık senin süper gücün!",
    strengths: ["Güçlü hayal gücü ve yaratıcılık", "Sezgileri kuvvetli, insanları iyi okur", "Sanatsal ve görsel yetenekler", "Bütüncül düşünme (büyük resmi görme)", "Empati ve duygusal zeka", "Esnek ve spontane düşünme"],
    developmentAreas: ["Zaman yönetimi ve planlama becerilerini geliştirebilirsin", "Detaylara daha fazla dikkat edebilirsin", "Başladığın işleri bitirme konusunda kendine hedefler koyabilirsin", "Düzenli çalışma alışkanlıkları edinebilirsin"],
    studyTips: ["Ders çalışırken renkli kalemler, zihin haritaları (mind map) ve şemalar kullan.", "Konuları hikayeleştirerek veya görselleştirerek öğren.", "Müzik dinleyerek çalışmak sana iyi gelebilir (sözsüz müzik dene).", "Uzun çalışma seansları yerine kısa ama yaratıcı molalar ver.", "Grup çalışmalarında fikirlerini paylaşmaktan çekinme, farklı bakış açın değerli."],
    careerAreas: ["Sanat ve Tasarım", "Müzik", "Edebiyat ve Yazarlık", "Psikoloji", "Mimarlık", "Reklamcılık", "Fotoğrafçılık", "Oyun Tasarımı", "Film ve Sinema"],
  },
  sol: {
    title: "Sol Beyin Baskın",
    icon: "🔬",
    description: "Sen dünyaya daha çok mantığınla, analizlerinle ve sistemli düşünmenle bakan birisin. Analitik güç senin süper gücün!",
    strengths: ["Güçlü analitik ve mantıksal düşünme", "Detaylara dikkat ve titizlik", "İyi planlama ve organizasyon", "Matematiksel ve sayısal beceriler", "Disiplinli ve tutarlı çalışma", "Dil ve sözel ifade becerileri"],
    developmentAreas: ["Yaratıcı düşünme ve hayal gücünü geliştirebilirsin", "Duygularını ifade etme konusunda daha rahat olabilirsin", "Spontane ve esnek olmayı deneyebilirsin", "Büyük resmi görmek için adım geri atabilirsin"],
    studyTips: ["Konuları sıralı ve adım adım çalış, listeler ve özetler çıkar.", "Formüller, kurallar ve kalıplar senin en iyi arkadaşın.", "Sessiz ve düzenli bir çalışma ortamı oluştur.", "Zaman planı yap ve ona sadık kal — bu seni güçlü kılar.", "Her konunun 'neden' ve 'nasıl' sorularını sor, derinlemesine anla."],
    careerAreas: ["Mühendislik", "Tıp", "Hukuk", "Bilgisayar Bilimi", "Muhasebe ve Finans", "Bilimsel Araştırma", "Matematik", "Programlama", "Bankacılık"],
  },
  dengeli: {
    title: "Dengeli Beyin",
    icon: "⚖️",
    description: "Sen hem yaratıcı hem de analitik tarafını dengeli kullanan birisin. Bu çok özel ve güçlü bir kombinasyon!",
    strengths: ["Hem yaratıcı hem analitik düşünebilme", "Farklı durumlarına uyum sağlama esnekliği", "Hem detayları hem büyük resmi görebilme", "Dengeli karar verme yeteneği", "Farklı insanlarla iyi iletişim kurabilme", "Çok yönlü problem çözme becerisi"],
    developmentAreas: ["Bazen hangi tarafını kullanacağına karar vermekte zorlanabilirsin", "Bir alanda uzmanlaşmak için bilinçli tercihler yapabilirsin", "Güçlü yönlerini keşfetmek için farklı alanları denemeye devam et"],
    studyTips: ["Hem görsel hem yazılı materyalleri birlikte kullan.", "Bazen planlı, bazen serbest çalışmayı dene — ikisi de sana uyar.", "Hem bireysel hem grup çalışmalarından verim alabilirsin.", "Farklı ders çalışma tekniklerini dönüşümlü kullan.", "Güçlü olduğun tarafı keşfet ve onu bilinçli geliştir."],
    careerAreas: ["Girişimcilik", "Proje Yönetimi", "Eğitim ve Öğretmenlik", "Danışmanlık", "İletişim ve Medya", "Araştırma-Geliştirme", "Mühendislik Tasarımı", "Ürün Geliştirme"],
  },
};
