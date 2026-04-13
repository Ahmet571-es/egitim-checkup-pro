// ============================================================
// Çoklu Zekâ — Veri (Gardner)
// ============================================================
import type { CokluZekaScores, ZekaScore } from '../types';

export const ZEKA_SIRA = ['sozel', 'mantiksal', 'gorsel', 'muziksel', 'dogaci', 'sosyal', 'bedensel', 'icsel'] as const;
export type ZekaKey = typeof ZEKA_SIRA[number];

export interface ZekaInfo {
  name: string; icon: string; description: string;
  strengths: string[]; studyTips: string[]; careers: string[];
}

export const COKLU_ZEKA_DATA: Record<ZekaKey, ZekaInfo> = {
  sozel:     { name: "Sözel-Dilsel Zekâ", icon: "📝", description: "Kelimelerle düşünme, dili etkili kullanma ve iletişim kurma yeteneğin çok güçlü!", strengths: ["Güçlü okuma ve yazma becerileri", "Zengin kelime hazinesi", "İyi bir hikaye anlatıcısı", "Dillere yatkınlık", "İkna edici konuşma"], studyTips: ["Konuları kendi kelimelerinle özetleyerek çalış.", "Sesli okuma ve anlatma yöntemini kullan.", "Günlük veya blog yazarak öğrendiklerini pekiştir.", "Kelime oyunları ve bulmacalar çöz."], careers: ["Yazar", "Gazeteci", "Avukat", "Öğretmen", "Çevirmen", "Editör", "Diplomat"] },
  mantiksal: { name: "Mantıksal-Matematiksel Zekâ", icon: "🔢", description: "Sayılarla, mantıkla ve sistemli düşünmeyle arası çok iyi olan bir zihne sahipsin!", strengths: ["Güçlü analitik düşünme", "Problem çözme becerisi", "Sayısal yetenekler", "Sebep-sonuç ilişkisi kurma", "Bilimsel merak"], studyTips: ["Konuları mantıksal sıraya koyarak çalış.", "Formüller, grafikler ve tablolar oluştur.", "Neden-sonuç ilişkilerini sorgulayarak öğren.", "Matematik ve bilim problemleri çözerek pratik yap."], careers: ["Mühendis", "Bilim İnsanı", "Programcı", "Doktor", "Ekonomist", "Muhasebeci", "Matematikçi"] },
  gorsel:    { name: "Görsel-Uzamsal Zekâ", icon: "🎨", description: "Dünyayı görsellerle, renklerle ve şekillerle algılayan çok güçlü bir hayal gücün var!", strengths: ["Güçlü görsel hafıza", "Zengin hayal gücü", "Renk ve tasarım duyarlılığı", "Mekânsal algılama", "Resim ve çizim yeteneği"], studyTips: ["Zihin haritaları (mind map) çizerek çalış.", "Renkli kalemler ve görsel notlar kullan.", "Konuları şema ve diyagramlarla öğren.", "Video ve görsel materyallerden yararlan."], careers: ["Mimar", "Grafik Tasarımcı", "Fotoğrafçı", "Ressam", "İç Mimar", "Pilot", "Cerrah"] },
  muziksel:  { name: "Müziksel-Ritmik Zekâ", icon: "🎵", description: "Müziğe, ritimlere ve seslere karşı özel bir duyarlılığın var!", strengths: ["Ritim ve melodi duyarlılığı", "Müzikal hafıza", "Ses tonu ayrımı", "Müzik aletlerine yatkınlık", "Ritmik hareket becerisi"], studyTips: ["Ders çalışırken fon müziği dinle (sözsüz).", "Öğrendiğin bilgileri şarkı veya kafiye haline getir.", "Ritmik tekrarlarla ezberle.", "Sesli çalışma yöntemini kullan."], careers: ["Müzisyen", "Besteci", "Ses Mühendisi", "DJ", "Müzik Öğretmeni", "Şarkıcı"] },
  dogaci:    { name: "Doğacı Zekâ", icon: "🌿", description: "Doğaya, hayvanlara ve çevreye karşı derin bir ilgi ve duyarlılığın var!", strengths: ["Doğa sevgisi ve çevre bilinci", "Canlıları gözlemleme yeteneği", "Sınıflandırma becerisi", "Çevre duyarlılığı", "Mevsim ve iklim farkındalığı"], studyTips: ["Mümkünse açık havada ders çalış.", "Doğa gözlemleri yaparak konuları somutlaştır.", "Sınıflandırma ve gruplama yöntemlerini kullan.", "Belgeseller izleyerek öğren."], careers: ["Biyolog", "Veteriner", "Çevre Mühendisi", "Botanikçi", "Zoolog", "Ormancı", "Ekolog"] },
  sosyal:    { name: "Sosyal (Kişilerarası) Zekâ", icon: "🤝", description: "İnsanlarla iletişim kurma, liderlik etme ve empati yapma konusunda çok yeteneklisin!", strengths: ["Güçlü empati yeteneği", "Liderlik becerisi", "İletişim gücü", "İşbirliği yapabilme", "İnsanları anlama ve yönlendirme"], studyTips: ["Grup çalışmaları ve tartışmalarla öğren.", "Öğrendiğin konuları arkadaşlarına anlat.", "Rol yapma ve canlandırma yöntemlerini dene.", "Çalışma grupları oluştur."], careers: ["Psikolog", "Öğretmen", "İnsan Kaynakları Uzmanı", "Sosyal Hizmet Uzmanı", "Politikacı", "Satış Uzmanı"] },
  bedensel:  { name: "Bedensel-Kinestetik Zekâ", icon: "⚽", description: "Bedenini çok iyi kullanıyorsun — hareket, spor ve el becerileri senin süper gücün!", strengths: ["Güçlü beden koordinasyonu", "Sportif yetenek", "El becerileri", "Yaparak öğrenme", "Fiziksel ifade gücü"], studyTips: ["Yaparak ve deneyerek öğren — laboratuvar, atölye çalışmaları.", "Ders çalışırken yürüyerek veya hareket ederek tekrar yap.", "Not alırken, çizerek ve yazarak çalış.", "Kısa aralarla aktif molalar ver."], careers: ["Sporcu", "Cerrah", "Dansçı", "Fizyoterapist", "Teknisyen", "Heykeltıraş", "Aşçı"] },
  icsel:     { name: "İçsel (Özedönük) Zekâ", icon: "🧘", description: "Kendini çok iyi tanıyorsun — güçlü ve zayıf yönlerinin farkındasın, bu çok değerli!", strengths: ["Öz farkındalık", "Bağımsız çalışma becerisi", "Kendine güven", "Duygusal olgunluk", "Hedef belirleme ve motivasyon"], studyTips: ["Bireysel çalışma sana daha uygun — sessiz ortamlar tercih et.", "Kendi kendine hedefler koy ve takip et.", "Günlük tut, öğrenme sürecini değerlendir.", "Meditasyon ve düşünce egzersizleri yap."], careers: ["Psikolog", "Filozof", "Yazar", "Araştırmacı", "Girişimci", "Danışman", "Sanatçı"] },
};

