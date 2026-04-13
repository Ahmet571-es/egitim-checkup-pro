// ============================================================
// Akademik Analiz — Veri & Engine (4 Kademe)
// ============================================================
import type { AkademikScores, AkademikSectionResult } from '../types';

export type AkademikKademe = 'kademe_1' | 'kademe_2' | 'kademe_3' | 'kademe_4';

export const KADEME_MAP: Record<number, AkademikKademe> = {
  5: 'kademe_1', 6: 'kademe_1', 7: 'kademe_2', 8: 'kademe_2',
  9: 'kademe_3', 10: 'kademe_3', 11: 'kademe_4', 12: 'kademe_4',
};

export const KADEME_LABELS: Record<AkademikKademe, string> = {
  kademe_1: '5-6. Sınıf (Temel)', kademe_2: '7-8. Sınıf (Orta)',
  kademe_3: '9-10. Sınıf (İleri)', kademe_4: '11-12. Sınıf (Üst)',
};

const DIFFICULTY_WEIGHTS: Record<string, number> = { kolay: 1, orta: 2, zor: 3 };

export const SKILL_LABELS: Record<string, string> = {
  detay_bulma: 'Detay Bulma', ana_fikir: 'Ana Fikir', cikarim: 'Çıkarım Yapma',
  soz_varligi: 'Söz Varlığı', yazar_tutumu: 'Yazarın Tutumu', karsilastirma: 'Karşılaştırma',
  hesaplama: 'Temel Hesaplama', problem_cozme: 'Problem Çözme', geometri: 'Geometri',
  veri_yorumlama: 'Veri Yorumlama', cebir: 'Cebirsel Düşünme', olasilik: 'Olasılık',
  oran_orant: 'Oran-Orantı / Yüzde', analoji: 'Analoji', seri: 'Seri Tamamlama',
  kiyas: 'Kıyas / Tasım', siralama: 'Sıralama', mantiksal_cikarim: 'Mantıksal Çıkarım',
};

export interface AkademikMCQ {
  id: string;
  text: string;
  options: Record<string, string>;
  answer: string;
  difficulty: 'kolay' | 'orta' | 'zor';
  skill: string;
}

export interface AkademikPassage {
  passage: string;
  questions: AkademikMCQ[];
}

export interface AkademikLikertQ {
  id: string;
  text: string;
}

export interface AkademikSection {
  name: string;
  icon: string;
  type: 'passage_mc' | 'mc' | 'likert';
  data: AkademikPassage[] | AkademikMCQ[] | AkademikLikertQ[];
}

// ============================================================
// KADEME 1 — Soru Verileri
// ============================================================
const K1_OKUMA: AkademikPassage[] = [
  { passage: "Arılar, doğadaki en çalışkan canlılardan biridir. Bir bal arısı, yaşamı boyunca sadece bir çay kaşığının on ikide biri kadar bal üretir. Bir kavanoz bal üretmek için arıların yaklaşık 3,5 milyon çiçeği ziyaret etmesi gerekir. Arılar balı üretirken aynı zamanda bitkilerin tozlaşmasını da sağlar. Bilim insanları, arıların yok olması durumunda birçok meyve ve sebzenin de yok olacağını söylemektedir.",
    questions: [
      { id:"k1_oa_1", text:"Bir bal arısı yaşamı boyunca ne kadar bal üretir?", options:{a:"Bir çay kaşığı",b:"Bir çay kaşığının on ikide biri",c:"Bir kavanoz",d:"Hiç üretmez"}, answer:"b", difficulty:"kolay", skill:"detay_bulma" },
      { id:"k1_oa_2", text:"Bir kavanoz bal için yaklaşık kaç çiçek ziyaret edilir?", options:{a:"350 bin",b:"35 bin",c:"3,5 milyon",d:"35 milyon"}, answer:"c", difficulty:"kolay", skill:"detay_bulma" },
      { id:"k1_oa_3", text:"Arıların tozlaşma yapmasının doğaya faydası nedir?", options:{a:"Balın tadını güzelleştirir",b:"Bitkilerin üremesini sağlar",c:"Arıların daha hızlı uçmasını sağlar",d:"Çiçeklerin rengini değiştirir"}, answer:"b", difficulty:"orta", skill:"cikarim" },
      { id:"k1_oa_4", text:"Metnin ana fikri nedir?", options:{a:"Arılar çok hızlı uçar",b:"Bal çok lezzetlidir",c:"Arılar doğa için çok önemli ve çalışkan canlılardır",d:"Arılar tehlikeli böceklerdir"}, answer:"c", difficulty:"orta", skill:"ana_fikir" },
      { id:"k1_oa_5", text:"Arılar yok olursa ne gibi bir sonuç beklenir?", options:{a:"Balın fiyatı düşer",b:"Meyve ve sebze üretimi ciddi şekilde azalır",c:"Çiçekler daha güzel açar",d:"Başka böcekler bal üretmeye başlar"}, answer:"b", difficulty:"zor", skill:"cikarim" },
    ]
  },
];

