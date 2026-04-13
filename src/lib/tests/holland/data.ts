// ============================================================
// Holland RIASEC — Veri
// ============================================================

export interface HollandQuestion {
  id: number;
  text: string;
  type: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
}

export interface HollandTypeInfo {
  name: string;
  icon: string;
  short: string;
  description: string;
  characteristics: string[];
  careers: string[];
  studyEnvironment: string;
}

export const HOLLAND_TYPES: Record<string, HollandTypeInfo> = {
  R: {
    name: "Gerçekçi (Realistic)", icon: "🔧", short: "Gerçekçi",
    description: "Uygulamacı, somut ve pratik işleri seven bir yapın var! Elleriyle çalışmayı, fiziksel aktiviteleri ve somut sonuçlar üretmeyi tercih edersin.",
    characteristics: ["Pratik ve uygulamacı", "El becerisi ve mekanik yeteneği güçlü", "Somut ve elle tutulur sonuçları sever", "Açık havada çalışmaktan hoşlanır", "Araç, makine ve aletlerle çalışmayı sever"],
    careers: ["Makine/Elektrik/İnşaat Mühendisi", "Pilot", "Mimar (Uygulama)", "Ziraat Mühendisi", "Elektronikçi", "Ormancı", "Beden Eğitimi Öğretmeni", "Aşçı/Şef"],
    studyEnvironment: "Laboratuvar, atölye ve açık hava etkinlikleri sana en uygun öğrenme ortamı.",
  },
  I: {
    name: "Araştırmacı (Investigative)", icon: "🔬", short: "Araştırmacı",
    description: "Meraklı, analitik ve bilimsel düşünmeyi seven bir yapın var! Problemleri araştırmayı, gözlem yapmayı ve çözüm üretmeyi seversin.",
    characteristics: ["Meraklı ve analitik düşünür", "Bilimsel yöntemlere ilgi duyar", "Bağımsız çalışmayı tercih eder", "Matematiksel ve mantıksal düşünce güçlü", "Eleştirel ve sorgulayıcı"],
    careers: ["Fizikçi/Kimyager/Biyolog", "Doktor", "Eczacı", "Yazılım Mühendisi", "Araştırmacı/Akademisyen", "Psikolog", "Matematikçi", "Veteriner"],
    studyEnvironment: "Kütüphane, laboratuvar ve bireysel araştırma ortamları sana en uygun.",
  },
  A: {
    name: "Sanatçı (Artistic)", icon: "🎨", short: "Sanatçı",
    description: "Yaratıcı, özgür düşünceli ve estetik duyarlılığı yüksek bir yapın var! Kendini ifade etmeyi ve özgün eserler ortaya koymayı seversin.",
    characteristics: ["Yaratıcı ve hayal gücü zengin", "Estetik duyarlılığı yüksek", "Özgün ve alışılmadık fikirleri sever", "Yapılandırılmamış ortamlarda daha iyi çalışır", "Duygusal ifade gücü kuvvetli"],
    careers: ["Ressam/Heykeltıraş", "Müzisyen/Besteci", "Yazar/Şair", "Grafik Tasarımcı", "Fotoğrafçı", "Oyuncu", "Moda Tasarımcısı", "Reklamcı"],
    studyEnvironment: "Özgür ve yaratıcı ortamlar, bireysel projeler sana en uygun.",
  },
  S: {
    name: "Sosyal (Social)", icon: "🤝", short: "Sosyal",
    description: "İnsanlarla çalışmayı, onlara yardım etmeyi ve öğretmeyi seven bir yapın var! Empati ve iletişim senin güçlü yönlerin.",
    characteristics: ["İnsanlarla çalışmayı sever", "Empati yeteneği güçlü", "İyi bir dinleyici ve iletişimci", "Öğretmeyi ve yardım etmeyi sever", "Takım çalışmasına yatkın"],
    careers: ["Öğretmen/Akademisyen", "Psikolog/Danışman", "Sosyal Hizmet Uzmanı", "Hemşire/Doktor", "İnsan Kaynakları", "Toplum Lideri", "Terapist"],
    studyEnvironment: "Grup çalışmaları, tartışmalar ve sosyal projeler sana en uygun.",
  },
  E: {
    name: "Girişimci (Enterprising)", icon: "💼", short: "Girişimci",
    description: "Liderlik etmeyi, ikna etmeyi ve risk almayı seven bir yapın var! Hedeflerine ulaşmak için insanları organize edebilirsin.",
    characteristics: ["Doğal liderlik özellikleri", "İkna ve etkileme becerisi güçlü", "Rekabetçi ve hırslı", "Risk almaktan çekinmez", "Organizasyon ve yönetim becerileri iyi"],
    careers: ["İşletmeci/Girişimci", "Satış/Pazarlama Müdürü", "Avukat", "Politikacı", "Yönetici/CEO", "Broker", "Proje Müdürü"],
    studyEnvironment: "Liderlik rolleri, proje bazlı çalışmalar ve sunum ortamları sana en uygun.",
  },
  C: {
    name: "Geleneksel (Conventional)", icon: "📊", short: "Geleneksel",
    description: "Düzenli, sistemli ve kurallara uygun çalışmayı seven bir yapın var! Detaylara dikkat etmek ve verileri organize etmek senin güçlü yönlerin.",
    characteristics: ["Düzenli ve sistematik çalışır", "Detaylara çok dikkat eder", "Kurallara ve prosedürlere saygılı", "Veri ve sayılarla rahat çalışır", "Güvenilir ve tutarlı"],
    careers: ["Muhasebeci/Mali Müşavir", "Banka Çalışanı", "Sekreter/İdari Asistan", "Veri Analisti", "Arşivci", "Vergi Uzmanı", "Aktüer"],
    studyEnvironment: "Yapılandırılmış, sessiz ve düzenli ortamlar sana en uygun.",
  },
};