export interface CokluZekaQuestion {
  id: number;
  text: string;
}

export const COKLU_ZEKA_QUESTIONS_LISE: Record<ZekaKey, CokluZekaQuestion[]> = {
  sozel:     [{ id: 1, text: "Resimlerden çok yazılar dikkatimi çeker." }, { id: 2, text: "İsimler, yerler, tarihler konusunda belleğim iyidir." }, { id: 3, text: "Kitap okumayı severim." }, { id: 4, text: "Kelimeleri doğru şekilde telaffuz ederim." }, { id: 5, text: "Bilmecelerden, kelime oyunlarından hoşlanırım." }, { id: 6, text: "Dinleyerek daha iyi öğrenirim." }, { id: 7, text: "Yaşıma göre kelime hazinem iyidir." }, { id: 8, text: "Yazı yazmaktan hoşlanırım." }, { id: 9, text: "Öğrendiğim yeni kelimeleri kullanmayı severim." }, { id: 10, text: "Sözel tartışmalarda başarılıyımdır." }],
  mantiksal: [{ id: 11, text: "Makinelerin nasıl çalıştığına dair sorular sorarım." }, { id: 12, text: "Aritmetik problemleri kafadan hesaplarım." }, { id: 13, text: "Matematik ve fen derslerinden hoşlanırım." }, { id: 14, text: "Satranç ve benzeri strateji oyunları severim." }, { id: 15, text: "Mantık bulmacalarını, beyin jimnastiğini severim." }, { id: 16, text: "Bilgisayarda oyunlardan çok hoşlanırım." }, { id: 17, text: "Deneylerden, yeni denemeler yapmaktan hoşlanırım." }, { id: 18, text: "Arkadaşlarıma oranla daha soyut düşünebilirim." }, { id: 19, text: "Matematik oyunlarından hoşlanırım." }, { id: 20, text: "Sebep-sonuç ilişkilerini kurmaktan zevk alırım." }],
  gorsel:    [{ id: 21, text: "Renklere karşı çok duyarlıyımdır." }, { id: 22, text: "Harita, tablo türü materyalleri daha kolay algılarım." }, { id: 23, text: "Arkadaşlarıma oranla daha fazla hayal kurarım." }, { id: 24, text: "Resim yapmayı ve boyamayı çok severim." }, { id: 25, text: "Yap-boz, Lego gibi oyunlardan hoşlanırım." }, { id: 26, text: "Daha önce gittiğim yerleri kolayca hatırlarım." }, { id: 27, text: "Bulmaca çözmekten hoşlanırım." }, { id: 28, text: "Rüyalarımı çok net ve ayrıntılarıyla hatırlarım." }, { id: 29, text: "Resimli kitapları daha çok severim." }, { id: 30, text: "Kitaplarıma, defterlerime, diğer materyallere çizerim." }],
  muziksel:  [{ id: 31, text: "Şarkıların melodilerini rahatlıkla hatırlarım." }, { id: 32, text: "Güzel şarkı söylerim." }, { id: 33, text: "Müzik aleti çalar ya da çalmayı çok isterim." }, { id: 34, text: "Müzik dersini çok severim." }, { id: 35, text: "Ritmik konuşur ya da hareket ederim." }, { id: 36, text: "Farkında olmadan mırıldanırım." }, { id: 37, text: "Çalışırken elimle ya da ayağımla ritim tutarım." }, { id: 38, text: "Çevredeki sesler çok dikkatimi çeker." }, { id: 39, text: "Çalışırken müzik dinlemek çok hoşuma gider." }, { id: 40, text: "Öğrendiğim şarkıları paylaşmayı severim." }],
  dogaci:    [{ id: 41, text: "Hayvanlara karşı çok meraklıyımdır." }, { id: 42, text: "Doğaya karşı duyarsız olanlara kızarım." }, { id: 43, text: "Evde hayvan besler ya da beslemeyi çok severim." }, { id: 44, text: "Bahçede toprakla, bitkilerle oynamayı çok severim." }, { id: 45, text: "Bitki beslemeyi severim." }, { id: 46, text: "Çevre kirliliğine karşı çok duyarlıyımdır." }, { id: 47, text: "Bitki ya da hayvanlarla ilgili belgesellere ilgi duyarım." }, { id: 48, text: "Mevsimlerle ve iklim olaylarıyla çok ilgiliyimdir." }, { id: 49, text: "Değişik meyve ve sebzelere karşı ilgiliyimdir." }, { id: 50, text: "Doğa olaylarıyla çok ilgiliyimdir." }],
  sosyal:    [{ id: 51, text: "Arkadaşlarımla oyun oynamaktan hoşlanırım." }, { id: 52, text: "Çevremde bir lider olarak görülürüm." }, { id: 53, text: "Problemi olan arkadaşlarıma öğütler veririm." }, { id: 54, text: "Arkadaşlarım fikirlerime değer verir." }, { id: 55, text: "Organizasyonların vazgeçilmez elemanıyımdır." }, { id: 56, text: "Arkadaşlarıma bir şeyler anlatmaktan çok hoşlanırım." }, { id: 57, text: "Arkadaşlarımı sık sık ararım." }, { id: 58, text: "Arkadaşlarımın sorunlarına yardımcı olmaktan hoşlanırım." }, { id: 59, text: "Çevremdekiler benimle arkadaşlık kurmak ister." }, { id: 60, text: "İnsanlara selam verir, hatır sorarım." }],
  bedensel:  [{ id: 61, text: "Koşmayı, atlamayı ve güreşmeyi çok severim." }, { id: 62, text: "Oturduğum yerde duramam, kımıldanırım." }, { id: 63, text: "Düşüncelerimi mimik-davranışlarla rahat ifade ederim." }, { id: 64, text: "Bir şeyi okumak yerine yaparak öğrenmeyi severim." }, { id: 65, text: "Merak ettiğim şeyleri elime alarak incelemek isterim." }, { id: 66, text: "Boş vakitlerimi dışarıda geçirmek isterim." }, { id: 67, text: "Arkadaşlarımla fiziksel oyunlar oynamayı severim." }, { id: 68, text: "El becerilerim gelişmiştir." }, { id: 69, text: "Sorunlarımı anlatırken vücut hareketlerini kullanırım." }, { id: 70, text: "İnsanlara ve eşyalara dokunmaktan hoşlanırım." }],
  icsel:     [{ id: 71, text: "Bağımsız olmayı severim." }, { id: 72, text: "Güçlü ve zayıf yanlarımı bilirim." }, { id: 73, text: "Yalnız çalışmayı daha çok severim." }, { id: 74, text: "Yalnız oynamayı severim." }, { id: 75, text: "Yaptığım işleri arkadaşlarımla paylaşmayı severim." }, { id: 76, text: "Yaptığım işlerin bilincindeyimdir." }, { id: 77, text: "Pek kimseye akıl danışmam." }, { id: 78, text: "Kendime saygım yüksektir." }, { id: 79, text: "Yoğun olarak uğraştığım bir ilgi alanım, hobim vardır." }, { id: 80, text: "Yardım istemeden kendi başıma ürünleri ortaya koyarım." }],
};