const K1_MATEMATIK: AkademikMCQ[] = [
  { id:"k1_m_1", text:"Bir markette elmalar 3'lü paketlerde satılıyor. 5 paket alan kişi kaç elma almış olur?", options:{a:"12",b:"8",c:"15",d:"18"}, answer:"c", difficulty:"kolay", skill:"hesaplama" },
  { id:"k1_m_2", text:"425 + 378 = ?", options:{a:"793",b:"803",c:"813",d:"703"}, answer:"b", difficulty:"kolay", skill:"hesaplama" },
  { id:"k1_m_3", text:"Bir dikdörtgenin uzun kenarı 12 cm, kısa kenarı 8 cm. Çevresi kaç cm'dir?", options:{a:"96",b:"40",c:"20",d:"36"}, answer:"b", difficulty:"kolay", skill:"geometri" },
  { id:"k1_m_4", text:"5, 10, 20, 40, … serisinde sonraki sayı kaçtır?", options:{a:"60",b:"50",c:"80",d:"100"}, answer:"c", difficulty:"kolay", skill:"hesaplama" },
  { id:"k1_m_5", text:"Bir pizzanın 3/8'i yendikten sonra kalan kısmı kaçta kaçtır?", options:{a:"5/8",b:"3/5",c:"1/2",d:"4/8"}, answer:"a", difficulty:"kolay", skill:"hesaplama" },
];

const K1_MANTIK: AkademikMCQ[] = [
  { id:"k1_l_1", text:"Elma → Meyve, Köpek → Hayvan, Gül → ?", options:{a:"Ağaç",b:"Bahçe",c:"Çiçek",d:"Yaprak"}, answer:"c", difficulty:"kolay", skill:"analoji" },
  { id:"k1_l_2", text:"Kitap → Okumak, Bıçak → Kesmek, Kalem → ?", options:{a:"Silmek",b:"Çizmek",c:"Yazmak",d:"Boyamak"}, answer:"c", difficulty:"kolay", skill:"analoji" },
  { id:"k1_l_3", text:"2, 4, 6, 8, … serisinde sonraki sayı kaçtır?", options:{a:"9",b:"10",c:"11",d:"12"}, answer:"b", difficulty:"kolay", skill:"seri" },
  { id:"k1_l_4", text:"Hangisi diğerlerinden farklıdır? Masa, Sandalye, Elma, Dolap", options:{a:"Masa",b:"Sandalye",c:"Elma",d:"Dolap"}, answer:"c", difficulty:"kolay", skill:"analoji" },
  { id:"k1_l_5", text:"Göz → Görmek, Kulak → ?", options:{a:"Yemek",b:"Duymak",c:"Koklamak",d:"Dokunmak"}, answer:"b", difficulty:"kolay", skill:"analoji" },
];

const K1_OZ_DEGER: AkademikLikertQ[] = [
  { id:"k1_od_1", text:"Ders çalışırken konuya kolayca odaklanabilirim." },
  { id:"k1_od_2", text:"Bir konuyu anlamazsam tekrar tekrar çalışırım." },
  { id:"k1_od_3", text:"Sınavlarda kendime güvenirim." },
  { id:"k1_od_4", text:"Okuduğum metinleri anlayıp özetleyebilirim." },
  { id:"k1_od_5", text:"Matematik problemlerini çözmekten keyif alırım." },
  { id:"k1_od_6", text:"Ödevlerimi zamanında tamamlarım." },
  { id:"k1_od_7", text:"Yeni konuları öğrenmek beni heyecanlandırır." },
  { id:"k1_od_8", text:"Arkadaşlarıma bir konuyu açıklayabilirim." },
  { id:"k1_od_9", text:"Zor bir soruyla karşılaşınca pes etmem." },
  { id:"k1_od_10", text:"Ders çalışma planı yapıp ona uyarım." },
  { id:"k1_od_11", text:"Derslerde söz alıp fikrimi söyleyebilirim." },
  { id:"k1_od_12", text:"Öğrendiklerimi günlük hayatta kullanabilirim." },
];

// Kademe 2
const K2_OZ_DEGER: AkademikLikertQ[] = [
  { id:"k2_od_1", text:"Karmaşık bir konuyu anlayıncaya kadar farklı kaynaklardan araştırırım." },
  { id:"k2_od_2", text:"Sınav öncesi etkili bir çalışma planı yapabilirim." },
  { id:"k2_od_3", text:"Bir metni okuduktan sonra ana fikrini belirleyebilirim." },
  { id:"k2_od_4", text:"Matematiksel problemlerde birden fazla çözüm yolu düşünebilirim." },
  { id:"k2_od_5", text:"Eleştirel düşünerek bilgiyi sorgulayabilirim." },
  { id:"k2_od_6", text:"Grup çalışmalarında fikirlerimi etkili şekilde ifade edebilirim." },
  { id:"k2_od_7", text:"Uzun vadeli akademik hedeflerim var ve bunlar için çalışıyorum." },
  { id:"k2_od_8", text:"Başarısız olduğumda nedenlerini analiz eder stratejimi değiştiririm." },
  { id:"k2_od_9", text:"Farklı dersler arasında bağlantı kurabilirim." },
  { id:"k2_od_10", text:"Not alarak ve özetleyerek çalışma verimliliğimi artırırım." },
  { id:"k2_od_11", text:"Akademik konularda kendime güveniyorum." },
  { id:"k2_od_12", text:"Öğrendiğim bilgiyi gerçek hayata uygulayabilirim." },
];

