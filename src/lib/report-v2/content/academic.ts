// ============================================================
// Rapor v2 — Akademik, dikkat, kaygı ve çalışma profilleri
// ============================================================
// Kişilik testi içermeyen paketlerde (Akademik Performans, Sınav Strateji)
// ve tek test raporlarında anlatımın omurgasını bu profiller oluşturur.
// Kişilik testi olan paketlerde ise kişilik profiline EK olarak devreye girer.
import type { Profile } from './types';

// ── Sınav kaygısı ────────────────────────────────────────────

export const ANX_HIGH: Profile = {
  id: 'anx_high',
  weight: 8,
  kisaca:
    '{ad}, sınav dönemlerinde belirgin bir kaygı yaşayan biri. Bu kaygı, bildiklerini sınavda gösterebilmesini zaman zaman zorlaştırabiliyor.',
  growth: ['Sınav öncesi ve sırasında yükselen kaygıyı ve kaygının yol açtığı düşünce ve beden tepkilerini yönetmek.'],
  priority:
    'Önümüzdeki dönemin önceliği, {adın} kaygıyla baş etme becerisi kazanması: sınav öncesi ve sırasında kullanabileceği basit sakinleşme tekniklerini düzenli prova ederek, bildiğini sınavda gösterebilmesi.',
  risks: [
    'Belirgin kaygı, bildiği soruları bile sınav anında hatırlayamamasına ya da süreyi verimsiz kullanmasına yol açabilir.',
  ],
  quickWins: ['Her gün 5 dakikalık nefes ve gevşeme pratiği', 'Deneme sınavlarını gerçek sınav koşullarında, süre tutarak çözme', 'Sınav sabahı için sabit ve sakin bir rutin'],
  youGrowth:
    'Sınavlar yaklaştıkça kaygının arttığı, sınav sırasında bildiklerini hatırlamakta zorlandığın oluyor olabilir. Bu çok yaygın bir durum ve öğrenilebilir tekniklerle belirgin biçimde azaltılabilir.',
  youWays: ['Sınav öncesi 4-7-8 nefesini dene: 4 saniye al, 7 saniye tut, 8 saniye ver.', 'Deneme sınavlarını gerçek sınav gibi, süre tutarak çöz.', 'Takıldığın soruyu işaretle ve geç; sonra dön.'],
  youTry: [
    'Nefes provası: Her gün 5 dakika, sınavda kullanacağın nefes tekniğini sakin bir anda prova et.',
    'Endişe notu: Sınavdan önceki akşam aklındaki endişeleri bir kâğıda yaz ve kâğıdı kapat.',
    'Sınav sabahı rutini: Her sınav sabahı aynı kahvaltıyı yap, aynı hazırlık sırasını izle, sakin bir müzik dinle.',
  ],
  familyOneLine: '{ad}, sınavları çok önemseyen ve iyi olmak isteyen; bu yüzden sınav dönemlerinde yoğun kaygı yaşayabilen ve sakin bir destek gördüğünde potansiyelini çok daha iyi gösteren biri.',
  approaches: [
    { do: 'Sınav dönemlerinde sakin ve öngörülebilir bir ev ortamı sağlayın.', why: 'Evdeki gerginlik, onun kaygısını artırabilir.' },
    { do: 'Sonuçtan çok hazırlığa ve çabaya odaklanın.', why: 'Sonuç baskısının azalması kaygıyı düşürür.' },
    { do: 'Kaygısını küçümsemeden dinleyin.', why: 'Duyulduğunu hissetmek, kaygıyı yönetmenin ilk adımıdır.' },
  ],
  doList: ['Sınav öncesi akşamı sakin ve rutin geçirin.', 'Hazırlık sürecindeki çabayı takdir edin.', 'Nefes ve gevşeme çalışmalarını birlikte deneyin.'],
  dontList: ['"Bu sınav çok önemli, hayatın buna bağlı" gibi cümleler kurmayın.', 'Sınav sonucunu sınav günü hemen sormayın.', 'Başka öğrencilerin puanlarını konuşmayın.'],
  dialog: [
    { instead: 'Bu sınav hayatının sınavı.', tryThis: 'Bu sınav, öğrendiklerini göstermek için bir fırsat; sonuç ne olursa olsun yanındayız.' },
    { instead: 'Bu kadar kaygılanacak ne var?', tryThis: 'Seni en çok ne endişelendiriyor, birlikte bakalım mı?' },
  ],
  gradeTalk: [
    'Sınav sonuçları konuşulurken önce nasıl hissettiğini sorun. Sonuç beklenenin altındaysa, kaygının mı yoksa hazırlığın mı belirleyici olduğunu birlikte anlamaya çalışın; çözüm de buna göre değişir.',
  ],
  supportSigns: [
    'Sınav öncesi uyku ve iştahın belirgin biçimde bozulması',
    'Sınav sırasında panik benzeri yoğun bedensel tepkiler',
    'Sınavlardan ya da okuldan kaçınma isteği',
    'Kaygının sınav dönemleri dışında da süreklileşmesi',
  ],
  plan: [
    '{adın} hangi sınav durumlarında kaygısının arttığını gözlemleyin. Sınav öncesi akşamlar için sakin bir rutin oluşturun.',
    'Nefes ve gevşeme tekniklerini birlikte düzenli olarak prova edin. Deneme sınavlarını gerçek sınav koşullarında çözmesini destekleyin.',
    'Kaygı düzeyinde ve sınav performansında değişimi birlikte değerlendirin. Kaygı yoğun sürüyorsa rehber öğretmen ya da bir uzmanla görüşün.',
  ],
  findings: ['Sınav kaygısı belirgin düzeyde; performansı olumsuz etkileme olasılığı var.'],
  cognitive: ['Sınavla ilgili felaketleştirici düşünceleri (ör. "Kazanamazsam her şey biter") fark etme ve gerçekçi alternatiflerle değiştirme.', 'Sınav anında kullanılacak "takıl – işaretle – geç" stratejisi.'],
  emotional: ['Diyafram nefesi ve kademeli kas gevşetmesi gibi bedensel düzenleme teknikleri.', 'Sınav öncesi kaygıyı 0-10 arasında derecelendirip izleme.'],
  academicSupport: ['Deneme sınavlarının gerçek sınav koşullarında (süre, ortam) uygulanması; maruz kalma yoluyla kaygının azaltılması.'],
  questions: ['Sınavdan önceki gece neler düşünüyorsun?', 'Sınav sırasında kaygılandığında bedeninde neler oluyor?', 'Bildiğin bir soruyu sınavda hatırlayamadığın oldu mu?'],
  verify: [['Kaygı sınav performansını düşürüyor', 'Deneme sınavı ile ev ortamındaki soru çözme başarısını karşılaştırmak']],
  priorities: [['Kaygı yönetimi', 'Kaygı azalmadan akademik hazırlığın sınava yansıması sınırlı kalır.']],
  referral:
    'Sınav kaygısı panik benzeri ataklara, okuldan kaçınmaya ya da sınav dönemleri dışında da süren yoğun kaygıya dönüşürse bir ruh sağlığı uzmanına yönlendirme değerlendirilmelidir.',
  monitoring: 'Deneme sınavları öncesinde ve sonrasında kaygı düzeyi (0-10) ile sınav performansı birlikte izlenebilir.',
};

