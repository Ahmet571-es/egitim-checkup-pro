// ============================================================
// Rapor v2 — "Bütünsel Değerlendirme" alt bölümleri
// ============================================================
// Her alt bölüm bir kurucu fonksiyondur. Gerekli veri yoksa null döner ve
// bölüm atlanır (numaralandırma kendiliğinden kayar). Paketler ve tek test
// raporları, bu katalogdan kendi sıralarını seçer.

import type { Block, ChartSpec, Level } from './types';
import { LEVEL_LABEL, HOLLAND_LABEL, MI_LABEL, VARK_LABEL, ENNEAGRAM_LABEL, type TestAnalysis } from './analyze';
import { HOLLAND_INFO, MI_INFO, VARK_INFO, STUDY_CAT_TEXT, studyLevels } from './content/tests';
import { capFirst, daDe, joinList, joinTr } from './tr';
import { BUL, KEY, NOTE, P, type Ctx } from './context';

export interface Sub {
  title: string;
  blocks: Block[];
}
export type SubBuilder = (c: Ctx) => Sub | null;

const NAVY = '#245B8F';
const lv = (l: Level) => LEVEL_LABEL[l].toLocaleLowerCase('tr-TR');
const lvAt = (a: TestAnalysis | undefined, i = 0): Level | undefined => a?.levels[i]?.level;
const pctOf = (a: TestAnalysis | undefined, i = 0): number | undefined => a?.levels[i]?.pct;
const strs = (xs: (string | undefined | false | null)[]) => xs.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);

/** Akademik performans ortalaması (0-100). */
function academicPct(c: Ctx): number | undefined {
  const a = c.get('akademik-analiz');
  const v = Number((a?.facts as Record<string, unknown> | undefined)?.perfAvg);
  return Number.isFinite(v) ? v : undefined;
}
function studyPct(c: Ctx): number | undefined {
  const a = c.get('calisma-davranisi');
  const v = Number((a?.facts as Record<string, unknown> | undefined)?.overall);
  return Number.isFinite(v) ? v : undefined;
}
function anxietyPct(c: Ctx): number | undefined {
  const a = c.get('sinav-kaygisi');
  const v = Number((a?.facts as Record<string, unknown> | undefined)?.totalPct);
  return Number.isFinite(v) ? v : undefined;
}
function attentionPct(c: Ctx): number | undefined {
  return pctOf(c.get('dikkat'));
}
const lcFirst = (x: string) => `${x.charAt(0).toLocaleLowerCase('tr-TR')}${x.slice(1)}`;
const varkName = (k: string) => (VARK_LABEL[k] ?? '').replace(/\s*\(.*\)/, '');
/** Akademik alanların en zayıfı (etiket, düzey). */
function weakestAcademic(c: Ctx): { label: string; short: string; level: Level } | undefined {
  const a = c.get('akademik-analiz');
  if (!a?.levels.length) return undefined;
  const w = [...a.levels].sort((x, y) => (x.pct ?? 0) - (y.pct ?? 0))[0];
  const short = w.label.startsWith('Matematik') ? 'matematik' : w.label.startsWith('Okuduğunu') ? 'okuduğunu anlama' : 'mantık yürütme';
  return { label: w.label, short, level: w.level };
}
/**
 * Öğrencinin okul kademesi. Sınıf bilgisi yoksa yaştan kestirilir; 14 yaş gibi
 * geçiş yaşlarında kademe belirsiz (null) kabul edilir ve metinler buna göre
 * kademe varsaymadan yazılır.
 */
type Stage = 'ilkokul' | 'ortaokul' | 'lise' | null;
function stageOf(c: Ctx): Stage {
  const g = c.student.grade;
  if (g) return g <= 4 ? 'ilkokul' : g <= 8 ? 'ortaokul' : 'lise';
  const a = c.student.age;
  if (!a) return null;
  if (a <= 9) return 'ilkokul';
  if (a <= 13) return 'ortaokul';
  if (a >= 15) return 'lise';
  return null;
}
/** Lise son sınıflarına henüz gelmemiş mi (üniversite tercihi henüz uzak mı)? */
function isEarly(c: Ctx): boolean {
  const g = c.student.grade;
  if (g) return g <= 9;
  const a = c.student.age;
  return !a || a <= 15;
}
const isHigh = (c: Ctx) => stageOf(c) === 'lise';

// ── Kişilik temelli alt bölümler ─────────────────────────────

const portrait: SubBuilder = (c) => {
  const p = c.persona;
  if (!p?.portrait?.length) return null;
  const blocks: Block[] = p.portrait.map((t) => P(c.f(t)));
  if (p.key) blocks.splice(Math.min(2, blocks.length), 0, KEY(c.f(p.key)));
  return { title: c.f('{adın} Mizaç Portresi'), blocks };
};

const motivation: SubBuilder = (c) => {
  const p = c.persona;
  if (!p?.motivates) return null;
  const blocks: Block[] = strs([p.motivates, p.stops]).map((t) => P(c.f(t)));
  const items = strs([
    p.motivators?.length ? `**Harekete geçirenler:** ${joinList(p.motivators)}.` : undefined,
    p.stoppers?.length ? `**Durduranlar:** ${joinList(p.stoppers)}.` : undefined,
  ]);
  if (items.length) blocks.push(BUL(items));
  return { title: 'Onu Harekete Geçiren ve Durduran Şeyler', blocks };
};

const motivationCareer: SubBuilder = (c) => {
  const s = motivation(c);
  return s ? { ...s, title: 'Onu Harekete Geçiren ve Zorlayan Şeyler' } : null;
};

const resources: SubBuilder = (c) => {
  const p = c.persona;
  if (!p?.resources?.length) return null;
  const blocks: Block[] = p.resources.map((t) => P(c.f(t)));
  const mi = c.get('coklu-zeka');
  const top = ((mi?.facts as Record<string, unknown> | undefined)?.top as string[] | undefined) ?? [];
  const bullets = [...(p.resourceBullets ?? [])];
  if (top[0]) bullets.push(`${MI_LABEL[top[0]]} alana belirgin ilgi`);
  if (bullets.length) blocks.push(BUL(bullets.slice(0, 5)));
  return { title: 'Güçlü Yanları ve Doğal Kaynakları', blocks };
};

const blindspots: SubBuilder = (c) => {
  const p = c.persona;
  if (!p?.blindspots?.length) return null;
  const blocks: Block[] = p.blindspots.map((t) => P(c.f(t)));
  if (p.blindspotBullets?.length) blocks.push(BUL(p.blindspotBullets));
  return { title: 'Gelişime Açık Alanları ve Fark Etmediği Noktalar', blocks };
};

const strengthsGrowth: SubBuilder = (c) => {
  const p = c.persona;
  if (!p) return null;
  const blocks: Block[] = strs([p.resources?.[0], p.blindspots?.[0]]).map((t) => P(c.f(t)));
  // "Kısaca" bölümündeki listeleri tekrar etmemek için kişilik kaynak/kör nokta maddeleri ve sonuçlardan gelen ek maddeler kullanılır.
  const shownS = new Set(c.collect<string>('strengths', 4));
  const shownG = new Set(c.collect<string>('growth', 3));
  const good = [...(p.resourceBullets ?? []), ...c.collect<string>('strengths', 10).filter((x) => !shownS.has(x))].slice(0, 5).map(c.f);
  const grow = [...(p.blindspotBullets ?? []), ...c.collect<string>('growth', 8).filter((x) => !shownG.has(x))].slice(0, 5).map(c.f);
  if (good.length || grow.length) blocks.push({ t: 'twoCol', tone: 'strengths', left: { title: 'Güçlü yanları', items: good }, right: { title: 'Gelişime açık alanları', items: grow } });
  return { title: 'Güçlü Yanları ve Gelişime Açık Alanları', blocks };
};

const communication: SubBuilder = (c) => {
  const p = c.persona;
  if (!p?.communication?.length) return null;
  const blocks: Block[] = p.communication.map((t) => P(c.f(t)));
  const items = strs([
    p.commStrong ? `**Güçlü olduğu yer:** ${p.commStrong}` : undefined,
    p.commHard ? `**Zorlanabileceği yer:** ${p.commHard}` : undefined,
    p.commStep ? `**Destek olabilecek adım:** ${p.commStep}` : undefined,
  ]).map(c.f);
  if (items.length) blocks.push(BUL(items));
  return { title: 'İletişim ve İlişki Tarzı', blocks };
};

const stress: SubBuilder = (c) => {
  const p = c.persona;
  if (!p?.stress?.length) return null;
  const blocks: Block[] = p.stress.map((t) => P(c.f(t)));
  const items = strs([p.stressSigns ? `**Dikkat edilecek işaretler:** ${p.stressSigns}` : undefined, p.stressHelps ? `**İyi gelenler:** ${p.stressHelps}` : undefined]);
  if (items.length) blocks.push(BUL(items));
  return { title: 'Stresle Karşılaştığında', blocks };
};

const conflict: SubBuilder = (c) => {
  const p = c.persona;
  if (!p?.conflict?.length) return null;
  const blocks: Block[] = p.conflict.map((t) => P(c.f(t)));
  if (p.conflictTip) blocks.push(KEY(c.f(p.conflictTip)));
  return { title: 'Çatışma ve Eleştiri Karşısında', blocks };
};

const interests: SubBuilder = (c) => {
  const mi = c.get('coklu-zeka');
  const hol = c.get('holland');
  if (!mi && !hol) return null;
  const blocks: Block[] = [];
  if (mi) {
    const top = ((mi.facts as Record<string, unknown>).top as string[]) ?? [];
    const bottom = ((mi.facts as Record<string, unknown>).bottom as string[]) ?? [];
    const ACTS: Record<string, string> = {
      sozel: 'kitap kulübü, okul gazetesi, münazara ya da günlük tutmak',
      mantiksal: 'akıl oyunları, satranç, kodlama ya da bilim projeleri',
      gorsel: 'çizim, tasarım, fotoğraf ya da maket çalışmaları',
      muziksel: 'bir enstrüman, koro ya da ritim çalışmaları',
      dogaci: 'doğa yürüyüşleri, bitki ya da hayvan gözlemi, çevre kulüpleri',
      sosyal: 'takım çalışmaları, gönüllülük ve akran öğreticiliği',
      bedensel: 'spor, dans, drama ya da el becerisi gerektiren atölyeler',
      icsel: 'kişisel hedef planlamak, bağımsız projeler ve kendini tanımaya yönelik okumalar',
    };
    if (top.length) {
      const acts = top.slice(0, 2).map((k) => ACTS[k]).filter(Boolean);
      blocks.push(P(c.f(`İlgi profiline göre ${acts.length > 1 ? `${acts[0]}; ayrıca ${acts[1]}` : acts[0] ?? ''} gibi etkinlikler, {ada} hem keyif verebilir hem de bu ilgileri derinleştirebilir.`)));
    }
    if (top[2]) {
      const int3 = MI_INFO[top[2]]?.interest ?? MI_LABEL[top[2]];
      blocks.push(P(c.f(`${capFirst(int3)} ${daDe(int3)} ilgi duyduğu alanlar arasında. Bu ilgi, öne çıkan alanlarla birleştiğinde ona farklı kapılar açabilir.`)));
    }
    if (bottom.length) {
      const pl = bottom.length > 1;
      blocks.push(P(c.f(`${capFirst(joinTr(bottom.map((k) => MI_LABEL[k].toLocaleLowerCase('tr-TR'))))} ${pl ? 'alanlar ise şu an daha az ilgi duyduğu alanlar' : 'alan ise şu an daha az ilgi duyduğu alan'}. Bu durum, ${pl ? 'o alanlardan' : 'o alandan'} uzak durması gerektiği anlamına gelmiyor; amaç başarı değil, keşif ve keyif olmalı.`)));
    }
  }
  if (hol) {
    const code = String((hol.facts as Record<string, unknown>).code ?? '');
    if (code) blocks.push(P(c.f(`Meslek ilgileri açısından ${joinTr(code.split('').map((k) => HOLLAND_LABEL[k]))} alanlar öne çıkıyor; ${HOLLAND_INFO[code[0]]?.act ?? ''} gerektiren etkinlikler ona daha çekici geliyor.`)));
  }
  return blocks.length ? { title: 'İlgi ve Yönelim Alanları', blocks } : null;
};