const K3_OZ_DEGER: AkademikLikertQ[] = [
  { id:"k3_od_1", text:"Bir konuyu derinlemesine araştırıp farklı bakış açılarını değerlendirebilirim." },
  { id:"k3_od_2", text:"Sınav ve proje takvimimi etkin biçimde yönetebilirim." },
  { id:"k3_od_3", text:"Okuduğum akademik metinleri eleştirel olarak değerlendirebilirim." },
  { id:"k3_od_4", text:"Soyut matematiksel kavramları anlayıp uygulayabilirim." },
  { id:"k3_od_5", text:"Bir argümanın güçlü ve zayıf yönlerini tespit edebilirim." },
  { id:"k3_od_6", text:"Sunum yaparak fikirlerimi etkili biçimde aktarabilirim." },
  { id:"k3_od_7", text:"Kariyer hedeflerim doğrultusunda bilinçli akademik tercihler yapıyorum." },
  { id:"k3_od_8", text:"Hatalarımdan sistematik olarak ders çıkarırım." },
  { id:"k3_od_9", text:"Farklı disiplinlerin kesişim noktalarını görebilirim." },
  { id:"k3_od_10", text:"Kendi öğrenme stratejilerimi değerlendirip geliştirebilirim." },
  { id:"k3_od_11", text:"Zorlu akademik görevlerin üstesinden gelebileceğime inanırım." },
  { id:"k3_od_12", text:"Teorik bilgiyi pratiğe dönüştürebilirim." },
];

const K4_OZ_DEGER: AkademikLikertQ[] = [
  { id:"k4_od_1", text:"Akademik literatürü takip edip sentezleyebilirim." },
  { id:"k4_od_2", text:"YKS/sınav hazırlık sürecimi stratejik olarak planlayabilirim." },
  { id:"k4_od_3", text:"Farklı kaynakları karşılaştırarak bilgiyi eleştirel değerlendirebilirim." },
  { id:"k4_od_4", text:"İleri matematik kavramlarını (türev, integral, olasılık) anlıyorum." },
  { id:"k4_od_5", text:"Bir konudaki varsayımları tespit edip sorgulayabilirim." },
  { id:"k4_od_6", text:"Akademik yazım kurallarına uygun metin üretebilirim." },
  { id:"k4_od_7", text:"Üniversite ve kariyer hedeflerim net ve bu hedeflere yönelik çalışıyorum." },
  { id:"k4_od_8", text:"Karmaşık problemleri parçalara ayırarak sistematik çözebilirim." },
  { id:"k4_od_9", text:"Disiplinlerarası düşünce ile yenilikçi çözümler üretebilirim." },
  { id:"k4_od_10", text:"Kendi bilişsel güçlü ve zayıf yönlerimin farkındayım." },
  { id:"k4_od_11", text:"Akademik baskı altında bile performansımı koruyabilirim." },
  { id:"k4_od_12", text:"Öğrendiklerimi toplumsal sorunlara uygulayabilirim." },
];

// Kısa matematik/mantık soruları kademeler 2-4 için (yeterli soru)
const K2_MATEMATIK: AkademikMCQ[] = [
  { id:"k2_m_1", text:"Bir ürünün fiyatı önce %20 artırıldı, sonra %20 indirildi. Son fiyat başlangıca göre nasıl?", options:{a:"Aynı kaldı",b:"%4 düştü",c:"%4 arttı",d:"%2 düştü"}, answer:"b", difficulty:"kolay", skill:"oran_orant" },
  { id:"k2_m_2", text:"x + y = 10 ve x − y = 4 ise x kaçtır?", options:{a:"5",b:"6",c:"7",d:"8"}, answer:"c", difficulty:"kolay", skill:"cebir" },
  { id:"k2_m_3", text:"Bir sınıfın matematik ortalaması 72. 25 öğrenci varsa toplam puan kaçtır?", options:{a:"1800",b:"1750",c:"1900",d:"1700"}, answer:"a", difficulty:"kolay", skill:"veri_yorumlama" },
  { id:"k2_m_4", text:"3, 7, 15, 31, 63, … serisinde sonraki sayı?", options:{a:"95",b:"127",c:"125",d:"126"}, answer:"b", difficulty:"kolay", skill:"hesaplama" },
  { id:"k2_m_5", text:"6 işçi bir duvarı 10 günde örüyor. 3 işçi kaç günde örer?", options:{a:"15",b:"20",c:"5",d:"30"}, answer:"b", difficulty:"orta", skill:"oran_orant" },
];