export const COKLU_ZEKA_QUESTIONS_ILKOGRETIM: Record<ZekaKey, CokluZekaQuestion[]> = {
  sozel:     [{ id: 1, text: "Kitaplara değer veririm." }, { id: 10, text: "Televizyon ya da film seyretmektense radyo dinlemeyi tercih ederim." }, { id: 14, text: "Kelime türetme ya da sözcük bulmacalarından hoşlanırım." }, { id: 16, text: "Tekerlemeler, komik şiirler ya da kelime oyunları ile kendimi ve başkalarını eğlendirmekten hoşlanırım." }, { id: 26, text: "Türkçe ve sosyal bilgiler dersleri matematik ve fen bilgisinden daha kolaydır." }],
  gorsel:    [{ id: 3, text: "Kavramları okumadan ya da yazmadan önce gözümde canlandırabilirim." }, { id: 5, text: "Resim yaparken çeşitli renkleri uyum içinde kullanırım." }, { id: 15, text: "Yap-boz, labirentler ve diğer görsel bulmacaları çözmekten hoşlanırım." }, { id: 21, text: "Hiç bilmediğim yerde bile yolumu bulabilirim." }, { id: 34, text: "Bir şeye yukarıdan kuşbakışı bakıldığında nasıl görünebileceğini rahatça gözümde canlandırabilirim." }],
  muziksel:  [{ id: 7, text: "Bir şarkının yanlış söylendiğini hemen anlarım." }, { id: 19, text: "Müziksiz bir hayat benim için çok sıkıcıdır." }, { id: 23, text: "Yolda yürürken şarkılar mırıldanırım." }, { id: 35, text: "Bir, iki kez duyduğum şarkıyı doğru bir şekilde söyleyebilirim." }, { id: 39, text: "Ders çalışırken, iş yaparken ya da yeni bir şey öğrenirken sıkça şarkılar söyler ya da ayağımla yere vurarak tempo tutarım." }],
  icsel:     [{ id: 20, text: "Ulaşmak istediğim önemli hedeflerim var." }, { id: 25, text: "Yaptığım hatalardan ders alırım." }, { id: 30, text: "Arkadaşlarımla birlikte olmak yerine yalnız kalmayı isterim." }, { id: 33, text: "Kendimi güçlü ve bağımsız hissediyorum." }, { id: 36, text: "Günlük tutarım." }],
  mantiksal: [{ id: 2, text: "Kâğıt, kalem kullanmadan hesap yapabilirim." }, { id: 4, text: "Matematik çok sevdiğim derslerden biridir." }, { id: 11, text: "Zekâ bulmacalarını çözmekten hoşlanırım." }, { id: 17, text: "İşlerimi belli bir sıraya göre yaparım." }, { id: 37, text: "Bir şeyi, ölçüldüğü, gruplandırıldığı ya da miktarı hesaplandığında daha iyi anlarım." }],
  bedensel:  [{ id: 6, text: "Uzun süre hareketsiz kalmaya dayanamam." }, { id: 12, text: "Dikiş, dokumacılık, oymacılık, doğramacılık ya da model yapmak gibi el becerisi gerektiren işlerle uğraşmayı severim." }, { id: 22, text: "Konuşurken çeşitli hareketler yaparım." }, { id: 28, text: "Yeni gördüğüm her şeye dokunmak isterim." }, { id: 38, text: "Öğrenmek için okumak ya da izlemek yerine o konuda uygulama yapmayı isterim." }],
  sosyal:    [{ id: 8, text: "Tek başıma koşmak ve yüzmek yerine arkadaşlarımla basketbol, voleybol gibi sporları yapmayı tercih ederim." }, { id: 13, text: "Sorunlarımı kendi başıma çözmek yerine başka birinden yardım isterim." }, { id: 24, text: "Bildiğim bir konuyu başkalarına öğretme konusunda herkese meydan okurum." }, { id: 29, text: "Kendimi bir lider olarak görüyorum (ya da arkadaşlarım öyle olduğumu söylüyorlar)." }, { id: 31, text: "Kalabalık içinde kendimi rahat hissederim." }],
  dogaci:    [{ id: 9, text: "Kırlarda ve ormanda olmaktan hoşlanırım." }, { id: 18, text: "Bazı insanların doğa konusundaki duyarsızlıkları beni çok üzer." }, { id: 27, text: "Etrafımda hayvanların olmasından çok hoşlanırım." }, { id: 32, text: "Çeşitli ağaç, kuş, bitki ve hayvan türleri arasındaki temel farklılıkları çok iyi bilirim." }, { id: 40, text: "Canlılar ve bitkilerle ilgili kitapları okumak, belgeselleri izlemekten çok hoşlanırım." }],
};

