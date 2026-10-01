// ============================================================
// Rapor v2 — Enneagram tipleri (4-6)
// ============================================================
import type { Profile } from './types';

export const ENN4: Profile = {
  id: 'enn4',
  weight: 10,
  result: [
    "{ad} için kendine özgü olmak, anlaşılmak ve anlam bulmak önemli bir iç ihtiyaç. Duyguları derin, hayal gücü zengin; sıradan olandan çok özgün olana ilgi duyuyor.",
    "Bu eğilimin gölge tarafı, duygu durumunun çalışma düzenini kolayca etkileyebilmesi.",
  ],
  kisaca:
    '{ad}, duyguları derin, hayal gücü zengin ve kendine özgü olmaya önem veren biri. Anlam ve özgünlük aradığı işlerde parlıyor; ancak duygularının yoğunluğu ve "anlaşılmama" hissi, zaman zaman motivasyonunu ve düzenini sarsabiliyor.',
  strengths: [
    'Yaratıcı ve özgün düşünür; olaylara farklı bir açıdan bakabilir.',
    'Duygusal farkındalığı yüksektir; kendini ve başkalarını derinden hisseder.',
    'Sanat, yazı ve ifade gerektiren alanlarda doğal bir yeteneği vardır.',
  ],
  growth: [
    'Duygu durumuna göre çalışma; "içimden gelmiyor" günlerinde işleri erteleme.',
    'Kendini başkalarından eksik ya da farklı hissedip içe çekilme.',
  ],
  develop: [
    '"İçimden gelmiyor" günleri için kısa ve sabit bir başlangıç rutini oluşturmak.',
    'Duygularını yazı, müzik ya da sanatla ifade etmeyi bir kaynak olarak kullanmak.',
    'Farklılığını bir güç olarak görebileceği ortamlar ve arkadaşlıklar bulmak.',
  ],
  priority:
    'Önümüzdeki dönemin önceliği, {adın} duygularından bağımsız işleyen küçük ve sabit bir çalışma rutini kurması: "içimden gelmese de 15 dakika başlarım" alışkanlığını edinmesi.',
  portrait: [
    '{ad}, iç dünyası zengin ve duyguları derin biri. Bir şiir, bir şarkı ya da bir film onu uzun süre etkileyebilir. Sıradan olandan çok, anlamlı ve özgün olana ilgi duyar. Kendini ifade etmenin yollarını arar; yazı, resim, müzik ya da kıyafet seçimi bunun bir parçası olabilir.',
    'Bu duyarlılık ona başkalarının duygularını derinden anlama gücü veriyor. Zor bir dönem geçiren bir arkadaşının yanında yargılamadan durabilir.',
    'Aynı yoğunluk, bazen duygu durumunun gününü belirlemesine yol açabiliyor. Keyifli olduğu günlerde çok üretken olabilirken, kendini anlaşılmamış hissettiği günlerde içine çekilip işlerini erteleyebiliyor.',
  ],
  key: '{adı} anlamanın anahtarı: Onun için "anlaşılmak" çok önemlidir; duyguları ciddiye alındığında açılır ve gücünü gösterir.',
  motivates:
    '{adı} en çok harekete geçiren şey, yaptığı işte kendinden bir şey katabilmek. Yaratıcılığına alan tanınan, kendi yorumunu ekleyebildiği ödevlerde enerjisi belirgin biçimde artar. İşin anlamını hissettiğinde özenle ve derinlemesine çalışır.',
  stops:
    'Onu durduran şey, tekdüze, mekanik ve anlamını hissetmediği işler. Ayrıca duygusal olarak zorlandığı dönemlerde, "şu an hiçbir şey yapamam" hissiyle işleri bırakabilir. Eleştiri, özellikle kendini ifade ettiği bir işe yöneldiğinde, onu derinden yaralayabilir.',
  motivators: ['yaratıcılığa alan tanınması', 'anlamlı ve kişisel görevler', 'duygularının ciddiye alınması', 'kendini ifade edebileceği ortamlar'],
  stoppers: ['tekdüze ve mekanik işler', 'duygularının küçümsenmesi', 'herkesle aynı kalıba sokulmak', 'kendini ifade ettiği işe sert eleştiri'],
  resources: [
    '{adın} en güçlü kaynağı yaratıcılığı ve duygusal derinliği. Olaylara farklı açılardan bakabilmesi, özgün fikirler üretmesini ve sanat, yazı, tasarım gibi alanlarda kendini göstermesini kolaylaştırıyor.',
    'Empati gücü de dikkat çekiyor: Başkalarının acısını ve sevincini derinden hissedebiliyor. Bu özellik, doğru yönlendirildiğinde ona hem ilişkilerde hem yaratıcı işlerde önemli bir güç sağlıyor.',
  ],
  resourceBullets: ['Yaratıcılık ve özgün bakış açısı', 'Duygusal farkındalık ve empati', 'Kendini ifade etme gücü', 'Derinlemesine düşünme'],
  blindspots: [
    '{adın} en önemli gelişim alanı, duygu durumundan bağımsız bir çalışma düzeni kurabilmek. "İçimden gelince yaparım" yaklaşımı, özellikle uzun soluklu derslerde birikme ve son anda yetiştirme sorunlarına yol açabiliyor.',
    'Fark etmediği bir nokta, kendini başkalarıyla kıyasladığında eksik olanlara odaklanması olabilir. Bu bakış, sahip olduğu güçlü yanları görmesini zorlaştırabilir.',
  ],
  blindspotBullets: ['Duygu durumuna bağlı erteleme', 'Kendini eksik hissetme ve içe çekilme', 'Rutin işlerden kaçınma'],
  communication: [
    '{ad}, derin ve samimi sohbetlerden hoşlanıyor; yüzeysel konuşmalar ona sıkıcı gelebilir. Güvendiği kişilerle duygularını açıkça paylaşabiliyor.',
    'Kendini anlaşılmamış hissettiğinde ise geri çekilip sessizleşebilir. Bu sessizlik çoğu zaman ilgisizlik değil, kırgınlıktır.',
  ],
  commStrong: 'derin sohbetler, duyguları anlatmak, yazarak ya da sanatla kendini ifade etmek.',
  commHard: 'yüzeysel sosyal ortamlar, duygularının küçümsendiği konuşmalar.',
  commStep: 'zorlandığında duygusunu bir cümleyle yazıp güvendiği birine iletmek.',
  stress: [
    'Stres altında {ad} içine dönebilir; odasına çekilir, hüzünlü müzikler dinler, kendini daha yalnız hissedebilir. Bu dönemlerde çalışma isteği belirgin biçimde azalabilir.',
    'Önemli olan bu duyguları bastırmak değil, onları ifade etmesine alan açmak ve küçük, somut adımlarla günlük düzenini korumasına yardım etmektir.',
  ],
  stressSigns: 'uzun süre odasına çekilmek, çalışma isteğinin tamamen kaybolması, "kimse beni anlamıyor" cümleleri.',
  stressHelps: 'yargılamadan dinlemek, yaratıcı bir uğraş, kısa yürüyüşler, küçük ve somut günlük hedefler.',
  conflict: [
    '{ad} eleştiriyi, özellikle kendini ifade ettiği bir işe yöneldiğinde, kişiliğine yönelik bir saldırı gibi algılayabilir. Tepkisi geri çekilmek ya da duygusal olarak uzaklaşmak olabilir.',
    'Eleştiri, önce emeğinin ve özgünlüğünün görüldüğünü gösteren bir cümleyle başladığında çok daha kolay kabul ediliyor.',
  ],
  conflictTip: 'Geri bildirime önce özgün yanını takdir ederek başlamak ("Bu bakış açısı çok farklı ve güzel"), {adın} öneriye açık olmasını kolaylaştırır.',
  learning: [
    '{ad} en iyi, konuyu kendi yorumuyla ilişkilendirebildiğinde öğreniyor. Bir tarih konusunu bir hikâyeye, bir fen konusunu bir görsele dönüştürmek bilgiyi onun için anlamlı kılıyor.',
    'Ancak duygu durumundan bağımsız, kısa ve sabit bir çalışma rutini de en az yaratıcılık kadar önemli. Her gün aynı saatte 15-20 dakikalık başlangıçlar, "içimden gelmiyor" günlerinde bile ilerlemesini sağlar.',
  ],
  learningBullets: ['Konuyu hikâyeye ya da görsele dönüştürme', 'Kısa ve sabit günlük başlangıçlar', 'Renkli ve kişisel not tutma', 'Öğrendiğini kendi cümleleriyle yazma'],
  future: [
    'Yaratıcılığı, duygusal derinliği ve kendini ifade etme gücü; sanat, tasarım, yazı, psikoloji ve özgünlüğün değer gördüğü alanlarda kendini anlamlı hissetmesini kolaylaştırabilir.',
  ],
  workEnv: ['Yaratıcılığa ve kişisel yoruma alan tanınan ortamlar.', 'İşin anlamının hissedildiği, özgünlüğün değer gördüğü görevler.'],
  drains: ['Tekdüze ve mekanik işler.', 'Herkesin aynı kalıba sokulduğu katı ortamlar.', 'Duyguların hiç yer bulmadığı soğuk ortamlar.'],
  youAre:
    '{ad}, sen duyguları derin, hayal gücü zengin ve kendine özgü birisin. Sıradan olandan çok anlamlı olana ilgi duyuyorsun. Bazen duyguların o kadar yoğun oluyor ki günün nasıl geçeceğini onlar belirliyor. Farklı olmak bir eksiklik değil; senin en güzel yanlarından biri.',
  youStrengths: ['Yaratıcısın ve farklı açılardan bakabiliyorsun.', 'İnsanların duygularını derinden anlıyorsun.', 'Kendini yazıyla, sanatla ya da sözle ifade edebiliyorsun.', 'Derin düşünebiliyorsun.'],
  youGrowth:
    'İçinden gelmediği günlerde işlerini ertelediğin olabilir. Kendini başkalarıyla kıyasladığında eksik hissettiğin, içine çekildiğin zamanlar da olabilir. Küçük ve sabit alışkanlıklar, duyguların ne olursa olsun yolunda ilerlemeni sağlar.',
  youWays: ['Her gün aynı saatte 15 dakika başla; içinden gelmese de.', 'Konuları hikâyeye ya da çizime dönüştür.', 'Renkli ve sana özel notlar tut.', 'Öğrendiğini kendi cümlelerinle yaz.'],
  youComm:
    'Derin sohbetlerde çok güçlüsün. Kendini anlaşılmamış hissettiğinde ise sessizleşebiliyorsun. Duygunu bir cümleyle yazıp güvendiğin birine göndermek, konuşmayı başlatmanın güzel bir yolu olabilir.',
  youFuture:
    'Yaratıcılık, kendini ifade etmek ve anlamlı işler sana iyi gelen şeyler gibi görünüyor. Bunlar bir meslek kararı değil, ipuçları. Farklı alanları denedikçe seni gerçekten neyin heyecanlandırdığını daha iyi göreceksin.',
  youTry: [
    '15 dakika kuralı: Her gün aynı saatte, içinden gelmese de 15 dakika ders çalışmaya başla.',
    'Duygu defteri: Zorlandığın günlerde ne hissettiğini birkaç cümleyle yaz.',
    'Güçlü yan listesi: Bu ay kendinde sevdiğin beş özelliği bir kâğıda yaz ve görebileceğin bir yere as.',
  ],
  youLast:
    '{ad}, farklı bakabilmen ve derin hissedebilmen dünyaya çok şey katıyor. Duygularına kulak vermek kadar onlara rağmen küçük adımlar atabilmek de bir güç. İkisini birlikte kullandığında çok güzel şeyler başaracaksın.',
  familyOneLine:
    '{ad}, duyguları derin ve kendine özgü olmaya önem veren; bu yüzden anlaşılmadığını hissettiğinde içine çekilebilen ve duyguları ciddiye alındığında en iyi hâline ulaşan biri.',
  approaches: [
    { do: 'Duygularını küçümsemeden dinleyin.', why: 'Anlaşıldığını hissetmek, {adın} açılmasının ve harekete geçmesinin ön koşuludur.' },
    { do: 'Yaratıcı uğraşlarını destekleyin.', why: 'Kendini ifade edebildiği alanlar duygu düzenlemesine de yardım eder.' },
    { do: 'Küçük ve sabit bir günlük rutin kurun.', why: 'Duygu durumundan bağımsız alışkanlıklar ertelemeyi azaltır.' },
    { do: 'Özgün yanlarını somut olarak takdir edin.', why: 'Kendini eksik hissetme eğilimini dengeler.' },
    { do: 'İçine çekildiğinde baskı yapmadan yakın durun.', why: 'Zorlamak yerine güvenli bir kapı aralığı bırakmak onu rahatlatır.' },
  ],
  doList: ['Duygularını adlandırmasına yardım edin.', 'Yaratıcı fikirlerine ilgi gösterin.', 'Günlük rutini birlikte ve esnek kurun.', 'Güçlü yanlarını sık sık hatırlatın.'],
  dontList: ['"Abartıyorsun" demeyin.', 'Duygusal anında ders konuşmaya zorlamayın.', 'Farklılığını alay konusu yapmayın.', 'İçine çekilmesini "şımarıklık" diye yorumlamayın.'],
  dialog: [
    { instead: 'Abartıyorsun.', tryThis: 'Bu seni gerçekten etkilemiş gibi görünüyor, anlatmak ister misin?' },
    { instead: 'Canın istemese de oturacaksın.', tryThis: 'Şimdi sadece 15 dakika başlayalım mı, sonra bakarız?' },
    { instead: 'Herkes gibi olsana.', tryThis: 'Bu konuya bakışın çok farklı ve ilginç.' },
    { instead: 'Yine neyin var?', tryThis: 'Bugün biraz durgun görünüyorsun; yanında olmamı ister misin?' },
  ],
  homeEnv: [
    '{ad} kendine ait, kişisel dokunuşlar taşıyan bir çalışma köşesinde daha rahat çalışır. Sevdiği renkler, bir pano ya da kendi düzeni ona aidiyet hissi verir.',
    'Duygu durumundan bağımsız, kısa ve sabit bir başlangıç saati belirlemek önemlidir. "Her gün 19.00\'da 15 dakika" gibi küçük bir kural, zor günlerde bile ilerlemesini sağlar.',
  ],
  gradeTalk: [
    'Not konuşmalarında önce duygusunu sorun, sonra konuya geçin. Düşük bir not onu derinden üzebilir; bu anlarda öneri yerine önce anlayış göstermek, daha sonra yapılacak planlamayı kolaylaştırır.',
  ],
  compare:
    '{adı} başkalarıyla karşılaştırmak, onun "ben eksiğim" duygusunu güçlendirebilir. Onu kendi özgün yolunda ve kendi hızında görmek, kendine güvenini artırır.',
  supportSigns: [
    'Haftalarca süren yoğun hüzün ya da içe kapanma',
    'Sevdiği uğraşlardan tamamen uzaklaşma',
    'Kendini değersiz ya da yalnız hissettiğini sık sık dile getirme',
    'Uyku ve iştahta belirgin değişiklikler',
  ],
  plan: [
    '{adın} duygu durumunun çalışma düzenini nasıl etkilediğini gözlemleyin. Yargısız dinleme zamanları oluşturun. Yaratıcı uğraşlarına alan açın.',
    'Kısa ve sabit bir günlük başlangıç saati belirleyin. Konuları yaratıcı yollarla çalışmasını destekleyin. Güçlü yanlarını görünür kılın.',
    'Neyin işe yaradığını birlikte konuşun. Zor günlerdeki küçük başarıları takdir edin. Gerekirse rehber öğretmenle duygu düzenleme üzerine görüşün.',
  ],
  caseTheme: 'duyarlı ve bireyci bir yönelim; öne çıkan konular: duygu durumuna bağlı motivasyon dalgalanması ve anlaşılmama hissi',
  findings: [
    'Yüksek duygusal yoğunluk ve farkındalık.',
    'Duygu durumuna bağlı erteleme ve düzensiz çalışma.',
    'Kendini başkalarıyla kıyaslayıp eksik hissetme eğilimi.',
    'Yaratıcı ifade alanlarında belirgin güç.',
  ],
  cognitive: [
    '"Hissetmiyorsam yapamam" inancını fark etmeye yönelik düşünce kayıtları.',
    'Duygudan bağımsız, davranışa dayalı küçük başlangıç hedefleri.',
    'Olumlu deneyimleri ve güçlü yanları kaydetme çalışması.',
  ],
  emotional: [
    'Duyguları adlandırma ve yazıyla ifade etme.',
    'Yaratıcı uğraşları duygu düzenleme aracı olarak kullanma.',
    'Yalnızlık ve anlaşılmama hissine yönelik güvenli bir destek ilişkisi kurma.',
  ],
  questions: [
    'Bir işe başlamak için içinden gelmesini beklediğin oluyor mu?',
    'Kendini en çok ne zaman anlaşılmış hissediyorsun?',
    'Duyguların yoğunlaştığında neler sana iyi geliyor?',
    'Kendinde en çok sevdiğin özellikler neler?',
  ],
  verify: [
    ['Çalışma düzeni duygu durumuna bağlı', 'Bir hafta boyunca duygu ve çalışma süresini birlikte kaydetmek'],
    ['Yaratıcı görevlerde motivasyon artıyor', 'Aynı konuyu yaratıcı ve klasik yöntemle çalışmasını karşılaştırmak'],
    ['Eleştiri sonrası geri çekiliyor', 'Geri bildirim sonrası bir günlük tepkisini birlikte konuşmak'],
  ],
  priorities: [
    ['Anlaşılma ve güven', 'Duygularının ciddiye alındığı bir ilişki kurulmadan değişim zorlaşır.'],
    ['Duygu düzenleme', 'Yoğun duyguları fark etme ve ifade etme becerisi güçlendirilir.'],
    ['Sabit rutin', 'Duygu durumundan bağımsız küçük alışkanlıklar kurulur.'],
    ['Güçlü yanları görme', 'Kıyaslama yerine kendi değerini tanıma çalışılır.'],
  ],
  referral:
    'İki haftadan uzun süren yoğun hüzün, sevdiği etkinliklerden belirgin uzaklaşma, umutsuzluk ifadeleri veya uyku ve iştahta belirgin değişiklikler gözlenirse bir ruh sağlığı uzmanına yönlendirme değerlendirilmelidir.',
  monitoring: 'Her görüşmede duygu durumu, günlük rutinin sürdürülme oranı ve yaratıcı uğraşlar birlikte gözden geçirilebilir.',
};