const K2_MANTIK: AkademikMCQ[] = [
  { id:"k2_l_1", text:"Demokrasi → Seçim, Diktatörlük → ?", options:{a:"Özgürlük",b:"Baskı",c:"Parlamento",d:"Anayasa"}, answer:"b", difficulty:"kolay", skill:"analoji" },
  { id:"k2_l_2", text:"1, 1, 2, 3, 5, 8, 13, … sonraki sayı?", options:{a:"18",b:"20",c:"21",d:"26"}, answer:"c", difficulty:"kolay", skill:"seri" },
  { id:"k2_l_3", text:"Tüm bilim insanları meraklıdır. Bazı öğretmenler bilim insanıdır. Hangisi kesinlikle doğru?", options:{a:"Tüm öğretmenler meraklıdır",b:"Bazı öğretmenler meraklıdır",c:"Hiçbir öğretmen meraklı değildir",d:"Meraklı olan herkes bilim insanıdır"}, answer:"b", difficulty:"kolay", skill:"kiyas" },
  { id:"k2_l_4", text:"A, B'den zengin. C, D'den fakir. B, D'den zengin. Kim en fakir?", options:{a:"A",b:"B",c:"C",d:"D"}, answer:"c", difficulty:"orta", skill:"siralama" },
  { id:"k2_l_5", text:"'Yağmur yağarsa yer ıslak olur.' Kontrapozitifi nedir?", options:{a:"Yağmur yağmazsa yer ıslak olmaz",b:"Yer ıslak değilse yağmur yağmamıştır",c:"Yer ıslaksa yağmur yağmıştır",d:"Yağmur yağarsa yer kuru kalır"}, answer:"b", difficulty:"orta", skill:"mantiksal_cikarim" },
];

const K3_MATEMATIK: AkademikMCQ[] = [
  { id:"k3_m_1", text:"f(x) = 3x − 7 ise f(5) kaçtır?", options:{a:"8",b:"22",c:"15",d:"2"}, answer:"a", difficulty:"kolay", skill:"cebir" },
  { id:"k3_m_2", text:"log₁₀(1000) kaçtır?", options:{a:"2",b:"3",c:"4",d:"10"}, answer:"b", difficulty:"kolay", skill:"cebir" },
  { id:"k3_m_3", text:"x² − 9 = 0 denkleminin kökleri?", options:{a:"±3",b:"±9",c:"3",d:"9"}, answer:"a", difficulty:"kolay", skill:"cebir" },
  { id:"k3_m_4", text:"sin(30°) kaçtır?", options:{a:"1/2",b:"√2/2",c:"√3/2",d:"1"}, answer:"a", difficulty:"kolay", skill:"geometri" },
  { id:"k3_m_5", text:"5! (5 faktöriyel) kaçtır?", options:{a:"25",b:"120",c:"60",d:"20"}, answer:"b", difficulty:"kolay", skill:"hesaplama" },
];

const K3_MANTIK: AkademikMCQ[] = [
  { id:"k3_l_1", text:"Sebep → Sonuç, Hipotez → ?", options:{a:"Deney",b:"Teori",c:"Kanıt",d:"Test"}, answer:"d", difficulty:"kolay", skill:"analoji" },
  { id:"k3_l_2", text:"1, 4, 9, 16, 25, … sonraki sayı?", options:{a:"30",b:"35",c:"36",d:"49"}, answer:"c", difficulty:"kolay", skill:"seri" },
  { id:"k3_l_3", text:"'Tüm metaller iletkendir' ve 'Bakır bir metaldir' önermelerinden ne çıkar?", options:{a:"Bakır iletken değildir",b:"Bakır iletkendir",c:"Bazı metaller iletken değildir",d:"Bilinemez"}, answer:"b", difficulty:"kolay", skill:"kiyas" },
  { id:"k3_l_4", text:"Hangi sayı diğerlerinden farklı mantıkla oluşmuştur? 2, 3, 5, 7, 9, 11", options:{a:"3",b:"7",c:"9",d:"11"}, answer:"c", difficulty:"kolay", skill:"seri" },
  { id:"k3_l_5", text:"n² + n her zaman çift midir? (n doğal sayı)", options:{a:"Evet — çünkü n(n+1) ardışık iki sayının çarpımıdır",b:"Hayır — n=3 için tek",c:"Sadece çift n'ler için",d:"Bilinemez"}, answer:"a", difficulty:"zor", skill:"mantiksal_cikarim" },
];

const K4_MATEMATIK: AkademikMCQ[] = [
  { id:"k4_m_1", text:"∫(2x)dx = ?", options:{a:"x² + C",b:"2x² + C",c:"x + C",d:"2 + C"}, answer:"a", difficulty:"kolay", skill:"cebir" },
  { id:"k4_m_2", text:"f(x) = x³ fonksiyonunun türevi f'(x) = ?", options:{a:"x²",b:"3x²",c:"3x",d:"x³"}, answer:"b", difficulty:"kolay", skill:"cebir" },
  { id:"k4_m_3", text:"lim(x→∞) (3x²+1)/(x²+5) = ?", options:{a:"3",b:"1",c:"0",d:"∞"}, answer:"a", difficulty:"kolay", skill:"cebir" },
  { id:"k4_m_4", text:"log₂(32) = ?", options:{a:"4",b:"5",c:"6",d:"3"}, answer:"b", difficulty:"kolay", skill:"cebir" },
  { id:"k4_m_5", text:"C(10,3) = ?", options:{a:"120",b:"720",c:"30",d:"1000"}, answer:"a", difficulty:"kolay", skill:"olasilik" },
];

