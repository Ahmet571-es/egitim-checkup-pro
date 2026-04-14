// ============================================================
// Hızlı Okuma Testi — Engine
// ============================================================
import type { SpeedReadingScores, Kademe, ReadingPassage } from '../types';
import { getOamPassage } from './oam-passages';

export const KADEME_MAP: Record<number, Kademe> = {
  1: 'kademe_0', 2: 'kademe_0', 3: 'kademe_0', 4: 'kademe_0',
  5: 'kademe_1', 6: 'kademe_1', 7: 'kademe_2', 8: 'kademe_2',
  9: 'kademe_3', 10: 'kademe_3', 11: 'kademe_4', 12: 'kademe_4',
};

export const KADEME_LABELS: Record<Kademe, string> = {
  kademe_0: '1-4. Sınıf (Başlangıç)',
  kademe_1: '5-6. Sınıf (Temel)', kademe_2: '7-8. Sınıf (Orta)',
  kademe_3: '9-10. Sınıf (İleri)', kademe_4: '11-12. Sınıf (Üst)',
};

export const WPM_NORMS: Record<Kademe, Record<string, number>> = {
  kademe_0: { cok_yavas: 30, yavas: 50, ortalama: 75, hizli: 100, cok_hizli: 130 },
  kademe_1: { cok_yavas: 60, yavas: 80, ortalama: 110, hizli: 140, cok_hizli: 170 },
  kademe_2: { cok_yavas: 90, yavas: 120, ortalama: 155, hizli: 190, cok_hizli: 230 },
  kademe_3: { cok_yavas: 120, yavas: 155, ortalama: 195, hizli: 240, cok_hizli: 280 },
  kademe_4: { cok_yavas: 150, yavas: 185, ortalama: 230, hizli: 275, cok_hizli: 320 },
};

