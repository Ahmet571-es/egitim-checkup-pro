// Çalışma Davranışı verisi — kısaltılmış (ilgili alanlar)
import type { CalismaDavranisiScores, CalismaCombination } from '../types';

export interface CalismaDavranisiQuestion {
  id: number;
  text: string;
  category: string;
  key: 'D' | 'Y'; // D=Doğru davranış, Y=Yanlış davranış
}

export const CALISMA_DAVRANISI_QUESTIONS: CalismaDavranisiQuestion[] = [
  { id: 1,  text: "Derslerle ilgili tekrarlarımın çoğunu sınavdan önceki gece yaparım.", category: "G", key: "Y" },
  { id: 2,  text: "Sınavlara hazırlanırken, sinirlilikten, gerginlikten, huzursuzluktan ötürü çalışmakta güçlük çekerim.", category: "G", key: "Y" },
  { id: 3,  text: "Ödevler ve kompozisyonlar bana angarya gelir, bir an önce kurtulmak isterim.", category: "E", key: "Y" },
  { id: 4,  text: "Anlayabilmek için çoğunlukla bir konuyu defalarca okurum.", category: "D", key: "Y" },
  { id: 5,  text: "Derse çalışırken önemli noktaları bulup çıkartmakta güçlük çekerim.", category: "D", key: "Y" },
  { id: 6,  text: "Bir dönem ödevini hazırlamaya başlamadan önce mutlaka müsveddesini yaparım.", category: "G", key: "D" },
  { id: 7,  text: "Bilmediğim veya anlamından emin olmadığım kelimeleri sözlükten bakarım.", category: "D", key: "D" },
  { id: 8,  text: "Not tutarken, öğretmenin veya yazarın kelimelerini değil kendi kelimelerimi kullanırım.", category: "C", key: "D" },
  { id: 9,  text: "Bir test sırasında sinirli olurum ve hak ettiğim kadar başarılı olamam.", category: "G", key: "Y" },
  { id: 10, text: "Derste notlarımı not defteri yerine elime geçen kağıtlara alırım.", category: "C", key: "Y" },
  { id: 11, text: "Zaman zaman okuduklarımı grafikler, şemalar ve özetler halinde ifade ederim.", category: "D", key: "D" },
  { id: 12, text: "Bir cümleyi meydana getiren ögeleri gerçekten bilmiyorum.", category: "B", key: "Y" },
  { id: 13, text: "Çalışmaya başlamak için çoğunlukla içimden gelmesini beklerim.", category: "A", key: "Y" },
  { id: 14, text: "Düzenli olarak tekrarlar yaparım.", category: "B", key: "D" },
  { id: 15, text: "Çalışmam sırasında telefonla arayanlar, gelen-giden ve başka sebepler çalışmaya ara vermemi gerektirir.", category: "A", key: "Y" },
  { id: 16, text: "Bir başka derse geçmeden önce, başladığım dersi bütünüyle tamamlarım.", category: "B", key: "Y" },
  { id: 17, text: "Çalışmam için harcamam gereken zamanı oyunda, televizyonun başında, telefonda, müzik dinleyerek, arkadaşlarla geçirdiğim olur.", category: "A", key: "Y" },
  { id: 18, text: "Zaman zaman, dersin amacının tam olarak ne olduğunu bilmeden, çalışmaya başladığımı fark ederim.", category: "A", key: "Y" },
  { id: 19, text: "Okulda öğrendiğim derslerle ilgili konuları dış dünyadaki olayları anlayabilmek için kullanırım.", category: "B", key: "D" },
  { id: 20, text: "Ders notlarının hepsini not defterimin içinde toplu olarak saklarım.", category: "C", key: "D" },
  { id: 21, text: "Kompozisyon ve dönem ödevlerinde sonuç bölümünü yazmakta zorlanıyorum.", category: "G", key: "Y" },
  { id: 22, text: "Öğretmenin her söylediğini not aldığım ve bunları elden geçirmediğim için bazen gereksiz malzemeyi çalışmak zorunda kalırım.", category: "C", key: "Y" },
  { id: 23, text: "Bir kompozisyon veya ödev hazırlarken, başlamadan önce bir plan yaparım.", category: "E", key: "D" },
  { id: 24, text: "Okuduğum her cümle veya paragraftan sonra not almak yerine, bölümü bitirdikten sonra not çıkartırım.", category: "C", key: "D" },
  { id: 25, text: "Kompozisyon veya ödevlerimi vermem gereken günden önce hazır ederim ve böylece birkaç kere okur ve gerekiyorsa yeniden yazarım.", category: "E", key: "D" },
  { id: 26, text: "Ödevleri bazen zamanında hazır edemem ve yetiştirmek zorunda kalırsam aceleyle hazırlarım.", category: "E", key: "Y" },
  { id: 27, text: "Bazı öğretmen ve derslerden hoşlanmamam okul başarımı etkiler.", category: "F", key: "Y" },
  { id: 28, text: "Sık sık ne okuduğumu bilmeden sayfalarca okumuş olduğumu fark ederim.", category: "D", key: "Y" },
  { id: 29, text: "Çoğunlukla okuduğum kitaptaki şekil ve tabloları atlarım.", category: "D", key: "Y" },
  { id: 30, text: "Bazı dersler için o kadar çok zaman harcıyorum ki, diğer derslere zamanım kalmıyor.", category: "A", key: "Y" },
  { id: 31, text: "Yeni (bilmediğim) kelimeleri ve anlamlarını yazmak için fihristli bir not defteri tutarım.", category: "C", key: "D" },
  { id: 32, text: "Çalışırken çoğunlukla kalkıp dolaşırım, gazete okurum veya bir şeyler araştırırım.", category: "A", key: "Y" },
  { id: 33, text: "Çalışmalarımla ilgili problemle karşılaşırsam, bunları öğretmenimle konuşmakta tereddüt etmem.", category: "F", key: "D" },
  { id: 34, text: "Bazen okurken önemli kelimeleri mırıldanarak veya fısıldayarak tekrar ederim.", category: "D", key: "D" },
  { id: 35, text: "Bazı öğretmenlerin beni antipatik bulduğunu hissediyorum.", category: "F", key: "Y" },
  { id: 36, text: "Doğru cevabı bilsem bile, çoğunlukla sınıfta sorulara cevap vermekten veya tekrarlara katılmaktan çekinirim.", category: "F", key: "Y" },
  { id: 37, text: "Çoğunlukla uykumu tam olarak alamıyorum ve sınıfta uyukladığımı hissediyorum.", category: "A", key: "Y" },
  { id: 38, text: "Yeni öğrendiğim kelimeleri uygun durumlarda kullanırım.", category: "B", key: "D" },
  { id: 39, text: "Zamana göre düzenlenmiş çalışma programım vardır.", category: "A", key: "D" },
  { id: 40, text: "Çalışırken kolayca hayallere dalabilirim.", category: "A", key: "Y" },
  { id: 41, text: "Bir yazılıda, yazmaya başlamadan önce o konuda fikir sahibi olmaya çalışmak bence zaman kaybıdır.", category: "G", key: "D" },
  { id: 42, text: "Yeni bir bölüme başlamadan önce o konuda fikir sahibi olmaya çalışmak bence zaman kaybıdır.", category: "B", key: "Y" },
  { id: 43, text: "Çalışma programıma sıkı sıkıya bağlı kalma düşüncesi bana sıkıntı verir, programda sık sık değişiklik yapmakta tereddüt etmem.", category: "A", key: "Y" },
  { id: 44, text: "Bazen televizyon seyrederken veya odada başkaları konuşurken ders çalıştığım olur.", category: "A", key: "Y" },
  { id: 45, text: "Kitaplarımda önemli veya zor bölümleri işaretlerim, böylece tekrarlarken bu noktalara özel dikkat harcamam mümkün olur.", category: "D", key: "D" },
  { id: 46, text: "Okurken dinlenme aralarımı bölüm sonlarında veririm ve kendi kendime o bölümün ana noktalarını tekrarlarım.", category: "D", key: "D" },
  { id: 47, text: "Öğrendiğim genel prensipleri ve kuralları ortaya koyan belirli örnekler düşünürüm.", category: "B", key: "D" },
  { id: 48, text: "Çalışmaya başlamakta güçlük çekerim.", category: "A", key: "Y" },
  { id: 49, text: "Bazen okula gittiğimde veya çalışmaya oturduğumda kitapları, kalemleri, notları veya diğer gerekli malzemeyi getirmediğimi fark ederim.", category: "A", key: "Y" },
  { id: 50, text: "Bir derste öğrendiklerimi, bir başka dersteki konuyu anlamak için kullanırım.", category: "B", key: "D" },
  { id: 51, text: "Bazen bir konuyu öğrendikten sonra gerekenden fazla tekrar yaparak, unutamayacağım şekilde hafızama yerleştiririm.", category: "B", key: "D" },
  { id: 52, text: "Bir ödevi nasıl yazmaya başlayacağımı gerçekten bilmiyorum.", category: "E", key: "Y" },
  { id: 53, text: "Ödevlerim daima içime bir sıkıntı verir.", category: "E", key: "Y" },
  { id: 54, text: "Bir sınava hazırlanırken, tam olarak kitaptaki kelimeleri hatırlamaya çalıştığım çok olur.", category: "G", key: "Y" },
  { id: 55, text: "Dersi doğrudan bir ışık altında değil, yansıyarak gelen bir ışık altında çalışırım.", category: "A", key: "Y" },
  { id: 56, text: "Bir konuyu ayrıntılı olarak çalışmaya başlamadan önce, genel bir fikir sahibi olabilmek için hızlı bir göz gezdiririm.", category: "D", key: "D" },
  { id: 57, text: "Öğretmenlerimin bana iyi duygular beslediğini hissediyorum.", category: "F", key: "D" },
  { id: 58, text: "Sınav başladığı zaman puan değerleri ve güçlük derecelerine bakmaksızın vakit kaybetmeden hemen yazmaya koyulurum.", category: "G", key: "Y" },
  { id: 59, text: "Birçok sınava, öğrendiklerimi sınav bitinceye kadar aklımda tutmak için çalışırım.", category: "G", key: "Y" },
  { id: 60, text: "Çabuk ancak bütünüyle anlayacak kadar hızlı okurum.", category: "D", key: "D" },
  { id: 61, text: "Not tutarken kendime ait özel işaretler ve kısaltmalar kullanırım.", category: "C", key: "D" },
  { id: 62, text: "Notlarımı derste tuttuğum gibi muhafaza eder bir karışıklık olmaması için onlara el sürmem.", category: "C", key: "Y" },
  { id: 63, text: "Bir ödeve başlamadan önce en az bir veya iki kaynağa bakar, güvendiğim kişilere danışırım.", category: "E", key: "D" },
  { id: 64, text: "Büyük çoğunlukla okul hayatını ilginç buluyorum.", category: "F", key: "D" },
  { id: 65, text: "Dersi dinlerken muhtemel sınav sorularına karşı dikkatli olurum ve bunları not alırım.", category: "G", key: "D" },
  { id: 66, text: "Sınava girmeden önce öğretmenin nelere önem verdiğiyle ilgilenmem ve sınav biçimiyle ilgili bilgi toplamak için vakit kaybetmem.", category: "G", key: "Y" },
  { id: 67, text: "Çalışma sürelerim oldukça kısadır ve bu yüzden zaman zaman dikkatimi toplamakta zorlanırım.", category: "A", key: "Y" },
  { id: 68, text: "Okula gitmek gerekmeseydi, pek çok şeyi daha kolay öğrenirdim.", category: "F", key: "Y" },
  { id: 69, text: "Okulda gençliğin en güzel günleri, hayatta kullanılıp kullanılmayacağı çok şüpheli birçok bilgiyi öğrenmek uğruna ziyan ediliyor.", category: "F", key: "Y" },
  { id: 70, text: "Ders çalışırken verdiğim dinlenme aralarından sonra tekrar derse dönmekte zorluk çekerim.", category: "A", key: "Y" },
  { id: 71, text: "Derse gelmeden önce işlenecek dersle ilgili okumayı zaman kaybı olarak görürüm.", category: "C", key: "Y" },
  { id: 72, text: "Öğretmenin anlattıkları kitapta varsa, onları anlamak için bol zamanım olacağı için fazla endişelenmem.", category: "C", key: "Y" },
  { id: 73, text: "Her kelimenin anlamına dikkat ederek çok yavaş okurum.", category: "D", key: "Y" },
];