function detectZekaProfile(sortedScores: [ZekaKey, ZekaScore][]): { type: string; name: string; description: string } {
  if (sortedScores.length === 0) return { type: 'belirsiz', name: 'Belirsiz', description: '' };
  const topPct = sortedScores[0][1].pct;
  const secondPct = sortedScores.length > 1 ? sortedScores[1][1].pct : 0;
  const pcts = sortedScores.map(s => s[1].pct);
  const spread = Math.max(...pcts) - Math.min(...pcts);

  if (spread <= 15) {
    return { type: 'dengeli', name: '🌈 Dengeli Profil', description: 'Tüm zekâ alanlarında birbirine yakın puanlar aldın. Çok yönlü bir yapın var!' };
  } else if (topPct - secondPct >= 15) {
    const topName = COKLU_ZEKA_DATA[sortedScores[0][0]].name;
    return { type: 'tek_baskin', name: `🎯 Tek Baskın: ${topName}`, description: `'${topName}' alanın diğerlerinden belirgin şekilde öne çıkıyor!` };
  } else if (sortedScores.length > 2 && topPct - sortedScores[2][1].pct <= 10) {
    const names = sortedScores.slice(0, 3).map(s => COKLU_ZEKA_DATA[s[0]].name);
    return { type: 'coklu_baskin', name: '⚡ Çoklu Baskın', description: `Birden fazla zekâ alanında (${names.join(', ')}) güçlüsün!` };
  } else {
    return { type: 'cift_baskin', name: '🔗 Çift Baskın', description: `İki zekâ alanın öne çıkıyor: ${COKLU_ZEKA_DATA[sortedScores[0][0]].name} ve ${COKLU_ZEKA_DATA[sortedScores[1][0]].name}.` };
  }
}