const learning: SubBuilder = (c) => {
  const p = c.persona;
  const vark = c.get('vark');
  const mi = c.get('coklu-zeka');
  const blocks: Block[] = [];
  if (p?.learning?.length) p.learning.forEach((t) => blocks.push(P(c.f(t))));
  const bullets = [...(p?.learningBullets ?? [])];
  if (vark) {
    const d = String((vark.facts as Record<string, unknown>).dominant);
    if (!p?.learning?.length) blocks.push(P(c.f(`{ad} ${VARK_INFO[d]?.pref ?? ''} tercih ediyor.`)));
    bullets.push(...(VARK_INFO[d]?.tips ?? []).slice(0, 2));
  }
  if (mi) {
    const top = ((mi.facts as Record<string, unknown>).top as string[]) ?? [];
    if (top[0] && !p?.learning?.length) blocks.push(P(c.f(`{ad} en çok ${MI_INFO[top[0]]?.learn ?? ''} öğrenmeye yatkın. Derslerde bu ilgiyi kullanan yöntemler, hem konuyu anlamasını hem de çalışma isteğini artırabilir.`)));
    const MI_TIPS: Record<string, string[]> = {
      sozel: ['Konuyu kendi cümleleriyle yazarak ya da anlatarak tekrar etmek', 'Kavramları hikâye ve örneklerle ilişkilendirmek'],
      mantiksal: ['Konuları tablo, akış şeması ve sebep-sonuç zincirleriyle çalışmak', 'Kuralı ezberlemek yerine nedenini sorgulamak'],
      gorsel: ['Zihin haritası, renkli şema ve çizimlerle not tutmak', 'Konuyu bir görsel üzerinde anlatmak'],
      muziksel: ['Ezber gerektiren bilgileri ritim ya da kafiyeyle çalışmak', 'Uygun bir fon müziğiyle kısa çalışma blokları denemek'],
      dogaci: ['Konuları gerçek hayattan ve doğadan örneklerle ilişkilendirmek', 'Bilgileri sınıflandırarak ve gruplayarak çalışmak'],
      sosyal: ['Bir arkadaşıyla soru-cevap yaparak çalışmak', 'Öğrendiğini başkasına anlatarak pekiştirmek'],
      bedensel: ['Çalışırken kısa hareket molaları vermek', 'Model, deney ve canlandırmayla öğrenmek'],
      icsel: ['Kendi hedeflerini koyup ilerlemesini kendisi takip etmek', 'Sessiz ve bireysel çalışma zamanları ayırmak'],
    };
    top.slice(0, 2).forEach((k) => bullets.push(...(MI_TIPS[k] ?? []).slice(0, top.length > 1 ? 1 : 2)));
  }
  if (!blocks.length && !bullets.length) return null;
  if (bullets.length) blocks.push(BUL([...new Set(bullets)].slice(0, 5)));
  return { title: 'Ona Uygun Öğrenme Dili', blocks };
};

const futureHints: SubBuilder = (c) => {
  const p = c.persona;
  const mi = c.get('coklu-zeka');
  const hol = c.get('holland');
  const blocks: Block[] = [];
  if (!hol) blocks.push(P(c.f(`Bu rapor meslek ilgilerini doğrudan ölçmedi; yine de {adın} ${p && mi ? 'kişilik ve ilgi sonuçları' : mi ? 'ilgi sonuçları' : 'kişilik sonuçları'} bazı ipuçları veriyor.`)));
  if (p?.future?.length) p.future.forEach((t) => blocks.push(P(c.f(t))));
  if (mi) {
    const top = ((mi.facts as Record<string, unknown>).top as string[]) ?? [];
    const fields = [...new Set(top.slice(0, 2).flatMap((k) => MI_INFO[k]?.careers ?? []))].slice(0, 5);
    if (fields.length) blocks.push(P(c.f(`İlgi alanları göz önüne alındığında ${joinTr(fields)} gibi alanlar, ileride keşfetmeye değer seçenekler arasında görünüyor.`)));
  }
  const st = stageOf(c);
  blocks.push(P(c.f(st === 'ilkokul' || st === 'ortaokul'
    ? `{ad} henüz ${st} çağında ve ilgileri bu yıllarda şekillenmeye devam edecek. Şimdilik en doğrusu, farklı alanları merakla denemesine alan açmak.`
    : 'İlgiler bu yıllarda şekillenmeye devam ediyor. Şimdilik en doğrusu, farklı alanları merakla denemesine alan açmak; ilerleyen dönemde ilgi, yetenek ve değerlerini birlikte ele alan bir kariyer değerlendirmesi daha net bir yol haritası çizmekte faydalı olacaktır.')));
  return blocks.length > 1 ? { title: 'Geleceğe Dair İlk İpuçları', blocks } : null;
};

// ── Akademik alt bölümler ────────────────────────────────────

const academicPicture: SubBuilder = (c) => {
  const a = c.get('akademik-analiz');
  if (!a) return null;
  const f = a.facts as Record<string, unknown>;
  const perfLevel = Number(f.perfLevel) as Level;
  const rows = [...a.levels].sort((x, y) => (y.pct ?? 0) - (x.pct ?? 0));
  const blocks: Block[] = [];
  const spread = rows.length > 1 && rows[0].level - rows[rows.length - 1].level >= 1;
  blocks.push(P(c.f(rows.length > 1
    ? `{adın} temel akademik becerileri ${spread ? 'alanlara göre farklılaşıyor' : 'alanlar arasında dengeli'}: ${rows.map((r) => `${r.label.toLocaleLowerCase('tr-TR')} ${lv(r.level)}`).join(', ')} düzeyde. ${spread ? `En güçlü alanı ${rows[0].label.toLocaleLowerCase('tr-TR')}, en çok desteklenmesi gereken alanı ise ${rows[rows.length - 1].label.toLocaleLowerCase('tr-TR')}.` : ''}`
    : `{adın} temel akademik becerileri ${lv(perfLevel)} düzeyde.`)));
  const weak = (f.weakSkills as string[]) ?? [];
  const strong = (f.strongSkills as string[]) ?? [];
  if (strong.length || weak.length) {
    blocks.push(P(c.f(`${strong.length ? `Beceri düzeyinde ${joinTr(strong)} konularında rahat ilerliyor. ` : ''}${weak.length ? `${capFirst(joinTr(weak))} ise en çok zorlandığı konular.` : ''}`)));
  }
  if (perfLevel <= 2) blocks.push(NOTE(c.f('Bu tablo bir yetenek değerlendirmesi değil; bugünkü düzeyi gösteriyor. Temel eksikler, doğru planlanmış adımlarla kapanabilir.')));
  else if (perfLevel >= 4 && rows.every((r) => r.level >= 4)) blocks.push(NOTE(c.f('Sağlam bir akademik zemin var. Bu zemini korumak ve üzerine düzenli çalışmayla yeni beceriler eklemek önemli.')));
  else if (perfLevel >= 4) blocks.push(NOTE(c.f(`Genel tablo iyi; ancak ${rows[rows.length - 1].label.toLocaleLowerCase('tr-TR')} alanı diğerlerinin gerisinde kalıyor. Bu alana yönelik hedefli çalışma, tabloyu dengeleyecektir.`)));
  return { title: c.f('{adın} Akademik Tablosu'), blocks };
};

const skillsInteract: SubBuilder = (c) => {
  const a = c.get('akademik-analiz');
  if (!a) return null;
  const blocks: Block[] = [];
  const t = c.has.bind(c);
  if (t('ac_read_low')) blocks.push(P(c.f(`Okuduğunu anlama, diğer tüm becerilerin kapısı. Bu alanda zorlanma, yalnızca Türkçe dersini değil; uzun soru köklerinin olduğu ${isHigh(c) ? 'matematik, fizik, kimya, biyoloji ve tarih' : 'matematik, fen bilimleri ve sosyal bilgiler'} derslerini de etkileyebilir. {adın} bildiği bir konuda bile soruyu yanlış anlaması nedeniyle hata yapması mümkün.`)));
  if (t('ac_logic_high') && t('ac_math_low')) blocks.push(P(c.f('Mantık yürütme becerisinin matematikten daha güçlü çıkması önemli bir ipucu: Hatalar düşünme biçiminden çok konu eksiklerinden kaynaklanıyor olabilir. Eksik konular tamamlandığında matematikte belirgin bir ilerleme görülebilir.')));
  if (t('ac_logic_high') && !t('ac_math_low') && !t('ac_math_high') && c.get('akademik-analiz')!.levels.some((l) => l.label.startsWith('Matematik') && l.level <= 3)) blocks.push(P(c.f('Mantık yürütme becerisi güçlü, matematik ise orta düzeyde. Bu fark, matematikteki gelişim alanının düşünme biçiminden çok konu tekrarı ve soru pratiğiyle ilgili olabileceğini düşündürüyor.')));
  if (t('ac_math_behind') && !t('ac_math_low')) blocks.push(P(c.f('Okuma becerisi matematikten belirgin biçimde güçlü. Matematikte sözel problemlerden başlamak, {adın} güçlü yanını zayıf alanına köprü olarak kullanmasını sağlar.')));
  if (t('ac_read_behind') && !t('ac_read_low')) blocks.push(P(c.f('Matematik becerisi okumadan belirgin biçimde güçlü. Okuma alışkanlığını desteklemek, sayısal derslerdeki başarısını da sözel alanlara taşımasına yardım eder.')));
  if (t('rd_slow') || t('rd_rushing')) blocks.push(P(c.f(t('rd_rushing') ? 'Hızlı ama yüzeysel okuma eğilimi, okuduğunu anlama sonuçlarını da etkiliyor olabilir.' : 'Okuma hızının düşük olması, süreli sınavlarda tüm bölümleri yetiştirmesini zorlaştırabilir.')));
  if (t('att_low') || t('att_impulsive')) blocks.push(P(c.f('Dikkat göstergelerindeki zorlanma, akademik sonuçlara işlem ve okuma hataları olarak yansıyabilir. Bu nedenle bazı yanlışlar bilgi eksikliğinden değil, dikkatten kaynaklanıyor olabilir.')));
  if (!blocks.length) blocks.push(P(c.f('{adın} temel becerileri birbirini dengeli biçimde destekliyor; belirgin bir alanın diğerlerini aşağı çektiği bir tablo görünmüyor.')));
  return { title: 'Temel Becerilerin Birbirini Nasıl Etkilediği', blocks };
};

const learningPrefs: SubBuilder = (c) => {
  const vark = c.get('vark');
  const mi = c.get('coklu-zeka');
  const brain = c.get('sag-sol-beyin');
  if (!vark && !mi && !brain) return null;
  const blocks: Block[] = [];
  const tips: string[] = [];
  if (vark) {
    const f = vark.facts as Record<string, unknown>;
    const d = String(f.dominant);
    const s = String(f.second);
    blocks.push(P(c.f(f.multimodal ? `{ad} bilgiyi tek bir yoldan değil, ${VARK_LABEL[d].toLocaleLowerCase('tr-TR')} ve ${VARK_LABEL[s].toLocaleLowerCase('tr-TR')} yolları birlikte kullanarak almayı tercih ediyor.` : `{ad} ${VARK_INFO[d]?.pref ?? ''} tercih ediyor.`)));
    tips.push(...(VARK_INFO[d]?.tips ?? []));
    if (f.multimodal) tips.push(...(VARK_INFO[s]?.tips ?? []).slice(0, 1));
  }
  if (mi) {
    const top = ((mi.facts as Record<string, unknown>).top as string[]) ?? [];
    if (top[0]) blocks.push(P(c.f(`İlgi profili de bunu destekliyor: {ad} ${MI_INFO[top[0]]?.learn ?? ''} öğrenmeye daha yatkın.`)));
  }
  if (brain) {
    const f = brain.facts as Record<string, unknown>;
    const r = Number(f.right);
    const l = Number(f.left);
    blocks.push(P(c.f(r - l > 10 ? 'Düşünme tercihinde bütüne bakmak ve sezgi ön planda; konuya önce genel resimle başlamak ona iyi geliyor.' : l - r > 10 ? 'Düşünme tercihinde adım adım ilerlemek ön planda; konuları sıralı ve yapılandırılmış biçimde çalışmak ona iyi geliyor.' : 'Düşünme tercihinde hem genel resme hem ayrıntıya dengeli bakıyor.')));
    tips.push(r - l > 10 ? 'Yeni bir konuya başlamadan önce konunun özetine ya da bir kavram haritasına göz atmak' : l - r > 10 ? 'Konuyu küçük adımlara bölüp her adımı tamamladıkça işaretlemek' : 'Konuya göre önce genel resme bakmak ya da adım adım ilerlemek arasında seçim yapmak');
  }
  if (tips.length) blocks.push(BUL([...new Set(tips)].slice(0, 5)));
  return { title: 'Öğrenme Tercihleri ve İşe Yarayan Yöntemler', blocks };
};

const studyHabits: SubBuilder = (c) => {
  const a = c.get('calisma-davranisi');
  if (!a) return null;
  const rows = studyLevels(a);
  const asc = [...rows].sort((x, y) => x.pct - y.pct);
  const good = rows.filter((r) => r.level >= 4).sort((x, y) => y.pct - x.pct);
  let weak = asc.filter((r) => r.level <= 2);
  const relative = !weak.length;
  if (relative) weak = asc.filter((r) => r.level === 3).slice(0, 2);
  const blocks: Block[] = [];
  const studyNow = c.collect<string>('studyNow', 2);
  studyNow.forEach((t) => blocks.push(P(c.f(t))));
  if (!studyNow.length) {
    const goodTxt = good.length ? `${capFirst(joinTr(good.slice(0, 3).map((r) => STUDY_CAT_TEXT[r.key]?.high ?? r.label)))} güçlü yanları arasında.` : '';
    const weakTxt = weak.length
      ? relative
        ? `Belirgin biçimde zayıf bir alan yok; görece daha düşük kalan ${weak.length > 1 ? 'alanlar' : 'alan'} ${joinTr(weak.map((r) => r.label.toLocaleLowerCase('tr-TR')))}.`
        : `Bugünkü tabloda en çok desteklenmesi gereken ${weak.length > 1 ? 'alanlar' : 'alan'} ${joinTr(weak.map((r) => r.label.toLocaleLowerCase('tr-TR')))}.`
      : 'Belirgin bir zayıf alan görünmüyor.';
    blocks.push(P(c.f(`${goodTxt} ${weakTxt}`.trim())));
  }
  blocks.push({
    t: 'twoCol',
    tone: 'strengths',
    left: { title: 'Neler var', items: good.length ? good.map((r) => r.label) : ['Belirgin biçimde güçlü bir alan henüz öne çıkmıyor.'] },
    right: { title: relative ? 'Neler güçlendirilebilir' : 'Neler eksik', items: weak.length ? weak.map((r) => r.label) : ['Belirgin bir eksik alan görünmüyor; mevcut düzen korunmalı.'] },
  });
  return { title: relative ? 'Şu Anki Çalışma Alışkanlıkları: Neler Var, Neler Güçlendirilebilir' : 'Şu Anki Çalışma Alışkanlıkları: Neler Var, Neler Eksik', blocks };
};

