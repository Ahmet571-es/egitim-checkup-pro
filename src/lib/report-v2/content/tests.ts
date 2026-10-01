// ============================================================
// Rapor v2 — Teste özel yorum metinleri
// ============================================================
// "Değerlendirme Sonuçları" bölümünde her testin altına yazılan iki kısa
// paragraf ile kariyer, öğrenme tercihi ve ilgi alanlarına ait veri tabloları.
import type { TestAnalysis } from '../analyze';
import { ANX_CATS, HOLLAND_LABEL, LEVEL_LABEL, MI_LABEL, STUDY_CATS, VARK_LABEL, ENNEAGRAM_LABEL } from '../analyze';
import type { Level } from '../types';
import { capFirst, joinSafe, joinTr } from '../tr';
import { ENNEAGRAM_PROFILES } from './index-enneagram';

// ── Enneagram kanatları ──────────────────────────────────────

/** Kanadın kısa adı: "2 kanadı (yardımsever yönü)". */
export const WING_SHORT: Record<number, string> = {
  1: 'ilkeli', 2: 'yardımsever', 3: 'başarı odaklı', 4: 'özgün', 5: 'araştırmacı', 6: 'sorumluluk sahibi', 7: 'hevesli', 8: 'kararlı', 9: 'uzlaşmacı',
};

const WING_ADDS: Record<number, string> = {
  1: 'bu yapıya bir parça ilke, düzen ve doğruluk hassasiyeti ekliyor',
  2: 'bu yapıyı insanlara dönük ve sıcak kılıyor; yardım etme isteğini belirginleştiriyor',
  3: 'bu yapıya hedef koyma ve başarı isteği ekliyor',
  4: 'bu yapıya duygusal derinlik ve özgün olma isteği katıyor',
  5: 'bu yapıya merak, gözlem ve derinlemesine düşünme eğilimi ekliyor',
  6: 'bu yapıya sorumluluk duygusu ve güven arayışı ekliyor',
  7: 'bu yapıya merak, hareket ve iyimserlik katıyor',
  8: 'bu yapıya kararlılık ve sözünü söyleme cesareti ekliyor',
  9: 'bu yapıyı daha sakin, uyumlu ve dengeli kılıyor',
};

// ── Çoklu zekâ ───────────────────────────────────────────────

export const MI_INFO: Record<string, { interest: string; learn: string; careers: string[] }> = {
  sozel: { interest: 'okuma, yazma ve kelimelerle düşünme', learn: 'okuyarak, yazarak ve kendi cümleleriyle anlatarak', careers: ['hukuk', 'öğretmenlik', 'gazetecilik', 'yayıncılık', 'çeviri'] },
  mantiksal: { interest: 'sayılar, örüntüler, sebep-sonuç ilişkileri ve problem çözme', learn: 'adım adım akıl yürüterek, şema ve tablolar kurarak', careers: ['mühendislik', 'yazılım', 'ekonomi', 'temel bilimler', 'tıp'] },
  gorsel: { interest: 'şekiller, renkler, haritalar ve zihinde canlandırma', learn: 'şemalar, zihin haritaları ve görsellerle', careers: ['mimarlık', 'tasarım', 'mühendislik', 'görsel sanatlar', 'cerrahi'] },
  muziksel: { interest: 'ritim, ses, melodi ve müzik', learn: 'ritimli tekrarlar, sesli çalışma ve kafiyeli ezberlerle', careers: ['müzik', 'ses teknolojileri', 'müzik öğretmenliği', 'sahne sanatları'] },
  dogaci: { interest: 'doğa, canlılar, çevre ve sınıflandırma', learn: 'gözlem yaparak, sınıflandırarak ve gerçek örneklerle', careers: ['biyoloji', 'veterinerlik', 'çevre bilimleri', 'tarım ve gıda', 'tıp'] },
  sosyal: { interest: 'insanlarla birlikte olma ve iş birliği yapma', learn: 'grup çalışmalarıyla, tartışarak ve konuyu başkasına anlatarak', careers: ['öğretmenlik', 'psikoloji', 'sağlık', 'insan kaynakları', 'sosyal hizmet'] },
  bedensel: { interest: 'hareket, spor ve yaparak deneyimleme', learn: 'yaparak, deneyerek ve hareket ederek', careers: ['spor bilimleri', 'fizyoterapi', 'teknik ve uygulamalı alanlar', 'sahne sanatları'] },
  icsel: { interest: 'kendini tanıma ve bağımsız çalışma', learn: 'sessiz ve bireysel çalışarak, kendi hedeflerini koyarak', careers: ['psikoloji', 'yazarlık', 'araştırma', 'danışmanlık', 'girişimcilik'] },
};