export const ALL_PASSAGES: Record<Kademe, ReadingPassage[]> = {
  kademe_0: [], // 1-4. sınıf metinleri OAM'den gelir
  kademe_1: [{
    id: 'k1_p1', title: 'Deniz Kaplumbağalarının Yolculuğu',
    text: 'Deniz kaplumbağaları, dünyanın en ilginç gezginlerinden biridir. Her yıl binlerce kilometre yüzerek doğdukları sahillere geri dönerler. Dişi kaplumbağalar yumurtalarını kumda açtıkları çukurlara bırakır ve üzerlerini kumla örter. Yaklaşık iki ay sonra yumurtadan çıkan minik yavrular, ay ışığının yansımasını takip ederek denize ulaşmaya çalışır. Ancak bu yolculuk oldukça tehlikelidir. Kuşlar, yengeçler ve diğer avcılar yavruları yakalamaya çalışır. Denize ulaşmayı başaran yavrulardan sadece binde biri yetişkin olabilir.\n\nBilim insanları, deniz kaplumbağalarının dünyanın manyetik alanını kullanarak yollarını bulduğunu keşfetmiştir. Bu yetenek sayesinde okyanusun ortasında bile kaybolmadan binlerce kilometre yüzebilirler. Kaplumbağalar ayrıca denizanası, yosun ve küçük deniz canlılarıyla beslenir. Plastik poşetler denizanasına benzediği için kaplumbağalar bazen bunları yutarak hastalanır veya ölür.\n\nBugün yedi deniz kaplumbağası türünden altısı nesli tehlike altında olan canlılar listesindedir. Sahillerdeki yapay ışıklar, yavruların deniz yerine karaya doğru yönelmesine neden olur. Plastik kirliliği, iklim değişikliği ve avlanma da kaplumbağaların hayatını tehdit etmektedir. Birçok ülke kaplumbağa yumurtlama sahillerini koruma altına almış ve gönüllü koruma programları başlatmıştır. Türkiye\'de de Dalyan, Patara ve Anamur gibi sahiller önemli yumurtlama alanlarıdır.',
    questions: [
      { id:'k1_p1_q1', text:'Dişi kaplumbağalar yumurtalarını nereye bırakır?', options:{a:'Denizin dibine',b:'Kayaların arasına',c:'Kumda açtıkları çukurlara',d:'Ağaçların altına'}, answer:'c' },
      { id:'k1_p1_q2', text:'Yumurtadan çıkan yavrular denizi nasıl bulur?', options:{a:'Annelerini takip ederek',b:'Ay ışığının yansımasını takip ederek',c:'Koku alarak',d:'Rüzgârı takip ederek'}, answer:'b' },
      { id:'k1_p1_q3', text:'Denize ulaşan yavrulardan ne kadarı yetişkin olabilir?', options:{a:'Yarısı',b:'Onda biri',c:'Binde biri',d:'Hepsi'}, answer:'c' },
      { id:'k1_p1_q4', text:'Kaplumbağalar yollarını nasıl bulur?', options:{a:'Yıldızlara bakarak',b:'Dünyanın manyetik alanını kullanarak',c:'Akıntıları takip ederek',d:'Diğer kaplumbağaları izleyerek'}, answer:'b' },
      { id:'k1_p1_q5', text:'Plastik poşetler neden kaplumbağalar için tehlikelidir?', options:{a:'Gürültü çıkardığı için',b:'Suyun sıcaklığını değiştirdiği için',c:'Denizanasına benzediği için yutarlar',d:'Yüzmelerini engellediği için'}, answer:'c' },
      { id:'k1_p1_q6', text:'Kaç deniz kaplumbağası türü nesli tehlike altındadır?', options:{a:'Üç',b:'Dört',c:'Beş',d:'Altı'}, answer:'d' },
      { id:'k1_p1_q7', text:'Sahillerdeki yapay ışıklar yavruları nasıl etkiler?', options:{a:'Daha hızlı büyümelerini sağlar',b:'Deniz yerine karaya yönelmelerine neden olur',c:'Yumurtadan daha erken çıkmalarına neden olur',d:'Hiç etkilemez'}, answer:'b' },
      { id:'k1_p1_q8', text:"Aşağıdakilerden hangisi Türkiye'deki kaplumbağa yumurtlama sahillerinden biridir?", options:{a:'Kızkumu',b:'Dalyan',c:'Ölüdeniz',d:'Çeşme'}, answer:'b' },
      { id:'k1_p1_q9', text:'Metnin ana düşüncesi aşağıdakilerden hangisidir?', options:{a:'Kaplumbağalar çok hızlı yüzer',b:'Deniz kaplumbağaları ilginç canlılardır ve korunmaya ihtiyaçları vardır',c:"Türkiye'nin sahilleri çok güzeldir",d:'Plastik poşetler yasaklanmalıdır'}, answer:'b' },
      { id:'k1_p1_q10', text:'Yumurtalar yaklaşık ne kadar sürede yavruya dönüşür?', options:{a:'Bir hafta',b:'İki hafta',c:'Bir ay',d:'İki ay'}, answer:'d' },
    ],
  }],
  kademe_2: [{
    id: 'k2_p1', title: 'Yapay Zekâ ve Geleceğimiz',
    text: 'Yapay zekâ, son yılların en çok konuşulan teknolojik gelişmesidir. Bilgisayarların insan gibi düşünmesi, öğrenmesi ve karar vermesi anlamına gelen bu kavram, hayatımızın birçok alanına girmiştir. Telefonlarımızdaki sesli asistanlar, sosyal medyadaki öneri algoritmaları ve otomobillerdeki sürücü destek sistemleri yapay zekânın günlük hayattaki örneklerindendir.\n\nYapay zekânın temelinde makine öğrenmesi adı verilen bir yöntem bulunur. Bu yöntemde bilgisayarlara büyük miktarda veri verilir ve bilgisayar bu verilerden kalıplar çıkararak kendi kendine öğrenir. Örneğin bir yapay zekâya milyonlarca kedi fotoğrafı gösterildiğinde, bir süre sonra daha önce hiç görmediği bir kedi fotoğrafını tanıyabilir hâle gelir. Bu süreç insan beynindeki öğrenmeye benzer ama çok daha hızlı gerçekleşir.\n\nTıp alanında yapay zekâ büyük bir devrim yaratmaktadır. Röntgen ve MR görüntülerini analiz ederek hastalıkları doktorlardan daha erken tespit edebilen sistemler geliştirilmiştir. Eğitim alanında ise her öğrencinin seviyesine göre özelleştirilmiş ders içerikleri sunan akıllı sistemler kullanılmaya başlanmıştır.\n\nAncak yapay zekânın bazı riskleri de bulunmaktadır. İş gücü piyasasında birçok mesleğin ortadan kalkacağı öngörülmektedir. Uzmanlar, yapay zekânın insanların yerini almayacağını, aksine onlarla birlikte çalışacağını düşünmektedir.',
    questions: [
      { id:'k2_p1_q1', text:'Makine öğrenmesi nasıl çalışır?', options:{a:'Bilgisayara tek tek kurallar yazılır',b:'Bilgisayar büyük verilerden kalıplar çıkararak kendi kendine öğrenir',c:'İnsan beyni bilgisayara bağlanır',d:'Bilgisayarlar birbirleriyle konuşarak öğrenir'}, answer:'b' },
      { id:'k2_p1_q2', text:'Tıp alanında yapay zekânın en önemli katkısı nedir?', options:{a:'Ameliyat yapmak',b:'Hastalıkları erken tespit etmek',c:'Doktorların yerini almak',d:'Hastane yönetimi'}, answer:'b' },
      { id:'k2_p1_q3', text:'Uzmanlar yapay zekânın geleceği hakkında ne düşünüyor?', options:{a:'İnsanların yerini alacak',b:'Tamamen zararlı',c:'İnsanlarla birlikte çalışacak',d:'Çok pahalı olacak'}, answer:'c' },
      { id:'k2_p1_q4', text:'Yapay zekânın öğrenmesi insan beyninden nasıl farklıdır?', options:{a:'Daha yavaştır',b:'Hiç farklı değildir',c:'Daha az doğrudur',d:'Çok daha hızlı gerçekleşir'}, answer:'d' },
      { id:'k2_p1_q5', text:'Aşağıdakilerden hangisi yapay zekânın günlük hayat örneği değildir?', options:{a:'Sesli asistanlar',b:'Öneri algoritmaları',c:'Sürücü destek sistemleri',d:'Kalemler'}, answer:'d' },
      { id:'k2_p1_q6', text:'Eğitim alanında yapay zekânın kullanımı nedir?', options:{a:'Sınav sorularını sızdırmak',b:'Her öğrencinin seviyesine göre içerik sunmak',c:'Öğretmenlerin yerini almak',d:'Notları yükseltmek'}, answer:'b' },
      { id:'k2_p1_q7', text:'Makine öğrenmesinde bilgisayara ne verilir?', options:{a:'Kurallar',b:'Büyük miktarda veri',c:'İnsan beyni',d:'Program kodu'}, answer:'b' },
      { id:'k2_p1_q8', text:'Yapay zekânın risk olarak belirtilen yönü nedir?', options:{a:'Çok yavaş çalışması',b:'Bazı mesleklerin ortadan kalkması',c:'Çok pahalı olması',d:'Güvenilir olmaması'}, answer:'b' },
      { id:'k2_p1_q9', text:'Metnin son paragrafındaki ana mesaj nedir?', options:{a:'Yapay zekâ tehlikelidir',b:'Herkes programlama öğrenmeli',c:'İnsana özgü beceriler önem kazanacak',d:'Yapay zekâ yasaklanmalı'}, answer:'c' },
      { id:'k2_p1_q10', text:'Hangi ülke yapay zekâ kullanımında öncü değil?', options:{a:'Bu bilgi metinde yok',b:'Türkiye',c:'ABD',d:'Çin'}, answer:'a' },
    ],
  }],
  kademe_3: [{
    id: 'k3_p1', title: 'Bilişsel Önyargılar ve Karar Alma',
    text: 'İnsan beyni, saniyede milyonlarca bilgiyi işleyen olağanüstü bir organdır. Ancak bu muazzam işlem gücüne rağmen, beynimiz sistematik düşünme hataları yapabilir. Psikologlar bu hatalara bilişsel önyargı adını verir. Bilişsel önyargılar, evrimsel süreçte hayatta kalmamızı kolaylaştırmak için gelişmiş zihinsel kestirme yollardır; ancak modern dünyada çoğu zaman bizi yanlış kararlara götürebilir.\n\nEn yaygın bilişsel önyargılardan biri doğrulama önyargısıdır. İnsanlar, zaten inandıkları şeyleri destekleyen bilgileri arayıp bulma, buna karşın inançlarıyla çelişen bilgileri görmezden gelme eğilimindedir. Sosyal medya algoritmaları, kullanıcılara sevdikleri içerikleri göstererek doğrulama önyargısını daha da güçlendirmektedir.\n\nBir diğer önemli önyargı çıpalama etkisidir. Karar verirken karşılaştığımız ilk bilgi, sonraki değerlendirmelerimizi orantısız biçimde etkiler. Hayatta kalma önyargısı da sıklıkla gözden kaçar. Başarılı girişimcilerin hikayeleri medyada sürekli yer alırken, aynı yolu izleyip başarısız olan binlerce kişi görünmez kalır.\n\nBilişsel önyargıların farkında olmak, onları tamamen ortadan kaldırmaz ancak etkilerini azaltabilir. Eleştirel düşünme eğitimi, farklı bakış açılarını değerlendirme alışkanlığı ve önemli kararlarda acele etmemek, daha sağlıklı düşünme süreçlerinin temelini oluşturur.',
    questions: [
      { id:'k3_p1_q1', text:'Bilişsel önyargılar evrimsel süreçte hangi amaçla gelişmiştir?', options:{a:'Sanat üretmek için',b:'Hayatta kalmayı kolaylaştırmak için',c:'Sosyal ilişkileri güçlendirmek için',d:'Dil öğrenmeyi hızlandırmak için'}, answer:'b' },
      { id:'k3_p1_q2', text:'Doğrulama önyargısı nedir?', options:{a:'Her bilgiyi doğru kabul etme',b:'İnandığımız şeyleri destekleyen bilgileri arayıp çelişenleri görmezden gelme',c:'Başkalarının fikirlerini onaylama',d:'Her zaman doğru karar verme'}, answer:'b' },
      { id:'k3_p1_q3', text:'Sosyal medya algoritmaları doğrulama önyargısını nasıl etkiler?', options:{a:'Azaltır',b:'Dengeler',c:'Kullanıcılara sevdikleri içerikleri göstererek güçlendirir',d:'Hiç etkilemez'}, answer:'c' },
      { id:'k3_p1_q4', text:'Hayatta kalma önyargısının sonucu nedir?', options:{a:'Herkes hayatta kalır',b:'Başarı olasılığı olduğundan yüksek algılanır',c:'Başarısızlar hep hatırlanır',d:'Medya dengelidir'}, answer:'b' },
      { id:'k3_p1_q5', text:'Metne göre bilişsel önyargılar tamamen ortadan kaldırılabilir mi?', options:{a:'Evet, eğitimle tamamen ortadan kalkar',b:'Hayır, ama farkındalıkla etkileri azaltılabilir',c:'Sadece çocuklukta önlenebilir',d:'İlaçla tedavi edilebilir'}, answer:'b' },
      { id:'k3_p1_q6', text:'Çıpalama etkisi nedir?', options:{a:'Gemi çıpası atmak',b:'İlk karşılaşılan bilginin sonraki kararları orantısız etkilemesi',c:'Her bilgiyi reddetmek',d:'Mantıklı düşünmek'}, answer:'b' },
      { id:'k3_p1_q7', text:'Daha sağlıklı düşünme için ne önerilir?', options:{a:'Her şeyi kabul etmek',b:'Hızlı karar vermek',c:'Eleştirel düşünme ve farklı bakış açıları',d:'Sosyal medyadan uzak durmak'}, answer:'c' },
      { id:'k3_p1_q8', text:'Metinde insan beyninin özelliği nasıl tanımlanıyor?', options:{a:'Yavaş çalışır',b:'Saniyede milyonlarca bilgiyi işler',c:'Hata yapmaz',d:'Küçüktür'}, answer:'b' },
      { id:'k3_p1_q9', text:"Metinde modern dünyanın değerli becerisi olarak ne gösterilmiştir?", options:{a:'Hızlı karar verme',b:'Çok çalışma',c:'Veriye dayalı düşünme ve kendini sorgulama',d:'Gruba uyum sağlama'}, answer:'c' },
      { id:'k3_p1_q10', text:'Önyargı kelimesinin metindeki anlamı nedir?', options:{a:'Süper güç',b:'Sistematik düşünme hatası',c:'Bilim yöntemi',d:'Beyin hastalığı'}, answer:'b' },
    ],
  }],
  kademe_4: [{
    id: 'k4_p1', title: 'Entropi, Düzen ve Evrenin Kaderi',
    text: 'Termodinamiğin ikinci yasası, fizik biliminin en temel ve en felsefi yasalarından biridir. Bu yasa, kapalı bir sistemdeki düzensizliğin — yani entropinin — zamanla her zaman artacağını söyler. Bir bardak sıcak çayın soğuması, buzun erimesi, demir bir çitin paslanması; bunların hepsi entropinin artışının günlük hayattaki tezahürleridir.\n\nEntropi kavramı ilk kez 1865\'te Alman fizikçi Rudolf Clausius tarafından formüle edilmiştir. Ludwig Boltzmann ise entropiyi istatistiksel bir çerçeveye oturtarak, bir sistemin mikro durumlarının sayısıyla ilişkilendirmiştir. Boltzmann\'ın ünlü denklemi S = k log W, entropi ile olasılık arasındaki derin bağlantıyı ortaya koyar.\n\nEntropinin artışı, zamanın yönünü belirleyen temel mekanizmadır. Kırılan bir yumurtanın kendiliğinden birleşmemesinin nedeni entropinin sürekli artmasıdır. Fizikçi Arthur Eddington bu durumu "zamanın oku" olarak adlandırmıştır.\n\nCanlı sistemler, kendi iç düzenlerini artırırken çevrelerine daha fazla düzensizlik yayar. Evrensel ölçekte entropi artışı, kozmolojinin en büyük sorularından birini gündeme getirir: evrenin kaderi ne olacaktır? Eğer entropi artmaya devam ederse, evren sonunda "ısı ölümü" denilen bir duruma ulaşacaktır.',
    questions: [
      { id:'k4_p1_q1', text:'Termodinamiğin ikinci yasası temelde ne söyler?', options:{a:'Enerji yoktan var edilebilir',b:'Kapalı sistemlerdeki entropi zamanla her zaman artar',c:'Sıcaklık her zaman yükselir',d:'Düzen her zaman artar'}, answer:'b' },
      { id:'k4_p1_q2', text:'Entropi kavramını ilk formüle eden bilim insanı kimdir?', options:{a:'Isaac Newton',b:'Albert Einstein',c:'Rudolf Clausius',d:'Ludwig Boltzmann'}, answer:'c' },
      { id:'k4_p1_q3', text:"Boltzmann'ın denklemi neyi ifade eder?", options:{a:'Enerji korunumunu',b:'Entropi ile olasılık arasındaki bağlantıyı',c:'Işık hızını',d:'Kütle çekim kuvvetini'}, answer:'b' },
      { id:'k4_p1_q4', text:'"Zamanın oku" kavramını ortaya atan fizikçi kimdir?', options:{a:'Boltzmann',b:'Schrödinger',c:'Clausius',d:'Arthur Eddington'}, answer:'d' },
      { id:'k4_p1_q5', text:'Canlı sistemler entropiyle nasıl bir ilişki içindedir?', options:{a:'Entropiyi tamamen yok ederler',b:'Kendi düzenlerini artırırken çevrelerine daha fazla düzensizlik yayarlar',c:'Entropi yasasını ihlal ederler',d:'Entropiden etkilenmezler'}, answer:'b' },
      { id:'k4_p1_q6', text:"'Isı ölümü' senaryosunda ne olur?", options:{a:'Evren çok sıcak olur',b:'Yeni yıldızlar doğar',c:'Tüm enerji eşit dağılmış, hiçbir iş yapılamaz bir denge oluşur',d:'Evren tekrar büyük patlamaya döner'}, answer:'c' },
      { id:'k4_p1_q7', text:'Kırılan bir yumurtanın kendiliğinden birleşmemesinin nedeni nedir?', options:{a:'Yer çekimi kuvveti',b:'Kimyasal bağların kopması',c:'Entropinin sürekli artması',d:'Yumurtanın iç yapısı'}, answer:'c' },
      { id:'k4_p1_q8', text:'Clausius entropiyi hangi bağlamda keşfetmiştir?', options:{a:'Canlı hücreleri incelerken',b:'Yıldızları gözlemlerken',c:'Buhar makinelerinin verimliliğini incelerken',d:'Atom çekirdeğini araştırırken'}, answer:'c' },
      { id:'k4_p1_q9', text:'Termodinamiğin diğer fizik yasalarından farkı nedir?', options:{a:'Daha basittir',b:'Zamanın simetrisini kırar',c:'Daha yeni bir yasadır',d:'Sadece sıvılar için geçerlidir'}, answer:'b' },
      { id:'k4_p1_q10', text:'Metnin ana teması nedir?', options:{a:'Evrenin sıcaklığı',b:'Entropi ve zamanın yönü',c:'Fizikçilerin biyografileri',d:'Termodinamiğin tarihi'}, answer:'b' },
    ],
  }],
};

