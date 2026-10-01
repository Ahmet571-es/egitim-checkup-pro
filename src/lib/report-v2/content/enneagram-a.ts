// ============================================================
// Rapor v2 — Enneagram tipleri (1-3)
// ============================================================
import type { Profile } from './types';

export const ENN1: Profile = {
  id: 'enn1',
  weight: 10,
  result: [
    "{ad} için \"doğru olanı yapmak\" ve \"hata yapmamak\" önemli bir iç pusula. Kurallara, adalete ve düzene değer veriyor; işlerin olması gerektiği gibi yapılmasını istiyor.",
    "Bu eğilimin gölge tarafı, iç eleştirmeninin sesinin zaman zaman fazla yükselmesi.",
  ],
  kisaca:
    '{ad}, işleri doğru ve özenli yapmaya büyük önem veren, sözüne güvenilir ve iç dünyasında yüksek standartlar taşıyan biri. Bu yüksek özen, zaman zaman kendine karşı sertleşmesine, eleştiriden çok etkilenmesine ve işe başlamayı ertelemesine yol açabiliyor.',
  strengths: [
    'Sorumluluk duygusu güçlü; söz verdiği işi sahiplenir ve özenle yapar.',
    'Doğruya, adalete ve düzene değer verir; güvenilir bir duruşu vardır.',
    'Bir işi sonuna kadar götürme ve ayrıntıyı görme becerisi güçlü görünüyor.',
  ],
  growth: [
    '"Tam doğru olmalı" baskısıyla işe başlamayı erteleme ve kendini fazla yorma eğilimi.',
    'Eleştiriyi kişisel algılama; hatayı "yeterince iyi olmamak" gibi hissetme.',
  ],
  develop: [
    'İşe "yeterince iyi" bir taslakla başlamayı ve sonra geliştirmeyi denemek.',
    'Hatayı öğrenmenin doğal bir parçası olarak görmeyi; geri bildirimi kişisel değil, işe yönelik algılamayı öğrenmek.',
    'Çalışma ile dinlenme arasında önceden belirlenmiş bir denge kurmak.',
  ],
  priority:
    'Önümüzdeki dönemin önceliği, {adın} "yeterince iyi" ile "kusursuz" arasındaki farkı deneyimlemesi: işe küçük ve kusurlu bir başlangıçla girmeyi, hatayı bir öğrenme adımı olarak görmeyi alışkanlık hâline getirmesi.',
  portrait: [
    '{ad}, işlerin "doğru" yapılmasına içten bağlı biri. Ödevini teslim etmek onun için yetmez; ödevin düzgün, eksiksiz ve özenli olması gerekir. Bu özen dışarıdan bakıldığında olgunluk ve güvenilirlik olarak görünür. Öğretmenleri onu "sorumluluk sahibi", arkadaşları ise "sözüne güvenilir" biri olarak tanıyor olabilir.',
    'Kurallara, adalete ve düzene değer veriyor; bir şeyin olması gerektiği gibi yapılmadığını gördüğünde rahatsız olabiliyor. Bu ilkeli tutum, doğru desteklendiğinde onu hem kendine hem çevresine güven veren biri yapıyor.',
    'Aynı özen, bazen {adın} kendine karşı fazla sert olmasına yol açıyor. İçinde zaman zaman "daha iyi olmalıydı" diyen bir ses olabilir. Bu ses onu hem ileri taşıyor hem de yoruyor; hatalar onun zihninde olduğundan büyük yer kaplayabiliyor.',
  ],
  key: '{adı} anlamanın anahtarı: Onun için hata yapmak, yalnızca bir işin yanlış olması değil; "yeterince iyi olmamak" gibi hissedilebiliyor.',
  motivates:
    '{adı} en çok harekete geçiren şey, yaptığı işin anlamlı ve doğru olduğunu hissetmek. Bir işin neden önemli olduğunu anladığında ve ondan ne beklendiği açık olduğunda büyük bir özenle çalışır. Başkasına faydalı olacağını bildiği işlerde enerjisi belirgin biçimde artar.',
  stops:
    'Onu durduran şey ise çoğu zaman tembellik değil, "tam doğru yapamama" kaygısıdır. Bir işe oturduğunda, işin nasıl kusursuz olacağını kafasında kurmaya başlar; bu tablo gözünde büyüdükçe başlamak zorlaşır. Dışarıdan erteleme gibi görünen davranışın arkasında çoğu zaman bu yüksek beklenti vardır.',
  motivators: ['açık beklentiler', 'anlamlı hedefler', 'emeğinin fark edilmesi', 'düzenli ve sakin bir ortam'],
  stoppers: ['belirsiz görevler', '"mükemmel olmalı" baskısı', 'herkesin önünde düzeltilmek', 'aynı anda çok fazla iş'],
  resources: [
    '{adın} en güçlü kaynağı sorumluluk duygusu. Planlı çalışmaya, düzen kurmaya ve bir işi sonuna kadar götürmeye doğal bir eğilimi var. Bu özellik, okul yıllarında artan iş yüküyle başa çıkmasında ona önemli bir dayanak olacak.',
    'Ayrıntıyı görmesi, hatayı fark etmesi ve kurala dikkat etmesi, özellikle özen ve doğruluk isteyen işlerde ona avantaj sağlıyor. Doğru desteklendiğinde bu titizlik, kendini düzenlemesinde de işine yarayacak.',
  ],
  resourceBullets: ['Özen, düzen ve görev bilinci', 'Ayrıntıyı görme ve hatayı fark etme', 'Adalet duygusu ve güvenilirlik', 'Bir işi sonuna kadar götürme kararlılığı'],
  blindspots: [
    '{adın} en önemli gelişim alanı, kendine koyduğu çıtanın yüksekliği. "Yeterince iyi" ile "kusursuz" arasındaki farkı ayırt etmekte zorlanabiliyor. Bu yüzden bir işe başlamak ona olması gerekenden daha ağır gelebiliyor; başladığında ise aynı işi defalarca düzeltmeye çalışabiliyor.',
    'Fark etmediği bir nokta da şu olabilir: Kendine gösterdiği sertlik, zaman zaman başkalarına yönelik beklentilerine de yansıyabilir. Bir grup çalışmasında işler onun istediği özenle yapılmadığında, sessizce işin büyük kısmını kendi üstlenmeyi seçebilir. Bu hem onu yorar hem de arkadaşlarının katkı alanını daraltır.',
  ],
  blindspotBullets: ['Mükemmeliyetçilik kaynaklı erteleme', 'İşi gereğinden fazla üstlenme ve yardım istememe', 'Küçük hataları büyük başarısızlık gibi görme'],
  communication: [
    '{ad}, dürüst ve açık iletişime değer veriyor; söylediğinin arkasında durmaya özen gösteriyor. Güvendiği kişilerle derin ve anlamlı sohbetler kurabiliyor. Kalabalık ortamlarda ise söz almadan önce söyleyeceğinin doğru olduğundan emin olmak isteyebilir; bu yüzden bildiği hâlde el kaldırmadığı anlar olabilir.',
    'Bu çekingenlik değil; daha çok "yanlış bir şey söylememe" özenidir. Yeni bir ortama girdiğinde önce gözlemler, kuralları anladıktan ve güven duyduktan sonra açılır.',
  ],
  commStrong: 'bire bir sohbetler, açık ve dürüst konuşmalar, sorumluluk gerektiren grup rolleri.',
  commHard: 'kalabalık önünde anlık söz almak, belirsiz tartışmalar, doğrudan eleştiri.',
  commStep: 'sınıfta önce küçük gruplarda söz almayı denemek; konuşmadan önce birkaç not almak.',
  stress: [
    '{ad} stres altındayken çoğu zaman dışarıya değil içeriye döner. Sessizleşir, daha çok çalışarak durumu kontrol altına almaya çalışır. Dışarıdan bakıldığında "çok çalışıyor, sorun yok" gibi görünebilir; oysa bu dönemlerde iç yükü artmış olabilir.',
    'Stres arttıkça iş listesini büyütmek, dinlenme zamanından kısmak ve küçük hatalara aşırı üzülmek gibi davranışlar görülebilir. Önemli olan bu hassasiyeti bastırmak değil, stresini fark edip dile getirmesine ve dinlenmeyi bir "hak" olarak görmesine yardımcı olmaktır.',
  ],
  stressSigns: 'her zamankinden sessiz olmak, gece geç saatlere kadar çalışmak, küçük hatalara aşırı üzülmek.',
  stressHelps: 'sakin, baş başa bir konuşma, düşüncelerini yazıya dökmek, iş listesini birlikte küçültmek, kısa yürüyüşler.',
  conflict: [
    '{ad} için eleştiri çoğu zaman yalnızca yapılan işe değil, kendisine yöneltilmiş gibi hissedilir. Bir hatası herkesin önünde düzeltildiğinde, bu küçük an onun zihninde gün boyu dönebilir. Tepkisi genellikle karşı çıkmak değil, susmak ve içine kapanmaktır.',
    'Haklı olduğunu düşündüğü bir konuda, özellikle adalet söz konusu olduğunda, içten içe kırgınlık biriktirebilir. Geri bildirim önce güçlü yanı, sonra somut bir düzeltme önerisi içerdiğinde çok daha kolay kabul ediliyor.',
  ],
  conflictTip: 'Eleştiri verirken "ne yanlış" yerine "bir sonraki adımda ne denenebilir" dilini kullanmak, {adın} savunmaya geçmeden dinlemesini kolaylaştırır.',
  learning: [
    '{ad} en iyi, ne beklendiğinin açık olduğu, adım adım ilerleyen bir çalışma düzeninde öğreniyor. Onun için en önemli öğrenme kuralı, işi küçük parçalara bölmek. "Bu akşam ödevi bitir" yerine "ilk 20 dakikada sadece taslak çıkar" gibi net ve kısa hedefler, mükemmeliyetçilik baskısını azaltıyor.',
    'İlk taslağın "kötü olabileceğine" baştan izin vermek başlamayı kolaylaştırıyor. Düzeltmeyi sonraya bırakan bir çalışma sırası, enerjisini korumasına yardım ediyor.',
  ],
  learningBullets: ['Kısa ve zamanı belli çalışma blokları (örneğin 25 dakika çalışma, 5 dakika mola)', 'Önce taslak, sonra düzeltme sırası', 'Açık ve adım adım yönergeler', 'Yazılı geri bildirim'],
  future: [
    'Özen, düzen ve doğruluk anlayışı; kuralların, kalitenin ve güvenilirliğin önemli olduğu alanlarda kendini rahat hissetmesini kolaylaştırabilir. İnsanlara faydalı olma isteği eklendiğinde, sorumluluk alıp işi dikkatle yürütmeyi gerektiren ortamlar ona anlamlı gelebilir.',
  ],
  workEnv: ['Net beklentilerin ve kalite ölçütlerinin olduğu, düzenli ve adil işleyen ortamlar.', 'Emeğin ve özenin görüldüğü, işin anlamının açık olduğu görevler.'],
  drains: ['Kuralların sık değiştiği, belirsiz ve dağınık ortamlar.', 'Sürekli acele ve "nasıl olursa olsun bitsin" baskısı.', 'Hataların herkesin önünde tartışıldığı ortamlar.'],
  youAre:
    '{ad}, sen işleri doğru ve özenli yapmayı çok önemseyen birisin. Söz verdiğin işi sahipleniyorsun, adaletli olmaya önem veriyorsun ve insanlar sana güvenebiliyor. Bazen içindeki "daha iyi olmalıydı" diyen ses fazla yükselebiliyor; bu ses senin özeninden geliyor ama seni gereğinden fazla yorabiliyor. Bu özelliklerin hiçbiri yanlış değil; hepsi seni sen yapan parçalar.',
  youStrengths: ['Sorumluluk sahibisin; insanlar sana güvenebiliyor.', 'Bir işi özenle ve sonuna kadar yapabiliyorsun.', 'Ayrıntıyı görüyor, hatayı fark edebiliyorsun.', 'Doğruya ve adalete değer veriyorsun.'],
  youGrowth:
    'Bir işe başlamayı, "tam doğru yapamam" düşüncesiyle ertelediğin oluyor olabilir. Bir hatayı ya da eleştiriyi uzun süre kafanda çevirdiğin, zorlandığında yardım istemek yerine her şeyi tek başına çözmeye çalıştığın zamanlar da olabilir. Bunlar üzerinde çalışılabilecek alışkanlıklar; hepsi küçük adımlarla değişebilir.',
  youWays: ['İşi küçük parçalara böl; ilk hedefin sadece "başlamak" olsun.', 'İlk taslağın kusurlu olmasına izin ver; düzeltmeyi sonraya bırak.', 'Çalışma sürene bir bitiş saati koy ve mola vermeyi ihmal etme.', 'Bitirdiğin işleri bir listede işaretle; ilerlemeni gör.'],
  youComm:
    'Güvendiğin insanlarla açık ve dürüst konuşmakta çok iyisin; kalabalıkta ise önce emin olmak istiyorsun. Bu gayet doğal. Söylemek istediğin bir şeyi yüz yüze anlatmakta zorlanırsan önce yazmayı deneyebilirsin; bir not ya da mesaj, konuşmayı başlatmanın güzel bir yolu olabilir.',
  youFuture:
    'Özenli olmak, sorumluluk almak ve işleri doğru yürütmek sana iyi gelen şeyler gibi görünüyor. Bunlar bir meslek kararı değil, sadece ipuçları. Önümüzdeki yıllarda farklı alanları merakla denemen ve seni neyin heyecanlandırdığını gözlemlemen en iyisi.',
  youTry: [
    '20 dakika kuralı: Ertelediğin bir işe sadece 20 dakika ayır; bitirmek zorunda değilsin, sadece başla.',
    'Akşam notu: Her akşam o gün "yeterince iyi" yaptığın bir şeyi deftere yaz.',
    'Bir kez yardım iste: Bu ay en az bir kez zorlandığın bir konuda öğretmeninden ya da bir arkadaşından yardım iste.',
  ],
  youLast:
    '{ad}, özenin senin en güzel yanlarından biri. Ama değerin yaptığın işlerin kusursuz olmasına bağlı değil. Hata yapmak, öğrenmenin doğal bir parçası. Kendine, bir arkadaşına göstereceğin kadar anlayış göstermeyi denersen hem daha rahat hem daha güçlü olacaksın.',
  familyOneLine:
    '{ad}, doğruyu yapmayı ve işleri özenle yürütmeyi çok önemseyen; bu yüzden kendine karşı sert olabilen, eleştiriden kolay etkilenen ve anlaşıldığını hissettiğinde en iyi hâline ulaşan biri.',
  approaches: [
    { do: 'Sonuç yerine emeği takdir edin.', why: '{adın} değerinin başarıya bağlı olmadığını hissetmesi, mükemmeliyetçilik baskısını azaltır.' },
    { do: 'Geri bildirimi mümkünse baş başa ve sakin bir anda verin.', why: 'Baş başa verilen geri bildirim ona duygusunu sakinleştirip öneriyi kendi hızında düşünme fırsatı tanır.' },
    { do: 'Büyük işleri birlikte küçük adımlara bölün.', why: 'Net ve küçük hedefler, başlamayı zorlaştıran "mükemmel olmalı" tablosunu küçültür.' },
    { do: 'Kendi hatalarınızı rahatça paylaşın.', why: 'Hatanın doğal olduğunu sizden görmek, {adın} kendine daha anlayışlı olmasına model olur.' },
    { do: 'Sessizleştiğinde baş başa sakin bir zaman ayırın.', why: '{ad} stresini dışa değil içe yansıtır; güvenli bir baş başa anda açılır.' },
  ],
  doList: ['Eleştiriyi baş başa ve sakin bir anda yapın.', 'Önce güçlü yanı, sonra somut bir öneriyi söyleyin.', 'Dinlenmeyi ve boş zamanı açıkça destekleyin.', '"Yeterince iyi" olanı fark edip dile getirin.'],
  dontList: ['Hatasını başkalarının yanında düzeltmeyin.', '"Daha iyisini yapabilirdin" cümlesini sık kullanmayın.', 'Gece geç saate kadar çalışmasını övmeyin.', 'Sessizliğini "sorun yok" diye yorumlamayın.'],
  dialog: [
    { instead: 'Neden hâlâ başlamadın?', tryThis: 'İlk 20 dakikada nereden başlamak istersin?' },
    { instead: 'Bu kadar dert edilecek bir şey değil.', tryThis: 'Bunun seni üzdüğünü görüyorum, anlatmak ister misin?' },
    { instead: 'Şurası da eksik olmuş.', tryThis: 'Bu kısım çok güzel olmuş; bir sonraki adımda şunu da ekleyebilirsin.' },
    { instead: 'Hep her şeyi kafana takıyorsun.', tryThis: 'Bu kadar özenli olman güzel; ama bugünlük bu kadarı yeterli.' },
  ],
  homeEnv: [
    '{ad} sessiz, düzenli ve dikkat dağıtıcıların az olduğu bir ortamda rahat çalışır. Masasında bir haftalık plan ve günlük küçük bir yapılacaklar listesi bulunması ona iyi gelir; ancak listelerin çok uzamamasına dikkat edin, günde 3-4 net hedef yeterlidir.',
    'Ödev başında sık sık yanına gidip kontrol etmek, iyi niyetli olsa bile "doğru yapıyor muyum" kaygısını artırabilir. Bunun yerine çalışma bitince kısa bir sohbetle nasıl geçtiğini sormak daha iyi sonuç verir. Bir işi defalarca baştan yaptığını fark ederseniz, "Bu hâli teslim etmeye yeterli" gibi nazik bir sınır koymak onu rahatlatır.',
  ],
  gradeTalk: [
    'Not konuşmalarında sonuçtan çok sürece odaklanmak faydalı olur: "Kaç aldın?" yerine "Nasıl hazırlandın, bir dahakine neyi farklı yapmak istersin?" gibi sorular. Beklentinin altında bir not geldiğinde {ad} muhtemelen kendini zaten yeterince eleştiriyor olacaktır; sizin rolünüz bu sesi büyütmek değil, dengelemek.',
  ],
  compare:
    '{adı} kardeşleriyle, kuzenleriyle ya da sınıf arkadaşlarıyla karşılaştırmak, iyi niyetle yapılsa bile onun iç eleştirmenini güçlendirir. "Bak o nasıl yapmış" cümlesi, {adda} motivasyondan çok "yeterince iyi değilim" duygusu uyandırabilir.',
  supportSigns: [
    'Uzun süre içine kapanma, sevdiği şeylerden ve arkadaşlarından uzaklaşma',
    'Uyku düzeninin belirgin biçimde bozulması, gece geç saatlere kadar çalışmanın alışkanlığa dönüşmesi',
    'Küçük hatalar karşısında yoğun ve uzun süren üzüntü ya da kendini sert sözlerle eleştirme',
    'İşleri ertelemenin artık belirgin biçimde okul hayatını aksatması',
  ],
  plan: [
    '{adın} hangi durumlarda ertelediğini ve sessizleştiğini not edin. Haftada bir kez baskısız, baş başa bir sohbet zamanı oluşturun. Emeği takdir eden cümleleri günlük dile yerleştirin.',
    'Büyük ödevleri birlikte parçalara bölün; "20 dakika kuralı"nı destekleyin. Geri bildirimi önce güçlü yandan başlayarak verin. Çalışmaya bir bitiş saati koyun.',
    '{adla} birlikte neyin işe yaradığını konuşun. Yardım isteme ve kusurlu başlama konusunda küçük başarıları görünür kılın. Gerekirse rehber öğretmenle ortak bir görüşme planlayın.',
  ],
  caseTheme: 'ilkeli ve mükemmeliyetçi bir yönelim; öne çıkan konular: "doğru yapma" baskısına bağlı erteleme ve eleştiriyi kişisel algılama',
  findings: [
    'Yüksek iç standartlar; kusursuzluk beklentisine bağlı başlama güçlüğü.',
    'Eleştiriye duyarlılık; tepki dışa değil içe dönük (susma, geri çekilme).',
    'Stres altında iş yükünü artırarak kontrol sağlama eğilimi.',
    'Kural, düzen ve adalet konularında belirgin hassasiyet.',
  ],
  cognitive: [
    '"Ya hep ya hiç" düşüncelerini fark etmeye yönelik basit düşünce kayıtları (durum – düşünce – alternatif düşünce).',
    '"Yeterince iyi" ölçütlerini görev başlamadan önce birlikte ve somut olarak tanımlama.',
    'Görev bölme ve zaman kutulama teknikleriyle başlama eşiğini düşürme.',
  ],
  emotional: [
    'Kendine anlayışlı konuşma pratiği: "Bir arkadaşın aynı hatayı yapsa ona ne söylerdin?"',
    'Duyguları yazarak adlandırma ve düzenleme.',
    'Dinlenmeyi ve molayı plana dahil ederek suçluluk duygusunu azaltma.',
  ],
  questions: [
    'Bir ödeve başlamadan önce aklından neler geçiyor?',
    'Senin için "yeterince iyi" bir iş nasıl görünür?',
    'Bir öğretmen seni düzelttiğinde o gün içinde neler hissediyorsun?',
    'Zorlandığında en çok kime ve nasıl açılmayı tercih ediyorsun?',
  ],
  verify: [
    ['Erteleme, beklentinin yüksekliğinden kaynaklanıyor', 'Ertelenen görevlerde başlamadan önceki düşünceleri birlikte kaydetmek'],
    ['Baş başa geri bildirim daha kolay kabul ediliyor', 'Aynı öneriyi bir kez sınıf içinde, bir kez baş başa vererek tepkiyi gözlemlemek'],
    ['Stres altında iş yükünü artırıyor', 'Yoğun haftalarda çalışma saatleri ve uyku düzenini birlikte takip etmek'],
  ],
  priorities: [
    ['Güvenli ilişki kurma', 'Eleştiriye hassas olduğu için önce yargılamayan, baş başa bir güven ortamı gerekir.'],
    ['Mükemmeliyetçiliği fark etme', 'Erteleme ve yorgunluğun kaynağı bu olduğundan diğer adımların temelini oluşturur.'],
    ['Başlama ve bitirme becerisi', 'Görev bölme ve zaman kutulama ile somut başarı deneyimleri oluşturulur.'],
    ['Stres ve yardım isteme', 'Kazanılan güvenle birlikte duygularını dile getirme ve destek isteme çalışılır.'],
  ],
  referral:
    'Uzun süreli içe kapanma, belirgin uyku ya da iştah değişiklikleri, kendine yönelik yoğun ve süreklileşen olumsuz konuşmalar veya okul işlevselliğinde belirgin düşme gözlenirse bir ruh sağlığı uzmanına yönlendirme değerlendirilmelidir.',
  monitoring:
    'Her görüşmede ertelenen görev sayısı, yardım isteme örnekleri ve yoğun dönemlerdeki uyku düzeni birlikte gözden geçirilebilir.',
};