// ── Öğrenme stilleri ─────────────────────────────────────────

export const VARK_INFO: Record<string, { pref: string; tips: string[] }> = {
  V: { pref: 'bilgiyi şemalar, renkler, grafikler ve görsellerle almayı', tips: ['Konuları zihin haritasına ve şemaya dökmek', 'Renkli kalemlerle görsel notlar tutmak', 'Videolardan ve görsel kaynaklardan yararlanmak'] },
  A: { pref: 'bilgiyi dinleyerek, konuşarak ve tartışarak almayı', tips: ['Konuyu sesli anlatarak tekrar etmek', 'Bir arkadaşla soru-cevap yapmak', 'Önemli bilgileri kaydedip dinlemek'] },
  R: { pref: 'bilgiyi okuyarak ve yazarak almayı', tips: ['Okuduğunu kendi cümleleriyle özetlemek', 'Liste ve maddeler hâlinde not tutmak', 'Konuyu yazarak yeniden anlatmak'] },
  K: { pref: 'bilgiyi yaparak, deneyerek ve somut örneklerle almayı', tips: ['Bol örnek ve uygulama sorusu çözmek', 'Deney, model ve somut materyal kullanmak', 'Çalışırken kısa hareket molaları vermek'] },
};

// ── Holland (RIASEC) ─────────────────────────────────────────

export const HOLLAND_INFO: Record<string, { like: string; act: string; env: string; jobs: string[]; fields: string[]; skill: string }> = {
  R: {
    like: 'elleriyle çalışmayı, araç-gereç kullanmayı ve somut sonuç veren işleri',
    act: 'el becerisi ve somut uygulama',
    env: 'somut, pratik ve uygulamalı',
    jobs: ['mühendislik', 'teknik uzmanlıklar', 'mimarlık', 'tarım ve veterinerlik', 'pilotluk'],
    fields: ['Makine / Elektrik-Elektronik Mühendisliği', 'İnşaat Mühendisliği', 'Mekatronik', 'Ziraat ve Veteriner Fakülteleri'],
    skill: 'pratik problem çözme ve el becerisi',
  },
  I: {
    like: 'araştırmayı, sorgulamayı, bir sorunun nedenini bulmayı ve düşünmeyi',
    act: 'araştırma ve derinlemesine düşünme',
    env: 'araştırmaya ve derinlemesine düşünmeye alan tanıyan',
    jobs: ['tıp ve sağlık bilimleri', 'temel bilimler', 'yazılım ve veri bilimi', 'mühendislik araştırmaları', 'eczacılık'],
    fields: ['Tıp', 'Diş Hekimliği / Eczacılık', 'Moleküler Biyoloji ve Genetik', 'Bilgisayar Mühendisliği', 'Fizik / Kimya / Matematik'],
    skill: 'analitik düşünme ve araştırma',
  },
  A: {
    like: 'yaratıcılığını kullanmayı, kendini ifade etmeyi ve özgün işler üretmeyi',
    act: 'yaratıcılık ve özgün ifade',
    env: 'yaratıcı, özgür ve kurallarla fazla kısıtlanmamış',
    jobs: ['tasarım', 'mimarlık', 'yazarlık ve iletişim', 'görsel ve sahne sanatları', 'reklamcılık'],
    fields: ['Mimarlık / İç Mimarlık', 'Grafik ve Endüstriyel Tasarım', 'Güzel Sanatlar', 'İletişim ve Medya', 'Dil ve Edebiyat'],
    skill: 'yaratıcılık ve özgün ifade',
  },
  S: {
    like: 'insanlara yardım etmeyi, onlarla doğrudan çalışmayı ve öğretmeyi',
    act: 'insanlarla doğrudan çalışma ve yardım',
    env: 'insanlarla iç içe, iş birliğine dayalı ve yardım odaklı',
    jobs: ['öğretmenlik', 'psikoloji ve rehberlik', 'hemşirelik ve fizyoterapi', 'sosyal hizmet', 'çocuk gelişimi'],
    fields: ['Psikoloji', 'Rehberlik ve Psikolojik Danışmanlık', 'Öğretmenlik Programları', 'Hemşirelik / Fizyoterapi', 'Sosyal Hizmet'],
    skill: 'iletişim, empati ve iş birliği',
  },
  E: {
    like: 'insanları yönlendirmeyi, ikna etmeyi, karar vermeyi ve sorumluluk almayı',
    act: 'liderlik, ikna ve karar verme',
    env: 'dinamik, hedef odaklı ve liderliğe alan tanıyan',
    jobs: ['işletme ve yönetim', 'hukuk', 'girişimcilik', 'pazarlama ve satış', 'siyaset ve kamu yönetimi'],
    fields: ['İşletme', 'Hukuk', 'Uluslararası İlişkiler', 'Siyaset Bilimi ve Kamu Yönetimi', 'Ekonomi'],
    skill: 'liderlik, ikna ve karar verme',
  },
  C: {
    like: 'düzenli, kurallı ve planlı çalışmayı, ayrıntıyla ve verilerle uğraşmayı',
    act: 'düzen, planlama ve ayrıntıya dikkat',
    env: 'düzenli, kuralları açık ve öngörülebilir',
    jobs: ['muhasebe ve finans', 'bankacılık', 'kamu yönetimi', 'veri ve kalite yönetimi', 'idari işler'],
    fields: ['Muhasebe ve Finans', 'Bankacılık ve Sigortacılık', 'İstatistik', 'Kamu Yönetimi', 'Yönetim Bilişim Sistemleri'],
    skill: 'düzen, ayrıntıya dikkat ve planlama',
  },
};