const effortGap: SubBuilder = (c) => {
  if (!c.get('calisma-davranisi') && !c.get('akademik-analiz')) return null;
  const causes: string[] = [];
  if (c.has('st_weak') || c.has('st_start_low')) causes.push('**Süreklilik:** Çalışmanın düzenli sürdürülememesi, öğrenilenlerin kalıcı hâle gelmesini engelliyor.');
  if (c.has('st_conscious_low')) causes.push('**Çalışma biçimi:** Okuyup geçmek gibi pasif yöntemler, harcanan sürenin karşılığını azaltıyor; kendini sınama ve aktif tekrar eksik.');
  if (c.has('st_notes_low')) causes.push('**Derste dinleme ve not:** Dersin kendisinden yeterince yararlanılamaması, evdeki çalışma yükünü artırıyor.');
  if (c.has('st_exam_low')) causes.push('**Sınava hazırlık:** Sınava planlı hazırlanma ve sınavda zamanı yönetme alışkanlığı henüz yerleşmemiş.');
  if (c.has('anx_high')) causes.push('**Kaygı:** Sınav anındaki kaygı, bilinenlerin sınava yansımasını zorlaştırabilir.');
  if (c.has('att_low') || c.has('att_impulsive')) causes.push('**Dikkat:** Dikkatsizlik hataları, bilinen sorularda puan kaybına yol açabilir.');
  if ((c.has('att_late_drop') || c.has('att_fluct')) && !c.has('att_low')) causes.push('**Dikkatin sürdürülmesi:** Görev uzadıkça dikkatin düşmesi, uzun çalışmaların ve sınavların son bölümlerinde verimi azaltabilir.');
  if (c.has('ac_read_low')) causes.push('**Okuduğunu anlama:** Soru köklerinin yanlış anlaşılması, bilinen konularda bile hataya yol açabilir.');
  if (c.has('ac_overconf')) causes.push('**Gerçekçi öz değerlendirme:** Kendini olduğundan hazır görmek, tekrar ve hazırlığı azaltabilir.');
  const single = c.analyses.length === 1;
  const title = 'Verimi Etkileyen Olası Etkenler';
  if (!causes.length) return { title, blocks: [P(c.f('{adın} sonuçlarında verimi belirgin biçimde azaltan bir etken görünmüyor. Mevcut çalışma düzenini koruyup hedefli tekrarlarla ilerlemek yeterli olabilir.'))] };
  const blocks: Block[] = [P(c.f(`${single ? 'Bu değerlendirmenin sonuçları' : 'Sonuçlar birlikte okunduğunda'}, {adın} çalışmasının verimini etkileyebilecek ${causes.length > 1 ? 'şu etkenlere' : 'şu etkene'} işaret ediyor:`)), BUL(causes.slice(0, 5))];
  if (causes.length > 1) blocks.push(NOTE(c.f('Bu etkenlerden hangisinin daha belirleyici olduğunu görüşmelerle ve birkaç haftalık gözlemle netleştirmek önerilir.')));
  return { title, blocks };
};

const potentialGap: SubBuilder = (c) => {
  const a = c.get('akademik-analiz');
  const mi = c.get('coklu-zeka');
  if (!a && !mi) return null;
  const f = (a?.facts ?? {}) as Record<string, unknown>;
  const blocks: Block[] = [];
  const logicHigh = c.has('ac_logic_high');
  const perf = Number(f.perfLevel) as Level;
  // Yalnızca ölçülmüş ve sorun gösteren etkenler anılır
  const factors: string[] = [];
  if (c.get('calisma-davranisi') && !c.has('st_good')) factors.push('çalışma düzeni');
  if (a && (c.has('ac_math_low') || c.has('ac_read_low') || perf <= 3)) factors.push('konu eksikleri');
  if (c.get('sinav-kaygisi') && (c.has('anx_high') || c.has('anx_mid'))) factors.push('sınav kaygısı');
  if (c.get('dikkat') && (c.has('att_low') || c.has('att_impulsive') || c.has('att_late_drop'))) factors.push('dikkatin sürdürülmesi');
  const ftxt = factors.length ? joinTr(factors) : 'düzenli çalışma';
  if (logicHigh && perf <= 3) blocks.push(P(c.f(`Mantık yürütme becerisinin güçlü çıkması, {adın} öğrenme kapasitesinin bugünkü akademik sonuçlarından daha yüksek olabileceğini düşündürüyor. Aradaki farkın kaynağı büyük olasılıkla kapasite değil; ${ftxt} gibi değiştirilebilir etkenler.`)));
  else if (perf >= 4) blocks.push(P(c.f(`{adın} akademik sonuçları genel olarak iyi düzeyde. Burada önemli olan, bu düzeyi sürdürülebilir bir çalışma ve dinlenme dengesiyle korumak${factors.includes('konu eksikleri') || c.has('ac_math_low') ? ' ve görece zayıf kalan alanı güçlendirmek' : ''}.`)));
  else if (a) blocks.push(P(c.f(`{adın} bugünkü sonuçları ile potansiyeli arasındaki farkı belirleyen etkenler büyük olasılıkla ${ftxt}.`)));
  const gap = Number(f.gap);
  if (Number.isFinite(gap) && gap < -15) blocks.push(P(c.f('Ayrıca {ad} kendini olduğundan daha az başarılı görüyor. Bu düşük öz değerlendirme, zor sorulara girişme cesaretini azaltabilir; başarılarını görünür kılmak bu farkı kapatmaya yardım eder.')));
  if (Number.isFinite(gap) && gap > 15) blocks.push(P(c.f('Öte yandan {ad} kendini olduğundan daha hazır görüyor. Bu iyimserlik motivasyon için değerli; ancak düzenli kendini sınama ile desteklenmezse hazırlığı azaltabilir.')));
  if (mi) {
    const top = ((mi.facts as Record<string, unknown>).top as string[]) ?? [];
    if (top[0]) blocks.push(P(c.f(`${capFirst(MI_LABEL[top[0]].toLocaleLowerCase('tr-TR'))} alana ilgisi, derslerde bu ilgiyi kullanan yöntemlerle bağlantı kurulduğunda performansını yükseltmek için bir kaldıraç olabilir.`)));
  }
  return blocks.length ? { title: 'Potansiyel ile Performans Arasındaki Fark', blocks } : null;
};

const subjectTips: SubBuilder = (c) => {
  const vark = c.get('vark');
  const a = c.get('akademik-analiz');
  const brain = c.get('sag-sol-beyin');
  const d = vark ? String((vark.facts as Record<string, unknown>).dominant) : brain ? (c.has('br_right') ? 'V' : c.has('br_left') ? 'R' : 'K') : '';
  const blocks: Block[] = [P(c.f(vark ? 'Aşağıdaki öneriler, {adın} sonuçlarına ve öğrenme tercihine göre derslere uyarlanmıştır.' : brain && !a ? 'Aşağıdaki öneriler, {adın} düşünme tercihine göre derslere uyarlanmıştır.' : 'Aşağıdaki öneriler, {adın} akademik sonuçlarına göre derslere uyarlanmıştır.'))];
  const style = (['V', 'A', 'R', 'K'] as const).includes(d as 'V') ? (d as 'V' | 'A' | 'R' | 'K') : 'R';
  const TIP: Record<string, Record<'V' | 'A' | 'R' | 'K', string>> = {
    tr: {
      V: 'Paragrafın ana fikrini ve yardımcı fikirlerini küçük bir şemaya dökmek; yeni kelimeleri görselli kartlara yazmak.',
      A: 'Okuduğu paragrafı birine sesli özetlemek; şiir ve metinleri yüksek sesle okumak.',
      R: 'Okuduğunu iki cümleyle yazılı özetlemek; yeni kelimeleri bir defterde toplamak.',
      K: 'Okurken önemli yerlerin altını çizmek ve kenara not almak; metni kısa bir canlandırma ya da çizimle anlatmak.',
    },
    mat: {
      V: 'Problemleri şekil, tablo ve sayı doğrusuyla görselleştirmek; çözüm adımlarını renkli kalemle işaretlemek.',
      A: 'Çözümü adım adım sesli anlatmak; bir arkadaşa konuyu açıklayarak tekrar etmek.',
      R: 'Kuralları ve çözüm adımlarını kendi cümleleriyle yazmak; bir formül ve hata defteri tutmak.',
      K: 'Konu bitince bol uygulama sorusu çözmek; somut materyal ve gerçek hayat örnekleriyle çalışmak.',
    },
    fen: {
      V: 'Kavramları şema ve akış diyagramlarıyla çalışmak; süreçleri çizerek anlatmak.',
      A: 'Konuyu sesli anlatarak tekrar etmek; deney ve süreçleri birine açıklamak.',
      R: 'Konu özetleri ve kavram listeleri hazırlamak; deney sonuçlarını yazılı raporlamak.',
      K: 'Deney, model kurma ve günlük hayattan örneklerle çalışmak; konu sonunda uygulama soruları çözmek.',
    },
    sos: {
      V: 'Zaman çizelgeleri, haritalar ve karşılaştırma tabloları hazırlamak.',
      A: 'Konuyu hikâye gibi sesli anlatmak; olayları biriyle tartışarak tekrar etmek.',
      R: 'Önemli kavramları kartlara yazmak; konuyu kendi cümleleriyle özetlemek.',
      K: 'Olayları canlandırarak ya da harita üzerinde göstererek çalışmak; müze ve gezi gözlemlerini kullanmak.',
    },
    dil: {
      V: 'Görselli kelime kartları ve renkli dil bilgisi tabloları kullanmak.',
      A: 'Dinleme çalışmaları ve sesli tekrar; kısa diyalogları yüksek sesle okumak.',
      R: 'Her gün 10 kelimelik kart tekrarı ve kısa yazma alıştırmaları yapmak.',
      K: 'Kelimeleri hareket ve canlandırmayla öğrenmek; günlük hayatta kullanılan cümlelerle pratik yapmak.',
    },
  };
  const hi = isHigh(c);
  const unknownStage = stageOf(c) === null;
  const mathTip = c.has('ac_math_low') ? 'Eksik konuları kolaydan zora sıralayan kısa setler ve bir hata defteri; her yanlışın doğru çözümünü yazmak.' : TIP.mat[style];
  const rows: [string, string][] = [
    [hi ? 'Türk Dili ve Edebiyatı' : unknownStage ? 'Türkçe / Edebiyat' : 'Türkçe', c.has('ac_read_low') || c.has('rd_slow') ? 'Her gün 15 dakika okuma ve iki cümlelik özet; paragraf sorularında önce soru kökü, sonra metin.' : TIP.tr[style]],
    ['Matematik', mathTip],
    [hi ? 'Fizik / Kimya / Biyoloji' : unknownStage ? 'Fen dersleri' : 'Fen Bilimleri', TIP.fen[style]],
    [hi ? 'Tarih / Coğrafya' : unknownStage ? 'Sosyal dersler' : 'Sosyal Bilgiler', TIP.sos[style]],
    ['Yabancı Dil', TIP.dil[style]],
  ];
  if (!a && !vark && !brain) return null;
  blocks.push({ t: 'table', head: ['Ders', 'Öneri'], rows });
  return { title: 'Ders Ders Çalışma Önerileri', blocks };
};

const quickWins: SubBuilder = (c) => {
  const items = c.collect<string>('quickWins', 5).map(c.f);
  if (!items.length) return null;
  return { title: 'Kısa Sürede Fark Yaratabilecek Adımlar', blocks: [P(c.f('Aşağıdaki küçük adımlar, {adın} hem sonuçlarını hem kendine güvenini destekleyebilir:')), BUL(items)] };
};

const risks: SubBuilder = (c) => {
  const items = c.collect<string>('risks', 5).map(c.f);
  if (!items.length) return null;
  return { title: 'Dikkat Edilmesi Gereken Riskler', blocks: [BUL(items)] };
};