export function gradeToKademe(grade: number): Kademe {
  return KADEME_MAP[grade] ?? 'kademe_2';
}

export function getPassageForGrade(grade: number): { passage: ReadingPassage; kademe: Kademe } {
  const kademe = gradeToKademe(grade);

  // Mevcut kademe metinleri + OAM sınıf bazlı metin
  const pool: ReadingPassage[] = [...(ALL_PASSAGES[kademe] ?? [])];
  const oamPassage = getOamPassage(grade);
  if (oamPassage) pool.push(oamPassage);

  // Havuz boşsa — en yakın kademe'den al
  if (pool.length === 0) {
    const fallback = ALL_PASSAGES['kademe_1'];
    return { passage: fallback[0], kademe: 'kademe_1' };
  }

  // Havuzdan rastgele seç
  const idx = Math.floor(Math.random() * pool.length);
  return { passage: pool[idx], kademe };
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

function classifyWpm(wpm: number, kademe: Kademe): [string, string, string, string] {
  const norms = WPM_NORMS[kademe];
  if (wpm < norms.cok_yavas) return ['cok_yavas', 'Çok Yavaş', '🔴', 'Okuma hızı yaş grubunun oldukça altında. Düzenli okuma alıştırması önerilir.'];
  if (wpm < norms.yavas) return ['yavas', 'Yavaş', '🟠', 'Okuma hızı ortalamanın altında. Günlük okuma süresi artırılmalı.'];
  if (wpm < norms.hizli) return ['ortalama', 'Ortalama', '🟡', 'Okuma hızı yaş grubuna uygun düzeyde.'];
  if (wpm < norms.cok_hizli) return ['hizli', 'Hızlı', '🔵', 'Okuma hızı ortalamanın üzerinde. Güçlü bir okuyucu.'];
  return ['cok_hizli', 'Çok Hızlı', '🟢', 'Okuma hızı mükemmel düzeyde!'];
}

export function calculateSpeedReading(
  answers: Record<string, string>,
  passageData: ReadingPassage,
  readingTimeSeconds: number,
  kademe: Kademe
): SpeedReadingScores {
  const wordCount = countWords(passageData.text);
  const readingTimeMinutes = readingTimeSeconds / 60.0;
  const wpm = Math.round(wordCount / Math.max(readingTimeMinutes, 0.01));

  const [speedKey, speedLabel, speedEmoji, speedComment] = classifyWpm(wpm, kademe);
  const norms = WPM_NORMS[kademe];

  const questions = passageData.questions;
  let correct = 0;
  const detail = questions.map(q => {
    const userAns = answers[q.id] ?? '';
    const isCorrect = userAns === q.answer;
    if (isCorrect) correct++;
    return { id: q.id, text: q.text, user: userAns, correctAnswer: q.answer, isCorrect };
  });

  const comprehensionPct = Math.round((correct / Math.max(questions.length, 1)) * 1000) / 10;

  let compLevel: string, compEmoji: string;
  if (comprehensionPct >= 80) { compLevel = 'Çok İyi'; compEmoji = '🟢'; }
  else if (comprehensionPct >= 60) { compLevel = 'İyi'; compEmoji = '🔵'; }
  else if (comprehensionPct >= 40) { compLevel = 'Orta'; compEmoji = '🟡'; }
  else if (comprehensionPct >= 20) { compLevel = 'Düşük'; compEmoji = '🟠'; }
  else { compLevel = 'Çok Düşük'; compEmoji = '🔴'; }

  const maxExpected = norms.cok_hizli * 1.3;
  const speedNormalized = Math.min((wpm / maxExpected) * 100, 100);
  const effectiveScore = Math.round((speedNormalized * 0.4 + comprehensionPct * 0.6) * 10) / 10;

  let effLevel: string, effEmoji: string;
  if (effectiveScore >= 80) { effLevel = 'Mükemmel'; effEmoji = '🟢'; }
  else if (effectiveScore >= 65) { effLevel = 'İyi'; effEmoji = '🔵'; }
  else if (effectiveScore >= 50) { effLevel = 'Orta'; effEmoji = '🟡'; }
  else if (effectiveScore >= 35) { effLevel = 'Gelişime Açık'; effEmoji = '🟠'; }
  else { effLevel = 'Destek Gerekli'; effEmoji = '🔴'; }

  let profile: string, profileDesc: string;
  if (wpm >= norms.hizli && comprehensionPct >= 70) {
    profile = '⚡ Hızlı & Anlayan Okuyucu'; profileDesc = 'Hem hızlı okuyor hem de okuduğunu iyi anlıyorsun. Harika!';
  } else if (wpm >= norms.hizli && comprehensionPct < 50) {
    profile = '💨 Hızlı Ama Yüzeysel Okuyucu'; profileDesc = 'Hızlı okuyorsun ama anlama oranın düşük. Yavaşlayıp odaklanman gerekebilir.';
  } else if (wpm < norms.yavas && comprehensionPct >= 70) {
    profile = '🔍 Yavaş Ama Derinlemesine Okuyucu'; profileDesc = 'Yavaş okuyorsun ama okuduğunu çok iyi anlıyorsun.';
  } else if (wpm < norms.yavas && comprehensionPct < 50) {
    profile = '📖 Destek İhtiyacı Olan Okuyucu'; profileDesc = 'Hem hız hem anlama konusunda desteğe ihtiyacın var.';
  } else {
    profile = '📚 Dengeli Okuyucu'; profileDesc = 'Okuma hızın ve anlamanı dengeli bir şekilde geliştirmeye devam edebilirsin.';
  }

  return {
    passageTitle: passageData.title, wordCount,
    readingTimeSeconds: Math.round(readingTimeSeconds * 10) / 10,
    readingTimeMinutes: Math.round(readingTimeMinutes * 100) / 100,
    wpm, speedKey, speedLabel, speedEmoji, speedComment,
    kademe, kademLabel: KADEME_LABELS[kademe],
    correct, total: questions.length, comprehensionPct, compLevel, compEmoji,
    effectiveScore, effLevel, effEmoji, profile, profileDesc, detail,
  };
}