export const ANX_MID: Profile = {
  id: 'anx_mid',
  weight: 4,
  kisaca: '{adın} sınav kaygısı orta düzeyde; bu düzeyde bir kaygı çoğu zaman dikkati toplamaya yardım eder, ancak belirli durumlarda yükselebiliyor.',
  growth: ['Kaygının yükseldiği belirli durumları (ör. zaman baskısı, önemli sınavlar) fark edip yönetmek.'],
  quickWins: ['Sınav öncesi kısa nefes egzersizi', 'Sınav formatını önceden tanıma'],
  youWays: ['Kaygın yükseldiğinde birkaç derin nefes al ve soruya geri dön.'],
  findings: ['Sınav kaygısı orta düzeyde; belirli alt boyutlarda yükselme var.'],
  cognitive: ['Kaygının yükseldiği özel durumların belirlenip bu durumlara yönelik kısa stratejiler geliştirilmesi.'],
  monitoring: 'Önemli sınav dönemlerinde kaygı düzeyi kısa bir ölçekle izlenebilir.',
};

export const ANX_LOW: Profile = {
  id: 'anx_low',
  weight: 2,
  strengths: ['Sınavlara karşı sakin ve dengeli bir tutumu var; kaygı performansını belirgin biçimde etkilemiyor.'],
  findings: ['Sınav kaygısı düşük; sınav anında sakin kalabilme önemli bir avantaj.'],
};

// ── Çalışma davranışı ────────────────────────────────────────