const top3: SubBuilder = (c) => {
  // Uzman bölümündeki "Öncelik Sırası" ile aynı olmasın diye: her profilin ilk
  // hızlı kazanımı (ne yapılacak) + ilk riski (neden önemli) eşlenir.
  const rows: [string, string][] = [];
  const seen = new Set<string>();
  for (const p of c.profiles) {
    if (p.id === 'generic' && rows.length >= 2) break;
    const what = p.quickWins?.[0] ?? p.develop?.[0];
    const why = p.risks?.[0];
    if (!what || !why || seen.has(what)) continue;
    seen.add(what);
    rows.push([`${rows.length + 1}. ${capFirst(c.f(what)).replace(/\.$/, '')}`, c.f(why)]);
    if (rows.length >= 3) break;
  }
  if (!rows.length) {
    const pr = c.collect<[string, string]>('priorities', 3);
    if (!pr.length) return null;
    return { title: 'Önümüzdeki Dönem İçin Öncelikler', blocks: [{ t: 'table', head: ['Öncelik', 'Neden'], rows: pr.map(([a, b], i) => [`${i + 1}. ${a}`, c.f(b)] as [string, string]) }] };
  }
  return { title: rows.length === 3 ? 'Önümüzdeki Dönem İçin 3 Öncelik' : 'Önümüzdeki Dönem İçin Öncelikler', blocks: [{ t: 'table', head: ['Ne yapılacak', 'Neden önemli'], rows }] };
};

const tracking: SubBuilder = (c) => {
  const items = c.collect<string>('tracking', 3).map(c.f);
  const monitoring = c.first('monitoring');
  const blocks: Block[] = [P(c.f('İlerlemeyi görünür kılmak hem {adın} motivasyonunu hem de ailenin ve öğretmenin doğru zamanda doğru desteği vermesini kolaylaştırır.'))];
  const bullets = [...items, ...(monitoring ? [c.f(monitoring)] : []), 'Üç ay sonra raporda öne çıkan alanlar yeniden gözden geçirilebilir.'];
  blocks.push(BUL([...new Set(bullets)].slice(0, 4)));
  return { title: 'Gelişimi Nasıl Takip Edeceğiz', blocks };
};

// ── Sınav alt bölümleri ──────────────────────────────────────

const readiness: SubBuilder = (c) => {
  const parts: { label: string; value: number }[] = [];
  const ac = academicPct(c);
  const st = studyPct(c);
  const at = attentionPct(c);
  const ax = anxietyPct(c);
  if (ac !== undefined) parts.push({ label: 'Akademik düzey', value: ac });
  if (st !== undefined) parts.push({ label: 'Çalışma düzeni', value: st });
  if (at !== undefined) parts.push({ label: 'Dikkat', value: at });
  if (ax !== undefined) parts.push({ label: 'Sakinlik', value: 100 - ax });
  if (parts.length < 2) return null;
  const avg = parts.reduce((s, p) => s + p.value, 0) / parts.length;
  const sorted = [...parts].sort((a, b) => b.value - a.value);
  const weakParts = parts.filter((p) => p.value < 50);
  const blocks: Block[] = [];
  blocks.push(P(c.f(avg >= 70 && !weakParts.length
    ? '{ad}, sınav hazırlığının temel taşlarında güçlü bir zemine sahip. Bu zemini korumak ve deneme sınavlarıyla sınav temposuna alışmak öncelikli.'
    : avg >= 55
      ? `{ad} sınava büyük ölçüde hazır görünüyor. ${weakParts.length === 1 ? `Bileşenlerden biri (${weakParts[0].label.toLocaleLowerCase('tr-TR')}) ise sınav performansını aşağı çekebilecek düzeyde destek istiyor.` : weakParts.length > 1 ? `${capFirst(joinTr(weakParts.map((p) => p.label.toLocaleLowerCase('tr-TR'))))} ise sınav performansını aşağı çekebilecek düzeyde destek istiyor.` : 'Bileşenlerin hiçbiri belirgin bir risk göstermiyor; görece zayıf olanı güçlendirmek yeterli.'}`
      : '{adın} sınav hazırlığının temel taşlarında belirgin destek ihtiyacı var. İyi haber şu: Bu alanların çoğu doğru bir planla güçlenebilir.')));
  blocks.push(P(c.f(`En güçlü olduğu alan ${sorted[0].label.toLocaleLowerCase('tr-TR')}, en çok desteklenmesi gereken alan ise ${sorted[sorted.length - 1].label.toLocaleLowerCase('tr-TR')}.`)));
  const chart: ChartSpec = { kind: 'columns3d', color: NAVY, points: parts, title: 'Sınava hazırlık bileşenleri' };
  blocks.push({ t: 'chart', chart, caption: ax !== undefined ? 'Sakinlik, kaygı puanının tersidir: yüksek değer, sınav kaygısından daha az etkilendiğini gösterir.' : undefined });
  return { title: c.f('{ad} Sınava Ne Kadar Hazır?'), blocks };
};

/** Hedefin en çok hangi akademik alana dayandığı (kaba eşleme). */
function targetDomain(target: string): { key: 'math' | 'read' | 'both'; text: string } | null {
  const t = target.toLocaleLowerCase('tr-TR');
  if (/tıp|diş|eczacı|mühendis|sayısal|fen lisesi|\bfen\b|mimar|bilgisayar|yazılım|fizik|kimya|biyoloji|veteriner|matematik/.test(t)) return { key: 'math', text: 'matematik ve fen derslerine' };
  if (/hukuk|eşit|psikoloji|işletme|ekonomi|iktisat|uluslararası|öğretmen/.test(t)) return { key: 'both', text: 'hem matematik hem de okuduğunu anlama ve yorumlama becerisine' };
  if (/sözel|edebiyat|tarih|dil|gazetecilik|iletişim|sosyal bilimler/.test(t)) return { key: 'read', text: 'okuduğunu anlama ve yorumlama becerisine' };
  return null;
}

const targetRange: SubBuilder = (c) => {
  const a = c.get('akademik-analiz');
  if (!a) return null;
  const perf = Number((a.facts as Record<string, unknown>).perfLevel) as Level;
  const w = weakestAcademic(c);
  const blocks: Block[] = [];
  const target = c.student.target?.trim();
  if (target) {
    const dom = targetDomain(target);
    blocks.push(P(c.f(`{adın} hedefi: **${target}**.${dom ? ` Bu hedefte sonuç büyük ölçüde ${dom.text} dayanıyor.` : ''}`)));
    const mathRow = a.levels.find((l) => l.label.startsWith('Matematik'));
    const readRow = a.levels.find((l) => l.label.startsWith('Okuduğunu'));
    const critical = dom?.key === 'math' ? mathRow : dom?.key === 'read' ? readRow : w ? a.levels.find((l) => l.label === w.label) : undefined;
    if (critical) {
      const name = critical.label.toLocaleLowerCase('tr-TR');
      blocks.push(P(c.f(critical.level >= 4
        ? `Hedef için en kritik alan olan ${name} bugün ${lv(critical.level)} düzeyde; bu, hedefe giden yolda önemli bir dayanak. Bu düzeyi deneme sınavlarında da istikrarlı biçimde gösterebilmek belirleyici olacak.`
        : `Hedef için en kritik alan olan ${name} bugün ${lv(critical.level)} düzeyde${w && w.label === critical.label ? ' ve aynı zamanda en zayıf alanı' : ''}. Hedefe yaklaşmanın en etkili yolu, bu alana haftalık programda ayrı ve düzenli bir yer açmak.`)));
    }
    if (w && (!critical || critical.label !== w.label) && w.level <= 3) blocks.push(P(c.f(`Bunun yanında ${w.short} alanı da (${lv(w.level)}) güçlendirilmesi gereken bir alan.`)));
  } else {
    blocks.push(P(c.f(
      perf >= 4
        ? `Akademik düzeyi, iddialı hedefler için iyi bir başlangıç noktası sunuyor.${w && w.level <= 3 ? ` Hedef belirlerken en zayıf alanı olan ${w.short} alanını güçlendirmek öncelikli olacak.` : ''}`
        : perf === 3
          ? `Akademik düzeyi orta seviyede. Hedef belirlerken, özellikle ${w?.short ?? 'zayıf alanlar'} için kısa vadeli ve ölçülebilir ara hedefler koymak hem gerçekçi hem motive edici olur.`
          : 'Akademik düzeyinde temel eksikler bulunuyor. Bu aşamada uzak ve büyük bir hedef yerine, eksik konuların kapanmasıyla ölçülen kısa vadeli hedefler belirlemek daha doğru olur.',
    )));
  }
  blocks.push(NOTE('Bu değerlendirme bir puan ya da sıralama tahmini içermez. Hedefe olan mesafe, deneme sınavı sonuçlarıyla her iki-üç ayda bir yeniden ölçülmelidir.'));
  return { title: target ? 'Hedef ve Bugünkü Akademik Düzey' : 'Akademik Düzey ve Hedef Belirleme', blocks };
};

const anxietyProfile: SubBuilder = (c) => {
  const a = c.get('sinav-kaygisi');
  if (!a) return null;
  const f = a.facts as Record<string, unknown>;
  const types = (f.typeScores as Record<string, number>) ?? {};
  const total = Number(f.totalLevel) as Level;
  const blocks: Block[] = [];
  const dom = String(f.dominantType ?? '');
  const domText: Record<string, string> = {
    bilissel: 'Kaygı daha çok düşünce düzeyinde yaşanıyor: "Ya yapamazsam", "Yeterince çalışmadım" gibi düşünceler öne çıkıyor.',
    bedensel: 'Kaygı daha çok bedende hissediliyor: çarpıntı, mide ağrısı, terleme gibi belirtiler öne çıkıyor.',
    sosyal: 'Kaygı daha çok başkalarının ne düşüneceği ve kendine yönelik beklentilerle ilgili.',
  };
  const opening: Record<number, string> = {
    5: 'Sınav kaygısı yüksek düzeyde ve sınav performansını etkileyebilecek bir yoğunlukta.',
    4: 'Sınav kaygısı belirgin; özellikle önemli sınavlarda performansı etkileyebilecek düzeyde.',
    3: 'Sınav kaygısı orta düzeyde; çoğu öğrencide görülen ölçüde bir gerginlik.',
    2: 'Sınav kaygısı düşük; sınavlara genel olarak sakin yaklaşabiliyor.',
    1: 'Sınav kaygısı çok düşük; sınavlara sakin ve rahat yaklaşıyor.',
  };
  blocks.push(P(c.f(`${opening[total] ?? ''} ${total >= 3 && domText[dom] ? domText[dom] : ''}`.trim())));
  if (c.has('anx_prep') && c.has('st_good')) {
    blocks.push(P(c.f('Kaygının en belirgin tetikleyicisi "yeterince hazır değilim" duygusu. Dikkat çekici olan, çalışma alışkanlıklarının aslında iyi düzeyde olması: {adın} hazırlıksızlık hissi, gerçek hazırlığından daha büyük görünüyor. Yaptığı çalışmayı görünür kılmak (tamamlanan konu listesi, deneme sonuçlarının takibi) bu duyguyu azaltabilir.')));
  } else if (total >= 3) {
    blocks.push(P(c.f(c.has('anx_prep') ? 'Kaygının en belirgin tetikleyicisi "yeterince hazır değilim" duygusu. Bu tür kaygı, hazırlık arttıkça azalma eğilimindedir; bu yüzden düzenli bir çalışma planı kaygıyı azaltmaya da yardım eder.' : c.has('anx_others') || c.has('anx_self') ? 'Kaygı, sonuçların nasıl değerlendirileceği ve "yeterince iyi olamama" endişesiyle besleniyor. Bu tür kaygıda evdeki ve okuldaki dil önemli bir rol oynar.' : 'Kaygı belirli sınav anlarında yükseliyor; özellikle önemli ve süreli sınavlarda daha belirgin hâle gelebiliyor.')));
  } else if (c.has('anx_prep')) {
    blocks.push(P(c.f('Genel tablo sakin olsa da "yeterince hazır değilim" duygusu diğer alt boyutlardan daha yüksek. Bu duygu, düzenli bir çalışma rutini ve tamamlanan konuların görünür kılınmasıyla azalabilir.')));
  }
  blocks.push({
    t: 'chart',
    chart: { kind: 'columns3d', color: a.color, points: [{ label: 'Bilişsel', value: types.bilissel ?? 0 }, { label: 'Bedensel', value: types.bedensel ?? 0 }, { label: 'Sosyal', value: types.sosyal ?? 0 }], title: 'Kaygı tiplerinin dağılımı' },
  });
  return { title: 'Kaygı Profili: Ne Zaman, Nasıl, Neden', blocks };
};

const anxietyImpact: SubBuilder = (c) => {
  const a = c.get('sinav-kaygisi');
  if (!a) return null;
  const items: string[] = [];
  if (c.has('anx_prep')) items.push(c.has('st_good') ? '**Hazırlık döneminde:** Düzenli çalışmasına rağmen "yetişmeyecek" düşüncesi zihnini meşgul edebilir ve çalışmanın keyfini azaltabilir.' : '**Hazırlık döneminde:** "Yetişmeyecek" düşüncesi çalışmaya başlamayı zorlaştırabilir ya da verimsiz, dağınık bir çalışmaya yol açabilir.');
  if (c.has('anx_body')) items.push('**Sınav öncesinde:** Uyku ve iştah bozulabilir; sınav sabahı bedensel gerginlik yükselebilir.');
  if (c.has('anx_blank')) items.push('**Sınav sırasında:** Zihnin boşalması, bilinen soruların hatırlanamamasına ve sürenin verimsiz kullanılmasına yol açabilir.');
  if (c.has('anx_others') || c.has('anx_self')) items.push('**Sınav sonrasında:** Sonucun başkalarınca nasıl karşılanacağı endişesi, bir sonraki sınava hazırlanırken motivasyonu etkileyebilir.');
  if (c.has('anx_future')) items.push('**Uzun vadede:** Sınavı geleceğin tamamını belirleyen bir an gibi görmek, kaygıyı tüm hazırlık sürecine yayabilir.');
  if (!items.length) {
    return { title: 'Kaygı Performansı Nerede Etkiliyor', blocks: [P(c.f(c.has('anx_low') ? '{adın} kaygı düzeyi düşük; sınav performansı üzerinde belirgin bir olumsuz etki beklenmiyor. Sınav anındaki sakinliği önemli bir avantaj.' : 'Kaygının performansa etkisi sınırlı görünüyor; yine de önemli sınav dönemlerinde gözlem yapmak faydalı olur.'))] };
  }
  return { title: 'Kaygı Performansı Nerede Etkiliyor', blocks: [P(c.f('Sonuçlar, kaygının {adın} sınav sürecinin farklı anlarında farklı biçimlerde ortaya çıkabileceğini gösteriyor:')), BUL(items)] };
};