export interface CalismaDavranisiCategory {
  name: string;
  questionIds: number[];
  maxScore: number;
  interpretations: {
    high: { range: [number, number]; text: string; tips: string[] };
    mid:  { range: [number, number]; text: string; tips: string[] };
    low:  { range: [number, number]; text: string; tips: string[] };
  };
}

export const CALISMA_DAVRANISI_CATEGORIES: Record<string, CalismaDavranisiCategory> = {
  A: {
    name: "Çalışmaya Başlamak ve Sürdürmek",
    questionIds: [13, 30, 40, 49, 15, 32, 43, 55, 17, 37, 44, 67, 18, 39, 48, 70],
    maxScore: 16,
    interpretations: {
      high: { range: [10, 16], text: "Ders çalışmaya başlamak ve zamanından etkin bir şekilde yararlanmak konusunda ciddi güçlüklerin olduğu görülüyor.", tips: ["Her gün aynı saatte ders çalışmaya başla.", "Pomodoro tekniğini dene: 25 dakika çalış, 5 dakika mola ver.", "Küçük hedefler koy.", "Dikkat dağıtıcıları uzaklaştır."] },
      mid:  { range: [5, 9], text: "Ders çalışmaya başlamak ve sürdürmek konusunda bazı güçlüklerin olduğu anlaşılıyor.", tips: ["Çalışma ve eğlence saatlerini önceden planla.", "Telefonu çalışma saatlerinde sessize al.", "Çalışma arkadaşı bul."] },
      low:  { range: [0, 4], text: "Ders çalışmaya başlamak ve sürdürmek konusunda önemli bir güçlüğün olmadığı anlaşılıyor. Tebrikler! 🎉", tips: [] },
    },
  },
  B: {
    name: "Bilinçli Çalışmak ve Öğrendiğini Kullanmak",
    questionIds: [12, 19, 47, 14, 38, 50, 16, 42, 51],
    maxScore: 9,
    interpretations: {
      high: { range: [5, 9], text: "Bilinçli çalışmak ve öğrendiğini kullanmak konusunda önemli eksiklerin olduğu görülüyor.", tips: ["Her dersten sonra 10 dakika kısa bir tekrar yap.", "Öğrendiğin bilgileri günlük hayattaki olaylarla ilişkilendir.", "Öğrendiğin konuları arkadaşlarına anlatmayı dene."] },
      mid:  { range: [3, 4], text: "Bilinçli çalışmak ve öğrendiğini kullanmak konusunda bazı eksiklerin olduğu görülüyor.", tips: ["Haftalık tekrar planı oluştur.", "Öğrendiğin konuları arkadaşlarına anlatmayı dene."] },
      low:  { range: [0, 2], text: "Bilinçli çalışan ve öğrendiğini kullanan bir öğrenci olduğun görülüyor. Tebrikler! 🎉", tips: [] },
    },
  },
  C: {
    name: "Not Tutmak ve Dersi Dinlemek",
    questionIds: [8, 22, 61, 72, 10, 24, 62, 20, 31, 71],
    maxScore: 10,
    interpretations: {
      high: { range: [6, 10], text: "Not tutmanın ve dersi dinlemenin başarı üzerindeki etkisini yeterince bilmediğin anlaşılıyor.", tips: ["Derste kendi cümlelerinle not al.", "Notlarını düzenli bir defterde tut.", "Ders sonunda notlarını 5 dakika gözden geçir."] },
      mid:  { range: [3, 5], text: "Not tutmak ve ders dinlemek konusunda bazı hataların olduğu anlaşılıyor.", tips: ["Cornell not tutma yöntemini araştır.", "Kendi kısaltma ve sembollerini geliştir."] },
      low:  { range: [0, 2], text: "Not tutmak ve dersi dinlemek konusunda başarılı olduğun anlaşılıyor. Harika! 🎉", tips: [] },
    },
  },
  D: {
    name: "Okuma Alışkanlıkları ve Teknikleri",
    questionIds: [4, 11, 34, 56, 5, 28, 45, 60, 7, 29, 46, 73],
    maxScore: 12,
    interpretations: {
      high: { range: [8, 12], text: "Okumaya çok fazla zaman ayırdığın, buna rağmen daha sonra oldukça az şey hatırlayabildiğin anlaşılıyor.", tips: ["Okumaya başlamadan önce başlıklara ve alt başlıklara göz gezdir.", "Önemli yerlerin altını çiz.", "Her bölümden sonra dur ve okuduğunu özetle."] },
      mid:  { range: [4, 7], text: "Okurken önemli olanla olmayanı ayırmakta zaman zaman güçlük çektiğin anlaşılıyor.", tips: ["SQ3R tekniğini dene.", "Şekil ve tabloları atlama."] },
      low:  { range: [0, 3], text: "Okuduğun metin içinde gerekli olanları ayırabildiğin anlaşılıyor. Süper! 🎉", tips: [] },
    },
  },
  E: {
    name: "Ödev Hazırlamak",
    questionIds: [3, 25, 52, 63, 23, 26, 53],
    maxScore: 7,
    interpretations: {
      high: { range: [5, 7], text: "Günlük veya dönem ödevi hazırlamanın, konunun özünü kavramak için ne kadar önemli olduğunun farkında olmadığın görülüyor.", tips: ["Ödevi küçük parçalara böl.", "Başlamadan önce kısa bir plan yap.", "Ödevini bitirdikten sonra bir gün bekle, sonra tekrar oku."] },
      mid:  { range: [3, 4], text: "Ödevlerini gereği gibi hazırlamak ve düzenlemekte zaman zaman güçlük çektiğin anlaşılıyor.", tips: ["Ödev takvimi oluştur.", "En az bir ek kaynak kullanmayı alışkanlık haline getir."] },
      low:  { range: [0, 2], text: "Ödevlerin eğitim hayatı içindeki önemini kavramış olduğun anlaşılıyor. Harika! 🎉", tips: [] },
    },
  },
  F: {
    name: "Okula Karşı Tutum",
    questionIds: [27, 35, 57, 68, 33, 36, 64, 69],
    maxScore: 8,
    interpretations: {
      high: { range: [5, 8], text: "Okula karşı tutumunun çalışmayı, öğrenmeyi ve başarılı olmayı güçleştirdiği görülüyor.", tips: ["Sevmediğin derslerde bile ilgini çekecek bir nokta bulmaya çalış.", "Öğretmenlerinle iletişimi kesmemeye çalış.", "Okuldaki sosyal etkinliklere katıl."] },
      mid:  { range: [3, 4], text: "Okula karşı bazı olumsuz duygu ve düşünceler içinde olduğun görülüyor.", tips: ["Okulda seni mutlu eden şeylerin bir listesini yap.", "Güvendiğin bir öğretmenle düşüncelerini paylaş."] },
      low:  { range: [0, 2], text: "Okula karşı olumlu bir tavır içinde olduğun görülüyor. Süper! 🎉", tips: [] },
    },
  },
  G: {
    name: "Sınavlara Hazırlanmak ve Sınava Girmek",
    questionIds: [1, 9, 54, 65, 2, 21, 58, 66, 6, 41, 59],
    maxScore: 11,
    interpretations: {
      high: { range: [8, 11], text: "Sınavlarda başarılı olmanın, sınav öncesinde başlayan ve sınavda da devam eden bir işlemler dizisi olduğunun farkında değilsin.", tips: ["Sınavdan en az 3 gün önce çalışmaya başla.", "Sınavda önce tüm soruları oku.", "Sınav öncesi öğretmenin nelere önem verdiğini öğren.", "Sınav sırasında sakin ol."] },
      mid:  { range: [4, 7], text: "Sınavlara hazırlanmak ve sınava girmek konusunda bazı eksiklerin olduğu görülüyor.", tips: ["Sınav stratejilerini gözden geçir.", "Geçmiş sınav sorularını çözerek pratik yap."] },
      low:  { range: [0, 3], text: "Sınavlara hazırlanmak ve sınava girmek konusundaki teknikleri iyi bildiğin görülüyor. Muhteşem! 🎉", tips: [] },
    },
  },
};