export const STUDY_WEAK: Profile = {
  id: 'study_weak',
  weight: 7,
  kisaca:
    '{adın} öğrenme kapasitesi ile bugünkü çalışma düzeni arasında bir boşluk görünüyor. Çalışmaya başlamak, planı sürdürmek ve tekrar yapmak gibi alışkanlıklar henüz yerleşmemiş; bu da emeğinin tam karşılığını almasını zorlaştırıyor.',
  growth: ['Düzenli bir çalışma rutini kurmak ve sürdürmek.', 'Tekrar ve kendini sınama alışkanlığı kazanmak.'],
  priority:
    'Önümüzdeki dönemin önceliği, {adın} kısa ama her gün sürdürülen bir çalışma rutini kurması: önce süreklilik, sonra süre.',
  risks: ['Çalışma alışkanlıkları yerleşmeden konu yükü arttıkça açık büyüyebilir; eksikler birikerek telafisi zor bir hâle gelebilir.'],
  quickWins: ['Günde tek bir 25 dakikalık çalışma bloğuyla başlamak', 'Her çalışmanın sonunda 5 dakikalık kendini sınama', 'Haftalık bir tekrar günü'],
  tracking: ['Haftada kaç gün planlanan çalışmanın yapıldığı basit bir tabloda işaretlenebilir.'],
  youGrowth:
    'Çalışmaya başlamakta zorlandığın, planlarının kısa süre içinde dağıldığı oluyor olabilir. Bu bir yetenek meselesi değil; doğru alışkanlıklarla değiştirilebilecek bir düzen meselesi.',
  youWays: ['Her gün aynı saatte, kısa bir süreyle başla.', 'Çalıştığın konuyu bitirince kendine 3 soru sor.', 'Haftada bir gün sadece tekrar yap.'],
  youTry: [
    'Aynı saat kuralı: Bu ay her gün aynı saatte 25 dakika çalış ve günleri bir tabloda işaretle.',
    'Üç soru: Her çalışmanın sonunda kitabı kapatıp kendine üç soru sor.',
    'Telefon başka odada: Çalışırken telefonunu başka bir odaya bırak.',
  ],
  familyOneLine: '{ad}, öğrenme kapasitesi olan ama henüz düzenli bir çalışma alışkanlığı kuramamış; doğru yapı ve tutarlı destekle bu alışkanlığı kazanabilecek biri.',
  approaches: [
    { do: 'Her gün aynı saatte başlayan kısa bir çalışma rutini kurun.', why: 'Süreklilik, süre uzunluğundan daha belirleyicidir.' },
    { do: 'Çalışma ortamındaki dikkat dağıtıcıları birlikte azaltın.', why: 'Telefon ve ekran, çoğu öğrencide başlamayı ve sürdürmeyi zorlaştıran yaygın etkenlerdir.' },
    { do: 'Sonuç yerine süreklilik başarısını takdir edin.', why: 'Alışkanlık oluşurken motivasyonu korumak gerekir.' },
  ],
  doList: ['Çalışma saatini ve süresini birlikte belirleyin.', 'Haftalık küçük hedefler koyun.', 'Düzenli çalıştığı günleri görünür kılın.'],
  dontList: ['Uzun ve sıkıcı çalışma süreleri dayatmayın.', 'Çalışmadığı günler için sert eleştiri yapmayın.', 'Çalışma sırasında sık sık kontrol etmeyin.'],
  dialog: [{ instead: 'Hiç ders çalışmıyorsun.', tryThis: 'Bugün 25 dakikalık çalışma bloğunu hangi saatte yapmak istersin?' }],
  homeEnv: [
    'Masada yalnızca o gün çalışılacak dersin malzemelerinin bulunması, telefonun başka bir odada durması ve çalışma saatinin her gün aynı olması, başlama eşiğini belirgin biçimde düşürür.',
  ],
  supportSigns: ['Çalışma düzensizliğinin notlara belirgin biçimde yansıması', 'Ödevlerin sık sık teslim edilmemesi'],
  plan: [
    'Çalışma saatini ve ortamını birlikte belirleyin; telefonu çalışma süresince başka odaya alın.',
    'Kendini sınama ve haftalık tekrar gününü rutine ekleyin. Düzenli çalışılan günleri bir tabloda takip edin.',
    'Rutinin sürdürülme oranını birlikte değerlendirin; gerekirse süreyi yavaşça artırın.',
  ],
  findings: ['Çalışma davranışında destek ihtiyacı; özellikle çalışmaya başlama ve planı sürdürme alışkanlıklarında.'],
  cognitive: ['Çalışmaya başlama eşiğini düşüren küçük ve zamanlı görevler (ör. 25 dakika).'],
  academicSupport: ['Haftalık çalışma planının birlikte hazırlanması ve sürdürülme oranının izlenmesi.', 'Aktif tekrar ve kendini sınama tekniklerinin öğretilmesi.'],
  questions: ['Bir çalışma planı yaptığında genellikle kaç gün sürüyor?', 'Çalışmaya başlamanı en çok ne zorlaştırıyor?'],
  verify: [['Sorun kapasite değil süreklilik', 'Kısa ama düzenli çalışılan iki haftanın sonuçlarını önceki dönemle karşılaştırmak']],
  priorities: [['Çalışma rutini', 'Düzenli bir rutin olmadan diğer akademik müdahalelerin etkisi sınırlı kalır.']],
  monitoring: 'Haftalık rutinin sürdürülme oranı ve kendini sınama alışkanlığı birlikte izlenebilir.',
};

export const STUDY_GOOD: Profile = {
  id: 'study_good',
  weight: 2,
  strengths: ['Çalışma alışkanlıkları büyük ölçüde yerleşmiş; plan yapma ve sürdürme konusunda sağlam bir zemini var.'],
  findings: ['Çalışma davranışı genel olarak güçlü; mevcut düzenin korunması önemli.'],
};

