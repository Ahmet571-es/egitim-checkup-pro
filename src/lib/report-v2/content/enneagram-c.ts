// ============================================================
// Rapor v2 — Enneagram tipleri (7-9)
// ============================================================
import type { Profile } from './types';

export const ENN7: Profile = {
  id: 'enn7',
  weight: 10,
  result: [
    "{ad} için yeni deneyimler, çeşitlilik ve özgürlük önemli bir iç ihtiyaç. Meraklı ve iyimser; yeni fikirlere hızla ilgi duyuyor.",
    "Bu eğilimin gölge tarafı, sıkıcı ya da tekrarlı görünen işlerde enerjisinin çabuk düşmesi.",
  ],
  kisaca:
    '{ad}, meraklı, enerjik ve yeni deneyimlere hızla ilgi duyan biri. Fikir üretmekte ve ortamı canlandırmakta çok güçlü; ancak sıkıcı ya da tekrarlı görünen işlerde enerjisi çabuk düşüyor ve başladığı işleri bitirmekte zorlanabiliyor.',
  strengths: [
    'Meraklı ve öğrenmeye açık; yeni fikirleri hızla kavrar.',
    'Enerjik ve iyimser; ortamı canlandırır, insanlarla kolay iletişim kurar.',
    'Yaratıcı çözümler üretir; farklı olasılıkları görür.',
  ],
  growth: [
    'Başladığı işleri sürdürmek ve bitirmek; planı ilk coşkudan sonra korumak.',
    'Sıkıcı ya da zor görünen işlerden kaçınma ve dikkatini dağıtacak şeylere yönelme eğilimi.',
  ],
  develop: [
    'Başladığı bir işi, yenisine geçmeden önce küçük bir aşamaya kadar tamamlamayı hedeflemek.',
    'Sıkıcı görevleri kısa bloklara bölüp aralarına küçük ödüller koymak.',
    'Çalışırken dikkat dağıtıcıları (telefon, ekran) ortamdan uzaklaştırmak.',
  ],
  priority:
    'Önümüzdeki dönemin önceliği, {adın} başladığı işi bitirme deneyimini sık yaşaması: kısa, eğlenceli ve bitiş çizgisi net olan çalışma bloklarıyla "süreklilik" alışkanlığı kazanması.',
  portrait: [
    '{ad}, hayatı zengin ve heyecanlı yaşamak isteyen biri. Yeni bir konu, yeni bir etkinlik ya da yeni bir fikir onu hemen heyecanlandırır. Sohbeti canlı, enerjisi bulaşıcıdır; arkadaş ortamlarında çoğu zaman neşe kaynağıdır.',
    'Bu merak ona hızlı öğrenme ve farklı alanlar arasında bağlantı kurma gücü veriyor. Bir projeye başlarken fikir üreten, grubu harekete geçiren kişi çoğu zaman odur.',
    'Aynı hareketlilik, uzun süre aynı işe odaklanmayı zorlaştırabiliyor. İlk günlerin coşkusu geçtiğinde, sıkıcı ve tekrarlı görünen işlerde enerjisi çabuk düşebilir; planlar yarım kalabilir.',
  ],
  key: '{adı} anlamanın anahtarı: Onun için sıkılmak, zorlanmaktan daha zor gelebilir; ilgisini canlı tutan bir yapı bulduğunda çok verimli çalışır.',
  motivates:
    '{adı} en çok harekete geçiren şey yenilik, çeşitlilik ve eğlence. Konular oyunlaştırıldığında, farklı yöntemler denendiğinde ve hızlı ilerleme görüldüğünde enerjisi belirgin biçimde artar. Arkadaşlarıyla birlikte çalışmak da onu canlandırır.',
  stops:
    'Onu durduran şey tekdüzelik ve uzun, sonu görünmeyen işler. Tekrar gerektiren konularda ya da zor bir problemde takıldığında başka bir şeye yönelme eğilimi gösterebilir. Bu, tembellikten çok sıkılmaya karşı bir kaçış hamlesidir.',
  motivators: ['yeni ve ilginç konular', 'çeşitlilik ve farklı yöntemler', 'hızlı ilerleme', 'arkadaşlarla birlikte çalışma'],
  stoppers: ['tekdüze tekrar', 'uzun ve sonu görünmeyen işler', 'kısıtlayıcı kurallar', 'zor bir noktada takılmak'],
  resources: [
    '{adın} en güçlü kaynağı merakı ve enerjisi. Yeni şeyleri hızla öğrenebilmesi, farklı alanlardan fikirleri birleştirebilmesi ve iyimser bakışı, onu hem okulda hem sosyal hayatta öne çıkarabilir.',
    'İletişim becerisi ve insanlarla kolay bağ kurması, grup çalışmalarında ve sunumlarda ona avantaj sağlıyor.',
  ],
  resourceBullets: ['Merak ve hızlı öğrenme', 'Yaratıcı fikir üretme', 'İyimserlik ve enerji', 'Kolay iletişim kurma'],
  blindspots: [
    '{adın} en önemli gelişim alanı, başladığı işi sürdürmek ve bitirmek. Planları genellikle ilk coşku döneminde güçlü; ancak kısa süre içinde dağılabiliyor.',
    'Fark etmediği bir nokta, zor ya da sıkıcı işlerden kaçınmanın zamanla birikmiş eksiklere dönüşmesi olabilir. Anlık keyfi seçmek, uzun vadeli hedefleri geciktirebilir.',
  ],
  blindspotBullets: ['Planı ilk coşkudan sonra sürdürememe', 'Tekrar ve sıkıcı işlerden kaçınma', 'Dikkati dağıtan şeylere kolay yönelme'],
  communication: [
    '{ad}, sıcak, esprili ve konuşkan bir iletişim tarzına sahip. Yeni insanlarla hızla kaynaşır; grup sohbetlerinde enerjiyi yükseltir.',
    'Ancak zor ya da duygusal konular açıldığında konuyu değiştirme ya da şakayla geçiştirme eğilimi gösterebilir.',
  ],
  commStrong: 'grup sohbetleri, sunumlar, yeni insanlarla tanışmak.',
  commHard: 'zor ve duygusal konuları konuşmak, uzun süre dinlemek.',
  commStep: 'zor bir konu açıldığında konuyu değiştirmeden önce birkaç dakika daha dinlemeyi denemek.',
  stress: [
    'Stres altında {ad} daha da hareketli hâle gelebilir; yeni etkinliklere, ekranlara ya da arkadaşlarına yönelerek zorlayan durumdan uzaklaşmaya çalışabilir. Dışarıdan "keyfi yerinde" görünürken aslında kaygısını erteliyor olabilir.',
    'Bu dönemlerde ona kaçmadan durumla yüzleşmesi için küçük ve net adımlar sunmak iyi gelir.',
  ],
  stressSigns: 'aşırı hareketlilik, sürekli yeni planlar, ekrana yönelme, sorumluluklardan kaçma.',
  stressHelps: 'kısa ve net görevler, fiziksel hareket, sorumluluğu küçük parçalara bölmek, sakin bir yüzleşme konuşması.',
  conflict: [
    '{ad} çatışmadan hoşlanmaz ve gerginliği esprile dağıtmaya çalışabilir. Eleştiriyi kısıtlanma gibi algılayabilir.',
    'Eleştiri kısa, net ve çözüm odaklı sunulduğunda; özellikle ona seçenek bırakıldığında daha kolay kabul edilir.',
  ],
  conflictTip: 'Geri bildirimi kısa tutup ona çözüm için iki seçenek sunmak ("şöyle mi yapalım, böyle mi?") {adın} kısıtlanmış hissetmeden sorumluluk almasını sağlar.',
  learning: [
    '{ad} en iyi, çeşitliliğin ve hareketin olduğu bir düzende öğreniyor. Kısa çalışma blokları, farklı yöntemler (video, oyun, soru yarışması) ve hızlı geri bildirim ilgisini canlı tutuyor.',
    'Süreklilik için ise her çalışma bloğunun net bir bitiş çizgisi olması önemli. "45 dakika çalış" yerine "bu 10 soruyu bitir" gibi somut hedefler, bitirme deneyimini sıklaştırır.',
  ],
  learningBullets: ['Kısa ve çeşitli çalışma blokları', 'Oyunlaştırma ve soru yarışmaları', 'Bitiş çizgisi net görevler', 'Çalışma arkadaşıyla karşılıklı sınama'],
  future: [
    'Merakı, enerjisi ve iletişim becerisi; yenilik, çeşitlilik ve insan teması içeren alanlarda kendini canlı hissetmesini kolaylaştırabilir. Doğru yapı kurulduğunda, ilgi duyduğu alanlarda derinleşmek de onun için mümkün.',
  ],
  workEnv: ['Çeşitliliğin ve yeniliğin olduğu dinamik ortamlar.', 'Fikir üretmeye ve insanlarla çalışmaya alan tanıyan işler.'],
  drains: ['Tekdüze ve tekrarlı işler.', 'Katı kurallarla kısıtlanmış ortamlar.', 'Uzun süre yalnız ve tek bir işe kapanma.'],
  youAre:
    '{ad}, sen meraklı, enerjik ve yeni şeyleri seven birisin. Fikir üretmekte ve ortamı neşelendirmekte çok iyisin. Bazen sıkıcı gelen işlerde enerjin düşüyor ve başladığın işleri bitirmek zorlaşabiliyor. Bu bir eksiklik değil; sadece senin için doğru çalışma düzenini bulmak gerekiyor.',
  youStrengths: ['Meraklısın ve hızlı öğreniyorsun.', 'Yaratıcı fikirler üretebiliyorsun.', 'İnsanlarla kolayca iletişim kuruyorsun.', 'İyimser ve enerjiksin.'],
  youGrowth:
    'Planlarının kısa süre içinde dağıldığı, sıkıcı gelen işleri ertelediğin olabilir. Zor bir noktada takıldığında başka bir şeye yöneldiğin zamanlar da olabilir. Kısa ve net hedeflerle "bitirme" alışkanlığı kazanabilirsin.',
  youWays: ['Çalışmayı kısa bloklara böl; her bloğun bitiş hedefi olsun.', 'Farklı yöntemler dene: video, soru yarışması, kart.', 'Çalışma arkadaşınla birbirinizi sınayın.', 'Bitirdiğin her işi bir tabloda işaretle.'],
  youComm:
    'İnsanlarla konuşmak ve ortamı canlandırmak senin süper gücün. Zor konular açıldığında ise konuyu değiştirmek isteyebilirsin. Biraz daha dinlemek, arkadaşlıklarını daha da güçlendirir.',
  youFuture:
    'Yenilik, çeşitlilik ve insanlarla çalışmak sana iyi gelen şeyler gibi görünüyor. Bunlar bir meslek kararı değil, ipuçları. Merakını farklı alanlarda denerken, seni gerçekten sürükleyen alanı bulacaksın.',
  youTry: [
    'Bitiş çizgisi: Her çalışma bloğuna net bir hedef koy ("bu 10 soruyu bitir") ve bitirince kendini ödüllendir.',
    'Seri tablosu: Bu ay aynı derse her gün çalıştığın günleri bir tabloda işaretle ve serini bozmamaya çalış.',
    'Zor ilk: Her gün önce en sıkıcı gelen işini, sonra sevdiğin işi yap.',
  ],
  youLast:
    '{ad}, merakın ve enerjin senin en güzel yanların. Bunlara bir de "bitirme" alışkanlığı eklediğinde, aklındaki pek çok fikri gerçeğe dönüştürebileceksin.',
  familyOneLine:
    '{ad}, yeniliği ve eğlenceyi seven, meraklı ve enerjik; bu yüzden sıkıcı işlerde çabuk dağılabilen ve ilgisini canlı tutan bir yapı bulduğunda çok verimli çalışan biri.',
  approaches: [
    { do: 'Çalışmayı kısa ve çeşitli bloklara bölün.', why: 'Kısa ve değişken bloklar sıkılmayı önler, sürekliliği artırır.' },
    { do: 'Her görevin bitiş çizgisini netleştirin.', why: 'Bitirme deneyimi sıklaştıkça süreklilik alışkanlığı oluşur.' },
    { do: 'Seçenek sunun, emir vermeyin.', why: 'Kısıtlanmış hissetmediğinde sorumluluk almaya daha isteklidir.' },
    { do: 'Bitirdiği işleri görünür kılın.', why: 'Tamamlanan işleri görmek motivasyonunu besler.' },
    { do: 'Zor konuları kaçmadan konuşmaya davet edin.', why: 'Zorlukları şakayla geçiştirme eğilimini dengeler.' },
  ],
  doList: ['Çalışma yöntemlerini çeşitlendirin.', 'Kısa hedefler ve küçük ödüller kullanın.', 'Fiziksel hareket molaları verin.', 'Merakını besleyen etkinlikleri destekleyin.'],
  dontList: ['Uzun ve aralıksız çalışma beklemeyin.', 'Yarım kalan işlerini sürekli yüzüne vurmayın.', 'Enerjisini "yaramazlık" diye etiketlemeyin.', 'Her yeni ilgisini hemen büyük bir projeye çevirmeyin.'],
  dialog: [
    { instead: 'Yine yarım bıraktın.', tryThis: 'Bunun bitmesine ne kaldı? Son adımı birlikte planlayalım mı?' },
    { instead: '2 saat masadan kalkma.', tryThis: 'Şu 10 soruyu bitir, sonra 5 dakika mola.' },
    { instead: 'Hep oyun peşindesin.', tryThis: 'Bu konuyu bir oyuna çevirsek nasıl olur?' },
    { instead: 'Ciddi ol biraz.', tryThis: 'Bu konu önemli, biraz konuşabilir miyiz?' },
  ],
  homeEnv: [
    '{ad} uzun süre aynı yerde oturmakta zorlanabilir. Kısa çalışma blokları arasında hareket molaları vermek, hatta zaman zaman ayakta ya da farklı bir köşede çalışmak ona iyi gelebilir.',
    'Masada dikkat dağıtıcıların (telefon, ekran) olmaması önemlidir; ama ortamın sıkıcı ve kısıtlayıcı olmaması da bir o kadar önemlidir.',
  ],
  gradeTalk: [
    'Not konuşmalarında yalnızca sonuca değil, sürekliliğe odaklanın: "Bu ay kaç gün düzenli çalıştın?" gibi sorular, onun için hem anlaşılır hem motive edicidir. Düşük bir notta suçlamak yerine küçük ve hızlı bir toparlanma planı yapın.',
  ],
  compare:
    '{adı} daha sakin ve düzenli yaşıtlarıyla karşılaştırmak, onun enerjisini bir kusur gibi görmesine yol açabilir. Enerjisini doğru yapıyla buluşturmak, onu değiştirmeye çalışmaktan çok daha etkilidir.',
  supportSigns: [
    'Okul başarısında birkaç hafta süren belirgin düşüş',
    'Sorumluluklardan sürekli ve yoğun kaçınma',
    'Ekran kullanımının kontrolden çıkması',
    'Zor duyguları hiç konuşamaması, sürekli kaçış arayışı',
  ],
  plan: [
    '{adın} hangi işlerde dağıldığını ve hangi işlerde sürdürebildiğini gözlemleyin. Kısa ve çeşitli çalışma bloklarını deneyin. Bitirdiği işleri görünür kılın.',
    'Her görev için net bitiş hedefleri koyun. Seri tablosu gibi süreklilik takip araçlarını kullanın. Önce zor, sonra kolay iş sırasını alışkanlık hâline getirin.',
    'Neyin işe yaradığını birlikte konuşun. Süreklilik başarılarını kutlayın. Gerekirse rehber öğretmenle planlama ve süreklilik üzerine görüşün.',
  ],
  caseTheme: 'hevesli ve maceracı bir yönelim; öne çıkan konular: planı sürdürmede güçlük ve sıkıcı görevlerden kaçınma',
  findings: [
    'Yüksek merak, enerji ve yenilik arayışı.',
    'Başlangıçta yüksek, sonra hızla düşen motivasyon.',
    'Tekdüze ve zor görevlerden kaçınma.',
    'Zor duyguları şakayla ya da hareketlilikle geçiştirme.',
  ],
  cognitive: [
    'Görevleri kısa, bitiş çizgisi net bloklara bölme.',
    '"Şimdi sıkıcı – sonra kazançlı" bağlantısını kuran hedef çalışması.',
    'Süreklilik takip araçları (seri tablosu, ilerleme çizelgesi).',
  ],
  emotional: [
    'Zor duygularla kaçmadan kısa süre kalabilme pratiği.',
    'Sıkıntı toleransını küçük adımlarla artırma.',
    'Enerjiyi düzenlemek için fiziksel hareketi planlı kullanma.',
  ],
  questions: [
    'Bir işi yarıda bıraktığında genellikle ne oluyor?',
    'Seni en çok hangi dersler sıkıyor, neden?',
    'Bitirdiğin bir işi düşün; seni sonuna kadar ne taşıdı?',
    'Zor bir şey hissettiğinde ne yaparsın?',
  ],
  verify: [
    ['Planlar ilk haftalardan sonra dağılıyor', 'Dört haftalık çalışma düzenini birlikte takip etmek'],
    ['Kısa bloklarda verim artıyor', 'Kısa ve uzun çalışma bloklarındaki tamamlama oranını karşılaştırmak'],
    ['Sıkıcı görevlerden kaçınıyor', 'Görev türlerine göre erteleme sıklığını kaydetmek'],
  ],
  priorities: [
    ['İlgiyi koruyan yapı', 'Çeşitlilik ve kısa bloklarla motivasyon korunur.'],
    ['Bitirme deneyimi', 'Bitiş çizgisi net görevlerle süreklilik alışkanlığı kurulur.'],
    ['Sıkıntı toleransı', 'Zor ve tekrarlı görevlerde kalabilme küçük adımlarla artırılır.'],
    ['Duygusal yüzleşme', 'Zorlukları kaçmadan konuşabilme çalışılır.'],
  ],
  referral:
    'Sorumluluklardan kaçınmanın süreklileştiği, okul ve evde belirgin işlev kaybının görüldüğü ya da ekran kullanımının kontrolden çıktığı durumlarda bir uzmana yönlendirme değerlendirilmelidir.',
  monitoring: 'Her görüşmede tamamlanan görev sayısı, süreklilik serisi ve kaçınılan görev türleri birlikte gözden geçirilebilir.',
};