export const ENN5: Profile = {
  id: 'enn5',
  weight: 10,
  result: [
    "{ad} için anlamak, bilmek ve kendi alanına sahip olmak önemli bir iç ihtiyaç. Meraklı ve gözlemci; konuları derinlemesine düşünmeyi seviyor.",
    "Bu eğilimin gölge tarafı, bilgiyi eyleme ve paylaşıma dönüştürmekte gecikebilmesi.",
  ],
  kisaca:
    '{ad}, meraklı, gözlemci ve konuları derinlemesine anlamayı seven biri. Kendi başına düşünüp araştırdığında çok güçlü; ancak sosyal ortamlarda geri durabiliyor ve bilgi toplamayı harekete geçmeye tercih edebiliyor.',
  strengths: [
    'Merakı ve öğrenme isteği yüksek; ilgilendiği konuda derinleşir.',
    'Sakin, mantıklı ve bağımsız düşünür.',
    'Gözlem gücü kuvvetlidir; ayrıntıları ve bağlantıları fark eder.',
  ],
  growth: [
    'Duygularını ve ihtiyaçlarını paylaşmakta zorlanma; içine kapanma.',
    '"Tam hazır olmadan" işe başlamama; bilgiyi eyleme dönüştürmekte gecikme.',
  ],
  develop: [
    'Duygularını önce güvendiği tek bir kişiyle, küçük adımlarla paylaşmayı denemek.',
    '"Önce hazırlanayım" yerine kısa bir deneme yapıp sonra eksikleri tamamlamayı alışkanlık hâline getirmek.',
    'Bilgisini bir sunum, proje ya da anlatım yoluyla başkalarıyla paylaşmak.',
  ],
  priority:
    'Önümüzdeki dönemin önceliği, {adın} bildiklerini eyleme ve paylaşıma dönüştürmesi: "tamamen hazır olmayı" beklemeden başlamayı ve düşüncelerini küçük gruplarda paylaşmayı denemesi.',
  portrait: [
    '{ad}, çevresini dikkatle izleyen ve olayların nasıl işlediğini anlamak isteyen biri. Bir konuya ilgi duyduğunda onu derinlemesine araştırır; belgeseller izler, kitaplar okur, sorular sorar. Bilgi onun için hem bir güvence hem bir keyif kaynağıdır.',
    'Bağımsız çalışmayı, kendi hızında düşünmeyi sever. Kalabalık ve gürültülü ortamlar onu çabuk yorabilir; yeniden enerji toplamak için yalnız kalmaya ihtiyaç duyabilir.',
    'Bu içe dönük güç, bazen onu sosyal ortamlardan ve duygusal paylaşımdan uzak tutabiliyor. Ne bildiğini çoğu zaman sorulduğunda söyler; kendiliğinden öne çıkmayı tercih etmeyebilir.',
  ],
  key: '{adı} anlamanın anahtarı: Onun için anlamak, harekete geçmenin ön koşuludur; neyi neden yaptığını bilmediği işlere girmekte zorlanır.',
  motivates:
    '{adı} en çok harekete geçiren şey merakını besleyen, düşünmeye alan tanıyan görevler. "Neden?" ve "nasıl?" sorularının sorulduğu, araştırma ve keşif içeren işlerde enerjisi belirgin biçimde artar. Kendi hızında ve bağımsız çalışabildiğinde verimi yükselir.',
  stops:
    'Onu durduran şey, anlamını kavrayamadığı ezber işler ve sürekli sosyal etkileşim gerektiren görevler. Bir de "yeterince bilmiyorum" hissi: Hazırlığın bitmediğini düşündüğü işlere başlamayı erteleyebilir.',
  motivators: ['merakı besleyen konular', 'bağımsız çalışma', 'mantıklı açıklamalar', 'kendi hızında ilerleme'],
  stoppers: ['anlamsız ezber', 'sürekli grup etkileşimi', 'aceleyle karar verme baskısı', 'kalabalık ve gürültü'],
  resources: [
    '{adın} en güçlü kaynağı merakı ve derinlemesine düşünme becerisi. Bir konuyu bütün yönleriyle anlamaya çalışması, özellikle fen, matematik ve araştırma gerektiren alanlarda ona önemli bir avantaj sağlayabilir.',
    'Sakinliği ve mantıklı yaklaşımı, kriz anlarında bile soğukkanlı kalmasını kolaylaştırıyor.',
  ],
  resourceBullets: ['Merak ve öğrenme isteği', 'Analitik ve bağımsız düşünme', 'Gözlem gücü', 'Sakinlik ve soğukkanlılık'],
  blindspots: [
    '{adın} en önemli gelişim alanı, bilgisini eyleme ve paylaşıma dönüştürmek. Tamamen hazır hissetmeden başlamakta zorlanabilir; bu da bazı işlerin gecikmesine yol açabilir.',
    'Fark etmediği bir nokta, duygularını ve ihtiyaçlarını paylaşmamasının çevresi tarafından ilgisizlik gibi algılanabilmesi. Yardıma ihtiyaç duyduğunda bile bunu söylemeyebilir.',
  ],
  blindspotBullets: ['Hazırlığı bitmeyince başlamamak', 'Duygularını ve ihtiyaçlarını paylaşmamak', 'Sosyal ortamlardan geri çekilmek'],
  communication: [
    '{ad}, az ama öz konuşan biri. İlgilendiği bir konuda sorulduğunda çok derin ve bilgili açıklamalar yapabilir. Küçük gruplarda ya da baş başa konuşmalarda daha rahat ifade eder.',
    'Duygusal konuşmalar ona zor gelebilir; düşüncelerini paylaşmak duygularını paylaşmaktan daha kolaydır.',
  ],
  commStrong: 'bilgi paylaşmak, mantıklı tartışmalar, baş başa derin sohbetler.',
  commHard: 'kalabalık önünde konuşmak, duygularını anlatmak, sosyal sohbetler.',
  commStep: 'derste bildiği bir konuda haftada bir kez gönüllü olarak söz almak.',
  stress: [
    'Stres altında {ad} daha da içine çekilebilir; odasına kapanır, bilgisayara ya da kitaplara yönelir, insanlardan uzaklaşır. Bu çekilme dinlenmek için gerekli olabilir; ancak uzun sürdüğünde yalnızlık hissini artırabilir.',
    'Bu dönemlerde ona alan tanımak, ama bağı koparmamak önemlidir.',
  ],
  stressSigns: 'uzun süreli yalnız kalma isteği, iletişimin azalması, ekran başında aşırı vakit geçirme.',
  stressHelps: 'baskısız birlikte vakit, ilgi alanıyla ilgili sohbet, sessiz ve düzenli bir ortam.',
  conflict: [
    '{ad} çatışmada genellikle geri çekilir; tartışmayı mantıkla çözmeye çalışır, duygusal tepkilerden uzak durur. Eleştiriyi mantıklı gerekçelerle sunulduğunda daha kolay kabul eder.',
    'Anlık ve duygusal tartışmalar onu kapatabilir; düşünmek için zaman tanındığında daha yapıcı olur.',
  ],
  conflictTip: 'Eleştiriyi gerekçesiyle ve sakin bir dille sunmak, ardından ona düşünme zamanı tanımak {adın} öneriyi benimsemesini kolaylaştırır.',
  learning: [
    '{ad} en iyi, konuyu "neden" ve "nasıl" sorularıyla derinlemesine anladığında öğreniyor. Kavram haritaları, sebep-sonuç zincirleri ve kendi araştırması bilgiyi onun için kalıcı kılıyor.',
    'Ancak öğrenmenin bir de uygulama ve paylaşım tarafı var. Bildiğini soru çözerek denemek ve birine anlatmak, bilgisini sınava ve günlük hayata taşımasına yardım eder.',
  ],
  learningBullets: ['Kavram haritası ve sebep-sonuç zinciri', 'Bağımsız araştırma ödevleri', 'Erken ve düzenli soru çözme', 'Bildiğini kısa bir özetle birine anlatma'],
  future: [
    'Merakı, analitik düşünme gücü ve bağımsız çalışma isteği; bilim, mühendislik, yazılım, araştırma ve uzmanlık gerektiren alanlarda kendini rahat hissetmesini kolaylaştırabilir.',
  ],
  workEnv: ['Bağımsız çalışmaya ve derinleşmeye alan tanıyan ortamlar.', 'Uzmanlığın ve bilginin değer gördüğü işler.'],
  drains: ['Sürekli toplantı ve sosyal etkileşim gerektiren işler.', 'Gürültülü, kalabalık ve kesintili ortamlar.', 'Düşünmeye zaman tanımayan aceleci süreçler.'],
  youAre:
    '{ad}, sen meraklı, gözlemci ve derin düşünen birisin. Bir konuyu gerçekten anlamadan rahat edemiyorsun. Kalabalıkta bazen geri durabiliyorsun ama bildiğin konularda çok değerli şeyler söyleyebiliyorsun. Sessiz olmak, söyleyecek bir şeyin olmadığı anlamına gelmiyor.',
  youStrengths: ['Meraklısın ve öğrenmeyi seviyorsun.', 'Konuları derinlemesine düşünebiliyorsun.', 'Sakin ve mantıklısın.', 'Kendi başına çalışabiliyorsun.'],
  youGrowth:
    'Tamamen hazır hissetmeden bir işe başlamakta zorlanabiliyorsun. Duygularını ve ihtiyaçlarını paylaşmak sana zor gelebilir. Bilgini paylaştıkça ve denedikçe hem öğrenmen hem özgüvenin artacak.',
  youWays: ['Konuları "neden-nasıl" sorularıyla çalış.', 'Kavram haritası çiz.', 'Öğrendiğini erken ve sık soru çözerek dene.', 'Bildiğini kısa bir özetle birine anlat.'],
  youComm:
    'Bildiğin konularda konuşmak sana kolay geliyor; duygularını anlatmak ise daha zor. Zorlandığında bunu tek bir cümleyle bile söylemek, yardım almanın ilk adımı olabilir.',
  youFuture:
    'Araştırmak, derinleşmek ve bir konunun uzmanı olmak sana iyi gelen şeyler gibi görünüyor. Bunlar bir meslek kararı değil, ipuçları. Merakının seni nereye götürdüğünü izlemek en güzel yol haritası olacak.',
  youTry: [
    'Hazır olmadan başla: Bu ay ertelediğin bir işe "yüzde 70 hazırım" dediğin anda başla.',
    'Haftalık söz: Her hafta derste bildiğin bir konuda bir kez söz al.',
    'Merak projesi: İlgini çeken bir konuda küçük bir araştırma yapıp bir sayfalık özet çıkar.',
  ],
  youLast:
    '{ad}, merakın ve derin düşünme gücün senin en değerli hazinelerin. Bildiklerini paylaştıkça ve denemeye cesaret ettikçe bu hazine hem senin hem çevrenin işine yarayacak.',
  familyOneLine:
    '{ad}, anlamayı ve keşfetmeyi seven; bu yüzden bağımsız alanına ihtiyaç duyan, duygularını paylaşmakta zorlanabilen ve merakı beslendiğinde en iyi hâline ulaşan biri.',
  approaches: [
    { do: 'Merakını ve sorularını ciddiye alın.', why: 'Sorularının değer görmesi, öğrenme isteğini canlı tutar.' },
    { do: 'Kendi alanına ve yalnız zamanına saygı gösterin.', why: 'Yeniden enerji toplamak için bu alana ihtiyaç duyar.' },
    { do: 'Kararlarda gerekçeleri açıklayın.', why: 'Mantıklı açıklamalar onun iş birliğini artırır.' },
    { do: 'Bağı koparmadan, baskısız birlikte vakit geçirin.', why: 'Yalnız kalma isteği, yalnız bırakılmak istediği anlamına gelmez.' },
    { do: 'Duygularını sormayı yumuşak bir dille sürdürün.', why: 'Duygularını paylaşmak ona zaman ve güven gerektirir.' },
  ],
  doList: ['İlgi alanlarıyla ilgili konuşun.', 'Düşünmesi için zaman tanıyın.', 'Kararlarınızın gerekçelerini paylaşın.', 'Küçük sosyal adımlarını takdir edin.'],
  dontList: ['Onu sürekli sosyal ortamlara zorlamayın.', 'Sorularını "çok soru soruyorsun" diye kesmeyin.', 'Yalnız kalmasını "asosyallik" diye etiketlemeyin.', 'Duygularını hemen anlatmaya zorlamayın.'],
  dialog: [
    { instead: 'Hep odana kapanıyorsun.', tryThis: 'Biraz dinlendikten sonra birlikte bir şey yapmak ister misin?' },
    { instead: 'Bu kadar soru sorma.', tryThis: 'Güzel bir soru; birlikte araştıralım mı?' },
    { instead: 'Neden hiçbir şey anlatmıyorsun?', tryThis: 'Bugün ilgini çeken bir şey oldu mu?' },
    { instead: 'Hemen karar ver.', tryThis: 'Düşünmek için ne kadar zamana ihtiyacın var?' },
  ],
  homeEnv: [
    '{ad} sessiz, düzenli ve kesintisiz çalışabileceği bir ortamda en verimli hâline ulaşır. Kendi masası, kitapları ve araştırma yapabileceği bir alan ona iyi gelir.',
    'Ekranda araştırmaya ayrılan süre ile boş vakit arasındaki dengeyi birlikte konuşmak ve çalışma ile dinlenme saatlerini ayırmak faydalı olur.',
  ],
  gradeTalk: [
    'Not konuşmalarında yalnızca sonucu değil, konuyu ne kadar anladığını sorun. {ad} için "anlamak" önemli bir motivasyondur. Düşük bir notta hangi kavramın eksik kaldığını birlikte bulmak, onun için en yapıcı yaklaşımdır.',
  ],
  compare:
    '{adı} daha sosyal ya da daha atak yaşıtlarıyla karşılaştırmak, onun kendi güçlü yanlarını görmesini zorlaştırabilir. Sessiz ve derin olmak da değerli bir özelliktir.',
  supportSigns: [
    'Neredeyse tüm zamanını yalnız ve ekran başında geçirme',
    'Arkadaşlık ilişkilerinin tamamen azalması',
    'Okula ve derslere ilginin belirgin biçimde düşmesi',
    'Duygularını hiç paylaşamaması ve belirgin içe kapanma',
  ],
  plan: [
    '{adın} ilgi alanlarını ve yalnız kalma ihtiyacını gözlemleyin. Baskısız birlikte vakit geçirme zamanları oluşturun. Sorularına ilgi gösterin.',
    'Bildiklerini paylaşmasını destekleyecek küçük fırsatlar yaratın (size bir konuyu anlatması gibi). Erken başlama alışkanlığını destekleyin.',
    'Neyin işe yaradığını birlikte konuşun. Sosyal ve paylaşım adımlarını görünür kılın. Gerekirse rehber öğretmenle sosyal katılım üzerine görüşün.',
  ],
  caseTheme: 'gözlemci ve araştırmacı bir yönelim; öne çıkan konular: bilgiyi eyleme dönüştürmede gecikme ve sosyal geri çekilme',
  findings: [
    'Yüksek merak ve analitik düşünme.',
    'Hazırlık bitmeden başlamakta güçlük.',
    'Duyguları ve ihtiyaçları paylaşmada çekingenlik.',
    'Sosyal ortamlardan enerji kaybı; yalnız kalarak toparlanma.',
  ],
  cognitive: [
    '"Tamamen hazır olmalıyım" inancını fark etmeye yönelik düşünce kayıtları.',
    'Bilgiyi eyleme dönüştüren küçük ve zamanlı görevler.',
    'Öğrendiğini başkasına anlatarak pekiştirme.',
  ],
  emotional: [
    'Duyguları adlandırma için basit duygu listeleriyle çalışma.',
    'Güvenli küçük gruplarda paylaşım pratiği.',
    'Yalnız kalma ihtiyacı ile sosyal bağ arasında denge kurma.',
  ],
  questions: [
    'Bir işe başlamadan önce ne kadar hazır olmak istiyorsun?',
    'Seni en çok hangi konular meraklandırıyor?',
    'Kalabalık ortamlarda neler hissediyorsun?',
    'Zorlandığında bunu kime ve nasıl söylüyorsun?',
  ],
  verify: [
    ['Başlamayı hazırlık nedeniyle erteliyor', 'Ertelenen görevlerde "hazır olma" düşüncelerini birlikte incelemek'],
    ['Küçük gruplarda daha rahat ifade ediyor', 'Grup ve baş başa ortamlardaki katılımını karşılaştırmak'],
    ['Merak odaklı görevlerde verimi artıyor', 'Araştırma ödevi ile ezber ödevindeki çabayı karşılaştırmak'],
  ],
  priorities: [
    ['Güvenli ilişki', 'Alanına saygı gösteren, baskısız bir ilişki zemini kurulmalı.'],
    ['Eyleme geçme', 'Küçük ve zamanlı görevlerle başlama eşiği düşürülür.'],
    ['Paylaşım becerisi', 'Bilgi ve duygu paylaşımı küçük ve güvenli adımlarla çalışılır.'],
    ['Sosyal denge', 'Yalnız kalma ile sosyal bağ arasında sağlıklı denge kurulur.'],
  ],
  referral:
    'Belirgin sosyal çekilme, arkadaşlık ilişkilerinin tamamen kopması, okula ilginin keskin biçimde düşmesi veya duygusal tepkilerde belirgin donukluk gözlenirse bir ruh sağlığı uzmanına yönlendirme değerlendirilmelidir.',
  monitoring: 'Her görüşmede başlama süresi, paylaşım örnekleri ve sosyal katılım birlikte gözden geçirilebilir.',
};