export const ATTITUDE_LOW: Profile = {
  id: 'attitude_low',
  weight: 5,
  growth: ['Okula ve derslere karşı tutumunu güçlendirmek; derslerin kendi hedefleriyle bağlantısını görmek.'],
  risks: ['Okula karşı olumsuz tutum, çalışma isteğini ve devamlılığı zamanla daha da azaltabilir.'],
  approaches: [{ do: 'Okul hakkında yargılamadan konuşun.', why: 'Olumsuz tutumun arkasındaki nedeni anlamak çözümün ilk adımıdır.' }],
  findings: ['Okula karşı tutum olumsuz yönde; motivasyon kaynaklarının araştırılması gerekiyor.'],
  questions: ['Okulda en çok neyi seviyorsun, en çok ne zorluyor?', 'Derslerin senin hedeflerinle nasıl bir ilgisi var?'],
  verify: [['Olumsuz tutum belirli derslere ya da ilişkilere bağlı', 'Ders ve ortam bazında duygularını birlikte haritalamak']],
};

// ── Dikkat ───────────────────────────────────────────────────

export const ATT_LOW: Profile = {
  id: 'att_low',
  weight: 7,
  kisaca:
    '{adın} dikkatini uzun süre ve doğru biçimde sürdürmesi bugün zorlanabildiği bir alan. Bu durum ders sırasında konuyu takip etmesini ve sınavlarda dikkatsizlik hatalarını azaltmasını zorlaştırabiliyor.',
  growth: ['Dikkati uzun süre sürdürmek ve dikkatsizlik hatalarını azaltmak.'],
  priority: 'Önümüzdeki dönemin önceliği, {adın} dikkatini destekleyecek bir çalışma düzeni kurması: kısa bloklar, sık ve planlı molalar, dikkat dağıtıcısı az bir ortam.',
  studyNow: ['Dikkat testinde odaklanmayı sürdürme ve doğruluk alanlarında zorlanma görülüyor. Bu tablo, uzun ve kesintisiz çalışma sürelerinin onun için verimli olmayabileceğini düşündürüyor.'],
  risks: ['Dikkatte zorlanma, bildiği konularda bile işlem ve okuma hatalarına yol açarak notlarına yansıyabilir.'],
  quickWins: ['15-20 dakikalık kısa çalışma blokları', 'Soruları okurken anahtar kelimelerin altını çizme', 'Sınavda kontrol için ayrılmış son 5 dakika'],
  youGrowth: 'Uzun süre aynı işe odaklanmak sana zor gelebiliyor. Bu, kısa bloklar ve doğru molalarla çalışarak yönetilebilecek bir durum.',
  youWays: ['15-20 dakikalık kısa bloklarla çalış.', 'Soruları okurken önemli kelimelerin altını çiz.', 'Sınavda son 5 dakikayı kontrole ayır.'],
  youTry: ['Kısa blok: Bu ay çalışmalarını 20 dakikalık bloklara böl ve aralarda 5 dakika hareket et.', 'Altını çiz: Her soruda soru kökündeki önemli kelimenin altını çiz.'],
  approaches: [
    { do: 'Çalışmayı kısa bloklara ve sık molalara bölün.', why: 'Kısa bloklar dikkat kapasitesine uygun bir düzen sağlar.' },
    { do: 'Ortamdaki dikkat dağıtıcıları azaltın.', why: 'Sessiz ve sade bir masa, dikkatin daha az bölünmesini sağlar.' },
  ],
  doList: ['Molalarda fiziksel hareketi destekleyin.', 'Talimatları kısa ve tek tek verin.'],
  dontList: ['Dikkatsizlik hatalarını "umursamazlık" diye yorumlamayın.', 'Uzun ve aralıksız çalışma beklemeyin.'],
  homeEnv: ['Masanın sade olması, çalışılacak dersin dışındaki malzemelerin kaldırılması ve kısa blokların arasına hareket molaları eklenmesi dikkatini destekler.'],
  supportSigns: ['Dikkatte zorlanmanın hem okulda hem evde belirgin işlev kaybına yol açması', 'Öğretmenlerden süreklileşen dikkat geri bildirimleri'],
  findings: ['Dikkat ve odaklanma göstergelerinde zorlanma; özellikle sürdürme ve doğrulukta.'],
  cognitive: ['Görev bölme, kısa zaman blokları ve kendini kontrol listeleri.'],
  academicSupport: ['Sınavlarda kontrol stratejisi ve soru kökü analizi çalışması.'],
  questions: ['Derste dikkatinin en çok ne zaman dağıldığını fark ediyor musun?', 'Hangi ortamda daha uzun süre odaklanabiliyorsun?'],
  verify: [['Kısa bloklarla dikkat sürdürme artıyor', 'Kısa ve uzun bloklardaki hata oranını karşılaştırmak']],
  priorities: [['Dikkat dostu çalışma düzeni', 'Dikkat kapasitesine uygun düzen kurulmadan çalışma süresini artırmak verim getirmez.']],
  referral:
    'Dikkat güçlükleri birden fazla ortamda (okul, ev) sürekli ve belirgin işlev kaybına yol açıyorsa, kapsamlı bir değerlendirme için bir çocuk-ergen psikiyatristine ya da uzman bir psikoloğa yönlendirme değerlendirilmelidir. Bu test tek başına tanı koymaz.',
  monitoring: 'Kısa blok düzeninde tamamlanan görevler ve sınavlardaki dikkatsizlik hatası sayısı izlenebilir.',
};

