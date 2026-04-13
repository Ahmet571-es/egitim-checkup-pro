// ============================================================
// Sınav Kaygısı Ölçeği — Veri (50 soru)
// ============================================================

export interface SinavKaygisiQuestion {
  id: number;
  text: string;
}

export const SINAV_KAYGISI_QUESTIONS: SinavKaygisiQuestion[] = [
  { id: 1,  text: "Sınava girmeden de sınıf geçmenin ve başarılı olmanın bir yolu olmasını isterdim." },
  { id: 2,  text: "Bir sınavda başarılı olmak, diğer sınavlarda kendime güvenimin artmasına yardımcı olmaz." },
  { id: 3,  text: "Çevremizdekiler (ailem, arkadaşlarım) başaracağım konusunda bana güveniyorlar." },
  { id: 4,  text: "Bir sınav sırasında bazen zihnimin sınavla ilgili olmayan konulara kaydığını hissediyorum." },
  { id: 5,  text: "Önemli bir sınavdan önce veya sonra canım bir şey yemek istemez." },
  { id: 6,  text: "Öğretmenin sık sık küçük yazılı veya sözlü yoklamalar yaptığı derslerden nefret ederim." },
  { id: 7,  text: "Sınavların mutlaka resmi, ciddi ve gerginlik yaratan durumlar olması gerekmez." },
  { id: 8,  text: "Sınavlarda başarılı olanlar çoğunlukla hayatta da iyi pozisyonlara gelirler." },
  { id: 9,  text: "Önemli bir sınavdan önce veya sınav sırasında bazı arkadaşlarımın çalışırken daha az zorlandıklarını ve benden daha akıllı olduklarını düşünürüm." },
  { id: 10, text: "Eğer sınavlar olmasaydı dersleri daha iyi öğreneceğimden eminim." },
  { id: 11, text: "Ne kadar başarılı olacağım konusundaki endişeler, sınava hazırlığımı ve sınav başarımı etkiler." },
  { id: 12, text: "Önemli bir sınava girecek olmam uykularımı bozar." },
  { id: 13, text: "Sınav sırasında çevremdeki insanların gezinmesi ve bana bakmalarından endişe duyarım." },
  { id: 14, text: "Her zaman düşünmesem de başarısız olursam çevremdekilerinin bana hangi gözle bakacakları konusunda endişelenirim." },
  { id: 15, text: "Geleceğimin sınavlarda göstereceğim başarıya bağlı olması beni üzüyor." },
  { id: 16, text: "Kendimi bir toplayabilsem, birçok kişiden daha iyi not alacağımı biliyorum." },
  { id: 17, text: "Başarısız olursam, insanlar benim yeteneğimden şüpheye düşecekler." },
  { id: 18, text: "Hiçbir zaman sınavlara tam olarak hazırlandığım duygusunu yaşayamam." },
  { id: 19, text: "Bir sınavdan önce bir türlü gevşeyemem." },
  { id: 20, text: "Önemli sınavlardan önce zihnim adeta durur kalır." },
  { id: 21, text: "Bir sınav sırasında dışarıdan gelen gürültüler, çevremdekilerinin çıkardıkları sesler, ışık, oda sıcaklığı vb. beni rahatsız eder." },
  { id: 22, text: "Sınavdan önce daima huzursuz, gergin ve sıkıntılı olurum." },
  { id: 23, text: "Sınavların insanın gelecekteki amaçlarına ulaşması konusunda ölçü olmasına hayret ederim." },
  { id: 24, text: "Sınavlar insanın gerçekten ne kadar bildiğini göstermez." },
  { id: 25, text: "Düşük not aldığımda, hiç kimseye notumu söyleyemem." },
  { id: 26, text: "Bir sınavdan önce çoğunlukla içimden bağırmak gelir." },
  { id: 27, text: "Önemli sınavlardan önce midem bulanır." },
  { id: 28, text: "Önemli bir sınava çalışırken çok kere olumsuz düşüncelerle peşin bir yenilgiyi yaşarım." },
  { id: 29, text: "Sınav sonuçlarını almadan önce kendimi çok endişeli ve huzursuz hissederim." },
  { id: 30, text: "Sınava başlarken, bir sınav veya teste ihtiyaç duyulmayan bir işe girebilmeyi çok isterim." },
  { id: 31, text: "Bir sınavda başarılı olamazsam, zaman zaman zannettiğim kadar akıllı olmadığımı düşünürüm." },
  { id: 32, text: "Eğer kırık not alırsam, annem ve babam müthiş hayal kırıklığına uğrar." },
  { id: 33, text: "Sınavlarla ilgili endişelerim çoğunlukla tam olarak hazırlanmamı engeller ve bu durum beni daha çok endişelendirir." },
  { id: 34, text: "Sınav sırasında, bacağımı salladığımı, parmaklarımı sıraya vurduğumu fark ediyorum." },
  { id: 35, text: "Bir sınavdan sonra çoğunlukla yapmış olduğumdan daha iyi yapabileceğimi düşünürüm." },
  { id: 36, text: "Bir sınav sırasında duygularım dikkatimin dağılmasına sebep olur." },
  { id: 37, text: "Bir sınava ne kadar çok çalışırsam, o kadar çok karıştırıyorum." },
  { id: 38, text: "Başarısız olursam, kendimle ilgili görüşlerim değişir." },
  { id: 39, text: "Bir sınav sırasında bedenimin belirli yerlerindeki kaslar kasılır." },
  { id: 40, text: "Bir sınavdan önce ne kendime tam olarak güvenebilirim, ne de zihinsel olarak gevşeyebilirim." },
  { id: 41, text: "Başarısız olursam arkadaşlarımın gözünde değerimin düşeceğini biliyorum." },
  { id: 42, text: "Önemli problemlerimden biri, bir sınava tam olarak hazırlanıp hazırlanmadığımı bilmemektir." },
  { id: 43, text: "Gerçekten önemli bir sınava girerken çoğunlukla bedensel olarak panik içinde olurum." },
  { id: 44, text: "Testi değerlendirenlerin bazı öğrencilerin sınavda çok heyecanlandıklarını bilmelerini ve bunu testi değerlendirirken hesaba katmalarını isterdim." },
  { id: 45, text: "Sınıf geçmek için sınava girmektense ödev hazırlamayı tercih ederim." },
  { id: 46, text: "Kendi notumu söylemeden önce arkadaşlarımın kaç aldığını bilmek isterim." },
  { id: 47, text: "Kırık not aldığım zaman, tanıdığım bazı insanların benimle alay edeceğini biliyorum ve bu beni rahatsız ediyor." },
  { id: 48, text: "Eğer sınavlara yalnız başıma girsem ve zamanla sınırlanmamış olsam daha başarılı olacağımı düşünüyorum." },
  { id: 49, text: "Sınavdaki sonuçların hayat başarım ve güvenliğimle doğrudan ilgili olduğunu düşünürüm." },
  { id: 50, text: "Sınavlar sırasında bazen gerçekten bildiklerimi unutacak kadar heyecanlanıyorum." },
];