export const ENN8: Profile = {
  id: 'enn8',
  weight: 10,
  result: [
    "{ad} için güçlü olmak, kontrolü elinde tutmak ve saygı görmek önemli bir iç ihtiyaç. Kararlı ve cesur; haksızlığa karşı durmaktan çekinmiyor.",
    "Bu eğilimin gölge tarafı, kontrolü kaybettiğini hissettiğinde öfkesinin hızla yükselebilmesi.",
  ],
  kisaca:
    '{ad}, güçlü, kararlı ve sözünü sakınmayan biri. Sorumluluk almaktan ve gerektiğinde liderlik etmekten çekinmiyor; ancak kontrolü kaybettiğini ya da haksızlığa uğradığını hissettiğinde sert ve öfkeli tepkiler verebiliyor.',
  strengths: [
    'Kararlı ve cesur; zor durumlarda sorumluluk almaktan kaçınmaz.',
    'Adalet duygusu güçlü; zayıfı korur, haksızlığa karşı durur.',
    'Liderlik becerisi var; grubu harekete geçirebilir.',
  ],
  growth: [
    'Öfkesini yönetmek; sert ve ani tepkilerini fark etmek.',
    'Kırılganlığını göstermekte ve yardım istemekte zorlanma.',
  ],
  develop: [
    'Öfkelendiğinde tepki vermeden önce kısa bir mola vermeyi denemek.',
    'Güvendiği kişilerden yardım istemeyi bir güç göstergesi olarak görmek.',
    'Liderlik isteğini takım çalışmaları ve sorumluluk alabileceği projelerde kullanmak.',
  ],
  priority:
    'Önümüzdeki dönemin önceliği, {adın} gücünü kontrollü kullanmayı öğrenmesi: öfke anında durup düşünmeyi ve duygularını sertlik yerine sözle ifade etmeyi alışkanlık hâline getirmesi.',
  portrait: [
    '{ad}, güçlü bir iradeye sahip biri. Ne istediğini bilir, düşündüğünü açıkça söyler. Bir grup içinde çoğu zaman öne çıkar; karar verir, sorumluluk alır, diğerlerini harekete geçirir.',
    'Adalet duygusu belirgindir: Bir arkadaşına haksızlık yapıldığında hemen araya girer. Bu yanı, çevresindekilere güven veren koruyucu bir güç olarak görünür.',
    'Aynı güç, kontrolü kaybettiğini ya da haksızlığa uğradığını hissettiğinde sertliğe dönüşebilir. Öfkesi çabuk yükselebilir; otoriteyle zaman zaman çatışabilir. Bu sertliğin arkasında çoğu zaman kırılganlığını göstermeme isteği yatar.',
  ],
  key: '{adı} anlamanın anahtarı: Onun için güçlü görünmek önemlidir; saygı gördüğünü ve kontrolün bir kısmının kendisinde olduğunu hissettiğinde iş birliği yapar.',
  motivates:
    '{adı} en çok harekete geçiren şey sorumluluk, meydan okuma ve saygı görmek. Bir işin sahibi olduğunda, kendi kararlarını verebildiğinde ve zor bir hedefe meydan okuduğunda çok güçlü bir çaba gösterir.',
  stops:
    'Onu durduran şey, kontrol edildiğini ya da küçümsendiğini hissetmek. Emir dili, gerekçesiz kurallar ve haksız bulduğu uygulamalar karşısında direnç gösterebilir; bu direnç bazen derslerden ve sorumluluklardan uzaklaşmaya dönüşebilir.',
  motivators: ['sorumluluk ve söz hakkı', 'meydan okuyan hedefler', 'saygı ve adil davranış', 'liderlik fırsatları'],
  stoppers: ['emir dili', 'gerekçesiz kurallar', 'küçümsenmek', 'haksızlık algısı'],
  resources: [
    '{adın} en güçlü kaynağı kararlılığı ve cesareti. Zorluklar karşısında geri çekilmez; bir hedefe kilitlendiğinde onu gerçekleştirmek için güçlü bir enerji ortaya koyar.',
    'Liderlik becerisi ve adalet duygusu, doğru yönlendirildiğinde onu hem okulda hem sosyal hayatta güvenilen ve sözü dinlenen biri yapar.',
  ],
  resourceBullets: ['Kararlılık ve cesaret', 'Liderlik ve sorumluluk alma', 'Güçlü adalet duygusu', 'Zorluklar karşısında dayanıklılık'],
  blindspots: [
    '{adın} en önemli gelişim alanı, gücünü ve öfkesini kontrollü kullanabilmek. Tepkileri bazen olayın büyüklüğünü aşabiliyor; bu da ilişkilerinde ve okulda sorun yaratabiliyor.',
    'Fark etmediği bir nokta, sert tutumunun çevresindekileri korkutabilmesi ya da uzaklaştırabilmesi. Ayrıca yardım istemeyi zayıflık gibi görebilir.',
  ],
  blindspotBullets: ['Öfkeyi ani ve sert ifade etme', 'Otoriteyle çatışma', 'Yardım istemeyi zayıflık olarak görme'],
  communication: [
    '{ad}, doğrudan ve açık bir iletişim tarzına sahip. Ne düşündüğünü dolandırmadan söyler; samimiyet ve dürüstlük bekler.',
    'Ancak bu doğrudanlık bazen kırıcı olabilir. Karşısındakinin duygularını fark etmesi ve tonunu ayarlaması, iletişimini çok daha güçlü kılacaktır.',
  ],
  commStrong: 'açık ve dürüst konuşmak, grubu yönlendirmek, haksızlığa karşı söz almak.',
  commHard: 'öfkeliyken sakin konuşmak, duygularını ve kırılganlığını göstermek.',
  commStep: 'öfkelendiğinde konuşmadan önce on saniye durmak ve derin nefes almak.',
  stress: [
    'Stres altında {ad} daha kontrolcü ve sert olabilir; öfkesi daha çabuk yükselir, karşı çıkma eğilimi artar. Kırgınlığını ya da korkusunu öfke olarak gösterebilir.',
    'Bu dönemlerde güç mücadelesine girmek yerine sakin, net ve saygılı bir tutum sergilemek iyi gelir.',
  ],
  stressSigns: 'sık öfke patlamaları, kurallara karşı artan direnç, arkadaşlarla çatışma.',
  stressHelps: 'fiziksel aktivite, sakin ve saygılı bir konuşma, kararlarda söz hakkı tanımak.',
  conflict: [
    '{ad} çatışmadan kaçmaz; tam tersine, haklı olduğunu düşündüğünde sonuna kadar savunur. Eleştiriye anında karşı çıkabilir.',
    'Güç mücadelesine dönüşen konuşmalarda geri adım atmakta zorlanır; ancak saygıyla ve gerekçeyle konuşulduğunda yapıcı bir şekilde uzlaşabilir.',
  ],
  conflictTip: 'Eleştiriyi gerekçesiyle ve saygılı bir dille, mümkünse baş başa sunmak; ona çözüm için söz hakkı tanımak {adın} savunmaya geçmeden dinlemesini sağlar.',
  learning: [
    '{ad} en iyi, kendi hedeflerini koyabildiği ve sorumluluğu üstlendiği bir düzende öğreniyor. Ona "bu konuyu sen yönet" ya da "bu hedefi sen belirle" demek, iç motivasyonunu harekete geçiriyor.',
    'Meydan okuyan görevler, zaman tutarak soru çözme ve somut sonuç gösteren çalışmalar ona iyi geliyor.',
  ],
  learningBullets: ['Kendi koyduğu hedefler', 'Meydan okuyan problemler', 'Süre tutarak çalışma', 'Grup içinde liderlik rolü'],
  future: [
    'Kararlılığı, liderlik becerisi ve adalet duygusu; sorumluluk, karar verme ve insanları yönetmeyi gerektiren alanlarda kendini güçlü hissetmesini kolaylaştırabilir.',
  ],
  workEnv: ['Sorumluluk ve karar yetkisi veren ortamlar.', 'Meydan okuyan, sonuç odaklı işler.'],
  drains: ['Sürekli denetlenen ve emir alınan işler.', 'Gerekçesiz kuralların olduğu katı ortamlar.', 'Haksızlığın göz ardı edildiği ortamlar.'],
  youAre:
    '{ad}, sen güçlü, kararlı ve cesur birisin. Haksızlığa karşı durmayı ve sorumluluk almayı seviyorsun. Bazen öfken çabuk yükselebiliyor; bu öfkenin arkasında çoğu zaman haklı bir duygu var. Gücünü kontrollü kullandığında çok iyi bir lider olabilirsin.',
  youStrengths: ['Kararlı ve cesursun.', 'Haksızlığa karşı duruyorsun.', 'Sorumluluk almaktan çekinmiyorsun.', 'İnsanları harekete geçirebiliyorsun.'],
  youGrowth:
    'Öfkelendiğinde sert tepkiler verdiğin olabilir. Yardım istemeyi zayıflık gibi görebilirsin. Oysa gerçek güç, duygularını kontrol edebilmek ve gerektiğinde destek isteyebilmektir.',
  youWays: ['Kendi hedeflerini kendin koy.', 'Zor problemlerle kendine meydan oku.', 'Süre tutarak çalış.', 'Bir konuyu arkadaşlarına sen anlat.'],
  youComm:
    'Düşündüğünü açıkça söylemen bir güç. Bazen tonun karşındakini kırabilir. Öfkelendiğinde konuşmadan önce on saniye durmak, söylediklerinin daha etkili olmasını sağlar.',
  youFuture:
    'Sorumluluk almak, karar vermek ve insanları bir hedef etrafında toplamak sana iyi gelen şeyler gibi görünüyor. Bunlar bir meslek kararı değil, ipuçları; farklı alanları denedikçe enerjini en iyi nerede kullanacağını göreceksin.',
  youTry: [
    'On saniye kuralı: Öfkelendiğinde konuşmadan önce on saniye dur ve derin nefes al.',
    'Liderlik görevi: Bu ay bir grup çalışmasında sorumluluğu üstlen ve herkesin fikrini dinle.',
    'Yardım iste: Zorlandığın bir konuda bu ay en az bir kez yardım iste.',
  ],
  youLast:
    '{ad}, gücün ve kararlılığın çevrene güven veriyor. Bu gücü sakinlikle birleştirdiğinde, insanlar sana sadece güvenmekle kalmayacak, seni gerçekten dinleyecekler.',
  familyOneLine:
    '{ad}, güçlü ve kararlı; bu yüzden kontrol edildiğini hissettiğinde direnç gösterebilen ve saygı gördüğünde, söz hakkı tanındığında en iyi hâline ulaşan biri.',
  approaches: [
    { do: 'Saygılı, net ve tutarlı olun.', why: 'Saygı gördüğünü hissetmek, iş birliğinin ön koşuludur.' },
    { do: 'Kurallara gerekçe ekleyin ve söz hakkı tanıyın.', why: 'Gerekçeli ve ortak kararlara daha kolay uyar.' },
    { do: 'Güç mücadelesine girmeyin.', why: 'Mücadele direnci artırır; sakinlik onu da sakinleştirir.' },
    { do: 'Sorumluluk verin.', why: 'Sorumluluk, enerjisini olumlu yöne çevirir.' },
    { do: 'Kırılganlığını göstermesine güvenli alan açın.', why: 'Sertliğin arkasındaki duyguları ifade edebilmesi önemlidir.' },
  ],
  doList: ['Kararlara onu da dahil edin.', 'Öfkesi geçtikten sonra sakince konuşun.', 'Haklı olduğu durumları kabul edin.', 'Fiziksel enerji boşaltma fırsatları sunun.'],
  dontList: ['Başkalarının önünde onu küçük düşürmeyin.', 'Öfke anında tartışmaya girmeyin.', 'Gerekçesiz yasaklar koymayın.', 'Tehdit ve ceza diliyle konuşmayın.'],
  dialog: [
    { instead: 'Ben ne dersem o!', tryThis: 'Bu konuda senin önerin ne? Birlikte karar verelim.' },
    { instead: 'Sus ve dinle!', tryThis: 'Şu an ikimiz de gerginiz; on dakika sonra konuşalım.' },
    { instead: 'Neden bu kadar sertsin?', tryThis: 'Seni bu kadar kızdıran ne oldu?' },
    { instead: 'Yardıma ihtiyacın yok mu?', tryThis: 'Bu konuda istersen birlikte bakabiliriz, karar senin.' },
  ],
  homeEnv: [
    '{ad} kendi çalışma planını yapmasına izin verildiğinde daha sorumlu davranır. Planı birlikte konuşup son kararı ona bırakmak, sahiplenmesini sağlar.',
    'Fiziksel enerjisini atabileceği spor ya da hareket etkinlikleri, çalışma saatlerinde daha sakin ve odaklı olmasına yardım eder.',
  ],
  gradeTalk: [
    'Not konuşmalarında suçlayıcı değil, saygılı ve çözüm odaklı olun. Hedefi birlikte belirleyip sorumluluğu ona bırakmak, notlarını sahiplenmesini sağlar.',
  ],
  compare:
    '{adı} başkalarıyla karşılaştırmak, onda rekabetten çok öfke ve direnç uyandırabilir. Kendi hedeflerine karşı ilerlemesini görünür kılmak daha etkilidir.',
  supportSigns: [
    'Sık ve şiddetli öfke patlamaları',
    'Okulda tekrarlayan disiplin sorunları',
    'Arkadaşlarıyla süreklileşen fiziksel ya da sözel çatışmalar',
    'Kurallara karşı genelleşmiş direnç',
  ],
  plan: [
    '{adın} hangi durumlarda öfkelendiğini gözlemleyin. Kurallara gerekçe ekleyin ve kararlara onu dahil edin. Güç mücadelesinden kaçının.',
    'Ona somut sorumluluklar verin. Öfke anında mola verme kuralını birlikte kurun. Fiziksel enerji boşaltma fırsatlarını artırın.',
    'Neyin işe yaradığını birlikte konuşun. Öfkesini kontrol ettiği anları takdir edin. Gerekirse rehber öğretmenle öfke yönetimi üzerine görüşün.',
  ],
  caseTheme: 'güçlü ve kararlı bir yönelim; öne çıkan konular: öfke yönetimi ve kontrol ihtiyacı',
  findings: [
    'Yüksek kararlılık ve liderlik eğilimi.',
    'Kontrol ihtiyacı ve otoriteyle çatışma riski.',
    'Öfkenin hızlı yükselmesi; kırılganlığın sertlikle örtülmesi.',
    'Güçlü adalet duygusu.',
  ],
  cognitive: [
    'Öfke tetikleyicilerini ve düşüncelerini fark etmeye yönelik kayıtlar.',
    '"Dur – düşün – seç" öfke yönetimi basamakları.',
    'Liderlik enerjisini yapıcı görevlere yönlendirme.',
  ],
  emotional: [
    'Öfkenin arkasındaki duyguları (kırgınlık, korku) adlandırma.',
    'Fiziksel aktiviteyi duygu düzenleme aracı olarak kullanma.',
    'Yardım istemeyi güç olarak yeniden çerçeveleme.',
  ],
  questions: [
    'Seni en çok neler kızdırıyor?',
    'Öfkelendiğinde bedeninde neler oluyor?',
    'Kendini en çok ne zaman saygı görmüş hissediyorsun?',
    'Yardım istemek senin için ne anlama geliyor?',
  ],
  verify: [
    ['Söz hakkı tanındığında iş birliği artıyor', 'Ortak karar ve emir dili sonrası tepkilerini karşılaştırmak'],
    ['Öfke tetikleyicileri belirli durumlara bağlı', 'Bir ay boyunca öfke anlarını ve öncesini birlikte kaydetmek'],
    ['Sorumluluk aldığında motivasyon yükseliyor', 'Liderlik rolü verilen etkinliklerdeki katılımını gözlemlemek'],
  ],
  priorities: [
    ['Saygıya dayalı ilişki', 'Güç mücadelesi olmayan, saygılı bir ilişki zemini kurulmalı.'],
    ['Öfke farkındalığı', 'Tetikleyiciler ve erken işaretler fark edilir.'],
    ['Öfke yönetimi', '"Dur – düşün – seç" basamakları pratik edilir.'],
    ['Yapıcı liderlik', 'Enerji ve liderlik becerisi olumlu rollere yönlendirilir.'],
  ],
  referral:
    'Şiddetli ve sık öfke patlamaları, fiziksel saldırganlık, tekrarlayan disiplin sorunları veya genelleşmiş kural dışı davranışlar gözlenirse bir ruh sağlığı uzmanına yönlendirme değerlendirilmelidir.',
  monitoring: 'Her görüşmede öfke anlarının sıklığı, kullandığı yönetim stratejileri ve aldığı sorumluluklar birlikte gözden geçirilebilir.',
};