export const ATT_IMPULSIVE: Profile = {
  id: 'att_impulsive',
  weight: 5,
  growth: ['Hızlı çalışırken doğruluğu korumak; aceleyle yapılan hataları azaltmak.'],
  risks: ['Hızlı ama hatalı çalışma tarzı, sınavlarda bildiği sorularda dikkatsizlik hatalarına yol açabilir.'],
  quickWins: ['Her soruda cevabı işaretlemeden önce soru kökünü bir kez daha okuma'],
  youWays: ['Cevabı işaretlemeden önce soruyu bir kez daha oku.'],
  findings: ['Dikkat profili hızlı ama hataya açık; dürtüsel yanıtlama eğilimi.'],
  cognitive: ['"Dur – oku – kontrol et" öz düzenleme basamakları.'],
  verify: [['Hatalar acele kaynaklı', 'Süre baskısı olan ve olmayan çalışmalardaki hata oranını karşılaştırmak']],
};

export const ATT_SLOW: Profile = {
  id: 'att_slow',
  weight: 4,
  growth: ['Doğruluğu korurken hızını artırmak; zaman yönetimini güçlendirmek.'],
  risks: ['Temkinli ve yavaş çalışma tarzı, süreli sınavlarda soruların yetişmemesine neden olabilir.'],
  quickWins: ['Süre tutarak kısa soru setleri çözme'],
  youWays: ['Kısa soru setlerini süre tutarak çöz ve süreni yavaş yavaş kısalt.'],
  findings: ['Dikkat profili temkinli; doğruluk iyi, hız görece düşük.'],
  academicSupport: ['Süreli soru çözme ile tempo çalışması.'],
};

export const ATT_FLUCT: Profile = {
  id: 'att_fluct',
  weight: 4,
  risks: ['Dikkatin görev ilerledikçe dalgalanması, uzun sınavların son bölümlerinde performans kaybına yol açabilir.'],
  quickWins: ['Uzun sınavlarda bölüm aralarında kısa nefes ve duruş molası'],
  findings: ['Dikkat performansı görev boyunca dalgalı.'],
  cognitive: ['Uzun görevleri bölümlere ayırıp aralarda kısa duruş molası verme.'],
  questions: ['Uzun bir sınavın ya da çalışmanın hangi bölümünde daha çok yoruluyorsun?'],
  verify: [['Dikkat uzun görevlerin sonunda düşüyor', 'Deneme sınavlarında bölümlere göre doğru oranını karşılaştırmak']],
};

export const ATT_MID: Profile = {
  id: 'att_mid',
  weight: 3,
  approaches: [{ do: 'Çalışma sürelerini dikkatinin taze kaldığı uzunlukta tutun.', why: 'Dikkat orta düzeyde; çok uzun bloklar verimi düşürebilir, kısa ve düzenli bloklar ise korur.' }],
  doList: ['Çalışma masasını sade tutmasına yardımcı olun.'],
  homeEnv: ['25-30 dakikalık çalışma blokları, aralarında kısa molalar ve sade bir masa, dikkatini korumasına yardım eder.'],
  findings: ['Dikkat göstergeleri orta düzeyde; uzun görevlerde verim kaybı olasılığı izlenmeli.'],
  monitoring: 'Uzun çalışmalarda ve deneme sınavlarının son bölümlerinde hata oranı izlenebilir.',
};

export const ATT_GOOD: Profile = {
  id: 'att_good',
  weight: 2,
  findings: ['Dikkat göstergeleri güçlü; olası verim kayıplarının kaynağı dikkat dışındaki alanlarda aranmalı.'],
};

// ── Akademik ─────────────────────────────────────────────────