export const ENN2: Profile = {
  id: 'enn2',
  weight: 10,
  result: [
    "{ad} için sevilmek, ihtiyaç duyulmak ve başkalarına faydalı olmak önemli bir iç ihtiyaç. Çevresindekilerin duygularını hızla fark ediyor ve yardım etmekten mutluluk duyuyor.",
    "Bu eğilimin gölge tarafı, başkalarını önemserken kendi ihtiyaçlarını geri plana atabilmesi.",
  ],
  kisaca:
    '{ad}, sıcak, yardımsever ve insanlarla bağ kurmaya çok önem veren biri. Çevresindekilerin ihtiyaçlarını hızla fark ediyor; ancak başkalarını önemserken kendi ihtiyaçlarını geri plana atabiliyor ve onaylanmadığını hissettiğinde kolay kırılabiliyor.',
  strengths: [
    'Empati gücü yüksek; arkadaşlarının ne hissettiğini çabuk fark eder.',
    'Yardım etmeye ve destek olmaya isteklidir; grubun "sıcak" yüzüdür.',
    'İlişki kurmada ve iş birliğinde doğal bir yeteneği vardır.',
  ],
  growth: [
    '"Hayır" demekte zorlanma; başkalarının işini kendi işinin önüne koyma.',
    'Takdir görmediğinde kırılma ve bunu dile getirmek yerine içinde biriktirme.',
  ],
  develop: [
    'Kendi işini önceliklendirip gerektiğinde nazikçe "hayır" demeyi denemek.',
    'Kırgınlıklarını biriktirmeden, sakin bir zamanda dile getirmeyi öğrenmek.',
    'Kendi ilgi alanlarına ayrılmış, yalnızca kendisi için olan bir zaman dilimi oluşturmak.',
  ],
  priority:
    'Önümüzdeki dönemin önceliği, {adın} kendi ihtiyaçlarını da en az başkalarınınki kadar önemsemeyi öğrenmesi: kendi işine zaman ayırmayı ve gerektiğinde nazikçe "hayır" demeyi alışkanlık hâline getirmesi.',
  portrait: [
    '{ad}, insanlarla kurduğu bağlardan güç alan biri. Bir arkadaşının üzgün olduğunu çoğu zaman o söylemeden fark eder; yanına gider, dinler, elinden geleni yapar. Sınıfta yeni gelen birini kaynaştıran, kırgın iki arkadaşı barıştıran kişi çoğu zaman odur.',
    'Bu sıcaklık ona sevilen ve aranan biri olma imkânı veriyor. Ancak {ad} için "işe yaramak" ve "sevilmek" zaman zaman iç içe geçebiliyor. Yardım ettiğinde değerli hissediyor; yardımı fark edilmediğinde ise sessizce kırılabiliyor.',
    'Başkalarına bu kadar odaklanmak, kendi isteklerini ve sınırlarını fark etmesini zorlaştırabiliyor. "Sen ne istiyorsun?" sorusu ona bazen beklenmedik derecede zor gelebilir.',
  ],
  key: '{adı} anlamanın anahtarı: Onun için ilişki her şeyden önce gelir; kendini değerli hissetmesi, sevildiğini ve ihtiyaç duyulduğunu hissetmesine bağlıdır.',
  motivates:
    '{adı} en çok harekete geçiren şey, yaptığı işin birine dokunduğunu görmek. Bir arkadaşına konu anlatmak, grup çalışmasında herkesin iyi hissetmesini sağlamak ya da öğretmeninin takdirini görmek enerjisini belirgin biçimde artırır. Sıcak ve ilgili bir yetişkinle çalıştığında daha istekli olur.',
  stops:
    'Onu durduran şey çoğu zaman soğuk, mesafeli ya da eleştirel ortamlardır. İlgi görmediğini ya da emeğinin fark edilmediğini hissettiğinde motivasyonu hızla düşebilir. Başkalarına yardım ederken kendi işlerini son ana bıraktığı da olabilir.',
  motivators: ['sıcak ve ilgili ilişkiler', 'emeğinin görülmesi', 'başkasına faydalı olmak', 'grup içinde anlamlı bir rol'],
  stoppers: ['soğuk ve mesafeli tutumlar', 'emeğinin fark edilmemesi', 'yalnız bırakılmak', 'sert ve kişisel eleştiri'],
  resources: [
    '{adın} en güçlü kaynağı insanları anlama ve onlarla bağ kurma becerisi. Bu beceri; grup çalışmalarında, akran desteğinde ve iletişim gerektiren her ortamda ona önemli bir avantaj sağlıyor.',
    'Cömertliği ve yardımseverliği, çevresinde güvenilir ve sevilen biri olmasını kolaylaştırıyor. Bu enerjiyi kendisine de yöneltebildiğinde, hem ilişkilerinde hem kendi gelişiminde dengeli bir güç kazanacak.',
  ],
  resourceBullets: ['Empati ve duygusal farkındalık', 'İş birliği ve ilişki kurma becerisi', 'Cömertlik ve destek olma isteği', 'Grubu kaynaştırma yeteneği'],
  blindspots: [
    '{adın} en önemli gelişim alanı, kendi ihtiyaçlarını ve sınırlarını fark etmek. Başkası istediğinde kendi planını kolayca bir kenara bırakabiliyor; bu da zaman içinde yorgunluk ve "beni kimse düşünmüyor" duygusu biriktirebilir.',
    'Fark etmediği bir nokta, yardımlarının karşılığında bir onay beklemesi olabilir. Bu beklenti karşılanmadığında kırgınlığını açıkça söylemek yerine içine atabilir ya da dolaylı yollarla gösterebilir.',
  ],
  blindspotBullets: ['"Hayır" diyememe ve sınır koymakta zorlanma', 'Kendi işlerini başkalarının işleri yüzünden erteleme', 'Takdir görmediğinde içten içe kırgınlık biriktirme'],
  communication: [
    '{ad}, sıcak, ilgili ve konuşmayı kolaylaştıran bir iletişim tarzına sahip. Karşısındakinin duygusunu hızlı okuyor ve ona göre davranıyor. İnsanlar ona dertlerini rahatça açabiliyor.',
    'Ancak kendi duygularını, özellikle kırgınlık ve öfkeyi dile getirmekte aynı rahatlığı göstermeyebilir. Ortamın havasını bozmamak için "sorun yok" deyip geçtiği olabilir.',
  ],
  commStrong: 'dinlemek, teselli etmek, grubu bir arada tutmak.',
  commHard: 'kendi isteğini açıkça söylemek, "hayır" demek, kırgınlığını dile getirmek.',
  commStep: 'haftada bir kez kendi isteğini açık bir cümleyle söylemeyi denemek.',
  stress: [
    'Stres altında {ad} daha çok başkalarına koşabilir; kendi derdini unutmak için çevresindekilerle uğraşır. Yük arttığında ise yorgunluk, alınganlık ve "kimse beni anlamıyor" duygusu belirginleşebilir.',
    'Bu dönemlerde ondan beklenen yardımları azaltmak ve ona kendisi için zaman ayırmasının bencillik olmadığını hatırlatmak iyi gelir.',
  ],
  stressSigns: 'her şeye "olur" demek, aşırı yorgunluk, küçük şeylere alınmak, kendi işlerini sürekli ertelemek.',
  stressHelps: 'sıcak bir sohbet, sevgisinin koşulsuz olduğunu hissettiren küçük jestler, ondan beklenenleri azaltmak.',
  conflict: [
    '{ad} çatışmadan hoşlanmaz; ilişkiyi korumak için çoğu zaman geri adım atar. Eleştiriyi yapılan işe değil, ilişkiye yönelik bir mesaj gibi algılayabilir ve "artık beni sevmiyor mu?" diye düşünebilir.',
    'Bu nedenle eleştirinin ilişkiyi tehdit etmediğini açıkça belli etmek, onun eleştiriyi dinleyebilmesini kolaylaştırır.',
  ],
  conflictTip: 'Eleştiriden önce ilişkiyi güvenceye almak ("Seninle çalışmak çok güzel; şu kısmı birlikte düzeltelim") {adın} savunmaya geçmeden dinlemesini sağlar.',
  learning: [
    '{ad} en iyi, ilişki içinde öğreniyor: birine anlatırken, birlikte çalışırken, ilgili bir öğretmenle soru-cevap yaparken. Konuyu bir arkadaşına anlatmak onun için hem öğrenme hem pekiştirme yolu.',
    'Tek başına çalışırken ise kısa ve net hedefler, ilerlemesini görebileceği bir takip listesi ve ara sıra gelen olumlu geri bildirim motivasyonunu korumasına yardım ediyor.',
  ],
  learningBullets: ['Çalışma arkadaşıyla karşılıklı soru sorma', 'Konuyu birine anlatarak tekrar', 'İlgili bir yetişkinle kısa kontrol görüşmeleri', 'İlerlemeyi gösteren takip listesi'],
  future: [
    'İnsanlara yardım etme isteği ve ilişki kurma becerisi; eğitim, sağlık, rehberlik, sosyal hizmet ve insanlarla birebir çalışmayı gerektiren alanlarda kendini anlamlı hissetmesini kolaylaştırabilir.',
  ],
  workEnv: ['İş birliğinin ve sıcak ilişkilerin olduğu ekipler.', 'Yaptığı işin insanlara doğrudan etkisini görebildiği ortamlar.'],
  drains: ['Rekabetin sert ve kişisel olduğu ortamlar.', 'Uzun süre yalnız ve insan temasından uzak çalışma.', 'Emeğin hiç görülmediği işler.'],
  youAre:
    '{ad}, sen insanları önemseyen, sıcak ve yardımsever birisin. Arkadaşlarının ne hissettiğini çabuk fark ediyorsun ve yanlarında olmaktan hoşlanıyorsun. Bazen başkalarına o kadar odaklanıyorsun ki kendi isteklerini ve yorgunluğunu fark etmeyebiliyorsun. Kendine iyi bakmak, başkalarına iyi bakmanın da bir parçası.',
  youStrengths: ['İnsanların duygularını kolayca fark ediyorsun.', 'Arkadaşlarına destek olmayı seviyorsun.', 'Grubu bir arada tutmakta çok iyisin.', 'Sıcak ve güven veren birisin.'],
  youGrowth:
    'Bazen "hayır" demekte zorlanıp kendi işlerini başkalarının işleri yüzünden erteleyebiliyorsun. Emeğin fark edilmediğinde içten içe kırıldığın da olabilir. Kendi isteklerini söylemek ve sınır koymak öğrenilebilen beceriler.',
  youWays: ['Konuyu bir arkadaşına anlatarak çalış.', 'Önce kendi işini bitir, sonra yardım et.', 'Çalışma arkadaşınla karşılıklı soru sor.', 'Bitirdiğin işleri işaretleyerek ilerlemeni gör.'],
  youComm:
    'İnsanlarla konuşmak ve onları dinlemek senin güçlü yanın. Kendi duygularını, özellikle kırgınlığını söylemek ise sana daha zor gelebilir. Bir şey canını sıktığında güvendiğin birine kısa bir cümleyle söylemeyi deneyebilirsin.',
  youFuture:
    'İnsanlara yardım etmek ve onlarla birlikte çalışmak sana anlam veren şeyler gibi görünüyor. Bunlar bir meslek kararı değil, sadece ipuçları; farklı alanları denedikçe seni nelerin mutlu ettiğini daha iyi göreceksin.',
  youTry: [
    'Benim zamanım: Her gün kısa bir süreyi sadece kendi işine ayır ve o sırada başkasının işini üstlenme.',
    'Nazik hayır: Bu ay en az bir kez, gücünün yetmediği bir isteğe kibarca "bu sefer olmaz" de.',
    'Kendine teşekkür: Her akşam kendin için yaptığın bir iyi şeyi not et.',
  ],
  youLast:
    '{ad}, iyi kalpliliğin çevrene çok şey katıyor. Ama sevilmek için sürekli bir şey yapman gerekmiyor. Kendine de bir arkadaşına davrandığın kadar şefkatle davrandığında hem daha mutlu hem daha güçlü olacaksın.',
  familyOneLine:
    '{ad}, sevdiklerine yardım etmekten mutluluk duyan; bu yüzden kendi ihtiyaçlarını geri plana atabilen, takdir edilmediğinde kolay kırılan ve sevildiğini hissettiğinde çiçek açan biri.',
  approaches: [
    { do: 'Sevginizi yaptıklarından bağımsız olarak gösterin.', why: '{adın} değerli olmak için sürekli yardım etmesi gerekmediğini hissetmesi önemlidir.' },
    { do: 'Kendi ihtiyaçlarını sormayı alışkanlık hâline getirin.', why: '"Sen ne istersin?" sorusu, kendini fark etmesini kolaylaştırır.' },
    { do: '"Hayır" dediğinde bunu destekleyin.', why: 'Sınır koymanın güvenli olduğunu evde deneyimlemesi gerekir.' },
    { do: 'Emeğini somut olarak takdir edin.', why: 'Görülmek onun için güçlü bir motivasyon kaynağıdır.' },
    { do: 'Eleştiriyi ilişkiyi güvenceye alarak yapın.', why: 'Eleştirinin sevgiyi azaltmadığını bilmek, onun dinlemesini kolaylaştırır.' },
  ],
  doList: ['Ona yardımı için değil, kendisi olduğu için teşekkür edin.', 'Ev işlerinde adil bir paylaşım kurun.', 'Kırgınlığını konuşmaya davet edin.', 'Kendine ayırdığı zamanı destekleyin.'],
  dontList: ['Yardımseverliğini sürekli iş yükü olarak kullanmayın.', '"Sen olmasan ne yapardık" yükünü vermeyin.', 'Kırgınlığını "alınganlık" diye geçiştirmeyin.', 'Sevgiyi başarıya bağlayan cümleler kurmayın.'],
  dialog: [
    { instead: 'Yine mi arkadaşının işiyle uğraşıyorsun?', tryThis: 'Bugün kendin için ne yapmak istersin?' },
    { instead: 'Bu kadar alınacak ne var?', tryThis: 'Sanki bir şey canını sıktı; anlatmak ister misin?' },
    { instead: 'Bunu herkes yapar.', tryThis: 'Bunu yaptığını gördüm ve çok değerli buldum.' },
    { instead: 'Neden hayır demedin?', tryThis: 'Bir dahaki sefere "bu sefer olmaz" demek istersen arkandayım.' },
  ],
  homeEnv: [
    '{ad} yalnız ve sessiz bir odada uzun süre çalışmakta zorlanabilir; kısa aralarla ailesiyle temas ettiği, ama dikkat dağıtıcıların az olduğu bir düzen ona iyi gelir. Zaman zaman yanında oturup kendi işinizi yapmanız bile ona destek hissi verir.',
    'Ev içinde ona sürekli yardım rolü vermek yerine, kendi derslerine ve kendine ayırdığı zamanı korumasına yardım edin.',
  ],
  gradeTalk: [
    'Not konuşmalarında sevginizin notla değişmediğini hissettirmek önemlidir. Düşük bir notta önce onu dinleyin, sonra birlikte bir sonraki adımı planlayın. Başarılarında ise yalnızca sonucu değil, gösterdiği çabayı ve kendine ayırdığı zamanı takdir edin.',
  ],
  compare:
    '{adı} başkalarıyla karşılaştırmak, onda "sevilmek için daha fazlasını yapmalıyım" duygusunu güçlendirebilir. Onu yalnızca kendi dünkü hâliyle karşılaştırmak hem kendine güvenini hem sizinle olan bağını güçlendirir.',
  supportSigns: [
    'Sürekli yorgunluk ve kendi işlerine hiç zaman kalmaması',
    'Arkadaşlık ilişkilerinde yoğun kırgınlık ve dışlanma hissi',
    'Kendini değersiz hissettiğini sık sık dile getirmesi',
    'Uyku ve iştahta belirgin değişiklikler',
  ],
  plan: [
    '{adın} hangi durumlarda kendi işini bırakıp başkasına koştuğunu gözlemleyin. Her gün kısa bir "senin zamanın" belirleyin. Sevginizi koşulsuz gösteren küçük jestleri artırın.',
    'Evde sınır koyma pratiği yapın: "Bu sefer olmaz" dediğinde destekleyin. Kendi işini önce bitirme düzenini birlikte kurun. Kırgınlıklarını konuşmaya davet edin.',
    'Neyin işe yaradığını birlikte konuşun. Kendi isteğini söylediği anları görünür kılın. Gerekirse rehber öğretmenle sınır koyma ve öz-bakım üzerine görüşün.',
  ],
  caseTheme: 'yardımsever ve ilişki odaklı bir yönelim; öne çıkan konular: kendi ihtiyaçlarını geri plana atma ve onaya duyarlılık',
  findings: [
    'Yüksek empati ve ilişki odaklılık.',
    'Sınır koymada güçlük; başkalarının ihtiyaçlarını önceleme.',
    'Takdire ve onaya duyarlılık; görülmediğinde içe dönük kırgınlık.',
    'Çatışmadan kaçınma ve öfkeyi dolaylı ifade etme eğilimi.',
  ],
  cognitive: [
    '"İşe yararsam sevilirim" inancını fark etmeye yönelik düşünce kayıtları.',
    'Günlük planlamada kendi işlerini önceleme pratiği.',
    'İhtiyaç ve istekleri ayırt etme çalışmaları.',
  ],
  emotional: [
    'Kırgınlık ve öfke gibi duyguları güvenli biçimde adlandırma ve ifade etme.',
    'Rol oyunlarıyla "hayır" deme ve sınır koyma pratiği.',
    'Öz-şefkat ve kendine zaman ayırma alışkanlığı.',
  ],
  questions: [
    'Bir arkadaşın senden yardım istediğinde, kendi işin olsa bile ne yaparsın?',
    'En son ne zaman sadece kendin için bir şey yaptın?',
    'Emeğin fark edilmediğinde neler hissediyorsun?',
    'Bir şeye "hayır" demek sana nasıl geliyor?',
  ],
  verify: [
    ['Kendi işlerini başkaları için erteliyor', 'Bir haftalık zaman kullanımını birlikte kaydetmek'],
    ['Eleştiriyi ilişkiye yönelik algılıyor', 'Geri bildirim sonrası duygularını birlikte konuşmak'],
    ['Takdir edildiğinde performansı artıyor', 'Somut takdir sonrası çalışma isteğini gözlemlemek'],
  ],
  priorities: [
    ['Güven ve kabul', 'Önce değerinin yaptıklarına bağlı olmadığı bir ilişki zemini kurulmalı.'],
    ['İhtiyaçları fark etme', 'Kendi isteklerini tanımadan sınır koymak mümkün olmaz.'],
    ['Sınır koyma becerisi', 'Küçük ve güvenli durumlarda "hayır" deme pratiği yapılır.'],
    ['Duyguları ifade etme', 'Kırgınlık ve öfkenin dolaysız ve güvenli ifadesi çalışılır.'],
  ],
  referral:
    'Belirgin değersizlik duyguları, ilişkilerde süreklileşen yoğun kırgınlık, sosyal çekilme veya uyku ve iştahta belirgin değişiklikler gözlenirse bir ruh sağlığı uzmanına yönlendirme değerlendirilmelidir.',
  monitoring: 'Her görüşmede kendine ayırdığı zaman, sınır koyduğu örnekler ve ilişkilerindeki kırgınlıklar birlikte gözden geçirilebilir.',
};