const SYNERGY_MAP: [Set<ZekaKey>, { name: string; detail: string }][] = [
  [new Set(['mantiksal', 'gorsel'] as ZekaKey[]), { name: '🏗️ Mühendislik Profili', detail: 'Mantıksal + görsel = mühendislik, mimarlık, bilgisayar bilimi.' }],
  [new Set(['sozel', 'sosyal'] as ZekaKey[]), { name: '🎤 İletişim Profili', detail: 'Dil + sosyal = hukuk, eğitim, gazetecilik.' }],
  [new Set(['muziksel', 'bedensel'] as ZekaKey[]), { name: '🎭 Performans Profili', detail: 'Müzik + beden = dans, tiyatro, spor.' }],
  [new Set(['icsel', 'sozel'] as ZekaKey[]), { name: '✍️ Yaratıcı Yazar Profili', detail: 'İçsel + dil = yazarlık, psikoloji, felsefe.' }],
  [new Set(['dogaci', 'bedensel'] as ZekaKey[]), { name: '🌿 Saha Bilimci Profili', detail: 'Doğa + fiziksel = biyoloji, veterinerlik, tarım.' }],
  [new Set(['mantiksal', 'sozel'] as ZekaKey[]), { name: '⚖️ Akademik-Analitik Profil', detail: 'Mantık + dil = araştırma, hukuk, ekonomi.' }],
  [new Set(['gorsel', 'bedensel'] as ZekaKey[]), { name: '🎨 Tasarım Profili', detail: 'Görsel + el becerisi = tasarım, heykel, moda.' }],
  [new Set(['sosyal', 'icsel'] as ZekaKey[]), { name: '🧑‍⚕️ İnsan Bilimci Profili', detail: 'Sosyal + iç görü = psikoloji, danışmanlık, koçluk.' }],
];