export const AC_LOW: Profile = {
  id: 'ac_low',
  weight: 7,
  kisaca:
    '{adın} temel akademik becerilerinde, sınıf düzeyinin gerektirdiği seviyeye göre desteklenmesi gereken alanlar var. Bu açıklar doğru planlanmış, adım adım bir çalışmayla kapanabilir.',
  growth: ['Temel becerilerdeki eksikleri adım adım tamamlamak.'],
  priority: 'Önümüzdeki dönemin önceliği, {adın} temel becerilerdeki eksiklerini küçük ve sistemli adımlarla kapatması: önce temel, sonra hız.',
  risks: ['Temel eksikler kapanmadan yeni konulara geçmek, üst sınıflarda açığın büyümesine yol açabilir.'],
  quickWins: ['Eksik konuların küçük parçalara bölünerek her gün kısa tekrarlarla çalışılması', 'Kolaydan zora giden soru setleri'],
  tracking: ['Eksik konular listesi oluşturulup tamamlandıkça işaretlenebilir.'],
  youGrowth: 'Bazı derslerde temel konularda eksiklerin olabilir. Bu eksikler, kolaydan zora giden küçük adımlarla kapanabilir.',
  youWays: ['Eksik konularını bir listeye yaz ve her gün birine çalış.', 'Kolay sorularla başla, sonra zora geç.'],
  approaches: [{ do: 'Eksik konuları birlikte listeleyin ve küçük parçalara bölün.', why: 'Büyük ve belirsiz bir açık yerine somut adımlar motivasyonu korur.' }],
  dontList: ['Eksikleri "tembellik" olarak yorumlamayın.'],
  findings: ['Akademik becerilerde sınıf düzeyine göre desteklenmesi gereken alanlar.'],
  academicSupport: ['Temel becerilere yönelik telafi programı; kolaydan zora sıralanmış alıştırmalar.'],
  verify: [['Eksikler belirli konulara yoğunlaşıyor', 'Konu bazlı kısa tarama testleriyle eksikleri haritalamak']],
  priorities: [['Temel becerilerin tamamlanması', 'Üst düzey konuların sağlam öğrenilmesi temel becerilere bağlıdır.']],
  monitoring: 'Eksik konu listesinin tamamlanma oranı ve kısa tarama testleri izlenebilir.',
};

export const AC_MID: Profile = {
  id: 'ac_mid',
  weight: 3,
  findings: ['Akademik becerilerde genel tablo orta düzeyde; en zayıf alan öncelikli destek gerektiriyor.'],
  academicSupport: ['En zayıf akademik alana yönelik haftalık hedefli konu tekrarı ve soru seti.'],
  priorities: [['En zayıf akademik alanın güçlendirilmesi', 'Genel tablo orta düzeyde; en zayıf alan düzenli konu tekrarı ve soru pratiğiyle gelişebilir.']],
};

export const AC_GOOD: Profile = {
  id: 'ac_good',
  weight: 3,
  findings: ['Akademik becerilerde genel tablo orta üstü; en zayıf alana yönelik hedefli çalışma öncelikli.'],
  academicSupport: ['En zayıf akademik alana yönelik haftalık hedefli konu tekrarı ve soru seti; güçlü alanlarda ise düzeyin korunması.'],
  priorities: [['En zayıf akademik alanın güçlendirilmesi', 'Genel tablo iyi; en zayıf alana yönelik hedefli çalışma, akademik dengeyi sağlar.']],
};

export const AC_HIGH: Profile = {
  id: 'ac_high',
  weight: 3,
  findings: ['Akademik beceriler güçlü düzeyde.'],
};

export const READ_LOW: Profile = {
  id: 'read_low',
  weight: 5,
  growth: ['Okuduğunu anlama becerisini güçlendirmek; metnin ana fikrini ve ayrıntılarını yakalamak.'],
  risks: ['Okuduğunu anlamadaki zorlanma, yalnızca Türkçe dersini değil, uzun soru köklerinin olduğu tüm dersleri etkileyebilir.'],
  quickWins: ['Her gün 15 dakika okuma ve okuduğunu iki cümleyle özetleme'],
  youWays: ['Her gün 15 dakika oku ve okuduğunu iki cümleyle özetle.', 'Paragraf sorularında önce soruyu, sonra metni oku.'],
  youTry: ['Okuma serisi: Bu ay her gün 15 dakika oku ve okuduğun metni iki cümleyle özetle.'],
  findings: ['Okuduğunu anlama alanında destek ihtiyacı.'],
  academicSupport: ['Ana fikir bulma, çıkarım yapma ve özetleme çalışmaları; düzenli okuma alışkanlığı.'],
  cognitive: ['Okurken durup "Burada ne anlatıldı?" diye kendine soru sorma (öz izleme) stratejisi.'],
  questions: ['Okurken en çok nerede zorlanıyorsun: uzun cümlelerde, bilmediğin kelimelerde, yoksa soruyu anlamakta mı?'],
};