export const ENN9: Profile = {
  id: 'enn9',
  weight: 10,
  result: [
    "{ad} için iç huzur, uyum ve çatışmasız ilişkiler önemli bir iç ihtiyaç. Sakin ve kabul edici; ortamı yumuşatmakta çok başarılı.",
    "Bu eğilimin gölge tarafı, uyum sağlarken kendi isteklerini ve önceliklerini geri plana atabilmesi.",
  ],
  kisaca:
    '{ad}, sakin, uyumlu ve çevresinde huzur arayan biri. İnsanlarla kolay anlaşıyor, ortamı yumuşatıyor; ancak kendi isteklerini geri plana atabiliyor ve harekete geçmesi, özellikle önemli işlerde, gecikebiliyor.',
  strengths: [
    'Sakin ve uyumlu; çatışmaları yumuşatır, ortamı dengeler.',
    'Farklı bakış açılarını anlayabilir; iyi bir dinleyicidir.',
    'Sabırlı ve kabul edicidir; insanlar yanında rahat hisseder.',
  ],
  growth: [
    'Önemli işleri erteleme; harekete geçmekte gecikme.',
    'Kendi isteklerini ve fikirlerini dile getirmekte zorlanma.',
  ],
  develop: [
    'Önemli işler için küçük bir ilk adım belirleyip onu hemen atmak.',
    'Fikrini ve isteğini, önce küçük konularda açıkça söylemeyi denemek.',
    'Günlük ve haftalık hedeflerini yazılı hâle getirip görünür bir yerde tutmak.',
  ],
  priority:
    'Önümüzdeki dönemin önceliği, {adın} önceliklerini belirleyip harekete geçme alışkanlığı kazanması: her gün en önemli işi önce yapmayı ve kendi fikrini açıkça söylemeyi denemesi.',
  portrait: [
    '{ad}, huzuru ve uyumu önemseyen biri. Çevresindeki insanlarla kolay anlaşır, tartışmaları büyütmek yerine yumuşatır. Sakin ve kabul edici tavrı, insanların yanında rahat hissetmesini sağlar.',
    'Farklı bakış açılarını anlayabilmesi, onu iyi bir dinleyici ve arabulucu yapıyor. Bir grup içinde herkesin fikrini dikkate alan, ortamı dengeleyen kişi çoğu zaman odur.',
    'Aynı uyum isteği, bazen kendi isteklerini ve önceliklerini geri plana atmasına yol açıyor. Önemli işleri erteleyip daha kolay ve rahat işlerle vakit geçirebilir; "sonra yaparım" düşüncesi, işlerin birikmesine neden olabilir.',
  ],
  key: '{adı} anlamanın anahtarı: Onun için iç huzur çok önemlidir; baskı hissettiğinde değil, desteklendiğini ve önemsendiğini hissettiğinde harekete geçer.',
  motivates:
    '{adı} en çok harekete geçiren şey sakin, destekleyici bir ortam ve net, küçük adımlar. Fikri sorulduğunda ve önemsendiğinde katılımı artar. Birlikte çalışmak, tek başına başlamaktan daha kolay gelebilir.',
  stops:
    'Onu durduran şey baskı, çatışma ve belirsiz büyük görevler. Nereden başlayacağını bilemediği işlerde erteleme eğilimi artabilir. Ayrıca kendi isteğini söylemek yerine çevreye uymayı seçtiği için gerçek ilgilerini fark etmekte zorlanabilir.',
  motivators: ['sakin ve destekleyici ortam', 'net ve küçük adımlar', 'fikrinin önemsenmesi', 'birlikte çalışma'],
  stoppers: ['baskı ve çatışma', 'büyük ve belirsiz görevler', 'acele ettirilmek', 'fikrinin görmezden gelinmesi'],
  resources: [
    '{adın} en güçlü kaynağı sakinliği ve uyum sağlama becerisi. Gergin ortamlarda bile dengede kalabilmesi, hem ilişkilerinde hem zor dönemlerde ona önemli bir güç sağlıyor.',
    'Farklı görüşleri anlayabilmesi ve iyi bir dinleyici olması, grup çalışmalarında ve arkadaşlık ilişkilerinde değerli bir katkı.',
  ],
  resourceBullets: ['Sakinlik ve dengelilik', 'İyi dinleme ve arabuluculuk', 'Farklı bakış açılarını anlama', 'Sabır ve kabul'],
  blindspots: [
    '{adın} en önemli gelişim alanı, önceliklerini belirleyip harekete geçmek. Önemli işler, daha rahat ve tanıdık işlerin arkasında kalabiliyor; bu da son ana sıkışmaya yol açıyor.',
    'Fark etmediği bir nokta, uyum sağlarken kendi sesini kaybetmesi olabilir. "Bana fark etmez" demeye alıştığında, kendi isteklerini tanımakta da zorlanabilir.',
  ],
  blindspotBullets: ['Önemli işleri erteleme', 'Kendi isteğini ve fikrini dile getirmeme', 'Çatışmadan kaçınmak için içine atma'],
  communication: [
    '{ad}, yumuşak, sakin ve kabul edici bir iletişim tarzına sahip. İnsanları dinler, onları yargılamaz. Tartışmalarda genellikle orta yolu bulmaya çalışır.',
    'Ancak kendi fikrini, özellikle karşı bir görüşse, açıkça söylemekte zorlanabilir. Kırgınlıklarını dile getirmek yerine içine atabilir.',
  ],
  commStrong: 'dinlemek, uzlaştırmak, sakin sohbetler.',
  commHard: 'kendi fikrini savunmak, "hayır" demek, karşı çıkmak.',
  commStep: 'her gün en az bir konuda "ben şunu tercih ederim" cümlesini kurmak.',
  stress: [
    'Stres altında {ad} daha da içine çekilebilir ve "uyuşma" eğilimi gösterebilir: Uzun süre ekran başında kalmak, uyumak ya da önemsiz işlerle oyalanmak, zor işlerden uzaklaşmanın bir yolu olabilir.',
    'Bu dönemlerde baskı yapmak yerine, küçük ve net bir ilk adımı birlikte belirlemek iyi gelir.',
  ],
  stressSigns: 'ekran başında ya da uyuyarak uzun vakit geçirmek, önemli işleri sürekli ertelemek, "bana fark etmez" cümleleri.',
  stressHelps: 'sakin bir konuşma, ilk adımı birlikte belirlemek, birlikte başlamak, kısa yürüyüşler.',
  conflict: [
    '{ad} çatışmadan kaçınır; gerginliği azaltmak için geri adım atar ya da susar. Eleştiriye çoğu zaman sessizce boyun eğer ama içinde direnç biriktirebilir.',
    'Bu sessiz direnç, söylenen işleri ertelemek şeklinde ortaya çıkabilir.',
  ],
  conflictTip: 'Eleştiriyi sakin ve yumuşak bir dille sunmak, ardından "sen ne düşünüyorsun?" diye sormak {adın} içine atmak yerine fikrini söylemesini sağlar.',
  learning: [
    '{ad} en iyi, net yapılandırılmış ve küçük adımlara bölünmüş bir düzende öğreniyor. "Bugün ne yapacağım?" sorusunun cevabının açık olması, başlamasını kolaylaştırıyor.',
    'Bir çalışma arkadaşıyla ya da bir yetişkinin yanında başlamak, harekete geçme eşiğini düşürüyor. Her gün en önemli işi önce yapma kuralı da önceliklerini korumasına yardım ediyor.',
  ],
  learningBullets: ['Günlük "ilk iş" listesi', 'Küçük ve net adımlar', 'Birlikte başlama', 'Düzenli ve sakin çalışma ortamı'],
  future: [
    'Sakinliği, uyum becerisi ve iyi dinleyiciliği; iş birliğinin, dengenin ve insanlara destek olmanın önemli olduğu alanlarda kendini rahat hissetmesini kolaylaştırabilir.',
  ],
  workEnv: ['Sakin, iş birliğine dayalı ve destekleyici ortamlar.', 'Görevlerin net tanımlandığı, düzenli işler.'],
  drains: ['Sürekli çatışma ve rekabetin olduğu ortamlar.', 'Acele ve yüksek baskı.', 'Önceliklerin sürekli değiştiği karmaşık işler.'],
  youAre:
    '{ad}, sen sakin, uyumlu ve insanları dinleyen birisin. Ortamı yumuşatmakta ve herkesi anlamakta çok iyisin. Bazen kendi isteklerini söylemek yerine çevrene uyuyorsun ve önemli işleri erteleyebiliyorsun. Senin fikrin de en az başkalarınınki kadar önemli.',
  youStrengths: ['Sakin ve dengelisin.', 'İnsanları gerçekten dinliyorsun.', 'Tartışmaları yumuşatabiliyorsun.', 'Sabırlısın.'],
  youGrowth:
    'Önemli işleri "sonra yaparım" diyerek ertelediğin olabilir. Kendi fikrini söylemek yerine "bana fark etmez" dediğin zamanlar da olabilir. Küçük adımlarla hem harekete geçmeyi hem kendi sesini duyurmayı öğrenebilirsin.',
  youWays: ['Her gün en önemli işi önce yap.', 'Büyük işleri küçük adımlara böl.', 'Bir arkadaşınla ya da ailenle birlikte başla.', 'Günlük "ilk iş" listeni akşamdan hazırla.'],
  youComm:
    'İnsanları dinlemekte çok iyisin. Kendi fikrini söylemek ise sana daha zor gelebilir. Küçük konulardan başlayarak "ben şunu tercih ederim" demeyi deneyebilirsin.',
  youFuture:
    'İnsanlarla iş birliği yapmak, ortamı dengelemek ve destek olmak sana iyi gelen şeyler gibi görünüyor. Bunlar bir meslek kararı değil, ipuçları; neyi gerçekten sevdiğini fark etmek için kendi isteklerine kulak vermen önemli.',
  youTry: [
    'İlk iş kuralı: Her gün en önemli işini, diğer her şeyden önce 20 dakika yap.',
    'Benim fikrim: Bu ay her gün en az bir kez "ben şunu tercih ederim" de.',
    'Akşam listesi: Her akşam ertesi günün üç önemli işini yaz.',
  ],
  youLast:
    '{ad}, sakinliğin ve iyi kalbin çevrene huzur veriyor. Kendi sesini ve önceliklerini de aynı özenle önemsediğinde, hem çok daha güçlü hem çok daha mutlu olacaksın.',
  familyOneLine:
    '{ad}, huzuru ve uyumu önemseyen, sakin ve kabul edici; bu yüzden kendi isteklerini geri plana atabilen ve önemsendiğini hissettiğinde harekete geçen biri.',
  approaches: [
    { do: 'Fikrini sorun ve gerçekten dinleyin.', why: 'Önemsendiğini hissetmek, kendi sesini bulmasını sağlar.' },
    { do: 'Büyük işleri küçük ve net adımlara bölün.', why: 'Nereden başlayacağını bildiğinde erteleme azalır.' },
    { do: 'Baskı yerine birlikte başlayın.', why: 'Birlikte başlamak harekete geçme eşiğini düşürür.' },
    { do: 'Öncelik belirlemesine yardım edin.', why: 'Önemli işleri önce yapma alışkanlığı birikmeyi önler.' },
    { do: 'Kırgınlıklarını konuşmaya davet edin.', why: 'İçine attığı duyguları ifade etmesi sessiz direnci azaltır.' },
  ],
  doList: ['Karar anlarında ona seçenek sunun.', 'Küçük ilerlemelerini fark edin.', 'Sakin ve düzenli bir ev ritmi kurun.', 'Kendi isteğini söylediği anları takdir edin.'],
  dontList: ['Onu sürekli acele ettirmeyin.', 'Sessizliğini "onay" olarak yorumlamayın.', 'Erteleme için sert eleştiri yapmayın.', 'Kararlarını hep onun yerine vermeyin.'],
  dialog: [
    { instead: 'Hâlâ başlamadın mı?', tryThis: 'İlk adım ne olabilir? İstersen birlikte başlayalım.' },
    { instead: 'Fark etmez deme, bir şey seç.', tryThis: 'Bu iki seçenekten hangisi sana daha iyi gelir?' },
    { instead: 'Hep son ana bırakıyorsun.', tryThis: 'Bu hafta en önemli üç işin ne? Birlikte yazalım.' },
    { instead: 'Neden hiçbir şey söylemiyorsun?', tryThis: 'Senin fikrin benim için önemli; ne düşünüyorsun?' },
  ],
  homeEnv: [
    '{ad} sakin, düzenli ve öngörülebilir bir ortamda rahat çalışır. Her gün aynı saatte başlayan bir çalışma rutini ve görünür bir "ilk iş" listesi, harekete geçmesini kolaylaştırır.',
    'Ekran ve dinlenme zamanlarının sınırlarını birlikte belirlemek, önemli işlerin geri planda kalmasını önler.',
  ],
  gradeTalk: [
    'Not konuşmalarında sakin ve destekleyici olun. Düşük bir notta suçlamak yerine, birlikte küçük ve net bir sonraki adım belirleyin. Baskı onu daha da içine çekebilir; destek ise harekete geçirir.',
  ],
  compare:
    '{adı} daha hızlı ve atak yaşıtlarıyla karşılaştırmak, onda motivasyondan çok geri çekilme yaratabilir. Kendi ritmindeki ilerlemeyi görmek onu cesaretlendirir.',
  supportSigns: [
    'Önemli işleri ertelemenin okul başarısını belirgin biçimde etkilemesi',
    'Uzun süre ekran başında ya da uyuyarak vakit geçirme',
    'İlgi ve isteklerinin belirgin biçimde azalması',
    'Duygularını hiç ifade edememe, içe kapanma',
  ],
  plan: [
    '{adın} hangi işleri ertelediğini ve nelerin onu harekete geçirdiğini gözlemleyin. Fikrini sorduğunuz sakin sohbetler yapın. Günlük bir başlama saati belirleyin.',
    'Akşamdan "ilk iş" listesi hazırlama alışkanlığı kurun. Büyük işleri küçük adımlara bölün; gerekirse birlikte başlayın.',
    'Neyin işe yaradığını birlikte konuşun. Kendi isteğini söylediği ve önce önemli işi yaptığı anları takdir edin. Gerekirse rehber öğretmenle motivasyon ve önceliklendirme üzerine görüşün.',
  ],
  caseTheme: 'uzlaşmacı ve barışçıl bir yönelim; öne çıkan konular: erteleme, önceliklendirme güçlüğü ve kendi sesini geri planda tutma',
  findings: [
    'Yüksek uyum ve çatışmadan kaçınma.',
    'Önemli işleri erteleme; harekete geçmede gecikme.',
    'Kendi isteklerini ve fikirlerini dile getirmede çekingenlik.',
    'Stres altında "uyuşma" ve oyalanma eğilimi.',
  ],
  cognitive: [
    'Öncelik belirleme (önemli-acil matrisi) çalışmaları.',
    '"Başlamak için hazır hissetmem gerekmez" düşüncesini güçlendirme.',
    'Günlük ilk iş ve zaman kutulama uygulamaları.',
  ],
  emotional: [
    'Kendi isteklerini ve duygularını adlandırma pratiği.',
    'Güvenli ortamda fikrini söyleme ve "hayır" deme çalışmaları.',
    'Kırgınlıkları dolaysız ifade etme.',
  ],
  questions: [
    'Bir işi ertelediğinde genellikle onun yerine ne yapıyorsun?',
    'En son ne zaman kendi isteğini açıkça söyledin?',
    'Bir tartışma olduğunda genellikle ne yaparsın?',
    'Seni gerçekten heyecanlandıran şeyler neler?',
  ],
  verify: [
    ['Önemli işleri erteliyor', 'Bir haftalık görev ve zaman kullanımını birlikte kaydetmek'],
    ['Birlikte başladığında harekete geçmesi kolaylaşıyor', 'Tek başına ve birlikte başlama durumlarını karşılaştırmak'],
    ['Fikrini söylemekte çekingen', 'Grup içinde fikir bildirme sıklığını gözlemlemek'],
  ],
  priorities: [
    ['Önemsenme ve güven', 'Fikrinin değer gördüğü destekleyici bir ilişki kurulmalı.'],
    ['Önceliklendirme', 'Önemli işleri belirleme ve önce yapma alışkanlığı kurulur.'],
    ['Harekete geçme', 'Küçük adımlar ve birlikte başlama ile erteleme azaltılır.'],
    ['Kendini ifade etme', 'Fikir ve istekleri dile getirme pratiği yapılır.'],
  ],
  referral:
    'Belirgin motivasyon kaybı, ilgi ve isteklerin uzun süre kaybolması, aşırı uyku ya da ekran kullanımı ve okul işlevselliğinde belirgin düşme gözlenirse bir ruh sağlığı uzmanına yönlendirme değerlendirilmelidir.',
  monitoring: 'Her görüşmede ertelenen görevler, "ilk iş" kuralına uyum ve fikrini ifade ettiği örnekler birlikte gözden geçirilebilir.',
};