export const HOLLAND_QUESTIONS: HollandQuestion[] = [
  // R (Gerçekçi) — 1-14
  { id: 1,  text: "Bir şeyi tamir etmekten hoşlanırım.", type: "R" },
  { id: 2,  text: "Açık havada çalışmaktan hoşlanırım.", type: "R" },
  { id: 3,  text: "Mekanik araçları ve makineleri kullanmaktan zevk alırım.", type: "R" },
  { id: 4,  text: "Elleri ile çalışmayı severim.", type: "R" },
  { id: 5,  text: "Fiziksel güç ve dayanıklılık gerektiren aktivitelerden hoşlanırım.", type: "R" },
  { id: 6,  text: "Somut ve elle tutulur sonuçlar üretmekten zevk alırım.", type: "R" },
  { id: 7,  text: "Spor yapmayı ve atletik aktivitelere katılmayı severim.", type: "R" },
  { id: 8,  text: "Pratik problemleri çözmekten hoşlanırım.", type: "R" },
  { id: 9,  text: "Yapım işleri ve inşaatla ilgili faaliyetleri severim.", type: "R" },
  { id: 10, text: "Araç gereç ve ekipmanlarla çalışmaktan keyif alırım.", type: "R" },
  { id: 11, text: "Ürün geliştirme ve prototip oluşturma gibi aktivitelerden hoşlanırım.", type: "R" },
  { id: 12, text: "Yemek pişirmek veya el sanatlarıyla ilgilenmekten hoşlanırım.", type: "R" },
  { id: 13, text: "Arabaları veya diğer motorlu araçları tamir etmek ilgimi çeker.", type: "R" },
  { id: 14, text: "Elektronik cihazları sökmeyi ve onarmayı severim.", type: "R" },
  // I (Araştırmacı) — 15-28
  { id: 15, text: "Bağımsız çalışmayı ve kendi başıma problem çözmeyi tercih ederim.", type: "I" },
  { id: 16, text: "Bilimsel araştırmalara ilgi duyarım.", type: "I" },
  { id: 17, text: "Karmaşık sorunları analiz etmekten zevk alırım.", type: "I" },
  { id: 18, text: "Matematiksel problemleri çözmekten hoşlanırım.", type: "I" },
  { id: 19, text: "Doğal dünya hakkında sorular sormaktan ve araştırma yapmaktan hoşlanırım.", type: "I" },
  { id: 20, text: "Teorileri ve kavramları incelemeyi severim.", type: "I" },
  { id: 21, text: "Bilgisayar programlama ve kodlamayı ilginç bulurum.", type: "I" },
  { id: 22, text: "Yeni şeyler öğrenmek ve keşfetmek beni heyecanlandırır.", type: "I" },
  { id: 23, text: "Sorunların kök nedenlerini bulmaya çalışırım.", type: "I" },
  { id: 24, text: "Veri toplama ve analiz etmekten zevk alırım.", type: "I" },
  { id: 25, text: "Deney yapmayı ve hipotezleri test etmeyi severim.", type: "I" },
  { id: 26, text: "Gözlem yaparak sonuçlar çıkarmaktan hoşlanırım.", type: "I" },
  { id: 27, text: "Teknik konular ve uzmanlık gerektiren alanlar ilgimi çeker.", type: "I" },
  { id: 28, text: "Karmaşık sistemlerin nasıl çalıştığını anlamaktan zevk alırım.", type: "I" },
  // A (Sanatçı) — 29-42
  { id: 29, text: "Resim yapmayı, çizmeyi veya el sanatlarıyla ilgilenmeyi severim.", type: "A" },
  { id: 30, text: "Yazı yazmaktan (şiir, hikaye, deneme gibi) hoşlanırım.", type: "A" },
  { id: 31, text: "Müzikle ilgilenmek (dinlemek, çalmak, söylemek) beni mutlu eder.", type: "A" },
  { id: 32, text: "Yaratıcı projeler üzerinde çalışmaktan zevk alırım.", type: "A" },
  { id: 33, text: "Kendimi sanatsal yollarla ifade etmeyi severim.", type: "A" },
  { id: 34, text: "Estetik ve güzellik benim için önemlidir.", type: "A" },
  { id: 35, text: "Hayal gücümü kullanarak yeni fikirler üretmekten hoşlanırım.", type: "A" },
  { id: 36, text: "Fotoğrafçılık, film veya multimedya ile ilgilenmekten zevk alırım.", type: "A" },
  { id: 37, text: "Dans, tiyatro veya performans sanatlarına ilgi duyarım.", type: "A" },
  { id: 38, text: "Farklı kültürler ve sanat formlarını keşfetmekten hoşlanırım.", type: "A" },
  { id: 39, text: "Doğaçlama yapmaktan ve ani kararlar almaktan zevk alırım.", type: "A" },
  { id: 40, text: "Moda, tasarım veya dekorasyon ile ilgilenmekten hoşlanırım.", type: "A" },
  { id: 41, text: "Sanatsal veya yaratıcı bir ortamda çalışmak isterim.", type: "A" },
  { id: 42, text: "Yenilikçi ve orijinal fikirler geliştirmekten zevk alırım.", type: "A" },
  // S (Sosyal) — 43-56
  { id: 43, text: "Başkalarına yardım etmekten ve onları desteklemekten hoşlanırım.", type: "S" },
  { id: 44, text: "Öğretme veya eğitim verme konusunda tutkuluyum.", type: "S" },
  { id: 45, text: "İnsanlarla çalışmayı ve onlarla etkileşimde bulunmayı severim.", type: "S" },
  { id: 46, text: "Sosyal sorunlar ve toplumsal konular benim için önemlidir.", type: "S" },
  { id: 47, text: "Danışmanlık ve rehberlik yapmaktan zevk alırım.", type: "S" },
  { id: 48, text: "İyi bir dinleyiciyimdir ve insanlar sorunlarını benimle paylaşır.", type: "S" },
  { id: 49, text: "Çocuklarla veya gençlerle çalışmaktan hoşlanırım.", type: "S" },
  { id: 50, text: "Takım çalışması ve işbirliği benim için önemlidir.", type: "S" },
  { id: 51, text: "İnsanları motive etmek ve teşvik etmek beni memnun eder.", type: "S" },
  { id: 52, text: "Topluluk projeleri ve gönüllü faaliyetlere ilgi duyarım.", type: "S" },
  { id: 53, text: "Başkalarının gelişimine katkı sağlamaktan mutluluk duyarım.", type: "S" },
  { id: 54, text: "İnsanları anlayabilmek ve empati kurabilmek benim için kolaydır.", type: "S" },
  { id: 55, text: "Sağlık hizmetleri veya sosyal hizmetler alanında çalışmak isterim.", type: "S" },
  { id: 56, text: "Farklı kültürlerden ve geçmişlerden gelen insanlarla çalışmaktan hoşlanırım.", type: "S" },
  // E (Girişimci) — 57-70
  { id: 57, text: "Başkalarını etkilemek ve ikna etmek benim için önemlidir.", type: "E" },
  { id: 58, text: "Liderlik rolleri üstlenmekten ve sorumluluk almaktan hoşlanırım.", type: "E" },
  { id: 59, text: "Girişimcilik ve iş kurmak benim için ilgi çekicidir.", type: "E" },
  { id: 60, text: "Rekabetçi ortamlarda çalışmaktan zevk alırım.", type: "E" },
  { id: 61, text: "Satış, pazarlama veya müzakere konularına ilgi duyarım.", type: "E" },
  { id: 62, text: "Risk almak ve cesur kararlar vermek beni heyecanlandırır.", type: "E" },
  { id: 63, text: "Proje yönetimi ve organizasyon konularında başarılıyımdır.", type: "E" },
  { id: 64, text: "Sunum yapma ve kamuoyu önünde konuşma konusunda kendime güveniyorum.", type: "E" },
  { id: 65, text: "Stratejik planlama ve uzun vadeli düşünmekten zevk alırım.", type: "E" },
  { id: 66, text: "İş dünyasındaki gelişmeleri ve trendleri takip etmekten hoşlanırım.", type: "E" },
  { id: 67, text: "Finansal konular ve yatırımlar ilgimi çeker.", type: "E" },
  { id: 68, text: "Başkalarını harekete geçirmek ve motive etmek konusunda iyiyimdir.", type: "E" },
  { id: 69, text: "Yeni iş fırsatları bulmak ve değerlendirmek beni heyecanlandırır.", type: "E" },
  { id: 70, text: "Bir hedef belirleyip o hedefe ulaşmak için plan yapmaktan hoşlanırım.", type: "E" },
  // C (Geleneksel) — 71-84
  { id: 71, text: "Verileri düzenlemek ve kayıt tutmaktan zevk alırım.", type: "C" },
  { id: 72, text: "Belirli kurallara ve prosedürlere uymak benim için önemlidir.", type: "C" },
  { id: 73, text: "Muhasebe ve finans konuları ilgimi çeker.", type: "C" },
  { id: 74, text: "Düzenli ve sistematik bir çalışma ortamını tercih ederim.", type: "C" },
  { id: 75, text: "Detaylara dikkat etmek ve hataları fark etmek konusunda iyiyimdir.", type: "C" },
  { id: 76, text: "Hesap tabloları ve veritabanlarıyla çalışmaktan hoşlanırım.", type: "C" },
  { id: 77, text: "Bürokrasi ve idari işler benim için anlamlıdır.", type: "C" },
  { id: 78, text: "Kesin ve ölçülebilir sonuçlar üretmekten zevk alırım.", type: "C" },
  { id: 79, text: "Rutinlere ve düzenli çalışma alışkanlıklarına sahip olmaktan hoşlanırım.", type: "C" },
  { id: 80, text: "Ofis ortamında çalışmayı tercih ederim.", type: "C" },
  { id: 81, text: "Bütçe planlaması ve maliyet analizi konularında başarılıyımdır.", type: "C" },
  { id: 82, text: "Bilgileri doğru ve eksiksiz bir şekilde aktarmak benim için önemlidir.", type: "C" },
  { id: 83, text: "Standartlara ve kalite kontrolüne önem veririm.", type: "C" },
  { id: 84, text: "İdari ve destek hizmetleri alanında çalışmak isterim.", type: "C" },
];