export const MATH_LOW: Profile = {
  id: 'math_low',
  weight: 5,
  growth: ['Matematikte temel kavramları ve problem çözme güvenini güçlendirmek.'],
  risks: ['Matematikteki kavram eksikleri birikimli olduğundan, kapanmadığında sonraki konuları da zorlaştırır.'],
  quickWins: ['Eksik kavramların kolaydan zora sıralanmış kısa setlerle çalışılması', 'Hata defteri tutma'],
  youWays: ['Matematikte bir hata defteri tut: Yanlış yaptığın soruyu ve doğru çözümünü yaz.'],
  youTry: ['Hata defteri: Bu ay yanlış yaptığın her matematik sorusunu ve doğru çözümünü bir deftere yaz; hafta sonu bu soruları yeniden çöz.'],
  findings: ['Matematiksel muhakeme alanında destek ihtiyacı.'],
  academicSupport: ['Kavram temelli telafi; hata analizi ve düzenli kısa alıştırmalar.'],
  cognitive: ['Hata defteriyle hata türlerini (kavram, işlem, dikkat) fark etme ve sınıflama.'],
  questions: ['Matematikte en çok nerede takılıyorsun: konuyu anlarken mi, soru çözerken mi?'],
};

export const UNDERCONF: Profile = {
  id: 'underconf',
  weight: 4,
  growth: ['Kendi akademik becerisine daha gerçekçi ve olumlu bakmak; başarılarını fark etmek.'],
  risks: ['Kendini olduğundan daha zayıf görmek, zor sorulara girişmekten kaçınmasına ve motivasyon kaybına yol açabilir.'],
  youGrowth: 'Kendini olduğundan daha az başarılı görüyor olabilirsin. Test sonuçların, düşündüğünden daha iyi olduğunu gösteriyor.',
  approaches: [{ do: 'Başarılarını somut örneklerle hatırlatın.', why: 'Kendi becerisini olduğundan düşük görme eğilimini dengeler.' }],
  findings: ['Öz-değerlendirme gerçek performansın belirgin biçimde altında; özgüven desteği gerekli.'],
  cognitive: ['Başarı kanıtlarını kaydetme ve "yapamam" düşüncesini kanıtlarla sınama.'],
};

export const OVERCONF: Profile = {
  id: 'overconf',
  weight: 4,
  growth: ['Kendi akademik düzeyini daha gerçekçi değerlendirmek; eksiklerini fark etmek.'],
  risks: ['Kendini olduğundan daha hazır görmek, tekrar ve hazırlığı azaltarak sınavlarda sürprizlere yol açabilir.'],
  youGrowth: 'Kendini bazı konularda olduğundan daha hazır görüyor olabilirsin. Düzenli kendini sınama, gerçek durumunu görmene yardım eder.',
  approaches: [{ do: 'Düzenli kendini sınama ve deneme sonuçlarını birlikte inceleyin.', why: 'Somut veri, gerçekçi bir öz değerlendirme yapmasını kolaylaştırır.' }],
  findings: ['Öz-değerlendirme gerçek performansın belirgin biçimde üstünde; gerçekçi hedef koyma desteği gerekli.'],
  academicSupport: ['Düzenli kendini sınama ve hata analizi ile gerçekçi öz değerlendirme.'],
};

// ── Okuma hızı ───────────────────────────────────────────────

export const RD_SLOW: Profile = {
  id: 'rd_slow',
  weight: 4,
  growth: ['Okuma hızını, anlamayı koruyarak artırmak.'],
  risks: ['Okuma hızının düşük olması, uzun metinli sorularda ve süreli sınavlarda zamanın yetmemesine yol açabilir.'],
  quickWins: ['Her gün süre tutarak 10 dakikalık okuma ve kelime/dakika takibi'],
  youWays: ['Her gün 10 dakika süre tutarak oku ve kelime sayını not et.'],
  findings: ['Okuma hızı sınıf düzeyine göre düşük.'],
};

export const RD_RUSH: Profile = {
  id: 'rd_rush',
  weight: 4,
  growth: ['Hızlı okurken anlamayı korumak.'],
  risks: ['Hızlı ama yüzeysel okuma, soru köklerindeki ayrıntıların kaçırılmasına yol açabilir.'],
  quickWins: ['Okuduktan sonra iki cümlelik özet çıkarma'],
  youWays: ['Okuduktan sonra metni iki cümleyle özetle; hız kadar anlamak da önemli.'],
  findings: ['Okuma hızlı, anlama oranı düşük; yüzeysel okuma eğilimi.'],
};

// ── Genel yedek profil ───────────────────────────────────────