const K4_MANTIK: AkademikMCQ[] = [
  { id:"k4_l_1", text:"Korelasyon → İlişki, Nedensellik → ?", options:{a:"Gözlem",b:"Sebep-sonuç",c:"İstatistik",d:"Rastlantı"}, answer:"b", difficulty:"kolay", skill:"analoji" },
  { id:"k4_l_2", text:"p → q doğru. q → r doğru. Hangisi kesinlikle doğru?", options:{a:"r → p",b:"p → r",c:"¬p → ¬r",d:"¬r → q"}, answer:"b", difficulty:"kolay", skill:"mantiksal_cikarim" },
  { id:"k4_l_3", text:"1, 2, 6, 24, 120, … sonraki sayı?", options:{a:"240",b:"600",c:"720",d:"480"}, answer:"c", difficulty:"kolay", skill:"seri" },
  { id:"k4_l_4", text:"Tümevarım → Özelden genele, Tümdengelim → ?", options:{a:"Genelden özele",b:"Özelden özele",c:"Genelden genele",d:"Sezgiden bilgiye"}, answer:"a", difficulty:"kolay", skill:"analoji" },
  { id:"k4_l_5", text:"Gödel'in eksiklik teoremi neyi söyler?", options:{a:"Matematik tutarsızdır",b:"Yeterince güçlü her formel sistemde kanıtlanamayan doğru önermeler vardır",c:"Her önerme kanıtlanabilir",d:"Mantık gereksizdir"}, answer:"b", difficulty:"orta", skill:"mantiksal_cikarim" },
];

// Kademe 2-4 için kısa okuma parçaları (1'er adet)
const K2_OKUMA: AkademikPassage[] = [{
  passage: "Yapay zekâ teknolojilerinin hızla gelişmesi toplumda hem heyecan hem de endişe yaratmaktadır. Bir yandan tıpta erken tanı, eğitimde kişiselleştirilmiş öğrenme ve endüstride verimlilik artışı gibi somut faydalar sağlanırken; öte yandan iş gücü piyasasında köklü dönüşümler beklenmektedir. Uzmanlar, 2030 yılına kadar mevcut mesleklerin yaklaşık üçte birinin otomasyona bağlı olarak dönüşeceğini öngörmektedir. Kritik olan, bireylerin yaşam boyu öğrenme becerisini kazanmasıdır.",
  questions: [
    { id:"k2_oa_1", text:"Yapay zekânın sağladığı faydalardan biri hangisidir?", options:{a:"İşsizliğin artması",b:"Eğitimde kişiselleştirilmiş öğrenme",c:"Mesleklerin tamamen yok olması",d:"Teknolojinin yavaşlaması"}, answer:"b", difficulty:"kolay", skill:"detay_bulma" },
    { id:"k2_oa_2", text:"2030'a kadar mesleklerin ne kadarı dönüşecek?", options:{a:"Tamamı",b:"Yarısı",c:"Yaklaşık üçte biri",d:"Onda biri"}, answer:"c", difficulty:"kolay", skill:"detay_bulma" },
    { id:"k2_oa_3", text:"Metne göre bireyler için kritik olan beceri nedir?", options:{a:"Tek meslekte uzmanlaşmak",b:"Teknolojiden uzak durmak",c:"Yaşam boyu öğrenme",d:"Erken emekli olmak"}, answer:"c", difficulty:"orta", skill:"ana_fikir" },
    { id:"k2_oa_4", text:"Yazarın yapay zekâya karşı tutumu nasıldır?", options:{a:"Tamamen olumsuz",b:"Tamamen olumlu",c:"Dengeli — hem fırsatları hem riskleri ele alan",d:"Kayıtsız"}, answer:"c", difficulty:"orta", skill:"yazar_tutumu" },
    { id:"k2_oa_5", text:"Metinden çıkarılacak en güçlü sonuç nedir?", options:{a:"Teknoloji kötüdür",b:"Değişime uyum sağlayanlar avantajlı olacak",c:"Tüm meslekler yok olacak",d:"Eğitimin önemi azalacak"}, answer:"b", difficulty:"zor", skill:"cikarim" },
  ]
}];

const K3_OKUMA: AkademikPassage[] = [{
  passage: "Bilişsel psikolojide 'çapa etkisi' olarak bilinen fenomen, karar verme süreçlerimizi şaşırtıcı biçimde etkiler. İlk karşılaştığımız bilgi — ne kadar alakasız olursa olsun — sonraki yargılarımız için bir referans noktası oluşturur. Örneğin bir deneyde katılımcılara rastgele bir sayı gösterilmiş, ardından BM'ye üye ülke sayısını tahmin etmeleri istenmiştir. Yüksek sayı görenlerin tahminleri, düşük sayı görenlerden sistematik olarak yüksek çıkmıştır. Bu etki pazarlamada, müzakerelerde ve hukuki kararlarda bile gözlemlenmektedir.",
  questions: [
    { id:"k3_oa_1", text:"Çapa etkisi nedir?", options:{a:"İlk bilginin sonraki yargıları etkilemesi",b:"Gemilerin çapa atması",c:"Hafıza kaybı",d:"Motivasyon artışı"}, answer:"a", difficulty:"kolay", skill:"detay_bulma" },
    { id:"k3_oa_2", text:"Çapa etkisi hangi alanlarda gözlemlenir?", options:{a:"Sadece laboratuvarda",b:"Pazarlama, müzakere ve hukuk",c:"Sadece eğitimde",d:"Sadece psikoloji kliniğinde"}, answer:"b", difficulty:"orta", skill:"detay_bulma" },
    { id:"k3_oa_3", text:"Yazarın amacı nedir?", options:{a:"Okuyucuyu korkutmak",b:"Bilişsel bir önyargıyı bilimsel kanıtlarla açıklamak",c:"BM'yi tanıtmak",d:"Pazarlama teknikleri öğretmek"}, answer:"b", difficulty:"orta", skill:"yazar_tutumu" },
    { id:"k3_oa_4", text:"Bu bilgi günlük hayatta nasıl kullanılabilir?", options:{a:"Hiçbir işe yaramaz",b:"Müzakerelerde ilk teklifinizi stratejik belirleyerek karşı tarafı etkileyebilirsiniz",c:"Gemicilik yapılabilir",d:"Hafıza güçlendirilebilir"}, answer:"b", difficulty:"zor", skill:"cikarim" },
    { id:"k3_oa_5", text:"Metinde kaçınılması gereken davranış hangisidir?", options:{a:"Analitik düşünme",b:"İlk bilgiye körü körüne güvenmek",c:"Araştırma yapmak",d:"Soru sormak"}, answer:"b", difficulty:"zor", skill:"cikarim" },
  ]
}];