const focus: SubBuilder = (c) => {
  const a = c.get('dikkat');
  if (!a) return null;
  const main = a.levels[0];
  const blocks: Block[] = [];
  blocks.push(P(c.f(main.level >= 4
    ? 'Dikkat sonuçları, ders çalışırken ve sınavlarda {ada} önemli bir dayanak sunuyor: Uzun ve yorucu görevlerde bile hızını ve doğruluğunu koruyabiliyor.'
    : main.level === 3
      ? 'Dikkat sonuçları, kısa ve orta uzunluktaki görevlerde {adın} verimli çalışabildiğini; çok uzun ve tekdüze görevlerde ise dikkatin azalabileceğini gösteriyor. 25-30 dakikalık bloklar ve kısa molalar bu yüzden önemli.'
      : 'Dikkat sonuçları, {adın} dikkatini uzun süre sürdürmekte zorlandığını gösteriyor. Ders çalışırken kısa bloklar, sade bir ortam ve sınavda kontrol stratejileri bu zorlanmayı azaltabilir.')));
  if (c.has('att_impulsive')) blocks.push(P(c.f('Hızlı çalışıyor ancak acele ettiğinde hata oranı yükseliyor. Sınavda soru kökünü okumadan cevaba geçmek gibi dikkatsizlik hataları bu profilin tipik riskidir.')));
  if (c.has('att_slow')) blocks.push(P(c.f('Doğruluğu iyi, ancak temkinli ve görece yavaş çalışıyor. Süreli sınavlarda tempo çalışması önem kazanıyor.')));
  if (c.has('att_fluct') || c.has('att_late_drop')) blocks.push(P(c.f('Görev ilerledikçe dikkat düzeyinde dalgalanma ya da düşüş görülüyor. Uzun sınavların son bölümlerinde performans kaybı yaşanabilir; bölüm aralarında kısa duruş molaları bu düşüşü azaltabilir.')));
  if (main.level <= 2) blocks.push(NOTE('Bu sonuç tek başına bir tanı anlamına gelmez. Dikkat güçlüğü birden fazla ortamda belirgin biçimde sürüyorsa kapsamlı bir uzman değerlendirmesi önerilir.'));
  return { title: 'Odaklanma Gücü ve Dayanıklılığı', blocks };
};

const studyAttention: SubBuilder = (c) => {
  const at = c.get('dikkat');
  const st = c.get('calisma-davranisi');
  if (!at || !st) return null;
  const atL = at.levels[0].level;
  const stL = Number((st.facts as Record<string, unknown>).overallLevel) as Level;
  let text: string;
  if (atL >= 4 && stL <= 2) text = 'Dikkat göstergeleri güçlü, ancak çalışma düzeni zayıf. Bu tablo önemli bir ipucu veriyor: Verim kaybının kaynağı dikkat değil, çalışmayı sürdürmeye yarayan alışkanlıkların eksikliği. Doğru bir rutin kurulduğunda belirgin bir ilerleme görülebilir.';
  else if (atL >= 4 && (c.has('st_start_low') || c.has('st_exam_low'))) text = `Dikkat göstergeleri güçlü; çalışma düzeni ise genel olarak orta, ancak ${c.has('st_start_low') ? 'çalışmaya başlama ve sürdürme' : 'sınava hazırlanma'} alanı zayıf. Bu tablo, verimi artırmada belirleyici olanın dikkat değil, çalışmayı başlatıp sürdürmeye yarayan alışkanlıklar olduğunu gösteriyor.`;
  else if (atL <= 2 && stL >= 4) text = 'Çalışma alışkanlıkları iyi, ancak dikkat göstergelerinde zorlanma var. {ad} çaba gösteriyor; ancak uzun ve kesintisiz çalışma blokları dikkat kapasitesini aşabiliyor. Kısa bloklar ve planlı molalar emeğinin karşılığını artıracaktır.';
  else if (atL <= 2 && stL <= 2) text = 'Hem dikkat hem çalışma düzeninde destek ihtiyacı görülüyor. Bu iki alan birbirini besliyor: Dağınık bir çalışma ortamı dikkati zorluyor, dikkat zorlandıkça çalışmayı sürdürmek güçleşiyor. Önce ortam ve rutin, sonra süre artırımı önerilir.';
  else text = 'Dikkat ve çalışma düzeni birbiriyle uyumlu bir tablo çiziyor. Mevcut düzeni koruyarak kısa ve hedefli tekrarlarla ilerlemek yeterli olacaktır.';
  return { title: 'Çalışma Düzeni ile Dikkat Arasındaki Bağ', blocks: [P(c.f(text))] };
};

const mockExams: SubBuilder = (c) => {
  if (!c.get('sinav-kaygisi') && !c.get('dikkat') && !c.get('akademik-analiz')) return null;
  const items: string[] = [];
  if (c.has('anx_blank') || c.has('anx_high')) items.push('İlk sorularda gerginlik yüksek olabilir; bilinen sorularda takılma ve süreyi verimsiz kullanma görülebilir.');
  if (c.has('att_impulsive')) items.push('Hızlı ilerlerken dikkatsizlik hataları artabilir; özellikle "değildir", "yanlıştır" gibi olumsuz soru köklerinde.');
  if (c.has('att_slow') || c.has('rd_slow')) items.push('Süre yetmeyebilir; son bölümlerdeki sorular boş kalabilir.');
  if (c.has('att_fluct') || c.has('att_late_drop')) items.push('Sınavın son bölümlerinde dikkat düşüşüyle birlikte hata oranı artabilir.');
  if (c.has('ac_read_low')) items.push('Uzun soru köklerinde soruyu yanlış anlama kaynaklı hatalar görülebilir.');
  if (!items.length) items.push('Belirgin bir risk örüntüsü görünmüyor; deneme sınavlarında istikrarın korunması önemli.');
  return {
    title: 'Deneme Sınavlarında Neler Oluyor',
    blocks: [
      P(c.f('Sonuçlar, deneme sınavlarında aşağıdaki durumların yaşanabileceğini düşündürüyor. Bunlar kesin yargılar değil, deneme sonrası birlikte kontrol edilecek gözlem noktalarıdır:')),
      BUL(items),
      NOTE(c.f('Her denemeden sonra yanlışları "bilmiyordum – dikkatsizlik – süre yetmedi – kaygı" diye dört gruba ayırmak, {adın} hangi alanda ilerlemesi gerektiğini netleştirir.')),
    ],
  };
};

const examAdvantages: SubBuilder = (c) => {
  const items: string[] = [];
  if (c.has('anx_low')) items.push('Sınav anında sakin kalabilmesi');
  if (c.has('att_good')) items.push('Dikkatini uzun süre ve doğru biçimde sürdürebilmesi');
  if (c.has('st_good')) items.push('Yerleşmiş çalışma alışkanlıkları');
  if (c.has('ac_high')) items.push('Güçlü akademik zemin');
  else if (c.has('ac_good')) items.push('Sağlam bir akademik temel');
  if (c.has('ac_read_high')) items.push(c.has('rd_fast') ? 'Okuduğunu hızlı ve doğru anlaması' : 'Okuduğunu doğru anlaması');
  if (c.has('ac_logic_high')) items.push('Güçlü mantık yürütme becerisi');
  if (c.has('ac_math_high')) items.push('Matematikte güçlü temel');
  if (c.has('st_exam_high')) items.push('Sınava hazırlanma ve sınavda zamanı yönetme becerisi');
  // Aynı alanı ikinci kez söyleyen genel güçlü yanları ele
  const covered = items.join(' ').toLocaleLowerCase('tr');
  const KEYS = ['dikkat', 'sakin', 'çalışma', 'akademik', 'okuduğunu', 'mantık', 'matematik', 'sınav'];
  const strengths = items.length >= 3 ? [] : c
    .collect<string>('strengths', 4)
    .map(c.f)
    .filter((x) => !KEYS.some((k) => covered.includes(k) && x.toLocaleLowerCase('tr').includes(k)));
  const all = [...items, ...strengths].slice(0, 5);
  if (!all.length) return null;
  return { title: c.f('{adın} Sınav Avantajları'), blocks: [P(c.f('Sınav sürecinde {adın} dayanabileceği güçlü yanlar:')), BUL(all)] };
};

const examRisks: SubBuilder = (c) => {
  const s = risks(c);
  return s ? { ...s, title: 'Öncelikli Riskler' } : null;
};

const examStrategy: SubBuilder = (c) => {
  const before: string[] = ['Deneme sınavlarını gerçek sınav saatinde ve süresinde çözmek', 'Sınavdan önceki gece yeni konu çalışmamak, erken uyumak'];
  const during: string[] = ['Önce bilinen soruları çözmek; takılınan soruyu işaretleyip geçmek'];
  const after: string[] = ['Yanlış yapılan soruların konularını bir sonraki hafta yeniden çalışmak'];
  const w = weakestAcademic(c);
  if (w && w.level <= 3) before.push(`En zayıf alan olan ${w.short} için haftada en az iki kısa konu tekrarı ve soru seti`);
  if (c.has('anx_high') || c.has('anx_mid')) {
    before.push('Sınav sabahı için sabit ve sakin bir rutin');
    during.push('Gerginlik yükseldiğinde 3 derin nefes alıp soruya dönmek');
  }
  if (c.has('att_impulsive')) during.push('Cevabı işaretlemeden önce soru kökünü bir kez daha okumak');
  if (c.has('att_slow') || c.has('rd_slow')) during.push('Bölüm başına süre planı yapıp saati kontrol etmek');
  if (c.has('att_fluct') || c.has('att_late_drop')) during.push('Bölüm aralarında 20 saniyelik duruş ve nefes molası');
  if (c.has('st_weak')) after.push('Haftada bir tekrar günü belirleyip o haftanın konularını gözden geçirmek');
  return {
    title: 'Sınav Stratejisi',
    blocks: [
      P('**Sınav öncesi**'),
      BUL(before),
      P('**Sınav sırasında**'),
      BUL(during),
      P('**Sınav sonrasında**'),
      BUL(after),
    ],
  };
};

const proSupport: SubBuilder = (c) => {
  const items: string[] = [];
  if (c.has('anx_high')) items.push(`Sınav kaygısının ${Number((c.get('sinav-kaygisi')?.facts as Record<string, unknown> | undefined)?.totalLevel) === 5 ? 'yüksek' : 'belirgin'} olması nedeniyle okulun rehberlik servisiyle kaygı yönetimi üzerine birkaç görüşme planlanması önerilir.`);
  if (c.has('att_low')) items.push('Dikkat göstergelerindeki zorlanma birden fazla ortamda sürüyorsa kapsamlı bir uzman değerlendirmesi düşünülebilir.');
  if (c.has('ac_low')) items.push('Temel eksiklerin kapanması için yapılandırılmış bir ders desteği faydalı olacaktır.');
  if (!items.length) items.push('Şu an için ek bir profesyonel destek ihtiyacı görünmüyor; düzenli takip yeterli olacaktır.');
  return { title: 'Profesyonel Destek Önerisi', blocks: [BUL(items)] };
};

// ── Kariyer alt bölümleri ────────────────────────────────────

function hollandCode(c: Ctx): string {
  const h = c.get('holland');
  return h ? String((h.facts as Record<string, unknown>).code ?? '') : '';
}

const careerIdentity: SubBuilder = (c) => {
  const code = hollandCode(c);
  if (!code) return null;
  const p = c.persona;
  const enn = c.get('enneagram');
  const main = enn ? Number((enn.facts as Record<string, unknown>).main) : 0;
  const blocks: Block[] = [
    P(c.f(`{adın} kariyer kimliğinin merkezinde ${HOLLAND_LABEL[code[0]]} ilgiler duruyor.${code[1] ? ` Buna ${joinTr(code.slice(1).split('').map((k) => HOLLAND_LABEL[k].toLocaleLowerCase('tr-TR')))} ilgiler eşlik ediyor.` : ''}`)),
  ];
  if (main && p) blocks.push(P(c.f(`Kişilik açısından ${ENNEAGRAM_LABEL[main].toLocaleLowerCase('tr-TR')} bir yönelimi var. Bu, meslek seçiminde yalnızca "ne yapacağı" değil, "nasıl bir ortamda" çalışacağı sorusunun da önemli olduğunu gösteriyor.`)));
  blocks.push(KEY(c.f(`Kariyer kimliğinin özü: {ad} için en uygun alanlar, ${HOLLAND_INFO[code[0]]?.act ?? ''}${code[1] ? ` ile ${HOLLAND_INFO[code[1]]?.act ?? ''}` : ''} becerilerini birlikte kullanabileceği alanlar.`)));
  return { title: c.f('{adın} Kariyer Kimliği'), blocks };
};