// ── Sınav kaygısı alt boyutları ──────────────────────────────

const ANX_CAT_TEXT: Record<string, string> = {
  genel_kaygi: 'sınavlara karşı genel bir gerginlik',
  hazirlik_endisesi: '"yeterince çalışmadım" duygusu',
  gelecek_endisesi: 'sınav sonucunun geleceğini belirleyeceği endişesi',
  baskalari_gorusu: 'başkalarının (aile, öğretmen, arkadaşlar) ne düşüneceği endişesi',
  kendi_gorusu: 'kendine yönelik yüksek beklenti ve kendini yetersiz görme',
  bedensel_tepkiler: 'sınav öncesi ve sırasında bedensel belirtiler (çarpıntı, mide ağrısı, terleme gibi)',
  zihinsel_tepkiler: 'sınav sırasında zihnin boşalması ve dikkatin dağılması',
};

export const STUDY_CAT_TEXT: Record<string, { low: string; high: string }> = {
  A: { low: 'çalışmaya başlayıp planı sürdürmek', high: 'çalışmaya başlayıp planını sürdürmesi' },
  B: { low: 'öğrendiğini anlamlandırıp kullanmak', high: 'öğrendiğini anlamlandırıp kullanması' },
  C: { low: 'derste dinleyip not tutmak', high: 'derste dinleyip not tutması' },
  D: { low: 'etkili bir okuma alışkanlığı kazanmak', high: 'okuma alışkanlığı' },
  E: { low: 'ödevleri düzenli hazırlamak', high: 'ödevlerini düzenli hazırlaması' },
  F: { low: 'okula karşı olumlu bir tutum geliştirmek', high: 'okula karşı olumlu tutumu' },
  G: { low: 'sınava hazırlanıp sınavda zamanı yönetmek', high: 'sınavlara iyi hazırlanması' },
};

const lvl = (l: Level) => LEVEL_LABEL[l].toLocaleLowerCase('tr-TR');
void lvl;