function detectZekaSynergies(top3: [ZekaKey, ZekaScore][]): { name: string; detail: string }[] {
  const topKeys = new Set(top3.map(t => t[0]));
  const synergies: { name: string; detail: string }[] = [];
  for (const [pairSet, info] of SYNERGY_MAP) {
    if ([...pairSet].every(k => topKeys.has(k))) {
      synergies.push(info);
    }
  }
  return synergies;
}

export function calculateCokluZekaLise(answers: Record<string | number, number>): CokluZekaScores {
  const norm: Record<number, number> = {};
  for (const [k, v] of Object.entries(answers)) norm[Number(k)] = Number(v);

  const scores: Record<string, ZekaScore> = {};
  for (const zekaKey of ZEKA_SIRA) {
    const questions = COKLU_ZEKA_QUESTIONS_LISE[zekaKey];
    const total = questions.reduce((s, q) => s + (norm[q.id] ?? 0), 0);
    const maxPossible = questions.length * 4;
    scores[zekaKey] = { raw: total, max: maxPossible, pct: Math.round((total / maxPossible) * 1000) / 10 };
  }

  const sortedScores = Object.entries(scores).sort((a, b) => b[1].pct - a[1].pct) as [ZekaKey, ZekaScore][];
  const scoresNamed: Record<string, number> = {};
  for (const [k, v] of Object.entries(scores)) scoresNamed[COKLU_ZEKA_DATA[k as ZekaKey].name] = v.pct;

  const profile = detectZekaProfile(sortedScores);
  const synergies = detectZekaSynergies(sortedScores.slice(0, 3));

  return { version: 'lise', scores, scoresNamed, top3: sortedScores.slice(0, 3), bottom2: sortedScores.slice(-2), profile, synergies };
}