/** Hiçbir özel profil eşleşmediğinde ya da bölümler boş kaldığında kullanılır. */
export const GENERIC: Profile = {
  id: 'generic',
  weight: 0,
  kisaca: '{ad}, kendine özgü güçlü yanları ve gelişime açık alanlarıyla öğrenme yolculuğunun önemli bir döneminde. Bu rapor, onu daha yakından tanımak ve doğru biçimde desteklemek için hazırlandı.',
  priority: 'Önümüzdeki dönemin önceliği, {adın} güçlü yanlarını fark ederek bunları gelişime açık alanlarında da kullanmayı öğrenmesi.',
  youAre: '{ad}, sen kendine özgü güçlü yanları olan birisin. Bu rapor, seni daha iyi tanıman ve kendine uygun çalışma yollarını bulman için hazırlandı.',
  youNow: 'Şu an kendini tanıma yolunda önemli bir yerdesin. Güçlü yanlarını fark ettikçe, zorlandığın alanlarda da daha cesur adımlar atabileceksin.',
  youTry: [
    'Güçlü yan listesi: Bu ay kendinde sevdiğin üç özelliği yaz ve bunları nasıl kullandığını gözlemle.',
    'Haftalık hedef: Her pazartesi o hafta için küçük ve ölçülebilir tek bir hedef belirle.',
    'Pazar değerlendirmesi: Her pazar akşamı haftanın en iyi giden şeyini ve bir sonraki hafta deneyeceğin şeyi yaz.',
  ],
  youLast: '{ad}, her insan farklı bir hızda ve farklı bir yolda ilerler. Kendi yolunda attığın her küçük adım değerli.',
  familyOneLine: '{ad}, kendine özgü güçlü yanları olan ve doğru destekle bu güçlü yanlarını her alanda daha iyi kullanabilecek biri.',
  approaches: [
    { do: 'Güçlü yanlarını somut örneklerle takdir edin.', why: 'Görülen güçlü yanlar, gelişime açık alanlarda cesaret kaynağı olur.' },
    { do: 'Sonuçtan çok çabaya ve sürece odaklanın.', why: 'Süreç odaklı bir yaklaşım, kalıcı motivasyonu destekler.' },
    { do: 'Düzenli, kısa ve baskısız sohbet zamanları oluşturun.', why: 'Güvenli bir iletişim, ihtiyaçlarını fark etmenizi kolaylaştırır.' },
  ],
  doList: ['Çabasını ve gelişimini fark edin.', 'Duygularını sormayı alışkanlık hâline getirin.', 'Düzenli bir günlük ritim kurun.'],
  dontList: ['Başkalarıyla karşılaştırmayın.', 'Yalnızca sonuca odaklanan sorular sormayın.', 'Zorlandığı alanları etiketlemeyin.'],
  dialog: [
    { instead: 'Kaç aldın?', tryThis: 'Bu konuda en çok neyi öğrendin?' },
    { instead: 'Neden yapamıyorsun?', tryThis: 'Seni en çok ne zorluyor, birlikte bakalım mı?' },
  ],
  homeEnv: ['Sessiz, düzenli ve dikkat dağıtıcıların az olduğu bir çalışma ortamı önemlidir. Çalışma ve mola saatlerinin önceden belli olması, {adın} enerjisini dengeli kullanmasına yardım eder.'],
  gradeTalk: ['Not konuşmalarında sonuçtan çok sürece odaklanmak faydalı olur: "Kaç aldın?" yerine "Nasıl hazırlandın, bir dahakine neyi farklı yapmak istersin?" gibi sorular.'],
  compare: '{adı} kardeşleriyle, kuzenleriyle ya da sınıf arkadaşlarıyla karşılaştırmak, iyi niyetle yapılsa bile motivasyonunu düşürebilir.',
  supportSigns: ['Uzun süre içine kapanma ya da sevdiği şeylerden uzaklaşma', 'Uyku ve iştah düzeninde belirgin değişiklikler', 'Okul başarısında ani ve belirgin düşüş', 'Yoğun ve süreklileşen kaygı ya da mutsuzluk ifadeleri'],
  plan: [
    '{adın} güçlü yanlarını ve zorlandığı durumları gözlemleyin. Haftada bir baskısız sohbet zamanı oluşturun.',
    'Raporda önerilen çalışma yollarından birkaçını birlikte deneyin. Küçük ilerlemeleri görünür kılın.',
    'Neyin işe yaradığını birlikte değerlendirin. Gerekirse rehber öğretmenle ortak bir görüşme planlayın.',
  ],
  caseTheme: 'kendine özgü güçlü yanlar ve gelişime açık alanlar',
  questions: ['Okulda seni en çok ne mutlu ediyor?', 'En çok hangi konularda zorlanıyorsun?', 'Zorlandığında kimden ve nasıl destek istersin?'],
  priorities: [
    ['Güvenli ilişki', 'Öğrencinin kendini rahat ifade edebileceği bir ilişki zemini kurulmalı.'],
    ['Güçlü yanların fark edilmesi', 'Güçlü yanlar, gelişim alanları için kaldıraç olarak kullanılır.'],
    ['Hedefli destek', 'Rapordaki gelişim alanlarına yönelik küçük ve ölçülebilir hedefler belirlenir.'],
  ],
  referral:
    'Uzun süreli içe kapanma, belirgin uyku ya da iştah değişiklikleri, yoğun ve süreklileşen kaygı veya mutsuzluk, ya da okul işlevselliğinde belirgin düşme gözlenirse bir ruh sağlığı uzmanına yönlendirme değerlendirilmelidir.',
  monitoring: 'Öğrencinin kendi gözlemleri ile aileden alınan bilgiler karşılaştırılarak ilerleme izlenebilir.',
};