// Soru 3 ters madde (olumlu ifade → kaygı YOK)
export const SINAV_KAYGISI_TERS_MADDELER = new Set([3]);

export interface SinavKaygisiCategory {
  name: string;
  icon: string;
  questionIds: number[];
  maxScore: number;
  interpretations: {
    high: { range: [number, number]; text: string; tips: string[] };
    mid:  { range: [number, number]; text: string; tips: string[] };
    low:  { range: [number, number]; text: string; tips: string[] };
  };
}

export const SINAV_KAYGISI_CATEGORIES: Record<string, SinavKaygisiCategory> = {
  baskalari_gorusu: {
    name: "Başkalarının Sizi Nasıl Gördüğü ile İlgili Endişeler", icon: "👥",
    questionIds: [14, 17, 25, 32, 41, 46, 47], maxScore: 7,
    interpretations: {
      high: { range: [5, 7], text: "Başkalarının seni nasıl gördüğü senin için büyük önem taşıyor. Çevrendeki insanların değerlendirmeleri sınav durumunda zihinsel faaliyetini olumsuz etkiliyor.", tips: ["Unutma: Sınavda ölçülen senin bilgin, kişiliğin veya değerin değil!", "Herkesin farklı güçlü yönleri var — kendini başkalarıyla kıyaslama.", "Güvendiğin birisiyle bu endişelerini paylaş."] },
      mid:  { range: [3, 4], text: "Başkalarının görüşleri seni bir miktar etkiliyor. Bu normal bir seviyede ama dikkat etmekte fayda var.", tips: ["Kendi başarı ölçütlerini belirle.", "Küçük başarılarını fark et ve kutla."] },
      low:  { range: [0, 2], text: "Başkalarının seninle ilgili görüşleri seni fazla etkilemiyor. Harika! 🎉", tips: [] },
    },
  },
  kendi_gorusu: {
    name: "Kendinizi Nasıl Gördüğünüzle İlgili Endişeler", icon: "🪞",
    questionIds: [2, 9, 16, 24, 31, 38, 40], maxScore: 7,
    interpretations: {
      high: { range: [5, 7], text: "Sınavlardaki başarınla kendinize olan saygını eşdeğer görüyorsun. Sınavlarda ölçülenin kişilik değerin değil, bilgi düzeyin olduğunu kabullenmek sana yardımcı olacaktır.", tips: ["Sınav sonucu senin değerini belirlemez — bunu kendine sık sık hatırlat.", "Başarısızlık bir son değil, öğrenme fırsatıdır.", "Güçlü yönlerinin bir listesini yap ve zor anlarda oku."] },
      mid:  { range: [3, 4], text: "Sınav sonuçları öz güvenini kısmen etkiliyor.", tips: ["Sınav dışı başarılarını da hatırla.", "Her sınavdan sonra 'ne öğrendim?' diye sor."] },
      low:  { range: [0, 2], text: "Sınavlardaki başarınla kendi kişiliğine verdiğin değeri birbirinden iyi ayırabiliyorsun. Süper! 🎉", tips: [] },
    },
  },
  gelecek_endisesi: {
    name: "Gelecekle İlgili Endişeler", icon: "🔮",
    questionIds: [1, 8, 15, 23, 30, 49], maxScore: 6,
    interpretations: {
      high: { range: [4, 6], text: "Sınavlardaki başarını gelecekteki mutluluğunun ve başarının tek ölçüsü olarak görüyorsun.", tips: ["Hayatta başarılı olmanın birçok yolu var — sınav bunlardan sadece biri.", "Bugüne odaklan: 'Şimdi ne yapabilirim?' diye sor.", "Sınavları bir tehdit değil, geçilmesi gereken basamaklar olarak gör."] },
      mid:  { range: [2, 3], text: "Gelecekle ilgili bazı endişelerin var ama bunlar henüz kontrol dışına çıkmamış.", tips: ["Kısa vadeli hedefler koy.", "Başarılı insanların hikayelerini oku."] },
      low:  { range: [0, 1], text: "Gelecekteki mutluluğunun tek belirleyicisinin sınavlar olmadığının farkındasın. Harika! 🎉", tips: [] },
    },
  },
  hazirlik_endisesi: {
    name: "Yeterince Hazırlanamamakla İlgili Endişeler", icon: "📖",
    questionIds: [6, 11, 18, 26, 33, 42], maxScore: 6,
    interpretations: {
      high: { range: [4, 6], text: "Sınavları kişiliğin ve gelecekteki güvenliğinin bir ölçüsü olarak gördüğün için herhangi bir sınava hazırlık dönemi senin için bir kriz dönemi olabiliyor.", tips: ["Sınava en az 3 gün öncesinden çalışmaya başla.", "Çalışma planı yap.", "Çalıştıktan sonra kendini test et."] },
      mid:  { range: [2, 3], text: "Sınav hazırlığında bazen endişe yaşıyorsun ama genel olarak baş edebiliyorsun.", tips: ["Çalışma planını yazıya dök.", "Sınav öncesi küçük testler çöz."] },
      low:  { range: [0, 1], text: "Sınavlara büyük bir gerginlik hissetmeden hazırlanıyorsun. Tebrikler! 🎉", tips: [] },
    },
  },
  bedensel_tepkiler: {
    name: "Bedensel Tepkiler", icon: "💪",
    questionIds: [5, 12, 19, 27, 34, 39, 43], maxScore: 7,
    interpretations: {
      high: { range: [5, 7], text: "Sınava hazırlanırken iştahsızlık, uykusuzluk, gerginlik gibi bedensel rahatsızlıklarla mücadele etmek zorunda kaldığın anlaşılıyor.", tips: ["Derin nefes egzersizleri yap: 4 saniye nefes al, 4 saniye tut, 4 saniye ver.", "Sınavdan önce hafif egzersiz yap.", "Düzenli uyku çok önemli."] },
      mid:  { range: [3, 4], text: "Bazı bedensel belirtiler yaşıyorsun ama bunlar henüz ciddi düzeyde değil.", tips: ["Stresli dönemlerde fiziksel aktiviteyi artır.", "Düzenli beslenme ve uyku rutini oluştur."] },
      low:  { range: [0, 2], text: "Sınava hazırlık sırasında heyecanını kontrol edebildiğin anlaşılıyor. Çok iyi! 🎉", tips: [] },
    },
  },
  zihinsel_tepkiler: {
    name: "Zihinsel Tepkiler", icon: "🧠",
    questionIds: [4, 13, 20, 21, 28, 35, 36, 37, 48, 50], maxScore: 10,
    interpretations: {
      high: { range: [7, 10], text: "Sınava hazırlanırken veya sınav sırasında çevrende olan bitenden fazlasıyla etkilendiğin ve dikkatini toplamakta ciddi güçlük çektiğin görülüyor.", tips: ["Dikkatini toplama egzersizleri yap.", "Sınav sırasında olumsuz düşünceler geldiğinde 'DUR' de ve nefes al.", "Pozitif iç konuşma yap."] },
      mid:  { range: [4, 6], text: "Bazen dikkat dağınıklığı ve olumsuz düşünceler yaşıyorsun ama tamamen kontrol dışı değil.", tips: ["Sınav öncesi 5 dakika sessizce otur.", "Olumsuz düşünceleri yazıya dök."] },
      low:  { range: [0, 3], text: "Zihinsel açıdan sınava hazırlanırken önemli bir rahatsızlık yaşamadığın görülüyor. Muhteşem! 🎉", tips: [] },
    },
  },
  genel_kaygi: {
    name: "Genel Sınav Kaygısı", icon: "📋",
    questionIds: [7, 10, 22, 29, 44, 45], maxScore: 6,
    interpretations: {
      high: { range: [4, 6], text: "Sınavlarda kendine güvenemediğin, sınavları varlığın ve geleceğin için bir tehdit olarak gördüğün anlaşılıyor.", tips: ["Sınavı bir savaş değil, bir oyun gibi düşün.", "Geçmiş başarılarını hatırla.", "Sınav sonrası kendini ödüllendir."] },
      mid:  { range: [2, 3], text: "Genel sınav kaygın orta düzeyde.", tips: ["Her sınav için kısa bir strateji planı yap.", "Sınavdan önce güzel bir aktivite yap."] },
      low:  { range: [0, 1], text: "Genel olarak sınavlara karşı sağlıklı bir tutum içinde olduğun anlaşılıyor. Süper! 🎉", tips: [] },
    },
  },
};