const interestProfile: SubBuilder = (c) => {
  const code = hollandCode(c);
  if (!code) return null;
  const blocks: Block[] = code.split('').map((k, i) => P(c.f(`**${i + 1}. ${HOLLAND_LABEL[k]} (${k}):** ${capFirst(HOLLAND_INFO[k]?.like ?? '')} seviyor.${i === 0 ? ` ${capFirst(HOLLAND_INFO[k]?.env ?? '')} ortamlarda kendini daha rahat hissedebilir.` : ''}`)));
  const h = c.get('holland');
  const order = ((h?.facts as Record<string, unknown> | undefined)?.order as string[]) ?? [];
  const last = order[order.length - 1];
  if (last && !code.includes(last)) blocks.push(P(c.f(`${HOLLAND_LABEL[last]} alan ise en düşük ilgiyi gördüğü alan; ${HOLLAND_INFO[last]?.act ?? ''} ağırlıklı işler ona şu an daha az çekici geliyor.`)));
  if (c.has('hol_flat')) blocks.push(NOTE('Alanlar arasındaki farklar küçük. Bu durum ilgilerin henüz netleşmediğini gösterebilir; staj, kulüp ve gönüllü çalışmalarla farklı alanları denemek önerilir.'));
  return { title: c.f('İlgi Profili: {ad} Neyle İlgileniyor'), blocks };
};

const interestFit: SubBuilder = (c) => {
  const s = interestProfile(c);
  return s ? { ...s, title: 'İlgi Profili ve Meslek Uyumu' } : null;
};

const workEnvironment: SubBuilder = (c) => {
  const code = hollandCode(c);
  const p = c.persona;
  if (!code && !p?.workEnv?.length) return null;
  const items = [...(p?.workEnv ?? []).slice(0, 3).map(c.f)];
  if (code && (code[1] || !items.length)) items.push(`${capFirst(HOLLAND_INFO[code[1] ?? code[0]]?.env ?? '')} ortamlar.`);
  return { title: 'Kişiliğine Uygun Çalışma Ortamı', blocks: [P(c.f('{adın} kişilik ve ilgi profili birlikte okunduğunda, en verimli olacağı çalışma ortamının özellikleri şöyle özetlenebilir:')), BUL(items)] };
};

const skillMap: SubBuilder = (c) => {
  const code = hollandCode(c);
  if (!code) return null;
  const mi = c.get('coklu-zeka');
  const rows: [string, string][] = code.split('').map((k) => [HOLLAND_LABEL[k], capFirst(HOLLAND_INFO[k]?.skill ?? '')]);
  if (mi) {
    const top = ((mi.facts as Record<string, unknown>).top as string[]) ?? [];
    top.slice(0, 2).forEach((k) => rows.push([MI_LABEL[k], `${capFirst(MI_INFO[k]?.learn ?? '')} öğrenmeye yatkın`]));
  }
  return { title: 'İlgilerine Göre Geliştirebileceği Beceriler', blocks: [P(c.f('{adın} ilgi ve tercihlerinin işaret ettiği, geliştirmeye değer beceriler:')), { t: 'table', head: ['Alan', 'Geliştirilebilecek beceri'], rows }, NOTE('Bu tablo ölçülmüş beceri düzeylerini değil, ilgilerin işaret ettiği ve geliştirilebilecek becerileri gösterir.')] };
};

const productiveAreas: SubBuilder = (c) => {
  const code = hollandCode(c);
  if (!code) return null;
  const p = c.persona;
  const blocks: Block[] = [P(c.f(`İlgi profiline göre {adın} en çok ${HOLLAND_INFO[code[0]]?.act ?? ''} gerektiren işlerde verimli olma ihtimali yüksek.${code[1] ? ` ${capFirst(HOLLAND_INFO[code[1]]?.act ?? '')} gerektiren işler de onun için güçlü bir ikinci alan olabilir.` : ''}`))];
  if (p?.resourceBullets?.length) blocks.push(P(c.f(`Kişilik açısından ${joinList(p.resourceBullets.slice(0, 3).map((x) => x.toLocaleLowerCase('tr-TR')))}, bu alanlarda ona ek bir güç katıyor.`)));
  return { title: 'En Verimli Olabileceği Alanlar', blocks };
};

const drains: SubBuilder = (c) => {
  const p = c.persona;
  const h = c.get('holland');
  const order = ((h?.facts as Record<string, unknown> | undefined)?.order as string[]) ?? [];
  const last = order[order.length - 1];
  const items = [...(p?.drains ?? []).map(c.f)];
  if (last && !hollandCode(c).includes(last)) items.push(`Ağırlıklı olarak ${HOLLAND_INFO[last]?.act ?? ''} gerektiren işler.`);
  if (!items.length) return null;
  return { title: 'Yorulabileceği ve Tükenebileceği Ortamlar', blocks: [P(c.f('Aşağıdaki ortamlar {adı} uzun vadede yorabilir. Bu, bu alanlardan tamamen uzak durması gerektiği anlamına gelmez; yalnızca enerjisinin nerede daha kolay aktığını gösterir.')), BUL(items)] };
};

const careerFields: SubBuilder = (c) => {
  const code = hollandCode(c);
  if (!code) return null;
  const rows: [string, string][] = [];
  const seenJobs = new Set<string>();
  const KEYWORD = (j: string) => {
    const x = j.toLocaleLowerCase('tr-TR');
    if (/tıp|hekim|hemşire|sağlık|eczacı/.test(x)) return 'saglik';
    if (/mühendis/.test(x)) return 'muhendis';
    if (/psikolo|rehber/.test(x)) return 'psikoloji';
    return x.split(/[ ,]/)[0].slice(0, 5);
  };
  code.split('').slice(0, 3).forEach((k, i) => {
    (HOLLAND_INFO[k]?.jobs ?? [])
      .filter((j) => !seenJobs.has(KEYWORD(j)))
      .slice(0, i === 0 ? 3 : 2)
      .forEach((j) => {
        seenJobs.add(KEYWORD(j));
        rows.push([capFirst(j), `${HOLLAND_LABEL[k]} ilgileriyle uyumlu (${i === 0 ? 'en güçlü ilgi' : 'destekleyici ilgi'})`]);
      });
  });
  return {
    title: 'Uygun Meslek ve Alanlar',
    blocks: [P(c.f('İlgi profiline göre {adın} keşfetmeye değer meslek alanları:')), { t: 'table', head: ['Meslek alanı', 'Uyum'], rows }, NOTE('Bu liste bir karar değil, keşif için bir başlangıç noktasıdır. Meslek seçiminde ilgilerin yanında akademik başarı, değerler ve iş koşulları da birlikte değerlendirilmelidir.')],
  };
};

const majorsMap: SubBuilder = (c) => {
  const code = hollandCode(c);
  if (!code) return null;
  const h = c.get('holland');
  const order = ((h?.facts as Record<string, unknown> | undefined)?.order as string[]) ?? [];
  const last = order[order.length - 1];
  const st = stageOf(c);
  if (st === 'ilkokul' || st === 'ortaokul') {
    const LISE: Record<string, string> = {
      R: 'Mesleki ve Teknik Anadolu Liselerinin teknik alanları; Anadolu Lisesi',
      I: 'Fen Lisesi; Anadolu Lisesi (sayısal ağırlıklı)',
      A: 'Güzel Sanatlar Lisesi; Anadolu Lisesi',
      S: 'Sosyal Bilimler Lisesi; Anadolu Lisesi',
      E: 'Sosyal Bilimler Lisesi; Anadolu Lisesi',
      C: 'Anadolu Lisesi; Mesleki ve Teknik Anadolu Liselerinin büro ve finans alanları',
    };
    const lrows: [string, string][] = [['İlgiyle en uyumlu', LISE[code[0]] ?? 'Anadolu Lisesi']];
    if (code[1] && LISE[code[1]] !== LISE[code[0]]) lrows.push(['Değerlendirilebilir', LISE[code[1]]]);
    return {
      title: 'Lise Türü ve Alan Haritası',
      blocks: [
        P(c.f('{ad} henüz ortaokulda; bu yüzden üniversite bölümünden önce lise türü kararı gündemde. İlgi profiline göre değerlendirilebilecek lise türleri:')),
        { t: 'table', head: ['Uyum düzeyi', 'Lise türü'], rows: lrows },
        NOTE('Lise tercihinde LGS puanı, okulun konumu ve öğrencinin akademik durumu da belirleyicidir. Bu tablo, ilgi temelli bir ön yönlendirmedir.'),
      ],
    };
  }
  // Aynı alan (ör. Tıp) iki satırda birden çıkmasın: anahtar kelimeye göre tekilleştir.
  const seen = new Set<string>();
  const keyOf = (x: string) => {
    const t = x.toLocaleLowerCase('tr-TR');
    if (/tıp|hekim|hemşire|eczacı|fizyoterapi/.test(t)) return 'saglik';
    if (/mühendis|mekatronik/.test(t)) return 'muhendislik:' + t;
    if (/psikolo|rehberlik/.test(t)) return 'psikoloji';
    if (/kamu yönetimi|siyaset/.test(t)) return 'kamu';
    return t;
  };
  const pick = (k: string, n: number) =>
    (HOLLAND_INFO[k]?.fields ?? [])
      .filter((x) => !seen.has(keyOf(x)))
      .slice(0, n)
      .map((x) => (seen.add(keyOf(x)), x))
      .join(', ');
  const rows: [string, string][] = [['İlgiyle en uyumlu', pick(code[0], 4)]];
  if (code[1]) rows.push(['Değerlendirilebilir', pick(code[1], 3)]);
  if (code[2]) rows.push(['Keşfedilebilir', pick(code[2], 3)]);
  if (last && !code.includes(last)) rows.push(['Şu an daha az ilgi duyduğu', pick(last, 3)]);
  const note = st === null
    ? 'Bu harita uzun vadeli, ilgi temelli bir ön yönlendirmedir. Öğrenci henüz lise türü tercihi aşamasındaysa önce ilgisine uygun lise türü değerlendirilmeli; bölüm tercihinde ise puan ve sınav türü de belirleyici olacaktır.'
    : 'Bölüm tercihinde puan aralıkları ve sınav türü de belirleyicidir. Bu harita, ilgi temelli bir ön yönlendirmedir.';
  return { title: 'Bölüm ve Alan Tercih Haritası', blocks: [{ t: 'table', head: ['İlgiyle uyum', 'Bölüm ve alanlar'], rows: rows.filter((r) => r[1]) }, NOTE(note)] };
};

const selfDevelopment: SubBuilder = (c) => {
  const dev = c.collect<string>('develop', 3).map(c.f);
  const grow = dev.length ? dev : c.collect<string>('growth', 3).map(c.f);
  const code = hollandCode(c);
  const items = [...grow];
  if (code) items.push(`${capFirst(HOLLAND_INFO[code[0]]?.skill ?? '')} becerisini okul dışı projeler, kulüpler ve yaz etkinlikleriyle derinleştirmek.`);
  items.push('İlgi duyduğu alanlarda çalışan kişilerle tanışmak ve onların günlük işlerini gözlemlemek.');
  return { title: 'Kendini Geliştirme Modeli', blocks: [P(c.f('{adın} kariyer yolunda güçlenmesi için önerilen gelişim adımları:')), BUL(items.slice(0, 5))] };
};

const decisionTips: SubBuilder = (c) => {
  const p = c.persona;
  const items: string[] = [];
  const enn = c.get('enneagram');
  const main = enn ? Number((enn.facts as Record<string, unknown>).main) : 0;
  const byType: Record<number, string> = {
    1: '"Tek doğru seçim" arayışına takılmamak; birden fazla iyi seçenek olabileceğini kabul etmek.',
    2: 'Başkalarının beklentilerini değil, kendi ilgi ve isteklerini merkeze almak.',
    3: 'Yalnızca prestijli görünen seçeneklere odaklanmamak; gerçekten keyif alacağı alanı sorgulamak.',
    4: 'Duygusal anlarda karar vermemek; seçenekleri sakin bir dönemde yeniden değerlendirmek.',
    5: 'Araştırmayı sonsuza kadar sürdürmemek; yeterli bilgi toplandığında karar vermek.',
    6: 'Kaygının kararı belirlemesine izin vermemek; güvendiği kişilere danışırken kendi sesini de dinlemek.',
    7: 'Her ilginç seçeneğe aynı anda yönelmemek; birkaç alanı derinlemesine denemek.',
    8: 'Aceleyle karar vermemek; farklı görüşleri dinlemeye zaman ayırmak.',
    9: 'Kararı ertelememek; kendi isteğini açıkça ortaya koymak.',
  };
  if (main && byType[main]) items.push(byType[main]);
  const st = stageOf(c);
  if (st === 'ilkokul' || st === 'ortaokul') {
    items.push('Lise tercihini yalnızca LGS puanına göre değil, ilgi alanlarına ve okulun sunduğu imkânlara göre de değerlendirmek.');
    items.push('Tercih edilen liseleri tanıtım günlerinde ziyaret etmek; o okullarda okuyan öğrencilerle konuşmak.');
  } else if (st === 'lise') {
    items.push('Bölüm tercihini yalnızca puana göre değil, ilgi ve çalışma ortamı tercihlerine göre de değerlendirmek.');
    items.push('Merak ettiği alanlarda üniversite tanıtım günleri, kısa kurslar ya da gönüllü çalışmalarla deneyim kazanmak.');
  } else {
    items.push('Okul ve alan tercihlerini yalnızca puana göre değil, ilgi alanlarına ve çalışma ortamı tercihlerine göre de değerlendirmek.');
    items.push('Merak ettiği alanlarda tanıtım günleri, kulüpler, kısa kurslar ya da gönüllü çalışmalarla deneyim kazanmak.');
  }
  if (c.has('hol_flat')) items.push('İlgiler henüz net değilse, kararı aceleye getirmeden farklı alanları denemeye zaman tanımak.');
  if (!p && !hollandCode(c)) return null;
  return { title: 'Karar Verirken Dikkat Etmesi Gerekenler', blocks: [BUL(items)] };
};