const K4_OKUMA: AkademikPassage[] = [{
  passage: "Postmodern felsefede 'büyük anlatılar'ın sonu tezini ileri süren Jean-François Lyotard, Aydınlanma'nın evrensel ilerleme vaadinin artık geçerliliğini yitirdiğini savunmuştur. Lyotard'a göre bilginin meşrulaştırılması artık tek bir üst-anlatıya değil, yerel ve bağlamsal 'küçük anlatılar'a dayanmaktadır. Bu görüş, bilimin nesnel hakikat iddialarını da sorgulamış ve bilginin toplumsal iktidar yapılarıyla iç içe olduğunu vurgulamıştır. Eleştirmenler ise bu yaklaşımın nihilizme ve göreciliğe kapı araladığını öne sürmüştür.",
  questions: [
    { id:"k4_oa_1", text:"Lyotard'ın temel tezi nedir?", options:{a:"Bilim her zaman doğrudur",b:"Büyük anlatılar artık geçerli değildir",c:"Aydınlanma mükemmeldir",d:"Bilgi iktidardan bağımsızdır"}, answer:"b", difficulty:"kolay", skill:"detay_bulma" },
    { id:"k4_oa_2", text:"'Küçük anlatılar' ne anlama gelir?", options:{a:"Kısa hikâyeler",b:"Yerel ve bağlamsal bilgi meşrulaştırma biçimleri",c:"Çocuk masalları",d:"Bilimsel makaleler"}, answer:"b", difficulty:"orta", skill:"soz_varligi" },
    { id:"k4_oa_3", text:"Eleştirmenler ne söylüyor?", options:{a:"Lyotard haklı",b:"Bu yaklaşım nihilizme kapı aralar",c:"Büyük anlatılar doğrudur",d:"Bilgi iktidarla ilgisizdir"}, answer:"b", difficulty:"orta", skill:"detay_bulma" },
    { id:"k4_oa_4", text:"Metin hangi varsayımı sorgular?", options:{a:"Evrensel ve nesnel hakikatin varlığı",b:"Yerçekiminin varlığı",c:"Dünyanın yuvarlak olması",d:"Suyun akışkanlığı"}, answer:"a", difficulty:"orta", skill:"cikarim" },
    { id:"k4_oa_5", text:"Bu tartışmanın bilim etiği açısından sonucu ne olabilir?", options:{a:"Bilime güvenmemek gerekir",b:"Bilimsel iddiaların sosyal bağlamını da değerlendirmek gerekir",c:"Bilim tamamen nesnel kabul edilmelidir",d:"Felsefe bilimden daha önemlidir"}, answer:"b", difficulty:"zor", skill:"cikarim" },
  ]
}];

export function gradeToKademe(grade: number): AkademikKademe {
  return KADEME_MAP[grade] ?? 'kademe_2';
}

export function getAkademikSections(grade?: number, version?: string): AkademikSection[] {
  let kademe: AkademikKademe;
  if (grade != null) {
    kademe = gradeToKademe(grade);
  } else if (version === 'ilkogretim') {
    kademe = 'kademe_1';
  } else if (version === 'lise') {
    kademe = 'kademe_3';
  } else {
    kademe = 'kademe_2';
  }

  const sectionMap: Record<AkademikKademe, { okuma: AkademikPassage[]; matematik: AkademikMCQ[]; mantik: AkademikMCQ[]; ozDeger: AkademikLikertQ[] }> = {
    kademe_1: { okuma: K1_OKUMA, matematik: K1_MATEMATIK, mantik: K1_MANTIK, ozDeger: K1_OZ_DEGER },
    kademe_2: { okuma: K2_OKUMA, matematik: K2_MATEMATIK, mantik: K2_MANTIK, ozDeger: K2_OZ_DEGER },
    kademe_3: { okuma: K3_OKUMA, matematik: K3_MATEMATIK, mantik: K3_MANTIK, ozDeger: K3_OZ_DEGER },
    kademe_4: { okuma: K4_OKUMA, matematik: K4_MATEMATIK, mantik: K4_MANTIK, ozDeger: K4_OZ_DEGER },
  };

  const d = sectionMap[kademe];
  return [
    { name: '📖 Okuma Anlama', icon: '📖', type: 'passage_mc', data: d.okuma },
    { name: '🔢 Matematiksel Muhakeme', icon: '🔢', type: 'mc', data: d.matematik },
    { name: '🧩 Mantıksal Düşünme', icon: '🧩', type: 'mc', data: d.mantik },
    { name: '📝 Akademik Öz-Değerlendirme', icon: '📝', type: 'likert', data: d.ozDeger },
  ];
}