const ANX_CAT_LABEL: Record<string, string> = Object.fromEntries(ANX_CATS.map((c) => [c.key, c.label]));

/** Çalışma davranışı alt boyutlarının anahtar + düzey listesi. */
export function studyLevels(a: TestAnalysis): { key: string; label: string; level: Level; pct: number }[] {
  return a.levels
    .map((r) => {
      const c = STUDY_CATS.find((x) => x.label === r.label);
      return c ? { key: c.key, label: r.label, level: r.level, pct: r.pct ?? 0 } : null;
    })
    .filter((x): x is { key: string; label: string; level: Level; pct: number } => !!x);
}

/** "Değerlendirme Sonuçları" bölümünde testin altındaki yorum paragrafları. */
export function testParagraphs(a: TestAnalysis): string[] {
  const f = a.facts as Record<string, unknown>;
  switch (a.testId) {
    case 'enneagram': {
      const main = Number(f.main);
      const wing = Number(f.wing);
      const p = ENNEAGRAM_PROFILES[main];
      const res = p?.result ?? [];
      const out = [
        `Baskın eğilim: **Tip ${main} — ${ENNEAGRAM_LABEL[main]}**, ${wing} kanadı${WING_SHORT[wing] ? ` (${WING_SHORT[wing]} yönü)` : ''}. ${res[0] ?? ''}`.trim(),
        `Kanat, ana tipin yanında kişiliğe ek bir renk katan komşu eğilimdir; ${wing} kanadı ${WING_ADDS[wing] ?? 'bu yapıya kendine özgü bir renk katıyor'}.${res[1] ? ` ${res[1]}` : ''}`,
      ];
      const second = Number(f.closeSecond);
      if (second) out.push(`Tip ${second} (${ENNEAGRAM_LABEL[second]}) eğilimi de ana tipe oldukça yakın çıktı; bu yön de {adın} davranışlarında zaman zaman belirgin olabilir.`);
      return out;
    }
    case 'coklu-zeka': {
      const top = (f.top as string[]) ?? [];
      const bottom = (f.bottom as string[]) ?? [];
      const out: string[] = [];
      if (top.length) {
        const ints = top.slice(0, 2).map((k) => MI_INFO[k]?.interest ?? MI_LABEL[k]);
        out.push(
          `${ints.length > 1 ? `{adın} ilgisi en çok iki alanda yoğunlaşıyor: ${ints[0]}; ayrıca ${ints[1]}.` : `{adın} ilgisi en çok ${ints[0]} yönünde.`} ${capFirst(MI_INFO[top[0]]?.learn ?? '')} öğrenmek ona daha doğal geliyor.`,
        );
      }
      if (bottom.length) {
        out.push(
          `${capFirst(joinTr(bottom.map((k) => MI_LABEL[k].toLocaleLowerCase('tr-TR'))))} ${bottom.length > 1 ? 'alanlar ise şu an daha az ilgi duyduğu alanlar; bu, o alanlarda' : 'alan ise şu an daha az ilgi duyduğu alan; bu, o alanda'} başarılı olamayacağı anlamına gelmez.`,
        );
      }
      if (a.traits.mi_balanced) out.push('Alanlar arasındaki farkların küçük olması, çok yönlü ve dengeli bir ilgi profiline işaret ediyor.');
      return out;
    }
    case 'vark': {
      const d = String(f.dominant);
      const s = String(f.second);
      const multi = Boolean(f.multimodal);
      const out = [
        multi
          ? `{ad} bilgiyi tek bir yoldan değil, birkaç yoldan almayı tercih ediyor; özellikle ${VARK_LABEL[d].toLocaleLowerCase('tr-TR')} ve ${VARK_LABEL[s].toLocaleLowerCase('tr-TR')} yollar öne çıkıyor.`
          : `{ad} ${VARK_INFO[d]?.pref ?? 'belirli bir yolu'} daha çok tercih ediyor.`,
        `Çalışma yöntemlerini bu tercihe göre çeşitlendirmek, özellikle sıkıldığı konularda işini kolaylaştırabilir: ${joinTr((VARK_INFO[d]?.tips ?? []).slice(0, 2).map((t) => t.toLocaleLowerCase('tr-TR')))} ona iyi gelebilir.`,
      ];
      return out;
    }
    case 'holland': {
      const code = String(f.code ?? '');
      const k = code.split('');
      const out: string[] = [];
      if (k.length) {
        out.push(
          `{adın} ilgi profili en çok ${HOLLAND_LABEL[k[0]]}${k[1] ? `, ardından ${joinTr(k.slice(1).map((x) => HOLLAND_LABEL[x]))}` : ''} alanlarda yoğunlaşıyor. {ad} en çok ${HOLLAND_INFO[k[0]]?.like ?? ''} seviyor.`,
        );
      }
      const order = (f.order as string[]) ?? [];
      const last = order[order.length - 1];
      if (last) out.push(`${HOLLAND_LABEL[last]} alanın en düşük çıkması, ${HOLLAND_INFO[last]?.env ?? ''} ortamların {adı} şu an pek çekmediğini gösteriyor.`);
      if (a.traits.hol_flat) out.push('Alanlar arasındaki farkın küçük olması, ilgilerin henüz netleşmediğine işaret ediyor olabilir; bu, bu yaşta oldukça doğal.');
      return out;
    }
    case 'sinav-kaygisi': {
      const total = Number(f.totalLevel) as Level;
      const top = (f.top as string[]) ?? [];
      const low = (f.low as string[]) ?? [];
      // Yalnızca belirgin (orta üstü ve yüksek) kaynaklar "kaynak" olarak anılır.
      const rowsBy = new Map(a.levels.map((r) => [r.label, r.level] as const));
      const lvOf = (k: string) => rowsBy.get(ANX_CAT_LABEL[k] ?? '') ?? 0;
      const strongSrc = top.filter((k) => lvOf(k) >= 4);
      const out: string[] = [];
      if (strongSrc.length) out.push(`Kaygıyı en çok besleyen ${strongSrc.length > 1 ? 'kaynaklar' : 'kaynak'}: ${joinSafe(strongSrc.map((k) => ANX_CAT_TEXT[k]).filter(Boolean))}.`);
      if (total >= 4) out.push(`${total === 5 ? 'Bu düzeydeki bir kaygı' : 'Belirgin bir kaygı'}, bildiklerini sınavda gösterebilmesini zorlaştırabilir. İyi haber şu: Sınav kaygısı, öğrenilebilir tekniklerle belirgin biçimde azaltılabilen bir durumdur.`);
      else if (total === 3) out.push(`Orta düzeydeki bir kaygı çoğu zaman dikkati toplamaya yardım eder. ${low.length ? `${capFirst(joinSafe(low.map((k) => ANX_CAT_TEXT[k]).filter(Boolean)))} ise düşük düzeyde.` : ''}`.trim());
      else out.push(`Sınavlara karşı sakin bir tutumu var; kaygı, performansını belirgin biçimde etkilemiyor gibi görünüyor.${strongSrc.length ? ' Yine de yukarıdaki kaynağın hazırlık döneminde izlenmesi faydalı olur.' : ''}`);
      return out;
    }
    case 'calisma-davranisi': {
      const byKey = studyLevels(a);
      const good = byKey.filter((r) => r.level >= 4).sort((x, y) => y.pct - x.pct);
      const weak = byKey.filter((r) => r.level <= 2).sort((x, y) => x.pct - y.pct);
      const lowest = [...byKey].sort((x, y) => x.pct - y.pct);
      const out: string[] = [];
      if (good.length) out.push(`En güçlü yanları: ${joinTr(good.slice(0, 3).map((r) => STUDY_CAT_TEXT[r.key]?.high).filter(Boolean))}.`);
      else if (lowest.length) out.push(`Belirgin biçimde öne çıkan bir alan yok; görece en iyi olduğu alan ${STUDY_CAT_TEXT[lowest[lowest.length - 1].key]?.high ?? ''}.`);
      if (weak.length) {
        out.push(`En çok desteklenmesi gereken ${weak.length > 1 ? 'alanlar' : 'alan'}: ${joinTr(weak.slice(0, 3).map((r) => STUDY_CAT_TEXT[r.key]?.low).filter(Boolean))}.${weak.some((r) => r.key === 'A') ? ' Bu tablo, {adın} kapasitesinden çok çalışmayı başlatıp sürdürmeye yarayan alışkanlıklarla ilgili.' : ''}`);
      } else if (lowest.length) {
        const lo = lowest.filter((r) => r.level === 3).slice(0, 2);
        out.push(lo.length ? `Belirgin bir zayıf alan görünmüyor; görece daha düşük kalan ${lo.length > 1 ? 'alanlar' : 'alan'} ${joinTr(lo.map((r) => STUDY_CAT_TEXT[r.key]?.low).filter(Boolean))}.` : 'Belirgin bir zayıf alan görünmüyor; mevcut düzenin korunması yeterli.');
      }
      return out;
    }
    case 'akademik-analiz': {
      const rows = a.levels;
      const strong = [...rows].sort((x, y) => (y.pct ?? 0) - (x.pct ?? 0))[0];
      const weak = [...rows].sort((x, y) => (x.pct ?? 0) - (y.pct ?? 0))[0];
      const weakSkills = (f.weakSkills as string[]) ?? [];
      const out: string[] = [];
      if (strong && weak && strong !== weak) {
        out.push(`${capFirst(strong.label.toLocaleLowerCase('tr-TR'))} alanında {ad} en güçlü sonucunu aldı (${lvl(strong.level)}). ${capFirst(weak.label.toLocaleLowerCase('tr-TR'))} ise görece daha çok desteklenmesi gereken alan (${lvl(weak.level)}).`);
      } else if (strong) {
        out.push(`{adın} akademik becerileri alanlar arasında dengeli bir görünüm sergiliyor (${lvl(strong.level)}).`);
      }
      if (weakSkills.length) out.push(`Beceri düzeyinde en çok zorlandığı konular ${joinTr(weakSkills)} olarak öne çıkıyor; bu konulara yönelik kısa ve hedefli çalışmalar öncelikli olmalı.`);
      const gap = Number(f.gap);
      if (Number.isFinite(gap) && gap > 15) out.push('{ad} kendi akademik düzeyini, test sonuçlarının gösterdiğinden daha yüksek değerlendiriyor. Düzenli kendini sınama, daha gerçekçi bir bakış kazanmasına yardım eder.');
      if (Number.isFinite(gap) && gap < -15) out.push('{ad} kendi akademik düzeyini, test sonuçlarının gösterdiğinden daha düşük değerlendiriyor. Başarılarını görünür kılmak, özgüvenini güçlendirecektir.');
      return out;
    }
    case 'd2-dikkat':
    case 'burdon-dikkat': {
      const main = a.levels[0];
      const general =
        main.level >= 4
          ? '{ad}, belirli bir süre boyunca hızlı ve doğru çalışabiliyor.'
          : main.level === 3
            ? '{ad} dikkatini toplayıp sürdürebiliyor; ancak uzun ve tekrarlı görevlerde verimi düşebilir.'
            : '{ad} dikkatini toplamakta ve sürdürmekte zorlanıyor; bu durum derslerde ve sınavlarda dikkatsizlik hataları olarak görülebilir.';
      const out = [general];
      const trend = (a.facts as Record<string, unknown>).trend;
      if (trend === 'down' && !a.traits.att_late_drop) out.push('Test ilerledikçe performansında düşüş görülüyor.');
      if (trend === 'up') out.push('Teste yavaş başlayıp ilerledikçe performansını yükseltiyor; ısınma süresine ihtiyaç duyuyor olabilir.');
      if (a.traits.att_impulsive) out.push('Hızlı çalışıyor ancak hata oranı görece yüksek; acele etmek doğruluğunu düşürebiliyor.');
      else if (a.traits.att_slow) out.push('Doğruluğu iyi, ancak temkinli ve görece yavaş çalışıyor; süreli görevlerde zaman yönetimi önem kazanıyor.');
      if (a.traits.att_fluct) out.push('Görev boyunca dikkat düzeyinde dalgalanmalar görülüyor.');
      if (a.traits.att_late_drop) out.push('Görevin son bölümüne doğru dikkati belirgin biçimde düşüyor; uzun görevlerde yorgunluk etkili olabilir.');
      if (a.traits.att_early_drop) out.push('Görevin başında dikkat toplamakta zorlanıyor, ilerledikçe performansı toparlanıyor.');
      if (main.level >= 4 && !a.traits.att_impulsive && !a.traits.att_fluct) out.push('Bu önemli bir bulgu: Derslerde ya da sınavlarda bir verim kaybı yaşanıyorsa, kaynağı büyük olasılıkla dikkat dışındaki etkenlerdir.');
      return out;
    }
    case 'hizli-okuma': {
      const wpm = Math.round(Number(f.wpm) || 0);
      const comp = Math.round(Number(f.comp) || 0);
      const out = [`{ad} dakikada yaklaşık ${wpm} kelime okudu ve okuduğunun %${comp} kadarını doğru anladı.`];
      if (a.traits.rd_rushing) out.push('Okuma hızı iyi, ancak anlama oranı düşük kalıyor; hızlanırken ayrıntıları kaçırıyor olabilir.');
      else if (a.traits.rd_slow && a.traits.rd_comp_high) out.push('Yavaş ama dikkatli okuyor; anlama oranı iyi. Hızını, anlamayı koruyarak artırması mümkün.');
      else if (a.traits.rd_slow) out.push('Okuma hızı sınıf düzeyine göre düşük; bu durum uzun metinli sorularda süreyi zorlayabilir.');
      else if (a.traits.rd_fast && a.traits.rd_comp_high) out.push('Hem hızlı hem anlayarak okuyor; bu, tüm dersler için önemli bir avantaj.');
      else if (a.traits.rd_comp_high) out.push('Okuma hızı sınıf düzeyiyle uyumlu, anlama oranı ise güçlü. Anlamayı koruyarak hızını kademeli artırması, uzun metinli sınavlarda ona zaman kazandırır.');
      else if (a.traits.rd_comp_low) out.push('Okuma hızı sınıf düzeyiyle uyumlu; ancak anlama oranı desteklenmeli. Okurken durup kendine "Burada ne anlatıldı?" diye sormak anlamayı güçlendirir.');
      else out.push('Okuma hızı ve anlama oranı sınıf düzeyiyle uyumlu ve birbiriyle dengeli.');
      return out;
    }
    case 'sag-sol-beyin': {
      const r = Number(f.right);
      const l = Number(f.left);
      const out =
        r - l > 10
          ? ['{ad} düşünürken bütüne bakmayı, sezgilerini ve hayal gücünü kullanmayı daha çok tercih ediyor.']
          : l - r > 10
            ? ['{ad} düşünürken adım adım ilerlemeyi, ayrıntıları ve mantıksal sırayı izlemeyi daha çok tercih ediyor.']
            : ['{ad} düşünürken hem adım adım çözümlemeyi hem bütüne bakmayı dengeli biçimde kullanıyor.'];
      return out;
    }
    default:
      return [];
  }
}

/** Testin altına eklenecek küçük açıklama notu (bilimsel çerçeve). */
export function testNote(testId: string): string | undefined {
  if (testId === 'enneagram') return 'Not: Enneagram bir eğilim haritasıdır; anlatılan özellikler kesin yargılar değil, gözlemle doğrulanacak olasılıklardır.';
  if (testId === 'sag-sol-beyin') return 'Not: Bu ölçüm beynin bir yarısının "baskın" olduğunu göstermez; günlük hayatta iki yarıküre birlikte çalışır. Sonuç yalnızca düşünme tercihini anlatır.';
  if (testId === 'vark') return 'Not: Öğrenme stili bir tercih göstergesidir; öğrencinin yalnızca bu yolla öğrenebileceği anlamına gelmez.';
  if (testId === 'coklu-zeka') return 'Not: Bu sonuçlar bir yetenek ya da zekâ ölçümü değil, ilgi ve tercih göstergesidir.';
  return undefined;
}