export const ENN3: Profile = {
  id: 'enn3',
  weight: 10,
  result: [
    "{ad} için hedef koymak, başarmak ve emeğinin karşılığını görmek önemli bir iç ihtiyaç. Net bir amaç olduğunda enerjisi yükseliyor ve verimli çalışıyor.",
    "Bu eğilimin gölge tarafı, değerini başarıya bağlayabilmesi ve başarısızlık ihtimalini olduğundan ağır yaşayabilmesi.",
  ],
  kisaca:
    '{ad}, hedef koymayı, başarmayı ve emeğinin karşılığını görmeyi seven, enerjik ve uyum sağlayan biri. Bu güçlü başarı isteği onu ileri taşıyor; ancak başarısızlık ihtimali, onun gözünde olduğundan daha büyük görünebiliyor.',
  strengths: [
    'Hedef odaklı ve çalışkan; bir amaç koyduğunda ona doğru kararlılıkla ilerler.',
    'Ortama hızla uyum sağlar; kendini iyi ifade eder.',
    'Verimli çalışmayı ve sonuç almayı sever.',
  ],
  growth: [
    'Değerini başarıya bağlama; başarısızlık ihtimalinde kaygılanma.',
    'Sonuca odaklanırken dinlenmeyi ve duygularını ihmal etme.',
  ],
  develop: [
    'Sonucun yanında öğrenme sürecini de değerli görmeyi denemek.',
    'Haftalık programına dinlenme ve keyif zamanlarını bilinçli olarak eklemek.',
    'Zorlandığı alanlardan kaçmak yerine küçük ve güvenli denemelerle üzerine gitmek.',
  ],
  priority:
    'Önümüzdeki dönemin önceliği, {adın} başarısının yanında öğrenme sürecinden de keyif alması: sonucun yanında çabayı ve gelişimi görmeyi, hatayı bir kimlik meselesi değil bir deneyim olarak yaşamayı öğrenmesi.',
  portrait: [
    '{ad}, hedeflerle canlanan biri. Bir amaç belirlediğinde planını yapar, çalışır ve sonucu görmek ister. Sınavlar, yarışmalar ya da görünür başarılar onu motive eder. Ortama hızla uyum sağlar; neyin beklendiğini çabuk anlar ve ona göre hareket eder.',
    'Bu özellik ona okulda ve sosyal hayatta önemli avantajlar sağlıyor. Öğretmenleri onu çoğu zaman "çalışkan" ve "başarılı" olarak tanımlar. Ancak {ad} için başarı yalnızca bir sonuç değil, kendini değerli hissetmenin de bir yolu olabilir.',
    'Bu yüzden başarısızlık ihtimali ona olduğundan ağır gelebilir. Zorlandığı bir alanda vazgeçmek ya da o alandan uzak durmak, "başarısız görünmek" yerine daha kolay bir seçenek gibi görünebilir.',
  ],
  key: '{adı} anlamanın anahtarı: Onun için başarı yalnızca bir hedef değil, kendini değerli hissetmenin de bir yolu olabilir.',
  motivates:
    '{adı} en çok harekete geçiren şey net hedefler, görünür ilerleme ve emeğinin takdir edilmesi. Neyi neden yaptığını bildiğinde ve ilerlemesini ölçebildiğinde çok verimli çalışır. Küçük hedefler koyup bunlara ulaştığını görmek enerjisini artırır.',
  stops:
    'Onu durduran şey, başarılı olamayacağını düşündüğü durumlar. Zor bir derste ilk denemelerde iyi sonuç alamazsa ilgisi düşebilir; "ben bu derste iyi değilim" etiketiyle o alandan uzaklaşabilir. Ayrıca çok yoğun dönemlerde dinlenmeyi ve duygularını ihmal edebilir.',
  motivators: ['net ve ölçülebilir hedefler', 'görünür ilerleme', 'emeğinin takdir edilmesi', 'sağlıklı rekabet'],
  stoppers: ['başarısız görünme ihtimali', 'belirsiz ve sonuçsuz görevler', 'emeğin görülmemesi', 'sürekli karşılaştırılmak'],
  resources: [
    '{adın} en güçlü kaynağı hedef koyma ve ona ulaşmak için çalışma becerisi. Planlı, enerjik ve sonuç odaklı bir çalışma tarzı var. Bu beceri, doğru yönlendirildiğinde uzun soluklu hedeflerde ona önemli bir güç sağlar.',
    'Uyum sağlama ve kendini ifade etme becerisi de sosyal ve akademik ortamlarda öne çıkmasını kolaylaştırıyor.',
  ],
  resourceBullets: ['Hedef koyma ve planlama', 'Yüksek enerji ve çalışkanlık', 'Uyum sağlama ve kendini ifade etme', 'Sonuç alma isteği'],
  blindspots: [
    '{adın} en önemli gelişim alanı, değerini başarıdan ayırabilmek. Sonuç beklediği gibi gelmediğinde kendini hızla değersiz hissedebilir. Bu da zor alanlardan kaçmasına ya da hatalarını saklamasına yol açabilir.',
    'Fark etmediği bir nokta da yoğun çalışırken duygularını ve dinlenme ihtiyacını erteleyebilmesi. Dışarıdan çok iyi görünürken içten yorulmuş olabilir.',
  ],
  blindspotBullets: ['Başarısızlık ihtimalinde zor alanlardan kaçınma', 'Dinlenmeyi ve duyguları erteleme', 'Kendini sürekli başkalarıyla kıyaslama'],
  communication: [
    '{ad}, açık, enerjik ve etkileyici bir iletişim tarzına sahip. Kendini iyi ifade eder, ortamın beklentisini hızla okur. Sunum yapmak, bir grubu harekete geçirmek ona kolay gelebilir.',
    'Ancak zorlandığını, emin olmadığını ya da yorulduğunu söylemek ona daha zor gelebilir. "Her şey yolunda" görüntüsünü korumaya özen gösterebilir.',
  ],
  commStrong: 'kendini ifade etmek, sunum yapmak, grubu hedefe yönlendirmek.',
  commHard: 'zorlandığını söylemek, yardım istemek, eksik olduğunu kabul etmek.',
  commStep: 'haftada bir kez zorlandığı bir konuyu güvendiği bir yetişkinle paylaşmak.',
  stress: [
    'Stres altında {ad} daha da çok çalışarak durumu kurtarmaya çalışabilir. Programını doldurur, dinlenmeyi ertelenebilir bir şey gibi görür. Sonuç beklediği gibi gelmezse ise hızla motivasyonunu kaybedebilir.',
    'Bu dönemlerde ona değerinin notlarından bağımsız olduğunu hissettirmek ve dinlenmeyi planın bir parçası yapmak iyi gelir.',
  ],
  stressSigns: 'aşırı yoğun program, uykudan kısmak, bir alandan aniden vazgeçmek, hatalarını saklamak.',
  stressHelps: 'hedefleri küçük parçalara bölmek, dinlenmeyi takvime yazmak, çabasını takdir eden sakin bir konuşma.',
  conflict: [
    '{ad} eleştiriyi kendi yeterliliğine yönelik bir mesaj gibi algılayabilir. Hemen savunmaya geçebilir ya da eleştiriyi kabul etmiş görünüp içten içe bozulabilir.',
    'Eleştiri, hedefe ulaşmasına yardım edecek somut bir bilgi olarak sunulduğunda çok daha kolay kabul ediliyor.',
  ],
  conflictTip: 'Geri bildirimi "hedefine ulaşmak için bir sonraki adım" olarak çerçevelemek, {adın} eleştiriyi bir fırsat olarak görmesini kolaylaştırır.',
  learning: [
    '{ad} en iyi, hedeflerin net ve ilerlemenin görünür olduğu bir düzende öğreniyor. Kısa hedefler, ilerleme tabloları ve düzenli kendini sınama ona iyi geliyor.',
    'Zor konularda ise "hemen başarılı olmak" yerine "adım adım ilerlemek" fikrini benimsemesi önemli. Küçük kazanımları fark etmek, zor alanlarda vazgeçmesini önler.',
  ],
  learningBullets: ['Ölçülebilir kısa hedefler', 'İlerleme tablosu ve kendini sınama', 'Zor konuları küçük adımlara bölme', 'Hatalardan öğrenme defteri'],
  future: [
    'Hedef odaklılığı, enerjisi ve kendini ifade etme becerisi; liderlik, girişimcilik, yönetim ve sonuç odaklı çalışmayı gerektiren alanlarda kendini rahat hissetmesini kolaylaştırabilir.',
  ],
  workEnv: ['Hedeflerin net olduğu, başarının görünür olduğu ortamlar.', 'Gelişme ve ilerleme fırsatı sunan, dinamik işler.'],
  drains: ['Sonucun görünmediği, uzun ve belirsiz süreçler.', 'Sürekli kıyaslamanın olduğu sert rekabet ortamları.', 'Emeğin hiç takdir edilmediği işler.'],
  youAre:
    '{ad}, sen hedef koymayı ve onlara ulaşmayı seven, enerjik birisin. Bir şey için çalıştığında elinden gelenin en iyisini yapıyorsun. Bazen başarılı olamama ihtimali gözünde büyüyebiliyor. Unutma: Değerin aldığın notlardan ya da kazandığın derecelerden çok daha fazlası.',
  youStrengths: ['Hedef koyup ona doğru çalışabiliyorsun.', 'Yeni ortamlara hızla uyum sağlıyorsun.', 'Kendini iyi ifade ediyorsun.', 'Çalışkan ve kararlısın.'],
  youGrowth:
    'Zorlandığın bir derste "ben bunda iyi değilim" deyip uzaklaştığın olabilir. Yoğun dönemlerde dinlenmeyi ve nasıl hissettiğini ihmal edebiliyorsun. Hata yapmak başarısızlık değil, öğrenmenin bir parçası.',
  youWays: ['Büyük hedefini küçük adımlara böl.', 'İlerlemeni bir tabloda takip et.', 'Hatalarını bir "öğrenme defterine" yaz.', 'Dinlenmeyi de programına ekle.'],
  youComm:
    'Kendini ifade etmekte çok iyisin. Zorlandığını söylemek ise sana daha zor gelebilir. Güvendiğin birine "bu konuda yardıma ihtiyacım var" demek, güçsüzlük değil akıllıca bir adım.',
  youFuture:
    'Hedef koymak, sonuç almak ve insanları bir amaç etrafında toplamak sana iyi gelen şeyler gibi görünüyor. Bunlar bir meslek kararı değil, ipuçları. Farklı alanları denedikçe seni gerçekten neyin mutlu ettiğini keşfedeceksin.',
  youTry: [
    'Zor alana bir adım: En az sevdiğin derste her gün 15 dakikalık küçük bir hedef koy.',
    'Öğrenme defteri: Bu ay yaptığın her hatanın sana ne öğrettiğini bir cümleyle yaz.',
    'Dinlenme randevusu: Haftada bir akşamı tamamen dinlenmeye ayır.',
  ],
  youLast:
    '{ad}, çalışkanlığın ve kararlılığın seni çok güzel yerlere taşıyacak. Ama yolculuğun kendisi de en az varış noktası kadar değerli. Kendine, başarılarından bağımsız olarak değer verdiğinde çok daha rahat ve güçlü olacaksın.',
  familyOneLine:
    '{ad}, başarmayı ve takdir görmeyi çok önemseyen; bu yüzden başarısızlık ihtimalinde kaygılanabilen ve değerinin sonuçlardan bağımsız olduğunu hissettiğinde en iyi hâline ulaşan biri.',
  approaches: [
    { do: 'Sonucun yanında çabayı ve gelişimi takdir edin.', why: 'Değerinin yalnızca başarıya bağlı olmadığını hissetmesi kaygısını azaltır.' },
    { do: 'Hedefleri birlikte gerçekçi ve küçük parçalara bölün.', why: 'Ulaşılabilir hedefler motivasyonunu korur, vazgeçmeyi önler.' },
    { do: 'Kendi hatalarınızı ve bunlardan öğrendiklerinizi paylaşın.', why: 'Hatanın doğal olduğunu görmek, hataları saklama eğilimini azaltır.' },
    { do: 'Dinlenmeyi açıkça destekleyin.', why: 'Yoğun dönemlerde kendini ihmal etmeye eğilimlidir.' },
    { do: 'Duygularını sormayı unutmayın.', why: '"Her şey yolunda" görüntüsünün arkasında yorgunluk olabilir.' },
  ],
  doList: ['Gelişimini kendi dünkü hâliyle kıyaslayın.', 'Zor alanlardaki küçük ilerlemeleri fark edin.', 'Dinlenmeye ve boş zamana alan açın.', 'Duygularını konuşmaya davet edin.'],
  dontList: ['Notu sevgiyle ya da ödülle doğrudan ilişkilendirmeyin.', 'Onu yaşıtlarıyla karşılaştırmayın.', 'Yalnızca sonuca odaklanan sorular sormayın.', 'Yoğun programını sürekli övmeyin.'],
  dialog: [
    { instead: 'Kaç aldın?', tryThis: 'Bu sınava nasıl hazırlandın, en çok neyi öğrendin?' },
    { instead: 'Neden birinci olmadın?', tryThis: 'Geçen seferden bu yana neyi daha iyi yaptın?' },
    { instead: 'Bu kadar dinlenmek yeter.', tryThis: 'Dinlenmen de çalışman kadar önemli.' },
    { instead: 'Bu derse çalışmıyorsun.', tryThis: 'Bu derste seni zorlayan ne, birlikte küçük bir adım belirleyelim mi?' },
  ],
  homeEnv: [
    '{ad} hedeflerini ve ilerlemesini görebildiği düzenli bir çalışma ortamından güç alır. Duvarda bir haftalık hedef tablosu ya da tamamlanan işleri işaretleyebileceği bir liste ona iyi gelir.',
    'Ancak programının dinlenmeye yer bırakmayacak kadar dolmamasına dikkat edin. Uyku ve boş zaman, verimliliğin bir parçasıdır.',
  ],
  gradeTalk: [
    'Not konuşmalarında sonuçtan çok sürece ve öğrenmeye odaklanın. İyi bir notta çabasını, düşük bir notta ise ondan ne öğrenebileceğini konuşun. Değerinin notla değişmediğini hissettirmek, onun zor alanlarda da cesaretle denemesini sağlar.',
  ],
  compare:
    '{adı} başkalarıyla karşılaştırmak, onun başarı kaygısını belirgin biçimde artırabilir. Karşılaştırma ancak kendi geçmiş performansıyla yapıldığında motive edicidir.',
  supportSigns: [
    'Başarısızlık sonrası uzun süren yoğun üzüntü ya da öfke',
    'Uykudan sürekli kısma, aşırı yoğun program',
    'Zorlandığı alanlardan tamamen uzaklaşma',
    'Sınavlar öncesinde belirgin bedensel gerginlik',
  ],
  plan: [
    '{adın} hedeflerini ve programını birlikte gözden geçirin. Dinlenme zamanlarını takvime ekleyin. Çabayı takdir eden cümleleri günlük dile yerleştirin.',
    'Zorlandığı bir alanda küçük ve ulaşılabilir hedefler belirleyin. Hatalardan öğrenme konuşmalarını alışkanlık hâline getirin. Duygularını sorun.',
    'Neyin işe yaradığını birlikte değerlendirin. Zor alandaki ilerlemeyi görünür kılın. Gerekirse rehber öğretmenle hedef ve kaygı yönetimini konuşun.',
  ],
  caseTheme: 'başarı ve hedef odaklı bir yönelim; öne çıkan konular: değerini başarıya bağlama ve başarısızlık kaygısı',
  findings: [
    'Yüksek başarı motivasyonu ve hedef odaklılık.',
    'Değeri sonuçla özdeşleştirme; başarısızlık ihtimalinde kaçınma.',
    'Yoğun çalışma ve dinlenmeyi erteleme eğilimi.',
    'Duyguları ve zorlanmayı gizleme; "her şey yolunda" görüntüsü.',
  ],
  cognitive: [
    '"Başarısız olursam değersizim" inancını fark etmeye yönelik düşünce kayıtları.',
    'Süreç hedefleri ile sonuç hedeflerini ayırt etme çalışması.',
    'Hata analizini kimlikten ayıran "öğrenme defteri" uygulaması.',
  ],
  emotional: [
    'Duyguları fark etme ve adlandırma; yorgunluğun işaretlerini tanıma.',
    'Dinlenmeyi suçluluk duymadan plana dahil etme.',
    'Kendine şefkat pratiği; başarıdan bağımsız değer duygusunu güçlendirme.',
  ],
  questions: [
    'Bir hedefe ulaşamadığında kendine neler söylüyorsun?',
    'Seni en çok hangi dersler zorluyor, o derslerde neler hissediyorsun?',
    'Dinlendiğinde kendini nasıl hissediyorsun?',
    'Başarılı olmak senin için ne anlama geliyor?',
  ],
  verify: [
    ['Zor alanlardan kaçınıyor', 'Ders bazında çalışma sürelerini birlikte kaydetmek'],
    ['Değerini başarıya bağlıyor', 'Düşük bir sonuç sonrası iç konuşmasını birlikte incelemek'],
    ['Dinlenmeyi ihmal ediyor', 'Bir haftalık uyku ve boş zaman düzenini takip etmek'],
  ],
  priorities: [
    ['Kabul ve güven', 'Değerinin başarıdan bağımsız olduğu bir ilişki zemini kurulmalı.'],
    ['Süreç odaklılık', 'Hedeflerin yanında öğrenme sürecini değerli görmesi sağlanır.'],
    ['Zor alanlarla yüzleşme', 'Küçük hedeflerle kaçındığı alanlarda başarı deneyimi oluşturulur.'],
    ['Denge ve dinlenme', 'Sürdürülebilir bir çalışma-dinlenme düzeni kurulur.'],
  ],
  referral:
    'Başarısızlık sonrası uzun süren yoğun çökkünlük, belirgin uyku sorunları, aşırı ve sürdürülemez çalışma düzeni veya yoğun kaygı belirtileri gözlenirse bir ruh sağlığı uzmanına yönlendirme değerlendirilmelidir.',
  monitoring: 'Her görüşmede hedeflere ulaşma durumu, zor alanlardaki çaba ve dinlenme düzeni birlikte gözden geçirilebilir.',
};