export function calculateCalismaDavranisi(
  answers: Record<string | number, string>
): CalismaDavranisiScores {
  const norm: Record<number, string> = {};
  for (const [k, v] of Object.entries(answers)) norm[Number(k)] = v;

  const qLookup: Record<number, CalismaDavranisiQuestion> = {};
  for (const q of CALISMA_DAVRANISI_QUESTIONS) qLookup[q.id] = q;

  const categoryScores: Record<string, number> = {};
  const categoryPositive: Record<string, number> = {};

  for (const [catKey, catInfo] of Object.entries(CALISMA_DAVRANISI_CATEGORIES)) {
    let wrong = 0;
    for (const qid of catInfo.questionIds) {
      const question = qLookup[qid];
      if (!question) continue;
      const ans = norm[qid];
      if (ans != null && ans !== question.key) wrong += 1;
    }
    categoryScores[catKey] = wrong;
    categoryPositive[catKey] = catInfo.maxScore - wrong;
  }

  const totalWrong = Object.values(categoryScores).reduce((a, b) => a + b, 0);
  const maxTotal = Object.values(CALISMA_DAVRANISI_CATEGORIES).reduce((a, c) => a + c.maxScore, 0);
  const totalPositive = maxTotal - totalWrong;
  const positivePct = maxTotal > 0 ? Math.round((totalPositive / maxTotal) * 1000) / 10 : 0;

  let level: string, levelEmoji: string;
  if (positivePct >= 80) { level = 'Çok İyi'; levelEmoji = '🟢'; }
  else if (positivePct >= 65) { level = 'İyi'; levelEmoji = '🔵'; }
  else if (positivePct >= 45) { level = 'Orta'; levelEmoji = '🟡'; }
  else if (positivePct >= 25) { level = 'Gelişime Açık'; levelEmoji = '🟠'; }
  else { level = 'Acil Destek'; levelEmoji = '🔴'; }

  const categoriesNamed: Record<string, number> = {};
  for (const [k, v] of Object.entries(categoryPositive)) {
    categoriesNamed[CALISMA_DAVRANISI_CATEGORIES[k].name] = v;
  }

  const combinations = detectCalismaCombinations(categoryPositive, CALISMA_DAVRANISI_CATEGORIES);

  return { categories: categoryScores, categoriesPositive: categoryPositive, categoriesNamed, total: totalWrong, totalPositive, maxTotal, positivePct, level, levelEmoji, combinations };
}