export function calculateAkademik(
  answers: Record<string, number | string>,
  grade?: number,
  version?: string
): AkademikScores {
  const kademe = grade ? gradeToKademe(grade) : (version === 'ilkogretim' ? 'kademe_1' : version === 'lise' ? 'kademe_3' : 'kademe_2');
  const sections = getAkademikSections(grade, version);
  const results: Record<string, AkademikSectionResult> = {};

  for (const sec of sections) {
    if (sec.type === 'passage_mc') {
      let correct = 0, total = 0, weighted = 0, weightedMax = 0;
      const diffBreakdown: Record<string, [number, number]> = { kolay: [0,0], orta: [0,0], zor: [0,0] };
      const skillBreakdown: Record<string, [number, number]> = {};

      for (const passage of sec.data as AkademikPassage[]) {
        for (const q of passage.questions) {
          total++;
          const w = DIFFICULTY_WEIGHTS[q.difficulty] ?? 1;
          weightedMax += w;
          diffBreakdown[q.difficulty][1] += 1;
          if (!skillBreakdown[q.skill]) skillBreakdown[q.skill] = [0,0];
          skillBreakdown[q.skill][1] += 1;
          if (answers[q.id] === q.answer) {
            correct++; weighted += w;
            diffBreakdown[q.difficulty][0] += 1;
            skillBreakdown[q.skill][0] += 1;
          }
        }
      }
      const pct = weightedMax > 0 ? Math.round((weighted / weightedMax) * 1000) / 10 : 0;
      results[sec.name] = {
        correct, total, pct, weightedScore: weighted, weightedMax,
        difficultyBreakdown: Object.fromEntries(Object.entries(diffBreakdown).map(([k, [c, t]]) => [k, { correct: c, total: t, pct: t > 0 ? Math.round(c/t*1000)/10 : 0 }])),
        skillBreakdown: Object.fromEntries(Object.entries(skillBreakdown).map(([k, [c, t]]) => [k, { correct: c, total: t, pct: t > 0 ? Math.round(c/t*1000)/10 : 0 }])),
      };
    } else if (sec.type === 'mc') {
      let correct = 0, total = 0, weighted = 0, weightedMax = 0;
      const diffBreakdown: Record<string, [number, number]> = { kolay: [0,0], orta: [0,0], zor: [0,0] };
      const skillBreakdown: Record<string, [number, number]> = {};

      for (const q of sec.data as AkademikMCQ[]) {
        total++;
        const w = DIFFICULTY_WEIGHTS[q.difficulty] ?? 1;
        weightedMax += w;
        diffBreakdown[q.difficulty][1] += 1;
        if (!skillBreakdown[q.skill]) skillBreakdown[q.skill] = [0,0];
        skillBreakdown[q.skill][1] += 1;
        if (answers[q.id] === q.answer) {
          correct++; weighted += w;
          diffBreakdown[q.difficulty][0] += 1;
          skillBreakdown[q.skill][0] += 1;
        }
      }
      const pct = weightedMax > 0 ? Math.round((weighted / weightedMax) * 1000) / 10 : 0;
      results[sec.name] = {
        correct, total, pct, weightedScore: weighted, weightedMax,
        difficultyBreakdown: Object.fromEntries(Object.entries(diffBreakdown).map(([k, [c, t]]) => [k, { correct: c, total: t, pct: t > 0 ? Math.round(c/t*1000)/10 : 0 }])),
        skillBreakdown: Object.fromEntries(Object.entries(skillBreakdown).map(([k, [c, t]]) => [k, { correct: c, total: t, pct: t > 0 ? Math.round(c/t*1000)/10 : 0 }])),
      };
    } else if (sec.type === 'likert') {
      let totalScore = 0;
      const count = (sec.data as AkademikLikertQ[]).length;
      for (const q of sec.data as AkademikLikertQ[]) {
        const val = Number(answers[q.id] ?? 3);
        totalScore += isNaN(val) ? 3 : val;
      }
      const maxScore = count * 5;
      const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;
      results[sec.name] = { score: totalScore, max: maxScore, pct, count };
    }
  }

  const perfKeys = Object.keys(results).filter(k => !k.includes('Öz-Değerlendirme'));
  const ozKey = Object.keys(results).find(k => k.includes('Öz-Değerlendirme'));
  const perfAvg = perfKeys.length > 0 ? perfKeys.reduce((s, k) => s + (results[k]?.pct ?? 0), 0) / perfKeys.length : 0;
  const ozAvg = ozKey ? (results[ozKey]?.pct ?? 0) : 0;
  const overall = Math.round((perfAvg * 0.75 + ozAvg * 0.25) * 10) / 10;

  let level: string, levelEmoji: string, levelDesc: string;
  if (overall >= 80) { level = 'Çok Yüksek'; levelEmoji = '🟢'; levelDesc = 'Akademik yetkinlik mükemmel düzeyde.'; }
  else if (overall >= 65) { level = 'Yüksek'; levelEmoji = '🔵'; levelDesc = 'Akademik yetkinlik ortalamanın üzerinde.'; }
  else if (overall >= 50) { level = 'Orta'; levelEmoji = '🟡'; levelDesc = 'Akademik yetkinlik ortalama düzeyde.'; }
  else if (overall >= 35) { level = 'Gelişime Açık'; levelEmoji = '🟠'; levelDesc = 'Akademik yetkinlik gelişime açık.'; }
  else { level = 'Acil Destek'; levelEmoji = '🔴'; levelDesc = 'Akademik destek ihtiyacı tespit edildi.'; }

  const gap = Math.round((ozAvg - perfAvg) * 10) / 10;
  let gapType: string, gapDesc: string;
  if (Math.abs(gap) <= 10) { gapType = 'tutarli'; gapDesc = 'Öz değerlendirme performansla tutarlı.'; }
  else if (gap > 20) { gapType = 'asiri_ozguvenli'; gapDesc = `Kendini %${Math.abs(gap)} yüksek değerlendiriyor.`; }
  else if (gap > 10) { gapType = 'hafif_ozguvenli'; gapDesc = `Kendini biraz yüksek değerlendiriyor (fark: %${Math.abs(gap)}).`; }
  else if (gap < -20) { gapType = 'dusuk_ozguven'; gapDesc = `Kendini %${Math.abs(gap)} düşük değerlendiriyor.`; }
  else { gapType = 'hafif_dusuk'; gapDesc = `Kendini biraz düşük değerlendiriyor (fark: %${Math.abs(gap)}).`; }

  const perfSorted = perfKeys.map(k => ({ name: k, pct: results[k]?.pct ?? 0 })).sort((a, b) => b.pct - a.pct);
  const strongest = perfSorted[0] ?? { name: '', pct: 0 };
  const weakest = perfSorted[perfSorted.length - 1] ?? { name: '', pct: 0 };

  return {
    version: version ?? kademe, kademe, kademLabel: KADEME_LABELS[kademe], grade: grade ?? null,
    sections: results, performanceAvg: Math.round(perfAvg * 10) / 10, selfAssessment: ozAvg,
    overall, level, levelEmoji, levelDesc, strongest, weakest, gap, gapType, gapDesc,
  };
}