const roadmap: SubBuilder = (c) => {
  if (!hollandCode(c)) return null;
  const rows: { period: string; title: string; text: string }[] = isEarly(c)
    ? [
        { period: 'Bu yıl', title: 'Keşif', text: 'İlgi alanlarıyla ilgili kulüp ve etkinliklere katılmak; farklı meslekleri tanımak.' },
        { period: 'Gelecek yıl', title: 'Derinleşme', text: 'Öne çıkan iki alanda küçük projeler yapmak; alan seçimi için akademik durumu değerlendirmek.' },
        { period: 'Sonraki yıllar', title: 'Netleşme', text: 'Hedef bölümleri belirlemek ve sınav hazırlığını bu hedeflere göre planlamak.' },
      ]
    : [
        { period: 'Önümüzdeki 3 ay', title: 'Netleşme', text: 'Öne çıkan alanlardaki bölümleri araştırmak; tanıtım günlerine katılmak ve alanda çalışanlarla görüşmek.' },
        { period: '3-6 ay', title: 'Hedef belirleme', text: 'Hedef bölüm aralığını belirlemek; deneme sınavlarıyla bugünkü düzey ile hedef arasındaki mesafeyi ölçmek.' },
        { period: '6-12 ay', title: 'Yol haritası', text: 'Sınav hazırlığını hedef bölümlere göre planlamak; hedefi deneme sonuçlarına göre güncellemek.' },
      ];
  return { title: 'Hedef Yol Haritası', blocks: [{ t: 'plan', rows }] };
};

// ── VIP özel alt bölümler ────────────────────────────────────

const atAGlance: SubBuilder = (c) => {
  if (c.analyses.length < 2) return null;
  const rows: [string, string][] = c.analyses.map((a) => {
    const f = a.facts as Record<string, unknown>;
    let txt = '';
    switch (a.testId) {
      case 'enneagram':
        txt = `Tip ${f.main} — ${ENNEAGRAM_LABEL[Number(f.main)]}`;
        break;
      case 'holland':
        txt = `${f.code} · ${String(f.code ?? '').split('').map((k) => HOLLAND_LABEL[k]).join(', ')}`;
        break;
      case 'coklu-zeka':
        txt = ((f.top as string[]) ?? []).slice(0, 2).map((k) => MI_LABEL[k]).join(', ');
        break;
      case 'vark':
        txt = f.multimodal ? `Çok yönlü: ${varkName(String(f.dominant)).toLocaleLowerCase('tr-TR')} ve ${varkName(String(f.second)).toLocaleLowerCase('tr-TR')}` : varkName(String(f.dominant));
        break;
      case 'akademik-analiz': {
        const rows = [...a.levels].sort((x, y) => (y.pct ?? 0) - (x.pct ?? 0));
        txt = rows.length > 1 ? `En güçlü alan ${rows[0].label.toLocaleLowerCase('tr-TR')} (${lv(rows[0].level)}), en zayıf alan ${rows[rows.length - 1].label.toLocaleLowerCase('tr-TR')} (${lv(rows[rows.length - 1].level)})` : rows[0] ? `${rows[0].label} ${lv(rows[0].level)}` : '';
        break;
      }
      case 'sag-sol-beyin':
        txt = a.headline ?? '';
        break;
      case 'hizli-okuma':
        txt = `Okuma hızı ${lv(a.levels[0]?.level ?? 3)}, anlama oranı ${lv(a.levels[1]?.level ?? 3)}`;
        break;
      case 'd2-dikkat':
      case 'burdon-dikkat':
        txt = `Dikkat ${lv(a.levels[0]?.level ?? 3)}${f.balance ? `; ${String(f.balance).replace(/\s*\(.*\)/, '').toLocaleLowerCase('tr-TR')} çalışma biçimi` : ''}`;
        break;
      case 'sinav-kaygisi':
        txt = `Genel kaygı ${lv(Number(f.totalLevel) as Level)}`;
        break;
      case 'calisma-davranisi':
        txt = `Genel çalışma düzeni ${lv(Number(f.overallLevel) as Level)}`;
        break;
      default:
        txt = a.headline ?? (a.levels[0] ? `${a.levels[0].label} ${lv(a.levels[0].level)}` : '');
    }
    return [a.name, txt];
  });
  return { title: c.f('{adı} Bir Bakışta Tanımak'), blocks: [{ t: 'table', head: ['Değerlendirme', 'Öne çıkan sonuç'], rows }] };
};

const academicAndLearning: SubBuilder = (c) => {
  const a = academicPicture(c);
  const l = learningPrefs(c);
  if (!a && !l) return null;
  const rd = c.get('hizli-okuma');
  const extra: Block[] = [];
  if (rd) {
    const f = rd.facts as Record<string, unknown>;
    extra.push(P(c.f(`Okuma becerisinde {ad} dakikada yaklaşık ${Math.round(Number(f.wpm) || 0)} kelime okuyor ve okuduğunun %${Math.round(Number(f.comp) || 0)} kadarını anlıyor. ${c.has('rd_comp_high') && !c.has('rd_fast') ? 'Anlama güçlü; anlamayı koruyarak hızını artırması, uzun metinli sınavlarda zaman kazandırır.' : c.has('rd_rushing') ? 'Hız iyi, ancak anlama desteklenmeli; acele etmeden okumak öncelikli.' : c.has('rd_slow') ? 'Okuma hızı, süreli sınavlarda zorlanmaya yol açabilir; düzenli okuma alışkanlığı hızı da artırır.' : 'Hız ve anlama dengeli.'}`)));
  }
  return { title: 'Akademik Tablo ve Öğrenme Tercihleri', blocks: [...(a?.blocks ?? []), ...extra, ...(l?.blocks ?? []).filter((b) => b.t !== 'callout')] };
};

const examAnxietyVip: SubBuilder = (c) => {
  const s = anxietyProfile(c);
  return s ? { ...s, title: 'Sınav Kaygısı' } : null;
};

const focusVip: SubBuilder = (c) => {
  const s = focus(c);
  return s ? { ...s, title: 'Dikkat ve Odaklanma' } : null;
};

const studyHabitsVip: SubBuilder = (c) => {
  const s = studyHabits(c);
  return s ? { ...s, title: 'Çalışma Alışkanlıkları' } : null;
};

const personalityAcademic: SubBuilder = (c) => {
  const enn = c.get('enneagram');
  if (!enn || (!c.get('calisma-davranisi') && !c.get('akademik-analiz'))) return null;
  const main = Number((enn.facts as Record<string, unknown>).main);
  const txt: Record<number, string> = {
    1: 'İlkeli ve mükemmeliyetçi yapısı, özenli ve düzenli çalışmasını destekliyor; ancak "tam doğru" beklentisi başlamayı geciktirebiliyor ve sınavlarda zaman kaybına yol açabiliyor.',
    2: 'İlişki odaklı yapısı, sevdiği öğretmenin dersinde ve grup çalışmalarında motivasyonunu artırıyor; ancak başkalarına yardım ederken kendi çalışmasını erteleyebiliyor.',
    3: 'Hedef odaklı yapısı, net hedefler ve görünür ilerleme olduğunda verimini artırıyor; ancak zorlandığı derslerden uzaklaşma riski taşıyor.',
    4: 'Duygusal derinliği, anlam bulduğu derslerde derinlemesine öğrenmesini sağlıyor; ancak duygu durumuna bağlı çalışma düzeni dalgalanabiliyor.',
    5: 'Meraklı ve analitik yapısı, anlamaya dayalı öğrenmeyi destekliyor; ancak "tamamen hazır olma" beklentisi soru çözme ve uygulamayı geciktirebiliyor.',
    6: 'Sorumluluk sahibi yapısı, düzenli hazırlığı destekliyor; ancak belirsizlik ve kaygı, sınav performansını etkileyebiliyor.',
    7: 'Meraklı ve enerjik yapısı, yeni konuları hızla kavramasını sağlıyor; ancak tekrar gerektiren işlerde sürekliliği korumakta zorlanabiliyor.',
    8: 'Kararlı yapısı, kendi koyduğu hedeflere güçlü bir çaba göstermesini sağlıyor; ancak dayatılan kurallara direnç, çalışma düzenini etkileyebiliyor.',
    9: 'Sakin ve uyumlu yapısı, dengeli bir öğrenme ortamı sağlıyor; ancak önemli işleri erteleme eğilimi birikmeye yol açabiliyor.',
  };
  const blocks: Block[] = [P(c.f(`{adın} ${lcFirst(txt[main] ?? '')}`))];
  const stWeakish = c.has('st_weak') || c.has('st_start_low');
  if (stWeakish && [3, 4, 7, 9].includes(main)) blocks.push(P(c.f(`Çalışma davranışı sonuçları da bu tabloyla uyumlu: ${c.has('st_start_low') ? 'Çalışmaya başlama ve sürdürme alanının düşük çıkması' : 'Çalışma düzeninin zayıf çıkması'}, sorunun kapasiteden çok çalışmayı sürdürmeye yarayan yapıda olduğunu düşündürüyor.`)));
  if (c.has('att_good') && stWeakish) blocks.push(P(c.f('Dikkat sonuçlarının güçlü olması da bunu destekliyor: {ad} odaklandığında verimli çalışabiliyor; asıl ihtiyaç, bu odağı düzenli aralıklarla devreye sokacak bir rutin.')));
  const w = weakestAcademic(c);
  if (w && w.short === 'matematik' && w.level <= 3 && [4, 7, 9].includes(main)) blocks.push(P(c.f('Tekrar ve birikim gerektiren matematikte düzeyin görece düşük kalması da bu süreklilik ihtiyacıyla ilişkili olabilir; matematik, kısa ama düzenli tekrarlarla en çok gelişen derslerden biridir.')));
  if (c.has('anx_high') && [1, 3, 6].includes(main)) blocks.push(P(c.f('Sınav kaygısı sonuçları, kişilik yapısındaki yüksek beklenti ve kontrol ihtiyacıyla uyumlu; kaygı büyük ölçüde bu iç beklentiden besleniyor olabilir.')));
  return { title: 'Kişiliği Akademik Performansını Nasıl Etkiliyor', blocks };
};

const anxietySource: SubBuilder = (c) => {
  const a = c.get('sinav-kaygisi');
  if (!a) return null;
  const sources: string[] = [];
  if (c.has('anx_prep')) sources.push(c.has('st_good') ? '**Hazırlık duygusu:** "Yeterince çalışmadım" duygusu öne çıkıyor; oysa çalışma alışkanlıkları iyi düzeyde. Bu, hazırlıksızlık hissinin gerçek hazırlıktan büyük olduğunu düşündürüyor.' : '**Hazırlık durumu:** "Yeterince çalışmadım" duygusu kaygının en belirgin kaynağı.');
  if (c.has('anx_self')) sources.push('**İç beklenti:** Kendine yönelik yüksek beklenti ve kendini yetersiz görme.');
  if (c.has('anx_others')) sources.push('**Dış değerlendirme:** Ailenin, öğretmenin ya da arkadaşların ne düşüneceği endişesi.');
  if (c.has('anx_future')) sources.push('**Gelecek kaygısı:** Sınavı geleceğin tamamını belirleyen bir an gibi görmek.');
  if (c.has('st_weak') && (c.has('anx_high') || c.has('anx_mid'))) sources.push('**Çalışma düzeni:** Düzensiz çalışma, hazırlıksızlık duygusunu artırarak kaygıyı besleyebilir.');
  if (c.has('ac_underconf') && c.has('anx_prep')) sources.push('**Öz değerlendirme:** Akademik öz değerlendirmesinin test sonuçlarından düşük olması, kendini olduğundan az hazır gördüğünü destekliyor.');
  if (!sources.length) return { title: 'Kaygısı Nereden Besleniyor', blocks: [P(c.f(c.has('anx_low') ? 'Belirgin bir kaygı kaynağı öne çıkmıyor; {ad} sınav dönemlerini genel olarak sakin karşılıyor.' : 'Kaygı belirli bir kaynaktan çok genel bir sınav gerginliği olarak görünüyor.'))] };
  return { title: 'Kaygısı Nereden Besleniyor', blocks: [P(c.f(c.has('anx_low') ? 'Genel kaygı düzeyi düşük olsa da aşağıdaki noktalar hazırlık döneminde izlenmeye değer:' : 'Sonuçlar, {adın} kaygısının şu kaynaklardan beslendiğini düşündürüyor:')), BUL(sources)] };
};