function detectCalismaCombinations(
  positive: Record<string, number>,
  categories: Record<string, CalismaDavranisiCategory>
): CalismaCombination[] {
  const combos: CalismaCombination[] = [];
  const pct = (catKey: string) => {
    const mx = categories[catKey]?.maxScore ?? 1;
    return Math.round((positive[catKey] ?? 0) / mx * 100);
  };

  if (pct('F') >= 60 && pct('A') < 40) {
    combos.push({ type: 'istekli_plansiz', title: '🔥 İstekli ama Plansız', detail: 'Okula karşı olumlu tutumun var ama çalışmaya başlama ve sürdürme konusunda zorluk yaşıyorsun.', tip: 'Her gün aynı saatte 25 dakikalık çalışma blokları planla.' });
  }
  if (pct('A') >= 60 && pct('C') < 40) {
    combos.push({ type: 'disiplinli_verimsiz', title: '⏰ Disiplinli ama Verimsiz', detail: 'Çalışmaya başlayıp sürdürebiliyorsun ama not tutma tekniklerin zayıf.', tip: 'Not tutma tekniklerini öğren: Cornell yöntemi, mind map.' });
  }
  if (pct('D') >= 60 && pct('G') < 40) {
    combos.push({ type: 'bilen_gosteremeyen', title: '📚 Bilgili ama Sınavda Zorlanıyor', detail: 'Okuma ve anlama becerilerin güçlü ama sınav stratejilerin zayıf.', tip: 'Sınav stratejileri: Önce tüm soruları oku, kolaylardan başla.' });
  }
  if (pct('F') < 35 && pct('A') < 35) {
    combos.push({ type: 'motivasyon_krizi', title: '⚠️ Genel Motivasyon Sorunu', detail: 'Hem okula karşı tutumun hem de çalışma alışkanlıkların düşük.', tip: 'Bir rehber öğretmen veya danışmanla konuş.' });
  }
  if (pct('E') >= 60 && pct('F') >= 60) {
    combos.push({ type: 'guclu_temel', title: '🌟 Güçlü Temel!', detail: 'Hem ödev yapma alışkanlığın hem de okula karşı tutumun çok iyi.', tip: 'Bu gücünü koruyarak diğer alanları da geliştirmeye odaklan.' });
  }
  const allHigh = ['A','B','C','D','E','F','G'].every(k => pct(k) >= 65);
  if (allHigh) {
    combos.push({ type: 'mukemmel', title: '🏆 Mükemmel Çalışma Profili!', detail: 'Tüm çalışma davranışı alanlarında güçlüsün. Tebrikler!', tip: 'Bu alışkanlıkları sürdür ve arkadaşlarına da ilham ver.' });
  }
  return combos;
}