export function generateAkademikReport(scores: AkademikScores): string {
  const bar = (pct: number) => {
    const n = Math.max(0, Math.min(10, Math.round(pct / 10)));
    return '█'.repeat(n) + '░'.repeat(10 - n);
  };
  const lvlIcon = (pct: number) => pct >= 80 ? '🟢' : pct >= 65 ? '🔵' : pct >= 50 ? '🟡' : pct >= 35 ? '🟠' : '🔴';

  let secRows = '';
  for (const [name, data] of Object.entries(scores.sections)) {
    const pct = data.pct;
    const detail = data.correct != null ? `${data.correct}/${data.total}` : `${data.score}/${data.max}`;
    secRows += `| ${lvlIcon(pct)} ${name} | ${detail} | %${pct} | ${bar(pct)} |\n`;
  }

  return `# 📚 AKADEMİK ANALİZ RAPORU — ${scores.kademLabel}

---

## 📊 Genel Akademik Profil

| Gösterge | Değer |
|----------|-------|
| 📈 Genel Akademik Skor | ${scores.levelEmoji} **%${scores.overall}** |
| 🎯 Performans Ortalaması | %${scores.performanceAvg} |
| 📝 Öz-Değerlendirme | %${scores.selfAssessment} |
| 🏆 Akademik Seviye | **${scores.level}** |

${bar(scores.overall)} %${scores.overall}

${scores.levelDesc}

---

## 📋 Bölüm Bazlı Sonuçlar

| Bölüm | Doğru/Toplam | Yüzde | Grafik |
|-------|-------------|-------|--------|
${secRows}

---

## 💪 En Güçlü Alan: ${scores.strongest.name}
%${scores.strongest.pct} başarı oranıyla en güçlü performans.

## 🌱 Gelişim Alanı: ${scores.weakest.name}
%${scores.weakest.pct} başarı oranıyla gelişim potansiyeli taşıyor.

---

## 🔍 Öz-Değerlendirme Analizi

${scores.gapDesc}

---

## 📌 Özet Tablo

| Gösterge | Sonuç |
|----------|-------|
| Kademe | ${scores.kademLabel} |
| Genel Skor | **%${scores.overall}** (${scores.level}) |
| En Güçlü Alan | ${scores.strongest.name} (%${scores.strongest.pct}) |
| Gelişim Alanı | ${scores.weakest.name} (%${scores.weakest.pct}) |
| Performans / Öz-Değerlendirme | %${scores.performanceAvg} / %${scores.selfAssessment} |`;
}