const efficiencySource: SubBuilder = (c) => {
  const parts: { name: string; v: number }[] = [];
  const at = attentionPct(c);
  const st = studyPct(c);
  const ax = anxietyPct(c);
  if (at !== undefined) parts.push({ name: 'dikkat', v: at });
  if (st !== undefined) parts.push({ name: 'çalışma düzeni', v: st });
  if (ax !== undefined) parts.push({ name: 'kaygı', v: 100 - ax });
  if (parts.length < 2) return null;
  parts.sort((a, b) => a.v - b.v);
  const weakest = parts[0];
  const blocks: Block[] = [
    P(c.f(`Dikkat, çalışma düzeni ve kaygı sonuçları birlikte karşılaştırıldığında, {adın} verim kaybının en olası kaynağı **${weakest.name}** olarak öne çıkıyor.`)),
  ];
  const others = parts.slice(1).map((p) => p.name);
  const explain: Record<string, string> = {
    dikkat: 'Kısa çalışma blokları, sade bir çalışma ortamı ve sınavda kontrol stratejileri öncelikli.',
    'çalışma düzeni': c.has('st_start_low') ? 'Sorun çalışmaya başlamak ve planı sürdürmekte. Önce kısa ve sabit bir rutin, sonra süre artırımı yaklaşımı öncelikli.' : 'Sorun çalışmanın düzenli sürdürülmesinde. Önce rutin, sonra süre yaklaşımı öncelikli.',
    kaygı: 'Kaygı, bilinenlerin sınava yansımasını zorlaştırabilir. Kaygı yönetimi teknikleri öncelikli.',
  };
  blocks.push(P(c.f(`${capFirst(joinTr(others))} görece daha iyi durumda. ${explain[weakest.name] ?? ''}`)));
  return { title: 'Verim Kaybının Gerçek Kaynağı: Dikkat mi, Düzen mi, Kaygı mı?', blocks };
};

const targetDistance: SubBuilder = (c) => {
  const a = c.get('akademik-analiz');
  if (!a) return null;
  const s = targetRange(c);
  return s ? { ...s, title: 'Hedef ile Bugünkü Durum Arasındaki Mesafe' } : null;
};

const consistency: SubBuilder = (c) => {
  const rows: [string, string][] = [];
  const add = (cond: boolean, finding: string, support: string) => cond && rows.push([finding, support]);
  const stWeakish = c.has('st_weak') || c.has('st_start_low');
  add(stWeakish && (c.has('enn7') || c.has('enn9') || c.has('enn4')), 'Çalışmayı sürdürmede güçlük', 'Kişilik (Enneagram) ve Çalışma Davranışı aynı noktaya işaret ediyor — güçlü tutarlılık');
  add(c.has('anx_high') && (c.has('enn1') || c.has('enn6') || c.has('enn3')), 'Yüksek kaygı ve iç beklenti', 'Kişilik ve Sınav Kaygısı birbirini destekliyor — güçlü tutarlılık');
  add(c.has('att_good') && stWeakish, 'Verim kaybı dikkat kaynaklı değil', 'Dikkat iyi, çalışmaya başlama ve sürdürme zayıf — bulgular sorunun kaynağını netleştiriyor');
  add(c.has('anx_prep') && c.has('ac_underconf'), 'Kendini olduğundan az hazır görme', 'Sınav Kaygısı (hazırlıksızlık) ve Akademik öz değerlendirme aynı yönde — tutarlı');
  add(c.has('anx_prep') && c.has('st_good'), 'Hazırlıksızlık duygusu gerçek hazırlıktan büyük', 'Çalışma alışkanlıkları iyi, hazırlıksızlık kaygısı yüksek — dikkatle izlenmeli');
  add(c.has('anx_low') && c.has('att_good'), 'Sınav anında sakin ve odaklı', 'Sınav Kaygısı ve Dikkat sonuçları birbirini destekliyor — güçlü tutarlılık');
  add(c.has('enn5') && hollandCode(c).includes('I'), 'Araştırma ve derinlemesine düşünme eğilimi', 'Kişilik (Enneagram) ve Holland aynı yönü gösteriyor — güçlü tutarlılık');
  add(c.has('ac_logic_high') && c.has('ac_math_low'), 'Matematikte konu eksiği', 'Mantık güçlü, matematik zayıf — kapasite değil konu eksiği');
  add(c.has('ac_overconf'), 'Gerçekçi olmayan öz değerlendirme', 'Akademik öz değerlendirme ile test sonuçları uyuşmuyor — dikkatle izlenmeli');
  const mi = c.get('coklu-zeka');
  const hol = c.get('holland');
  if (mi && hol) {
    const top = ((mi.facts as Record<string, unknown>).top as string[]) ?? [];
    const code = hollandCode(c);
    const match = (top.includes('sosyal') && code.includes('S')) || (top.includes('mantiksal') && (code.includes('I') || code.includes('C'))) || (top.includes('gorsel') && (code.includes('A') || code.includes('R'))) || (top.includes('dogaci') && (code.includes('I') || code.includes('R'))) || (top.includes('sozel') && (code.includes('A') || code.includes('E') || code.includes('S')));
    rows.push(['İlgi alanları', match ? 'Çoklu Zekâ ve Holland sonuçları aynı yönü gösteriyor — güçlü tutarlılık' : 'Çoklu Zekâ ve Holland sonuçları farklı yönler gösteriyor — ilgiler henüz netleşiyor olabilir']);
  }
  if (!rows.length) return null;
  return { title: 'Bulguların Birbirini Ne Kadar Desteklediği', blocks: [P(c.f('Farklı testlerin aynı noktaya işaret etmesi, bulguların güvenilirliğini artırır. {adın} sonuçlarında öne çıkan tutarlılıklar:')), { t: 'table', head: ['Bulgu', 'Testler arası tutarlılık'], rows }] };
};

const overall: SubBuilder = (c) => {
  const strengths = c.collect<string>('strengths', 3).map(c.f);
  const grow = c.collect<string>('develop', 1).concat(c.collect<string>('growth', 1)).map(c.f);
  const blocks: Block[] = [
    P(c.f('Tüm değerlendirmeler birlikte okunduğunda {ad}, güçlü yanları ve gelişime açık alanları belirgin biçimde ayrışan bir profil çiziyor.')),
  ];
  if (strengths.length) blocks.push(P('En önemli dayanakları:'), BUL(strengths));
  if (grow[0]) blocks.push(KEY(`Bu profilde ilerlemenin anahtarı: ${capFirst(grow[0]).replace(/\.$/, '')}.`));
  blocks.push(NOTE('Bu bölüm, raporda yer alan tüm değerlendirmelerin birlikte yorumlanmasıyla hazırlanan bütünsel bir özettir; bir uzmanın yüz yüze görüşmesinin yerini tutmaz.'));
  return { title: 'Bütünsel Sonuç', blocks };
};

// ── Tek test özel ────────────────────────────────────────────

const reading: SubBuilder = (c) => {
  const a = c.get('hizli-okuma');
  if (!a) return null;
  const blocks: Block[] = [];
  if (c.has('rd_rushing')) blocks.push(P(c.f('{ad} hızlı okuyor ancak okuduğunun önemli bir kısmını kaçırıyor. Bu profilde hedef daha da hızlanmak değil, hızı koruyarak anlamayı artırmak.')));
  else if (c.has('rd_slow') && c.has('rd_comp_high')) blocks.push(P(c.f('{ad} yavaş ama dikkatli okuyor. Anlamayı koruyarak hızını artırması, uzun metinli sınavlarda ona önemli bir zaman kazandırır.')));
  else if (c.has('rd_slow')) blocks.push(P(c.f('{adın} okuma hızı ve anlama oranı birlikte desteklenmeli. Düzenli okuma alışkanlığı her ikisini de geliştirir.')));
  else if (c.has('rd_comp_high') && !c.has('rd_fast')) blocks.push(P(c.f('{ad} okuduğunu iyi anlıyor; okuma hızı ise sınıf düzeyiyle uyumlu. Bu profilde hedef, anlamayı koruyarak hızı kademeli olarak artırmak. Böylece uzun metinli sınavlarda zaman kazanabilir.')));
  else if (c.has('rd_fast') && c.has('rd_comp_high')) blocks.push(P(c.f('{ad} hem hızlı hem anlayarak okuyor. Bu güçlü beceriyi uzun ve zor metinlerde de sürdürmek önemli.')));
  else blocks.push(P(c.f('{adın} okuma hızı ve anlama oranı dengeli. Düzenli okuma alışkanlığıyla bu dengeyi korumak önemli.')));
  blocks.push(BUL(c.has('rd_rushing')
    ? ['Okurken her paragraftan sonra durup ana fikri kendine söylemek', 'Okuduktan sonra iki cümlelik özet çıkarmak', 'Hız yerine anlama oranını takip etmek']
    : c.has('rd_comp_high') && !c.has('rd_fast')
      ? ['Her gün 10 dakika süre tutarak, anlamayı koruyarak biraz daha hızlı okumayı denemek', 'Gözü satır boyunca kelime kelime değil, kelime grupları hâlinde ilerletmek', 'Haftada bir kez okuma hızını ve anlama oranını birlikte kaydetmek']
      : ['Her gün 15 dakika ilgisini çeken bir metni okumak', 'Okuduktan sonra iki cümlelik özet çıkarmak', 'Haftada bir kez süre tutarak okuma hızını kaydetmek']));
  return { title: 'Okuma Hızı ve Anlama Dengesi', blocks };
};

const thinkingStyle: SubBuilder = (c) => {
  const a = c.get('sag-sol-beyin');
  if (!a) return null;
  const f = a.facts as Record<string, unknown>;
  const r = Number(f.right);
  const l = Number(f.left);
  const blocks: Block[] = [
    P(c.f(r - l > 10
      ? '{ad} öğrenirken önce bütünü görmek, sezgilerini ve hayal gücünü kullanmak istiyor. Konuya genel bir resimle başlamak, sonra ayrıntılara inmek ona iyi gelir.'
      : l - r > 10
        ? '{ad} öğrenirken adım adım ilerlemek, sırayı ve ayrıntıyı izlemek istiyor. Yapılandırılmış notlar ve sıralı çalışma planı ona iyi gelir.'
        : '{ad} öğrenirken hem bütüne hem ayrıntıya dengeli bakabiliyor. Konuya göre yöntem değiştirebilmesi bir avantaj.')),
    BUL(r - l > 10
      ? ['Yeni bir konuya başlamadan önce konunun özetine ya da kavram haritasına göz atmak', 'Konuları şema, renk ve örneklerle birbirine bağlamak', 'Ayrıntı gerektiren işlerde kendine küçük bir kontrol listesi hazırlamak']
      : l - r > 10
        ? ['Konuyu küçük adımlara bölüp her adımı tamamladıkça işaretlemek', 'Sıralı ve maddeli notlar tutmak', 'Ara sıra konunun "büyük resmini" görmek için kısa bir özet ya da şema çıkarmak']
        : ['Konuya göre önce genel resme bakmak ya da adım adım ilerlemek arasında seçim yapmak', 'Hem şemalı hem maddeli not tekniklerini denemek', 'Zorlandığı konularda diğer yaklaşıma geçmeyi denemek']),
  ];
  return { title: 'Düşünme Tercihi ve İşe Yarayan Yöntemler', blocks };
};

// ── Katalog ──────────────────────────────────────────────────

export const SUBS: Record<string, SubBuilder> = {
  portrait, motivation, motivationCareer, resources, blindspots, strengthsGrowth, communication, stress, conflict, interests, learning, futureHints,
  academicPicture, skillsInteract, learningPrefs, studyHabits, effortGap, potentialGap, subjectTips, quickWins, risks, top3, tracking,
  readiness, targetRange, anxietyProfile, anxietyImpact, focus, studyAttention, mockExams, examAdvantages, examRisks, examStrategy, proSupport,
  careerIdentity, interestProfile, interestFit, workEnvironment, skillMap, productiveAreas, drains, careerFields, majorsMap, selfDevelopment, decisionTips, roadmap,
  atAGlance, academicAndLearning, examAnxietyVip, focusVip, studyHabitsVip, personalityAcademic, anxietySource, efficiencySource, targetDistance, consistency, overall,
  reading, thinkingStyle,
};

export function buildHolistic(c: Ctx, order: string[]): Block[] {
  const blocks: Block[] = [];
  let n = 0;
  for (const id of order) {
    const b = SUBS[id];
    if (!b) continue;
    let sub: Sub | null = null;
    try {
      sub = b(c);
    } catch (e) {
      console.error(`[report-v2/holistic] ${id} kurulamadı:`, (e as Error).message);
      sub = null;
    }
    if (!sub || !sub.blocks.length) continue;
    n++;
    blocks.push({ t: 'h3', num: String(n).padStart(2, '0'), text: sub.title });
    blocks.push(...sub.blocks);
  }
  return blocks;
}