export function generateCalismaDavranisiReport(scores: CalismaDavranisiScores): string {
  const { categories: categoryScores, categoriesPositive: positive, maxTotal, totalPositive, positivePct, level, levelEmoji, combinations } = scores;

  const bar = (pct: number) => {
    const n = Math.round(pct / 10);
    return '█'.repeat(n) + '░'.repeat(10 - n);
  };

  const levelMessages: Record<string, string> = {
    'Çok İyi': 'Çalışma alışkanlıkların mükemmel düzeyde! Sen bir rol model olabilirsin. 🌟',
    'İyi': 'Çalışma alışkanlıkların genel olarak iyi. Küçük iyileştirmelerle mükemmele ulaşabilirsin!',
    'Orta': 'Bazı alanlarda güçlüsün, bazılarında gelişime açıksın.',
    'Gelişime Açık': 'Çalışma davranışlarında önemli gelişim alanları var.',
    'Acil Destek': 'Çalışma alışkanlıklarında acil destek ihtiyacı var.',
  };

  let report = `# 📊 ÇALIŞMA DAVRANIŞI DEĞERLENDİRME RAPORU\n\n**Genel Durum:** ${levelEmoji} **${level}** — Doğru Davranış Puanı: ${totalPositive}/${maxTotal} (%${positivePct})\n\n${levelMessages[level] ?? ''}\n\n---\n\n`;
  report += `## 📋 Kategori Özet Tablosu\n\n| Kategori | Puan | Seviye | Grafik |\n|----------|------|--------|--------|\n`;

  for (const catKey of ['A','B','C','D','E','F','G']) {
    const cat = CALISMA_DAVRANISI_CATEGORIES[catKey];
    if (!cat) continue;
    const pos = positive[catKey] ?? 0;
    const pct = cat.maxScore > 0 ? Math.round((pos / cat.maxScore) * 1000) / 10 : 0;
    const sev = pct >= 65 ? '🟢' : pct >= 40 ? '🟡' : '🔴';
    report += `| ${catKey}. ${cat.name} | ${pos}/${cat.maxScore} | ${sev} %${pct} | ${bar(pct)} |\n`;
  }
  report += `\n---\n\n`;

  report += `## 📝 Detaylı Kategori Analizi\n\n`;
  for (const catKey of ['A','B','C','D','E','F','G']) {
    const cat = CALISMA_DAVRANISI_CATEGORIES[catKey];
    if (!cat) continue;
    const score = categoryScores[catKey] ?? 0;
    const pos = positive[catKey] ?? 0;
    const pct = cat.maxScore > 0 ? Math.round((pos / cat.maxScore) * 1000) / 10 : 0;
    report += `### ${catKey}. ${cat.name}\n**Doğru Davranış Puanın:** ${pos}/${cat.maxScore} (%${pct})\n\n`;

    for (const [, ld] of Object.entries(cat.interpretations)) {
      const [lo, hi] = ld.range;
      if (score >= lo && score <= hi) {
        report += `${ld.text}\n\n`;
        if (ld.tips.length > 0) {
          report += `**Sana Özel İpuçları:**\n${ld.tips.map(t => `- 💡 ${t}`).join('\n')}\n\n`;
        }
        break;
      }
    }
    report += `---\n\n`;
  }

  if (combinations.length > 0) {
    report += `## 🔗 Profil Analizi\n\n`;
    for (const combo of combinations) {
      report += `### ${combo.title}\n${combo.detail}\n\n**💡 Öneri:** ${combo.tip}\n\n`;
    }
    report += `---\n\n`;
  }

  report += `## 💬 Son Söz\nUnutma, çalışma davranışları doğuştan gelen değil, **öğrenilebilen** becerilerdir! Sen bunu yapabilirsin! 🚀`;
  return report;
}