export const ENN6: Profile = {
  id: 'enn6',
  weight: 10,
  result: [
    "{ad} için güven, öngörülebilirlik ve güvenilir bir destek önemli bir iç ihtiyaç. Sorumluluk sahibi ve sadık; olası sorunları önceden görmeye çalışıyor.",
    "Bu eğilimin gölge tarafı, belirsizlik arttığında kaygının da hızla artabilmesi.",
  ],
  kisaca:
    '{ad}, sorumluluk sahibi, sadık ve güvendiği insanlara bağlı biri. Olası sorunları önceden görmesi onu dikkatli ve hazırlıklı kılıyor; ancak belirsizlik ve "ya kötü giderse" düşünceleri, zaman zaman kaygısını artırıp karar vermesini zorlaştırabiliyor.',
  strengths: [
    'Sorumluluk sahibi ve güvenilir; bağlı olduğu insanlara ve işlere sadıktır.',
    'Olası sorunları önceden fark eder; dikkatli ve hazırlıklıdır.',
    'Ekip çalışmasına yatkındır; grubu birlikte tutar.',
  ],
  growth: [
    'Belirsizlik karşısında kaygılanma ve en kötü senaryoyu düşünme.',
    'Kendi kararına güvenmekte zorlanma; sürekli onay arama.',
  ],
  develop: [
    'Kaygı verici düşünceleri yazıp gerçekçi karşılıklarını birlikte bulmak.',
    'Küçük kararları kendi başına verip sonuçlarını gözlemleyerek kendine güvenini artırmak.',
    'Belirsiz durumlar için önceden basit bir "B planı" hazırlamak.',
  ],
  priority:
    'Önümüzdeki dönemin önceliği, {adın} kendi kararlarına güvenmeyi deneyimlemesi: "ya kötü giderse" düşüncesini fark edip yerine "olursa ne yaparım" planını koymayı öğrenmesi.',
  portrait: [
    '{ad}, güven ve öngörülebilirlik arayan biri. Ne olacağını bildiğinde, kurallar ve beklentiler açık olduğunda rahat eder. Bağlı olduğu insanlara ve gruplara karşı sadıktır; arkadaşları ona güvenebilir.',
    'Olası sorunları önceden görme becerisi ona dikkatli ve hazırlıklı olma gücü veriyor. Bir sınava çalışırken "ya şu soru çıkarsa" diye düşünüp ek hazırlık yapabilir.',
    'Aynı öngörü, belirsizlik arttığında kaygıya dönüşebiliyor. Zihni olası kötü senaryolar üzerinde dönebilir; bu da karar vermesini ve harekete geçmesini zorlaştırabilir.',
  ],
  key: '{adı} anlamanın anahtarı: Onun için güven her şeyin temelidir; neyle karşılaşacağını bildiğinde ve arkasında birinin olduğunu hissettiğinde cesaretle ilerler.',
  motivates:
    '{adı} en çok harekete geçiren şey açık beklentiler, güvendiği bir yetişkinin desteği ve hazırlıklı olduğunu hissetmek. Plan yapıldığında ve adımlar netleştiğinde kararlılıkla çalışır. Ekip içinde sorumluluk aldığında da enerjisi artar.',
  stops:
    'Onu durduran şey belirsizlik ve güvensizlik. Ne beklendiğini bilmediği, kuralların net olmadığı durumlarda kaygısı artar. "Ya yanlış yaparsam" düşüncesi, karar vermesini ve işe başlamasını geciktirebilir.',
  motivators: ['açık beklentiler', 'güvenilir bir destek', 'hazırlıklı olma hissi', 'ekip içinde sorumluluk'],
  stoppers: ['belirsizlik', 'ani değişiklikler', 'güvenmediği ortamlar', 'tek başına karar verme baskısı'],
  resources: [
    '{adın} en güçlü kaynağı sorumluluk duygusu ve sadakati. Bağlı olduğu işi ve insanları bırakmaz; zor zamanlarda da yanlarında durur. Bu özellik ona güvenilir bir arkadaş ve takım oyuncusu olma gücü veriyor.',
    'Olası riskleri önceden görmesi ve hazırlıklı olma isteği, düzenli ve planlı çalışmasını destekliyor.',
  ],
  resourceBullets: ['Sorumluluk ve sadakat', 'Riskleri öngörme ve hazırlıklı olma', 'Ekip ruhu', 'Dikkatli ve özenli çalışma'],
  blindspots: [
    '{adın} en önemli gelişim alanı, belirsizlikle başa çıkabilmek. Zihni olası kötü sonuçlara odaklandığında kaygısı artıyor ve bu durum performansını düşürebiliyor.',
    'Fark etmediği bir nokta, kendi doğru kararlarını fark etmekte zorlanması olabilir. Onay almadan harekete geçmekte tereddüt edebilir; bu da sorumluluk almasını geciktirebilir.',
  ],
  blindspotBullets: ['"Ya kötü giderse" düşünceleriyle kaygılanma', 'Karar vermekte tereddüt ve sürekli onay arama', 'Belirsiz durumlarda donup kalma'],
  communication: [
    '{ad}, güvendiği kişilerle sıcak ve samimi bir iletişim kurar. Sorular sorarak durumu netleştirmeye çalışır; bu, ilgisizlik değil güvence arayışıdır.',
    'Yeni ve tanımadığı ortamlarda temkinli olabilir. Güven inşa edildikçe açılır ve gruba değerli katkılar sunar.',
  ],
  commStrong: 'güvendiği kişilerle samimi sohbetler, ekip içinde destek olmak.',
  commHard: 'yeni ve belirsiz ortamlar, ani kararlar, belirsiz tartışmalar.',
  commStep: 'yeni bir ortamda önce bir kişiyle tanışıp oradan genişlemek.',
  stress: [
    'Stres altında {adın} kaygısı belirginleşir; zihni olası sorunlarla meşgul olur, sık sık güvence ister, kararsızlaşır. Bazen bedeninde de gerginlik hissedebilir.',
    'Bu dönemlerde ona net bir plan sunmak, "olursa ne yaparız" sorusunu birlikte yanıtlamak ve sakin bir destek olmak iyi gelir.',
  ],
  stressSigns: 'sık sık güvence istemek, uykudan önce endişeli düşünceler, kararsızlık, bedensel gerginlik.',
  stressHelps: 'net bir plan, "olursa ne yaparız" konuşması, nefes ve gevşeme çalışmaları, güvenilir bir yetişkinin sakinliği.',
  conflict: [
    '{ad} çatışmada önce temkinli davranır; karşısındakinin niyetini anlamaya çalışır. Güvendiği biriyle anlaşmazlık yaşadığında bu onu derinden rahatsız edebilir.',
    'Eleştiri, açık ve tutarlı bir dille, ilişkiyi tehdit etmeden sunulduğunda kolay kabul edilir.',
  ],
  conflictTip: 'Geri bildirimi tutarlı, sakin ve net bir dille vermek; ardından "arkandayım" mesajını eklemek {adın} güvenle dinlemesini sağlar.',
  learning: [
    '{ad} en iyi, adımları net ve öngörülebilir bir düzende öğreniyor. Konunun haritası, çalışma planı ve sınav formatı hakkında bilgi sahibi olmak kaygısını azaltıp verimini artırıyor.',
    'Düzenli deneme ve tekrar, "hazırım" hissini güçlendirdiği için onun için özellikle değerli. Belirsizlik azaldıkça performansı da yükseliyor.',
  ],
  learningBullets: ['Net çalışma planı ve konu haritası', 'Düzenli deneme ve tekrar', 'Sınav formatını önceden tanıma', 'Güvendiği bir çalışma arkadaşı'],
  future: [
    'Sorumluluk duygusu, öngörü becerisi ve ekip ruhu; güvenliğin, düzenin ve dayanışmanın önemli olduğu alanlarda kendini rahat hissetmesini kolaylaştırabilir.',
  ],
  workEnv: ['Kuralların ve beklentilerin açık olduğu, güvenilir ekipler.', 'Planlı ilerleyen, öngörülebilir işler.'],
  drains: ['Sürekli değişen ve belirsiz ortamlar.', 'Güvenin zayıf olduğu, rekabetçi ekipler.', 'Tek başına ve aceleyle büyük karar verme baskısı.'],
  youAre:
    '{ad}, sen sorumluluk sahibi, sadık ve güvenilir birisin. Arkadaşların sana güvenebiliyor. Olası sorunları önceden görmen seni hazırlıklı yapıyor; ama bazen "ya kötü giderse" düşünceleri seni yorabiliyor. Kendi doğru kararlarına güvenmeyi öğrendikçe çok daha rahat hissedeceksin.',
  youStrengths: ['Sorumluluk sahibi ve güvenilirsin.', 'Olası sorunları önceden görebiliyorsun.', 'Takım içinde çok değerlisin.', 'Hazırlıklı olmayı seviyorsun.'],
  youGrowth:
    'Belirsiz durumlarda kaygılanıp en kötü ihtimali düşündüğün olabilir. Karar verirken sürekli başkalarına danışmak isteyebilirsin. Kendi kararlarını küçük adımlarla denedikçe sana olan güvenin artacak.',
  youWays: ['Çalışma planını önceden yap.', 'Sınav formatını tanı ve deneme çöz.', 'Güvendiğin bir arkadaşla çalış.', 'Kaygılandığında "olursa ne yaparım" planı yaz.'],
  youComm:
    'Güvendiğin insanlarla çok rahatsın; yeni ortamlarda ise önce gözlemliyorsun. Bu gayet doğal. Yeni bir ortamda önce bir kişiyle tanışmak işini kolaylaştırabilir.',
  youFuture:
    'Sorumluluk almak, ekip içinde çalışmak ve işleri planlı yürütmek sana iyi gelen şeyler gibi görünüyor. Bunlar bir meslek kararı değil, ipuçları; farklı alanları denedikçe kendini daha iyi tanıyacaksın.',
  youTry: [
    '"Olursa ne yaparım" planı: Kaygılandığın bir durum için üç maddelik bir çözüm planı yaz.',
    'Kendi kararım: Bu ay küçük bir konuda kimseye danışmadan karar ver ve sonucunu gözlemle.',
    'Nefes molası: Kaygılandığında 4 saniye nefes al, 4 saniye tut, 6 saniye ver; üç kez tekrarla.',
  ],
  youLast:
    '{ad}, sorumluluk duygun ve sadakatin çevrene güven veriyor. Aynı güveni kendine de gösterdiğinde, belirsizlikler seni eskisi kadar korkutmayacak.',
  familyOneLine:
    '{ad}, güvendiği insanlara bağlı ve sorumluluk sahibi; bu yüzden belirsizlikte kaygılanabilen ve arkasında güvenilir bir destek hissettiğinde cesaretle ilerleyen biri.',
  approaches: [
    { do: 'Tutarlı ve öngörülebilir olun.', why: 'Tutarlılık, {adın} güven duygusunu ve iç huzurunu destekler.' },
    { do: 'Belirsiz durumları birlikte netleştirin.', why: 'Ne olacağını bildiğinde kaygısı belirgin biçimde azalır.' },
    { do: 'Kendi kararlarını vermesine alan tanıyın.', why: 'Küçük kararlarla öz güveni gelişir.' },
    { do: 'Kaygısını küçümsemeden dinleyin.', why: 'Duyulduğunu hissetmek, kaygıyı yönetmenin ilk adımıdır.' },
    { do: '"Olursa ne yaparız" planlarını birlikte yapın.', why: 'Hazırlıklı olma hissi kaygıyı eyleme dönüştürür.' },
  ],
  doList: ['Planları önceden ve açıkça paylaşın.', 'Verdiği doğru kararları fark edin.', 'Kaygısını ciddiye alıp birlikte çözüm arayın.', 'Sakin ve tutarlı bir model olun.'],
  dontList: ['Planları son dakikada sık sık değiştirmeyin.', '"Boş yere korkuyorsun" demeyin.', 'Kararlarını sürekli onun yerine vermeyin.', 'Kaygıyı artıran felaket senaryoları konuşmayın.'],
  dialog: [
    { instead: 'Boş yere endişeleniyorsun.', tryThis: 'Seni en çok ne endişelendiriyor, birlikte bakalım mı?' },
    { instead: 'Sen karar verme, ben hallederim.', tryThis: 'Sen ne düşünüyorsun? Kararına güveniyorum.' },
    { instead: 'Bu kadar soru sorma.', tryThis: 'Neyi netleştirmek istersin?' },
    { instead: 'Kötü olursa ne olacak?', tryThis: 'Olursa ne yapabiliriz, bir plan yapalım.' },
  ],
  homeEnv: [
    '{ad} düzenli ve öngörülebilir bir ev ortamında rahat çalışır. Haftalık çalışma planının görünür bir yerde durması ve önemli tarihlerin önceden bilinmesi kaygısını azaltır.',
    'Sınav öncesi akşamlarda sakin ve rutini bozmayan bir ortam sağlamak, onun hazırlıklı hissetmesine yardım eder.',
  ],
  gradeTalk: [
    'Not konuşmalarında sakin ve tutarlı olun. Düşük bir notta suçlamak yerine "bir sonraki sefer için ne yapabiliriz" planına odaklanın. Bu yaklaşım, kaygısını eyleme dönüştürmesini sağlar.',
  ],
  compare:
    '{adı} başkalarıyla karşılaştırmak, onun güvensizlik ve kaygı duygularını artırabilir. Kendi gelişimini görünür kılmak, öz güvenini güçlendirmenin en etkili yoludur.',
  supportSigns: [
    'Günlük hayatı etkileyen yoğun ve sürekli kaygı',
    'Uykuya dalmakta zorlanma, sık bedensel şikâyetler',
    'Okula ya da sınavlara gitmekten kaçınma',
    'Karar verememenin günlük işleri belirgin biçimde aksatması',
  ],
  plan: [
    '{adın} hangi durumlarda kaygılandığını gözlemleyin. Haftalık planları birlikte görünür hâle getirin. Kaygısını dinleyen sakin konuşmalar yapın.',
    '"Olursa ne yaparız" planlarını alışkanlık hâline getirin. Küçük kararları ona bırakın. Basit nefes ve gevşeme çalışmalarını birlikte deneyin.',
    'Neyin işe yaradığını birlikte konuşun. Kendi kararlarıyla elde ettiği başarıları görünür kılın. Gerekirse rehber öğretmenle kaygı yönetimini konuşun.',
  ],
  caseTheme: 'sadık ve sorgulayıcı bir yönelim; öne çıkan konular: belirsizlikte artan kaygı ve kendi kararına güvenmekte zorlanma',
  findings: [
    'Yüksek sorumluluk ve sadakat.',
    'Belirsizliğe duyarlılık; felaketleştirme eğilimi.',
    'Karar vermede tereddüt ve onay arama.',
    'Güvenli ortamda belirgin performans artışı.',
  ],
  cognitive: [
    '"En kötü ne olabilir – en olası ne – olursa ne yaparım" düşünce çalışması.',
    'Kaygılı düşünceleri kanıtlarla sınama.',
    'Küçük kararlarla öz yeterlik deneyimleri oluşturma.',
  ],
  emotional: [
    'Nefes ve gevşeme teknikleriyle bedensel kaygıyı düzenleme.',
    'Güvenli ve tutarlı bir destek ilişkisi kurma.',
    'Kaygıyı adlandırma ve ölçekleme (0-10).',
  ],
  questions: [
    'Seni en çok hangi durumlar endişelendiriyor?',
    'Bir karar verirken kimlere danışıyorsun?',
    'Kaygılandığında bedeninde neler hissediyorsun?',
    'Kendini en güvende hissettiğin yer ve kişiler kimler?',
  ],
  verify: [
    ['Belirsizlikte kaygı artıyor', 'Sınav formatı bilinen ve bilinmeyen durumlardaki tepkisini karşılaştırmak'],
    ['Onay almadan karar vermekte zorlanıyor', 'Küçük kararlarda danışma sıklığını birlikte kaydetmek'],
    ['Plan yapıldığında kaygı azalıyor', 'Plan öncesi ve sonrası kaygıyı 0-10 ölçekle değerlendirmek'],
  ],
  priorities: [
    ['Güven ilişkisi', 'Tutarlı ve öngörülebilir bir destek ilişkisi temeldir.'],
    ['Kaygı farkındalığı', 'Kaygılı düşünceleri fark etme ve sınama becerisi kazandırılır.'],
    ['Karar verme', 'Küçük kararlarla öz yeterlik güçlendirilir.'],
    ['Bedensel düzenleme', 'Nefes ve gevşeme teknikleri günlük rutine eklenir.'],
  ],
  referral:
    'Günlük işlevselliği etkileyen yoğun kaygı, panik benzeri ataklar, okuldan kaçınma veya belirgin uyku sorunları gözlenirse bir ruh sağlığı uzmanına yönlendirme değerlendirilmelidir.',
  monitoring: 'Her görüşmede kaygı düzeyi (0-10), verdiği bağımsız kararlar ve plan kullanımı birlikte gözden geçirilebilir.',
};