export function calculateCokluZekaIlkogretim(answers: Record<string | number, string>): CokluZekaScores {
  const norm: Record<number, string> = {};
  for (const [k, v] of Object.entries(answers)) norm[Number(k)] = v;

  const scores: Record<string, ZekaScore> = {};
  for (const zekaKey of ZEKA_SIRA) {
    const questions = COKLU_ZEKA_QUESTIONS_ILKOGRETIM[zekaKey];
    const total = questions.reduce((s, q) => s + (norm[q.id] === 'E' ? 8 : 0), 0);
    const maxPossible = questions.length * 8;
    scores[zekaKey] = { raw: total, max: maxPossible, pct: Math.round((total / maxPossible) * 1000) / 10 };
  }

  const sortedScores = Object.entries(scores).sort((a, b) => b[1].pct - a[1].pct) as [ZekaKey, ZekaScore][];
  const scoresNamed: Record<string, number> = {};
  for (const [k, v] of Object.entries(scores)) scoresNamed[COKLU_ZEKA_DATA[k as ZekaKey].name] = v.pct;

  const profile = detectZekaProfile(sortedScores);
  const synergies = detectZekaSynergies(sortedScores.slice(0, 3));

  return { version: 'ilkogretim', scores, scoresNamed, top3: sortedScores.slice(0, 3), bottom2: sortedScores.slice(-2), profile, synergies };
}

export function generateCokluZekaReport(result: CokluZekaScores): string {
  const { scores, top3, bottom2, profile, synergies } = result;
  const ver = result.version === 'lise' ? 'Lise/Yetişkin' : 'İlköğretim';

  const bar = (pct: number) => {
    const n = Math.round(pct / 10);
    return '█'.repeat(n) + '░'.repeat(10 - n);
  };

  let report = `# 🧠 ÇOKLU ZEKÂ DEĞERLENDİRME RAPORU\n**Versiyon:** ${ver}\n\n---\n\n`;
  if (profile) {
    report += `## 🎯 Zekâ Profil Tipin: ${profile.name}\n\n${profile.description}\n\n---\n\n`;
  }

  report += `## 📊 Zekâ Profil Tablon\n\n| Zekâ Türü | Puan | Yüzde | Grafik |\n|---|---|---|---|\n`;
  for (const [zekaKey, sd] of Object.entries(scores).sort((a, b) => b[1].pct - a[1].pct)) {
    const d = COKLU_ZEKA_DATA[zekaKey as ZekaKey];
    report += `| ${d.icon} ${d.name} | ${sd.raw}/${sd.max} | %${sd.pct} | ${bar(sd.pct)} |\n`;
  }

  report += `\n---\n\n## 🏆 En Güçlü 3 Zekâ Alanın\n\n`;
  const medals = ['🥇', '🥈', '🥉'];
  for (let rank = 0; rank < top3.length; rank++) {
    const [zk, sd] = top3[rank];
    const d = COKLU_ZEKA_DATA[zk as ZekaKey];
    report += `### ${medals[rank]} ${rank + 1}. ${d.icon} ${d.name} (%${sd.pct})\n\n${d.description}\n\n`;
    report += `**Güçlü Yönlerin:**\n${d.strengths.map(s => `- ✅ ${s}`).join('\n')}\n\n`;
    report += `**Ders Çalışma İpuçları:**\n${d.studyTips.map(t => `- 💡 ${t}`).join('\n')}\n\n`;
    report += `**Sana Uygun Kariyer Alanları:** ${d.careers.join(', ')}\n\n---\n\n`;
  }

  if (synergies.length > 0) {
    report += `## 🔗 Zekâ Sinerjilerin\n\n`;
    for (const syn of synergies) {
      report += `### ${syn.name}\n${syn.detail}\n\n`;
    }
    report += `---\n\n`;
  }

  report += `## 🌱 Gelişime Açık Alanların\n\n`;
  for (const [zk, sd] of bottom2) {
    const d = COKLU_ZEKA_DATA[zk as ZekaKey];
    report += `### ${d.icon} ${d.name} (%${sd.pct})\n\nBu alanda henüz keşfetmediğin yeteneklerin olabilir.\n\n${d.studyTips.map(t => `- 🌱 ${t}`).join('\n')}\n\n`;
  }

  report += `---\n\n## 💬 Son Söz\nUnutma, herkesin farklı zekâ alanlarında güçlü ve gelişime açık yönleri vardır. Sen benzersizsin! 🌟`;
  return report;
}
