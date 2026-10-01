// ============================================================
// Rapor v2 — Sonuçlardan türetilen "sentez" profil
// ============================================================
// Kişilik testi olmayan raporlarda (Akademik Performans, Sınav Strateji, tek
// test raporları) öğrenciyi anlatan cümleler bu modülde, test sonuçlarından
// kurulur. Kişilik testi olan raporlarda ise yalnızca sonuca dayalı güçlü
// yanlar ve gelişim alanları ekler.
//
// Örnek raporlardaki "Kısaca" kalıbı izlenir:
//   "{ad}, [güçlü yanlar] bir öğrenci; ancak [ana gelişim alanı]. [Kısa sonuç]."

import type { Profile } from './types';
import type { TestAnalysis, TraitMap } from '../analyze';
import { MI_LABEL, HOLLAND_LABEL, VARK_LABEL } from '../analyze';
import { MI_INFO, VARK_INFO, HOLLAND_INFO, studyLevels } from './tests';
import { joinList, joinTr, capFirst } from '../tr';

const MI_ADJ: Record<string, string> = {
  sozel: 'kelimelerle uğraşmayı seven',
  mantiksal: 'sayılar ve mantıkla düşünmeyi seven',
  gorsel: 'şekiller ve görsellerle düşünen',
  muziksel: 'ritim ve seslere duyarlı',
  dogaci: 'doğaya ve canlılara ilgili',
  sosyal: 'insanlarla kolay bağ kuran',
  bedensel: 'hareketli ve yaparak öğrenen',
  icsel: 'kendini tanımaya ilgi duyan',
};

const MI_YOU: Record<string, string> = {
  sozel: 'kelimelerle uğraşmayı seviyorsun',
  mantiksal: 'sayılar ve mantıkla düşünmeyi seviyorsun',
  gorsel: 'şekiller ve görsellerle düşünüyorsun',
  muziksel: 'ritim ve seslere duyarlısın',
  dogaci: 'doğaya ve canlılara ilgi duyuyorsun',
  sosyal: 'insanlarla kolayca bağ kuruyorsun',
  bedensel: 'hareket ederek ve yaparak öğreniyorsun',
  icsel: 'kendini tanımaya ve bağımsız çalışmaya ilgi duyuyorsun',
};

const VARK_ADJ: Record<string, string> = {
  V: 'görsellerle öğrenmeyi seven',
  A: 'dinleyerek ve konuşarak öğrenmeyi seven',
  R: 'okuyup yazarak öğrenmeyi seven',
  K: 'yaparak ve deneyerek öğrenmeyi seven',
};

const STUDY_ADJ: Record<string, string> = {
  A: 'planını sürdürebilen', B: 'öğrendiğini kullanabilen', C: 'derste iyi dinleyen', D: 'düzenli okuyan',
  E: 'ödevlerini düzenli yapan', F: 'okula olumlu bakan', G: 'sınavlara iyi hazırlanan',
};
const STUDY_THIRD: Record<string, string> = {
  A: 'çalışmaya başlayıp planını sürdürebilmesi', B: 'öğrendiğini anlamlandırıp kullanabilmesi', C: 'derste iyi dinleyip not tutması', D: 'düzenli okuma alışkanlığı',
  E: 'ödevlerini düzenli hazırlaması', F: 'okula karşı olumlu tutumu', G: 'sınavlara iyi hazırlanması',
};
const STUDY_YOU: Record<string, string> = {
  A: 'çalışmaya başlayıp planını sürdürebiliyorsun', B: 'öğrendiğini anlamlandırıp kullanabiliyorsun', C: 'derste iyi dinleyip not tutabiliyorsun', D: 'düzenli okuyorsun',
  E: 'ödevlerini düzenli hazırlıyorsun', F: 'okula karşı olumlu bir tutumun var', G: 'sınavlara iyi hazırlanıyorsun',
};
const HOL_ADJ: Record<string, string> = {
  R: 'elleriyle çalışmayı seven', I: 'araştırmayı ve sorgulamayı seven', A: 'yaratıcı', S: 'insanlara yardım etmeyi seven', E: 'sorumluluk almayı seven', C: 'düzenli ve planlı çalışmayı seven',
};
const lc = (x: string) => `${x.charAt(0).toLocaleLowerCase('tr-TR')}${x.slice(1)}`;

interface Issue {
  trait: string;
  clause: string; // "ancak …" sonrası
  close: string; // kısa sonuç cümlesi
  you: string; // öğrenciye
  family: string; // aile tek cümle için
  theme: string; // uzman vaka özeti
}

const ISSUES: Issue[] = [
  {
    trait: 'anx_high',
    clause: 'sınav anında yükselen kaygı, bildiklerini sınavda göstermesini zorlaştırabiliyor',
    close: 'Sınav kaygısı, öğrenilebilir tekniklerle azaltılabilen bir durum.',
    you: 'Sınavlarda kaygın yükseldiğinde bildiklerini hatırlamakta zorlandığın oluyor olabilir.',
    family: 'sınav anında yükselen kaygı nedeniyle bildiğini göstermekte zorlanabilen',
    theme: 'sınav döneminde belirginleşen kaygı',
  },
  {
    trait: 'st_weak',
    clause: 'düzenli bir çalışma alışkanlığı henüz oturmamış, çalışmaya başlamak ve planı sürdürmek onu zorluyor',
    close: 'Burada belirleyici olan kapasite değil, çalışmanın sürekliliği.',
    you: 'Planların kısa sürede dağılabiliyor; bu yüzden emeğinin karşılığını tam alamıyor olabilirsin.',
    family: 'düzenli bir çalışma alışkanlığı henüz oturmamış',
    theme: 'çalışma davranışında süreklilik ve aktif tekrar eksikliği',
  },
  {
    trait: 'ac_both_low',
    clause: 'okuduğunu anlama ve matematikte desteklenmesi gereken alanlar öne çıkıyor',
    close: 'İki alan da kısa ve düzenli çalışmalarla güçlenebilir; okuma becerisi geliştikçe matematikteki sözel problemler de kolaylaşacaktır.',
    you: 'Okuduğunu anlamada ve matematikte bazı eksiklerin var; her gün kısa okumalar ve bir hata defteriyle bunları adım adım kapatabilirsin.',
    family: 'okuduğunu anlama ve matematikte desteklenmesi gereken',
    theme: 'okuduğunu anlama ve matematikte destek ihtiyacı',
  },
  {
    trait: 'ac_low',
    clause: 'temel becerilerinde kapanması gereken açıklar bulunuyor',
    close: 'Doğru planlanmış adımlarla bu açıklar kapanabilir.',
    you: 'Bazı temel konularda eksiklerin var; bunlar küçük adımlarla kapanabilir.',
    family: 'temel becerilerinde desteklenmesi gereken alanlar bulunan',
    theme: 'temel akademik becerilerde açıklar',
  },
  {
    trait: 'ac_math_low',
    clause: 'matematikte konu eksikleri öne çıkıyor',
    close: 'Eksik konular adım adım tamamlandığında matematikte belirgin bir ilerleme görülebilir.',
    you: 'Matematikte bazı konularda eksiklerin var; bir hata defteriyle bunları adım adım kapatabilirsin.',
    family: 'matematikte konu eksiklerini tamamlaması gereken',
    theme: 'matematikte konu eksikleri',
  },
  {
    trait: 'ac_read_low',
    clause: 'okuduğunu anlamadaki zorlanma diğer derslere de yansıyabiliyor',
    close: 'Düzenli okuma alışkanlığı tüm dersleri destekleyecektir.',
    you: 'Okuduğunu anlamak bazen zor gelebiliyor; her gün kısa okumalar bu beceriyi güçlendirir.',
    family: 'okuduğunu anlama becerisi desteklenmesi gereken',
    theme: 'okuduğunu anlamada zorlanma',
  },
  {
    trait: 'st_conscious_low',
    clause: 'kendini sınama ve aktif tekrar gibi verimli çalışma yöntemleri henüz yerleşmemiş',
    close: 'Burada belirleyici olan çalışma süresinden çok çalışma yöntemi.',
    you: 'Çalışırken okuyup geçmek yerine kendini sınamaya daha çok yer verdiğinde emeğinin karşılığını daha iyi alacaksın.',
    family: 'çalışmasının içeriğini değiştirdiğinde çok daha iyi sonuç alabilecek',
    theme: 'pasif çalışma yöntemleri ve kendini sınama eksikliği',
  },
  {
    trait: 'att_low',
    clause: 'dikkatini uzun süre sürdürmekte zorlandığı için bildiği konularda bile hata yapabiliyor',
    close: 'Sorun bilgi eksikliğinden çok dikkatin sürdürülmesinde.',
    you: 'Uzun süre aynı işe odaklanmak sana zor gelebiliyor; kısa bloklarla çalışmak işini kolaylaştırır.',
    family: 'dikkatini uzun süre sürdürmekte zorlanabilen',
    theme: 'dikkati sürdürmede ve doğrulukta zorlanma',
  },
  {
    trait: 'att_impulsive',
    clause: 'acele ettiğinde dikkatsizlik hataları artıyor',
    close: 'Hız iyi; doğruluk için küçük bir kontrol alışkanlığı yeterli olabilir.',
    you: 'Hızlı çalışıyorsun ama acele ettiğinde dikkatsizlik hataları yapabiliyorsun.',
    family: 'hızlı ama acele ettiğinde hata yapabilen',
    theme: 'hızlı ama hataya açık, dürtüsel yanıtlama eğilimi',
  },
  {
    trait: 'att_late_drop',
    clause: 'süre ilerledikçe azalan odak, uzun sınavların son bölümlerinde puan kaybına yol açabiliyor',
    close: 'Dayanıklılık çalışması ve kısa molalar bu düşüşü azaltabilir.',
    you: 'Uzun sınavların sonuna doğru odağın düşebiliyor; bölüm aralarındaki kısa molalar sana iyi gelir.',
    family: 'uzun görevlerin sonuna doğru odağı azalabilen',
    theme: 'görev ilerledikçe düşen dikkat',
  },
  {
    trait: 'st_exam_low',
    clause: 'sınavlara hazırlanma ve sınavda zamanı yönetme konusunda desteğe ihtiyaç duyuyor',
    close: 'Deneme sınavlarıyla planlı bir hazırlık bu alanı güçlendirebilir.',
    you: 'Sınavlara hazırlanırken ve sınavda zamanı yönetirken zorlanabiliyorsun.',
    family: 'sınava hazırlanma ve zaman yönetimi desteklenmesi gereken',
    theme: 'sınava hazırlanma ve sınavda zaman yönetiminde destek ihtiyacı',
  },
];

function strengthItems(traits: TraitMap, analyses: TestAnalysis[]): { third: string[]; you: string[]; adj: string[] } {
  const has = (k: string) => (traits[k] ?? 0) > 0;
  const third: string[] = [];
  const you: string[] = [];
  const adj: string[] = [];
  if (has('ac_read_high')) {
    third.push('Okuduğunu anlama becerisi güçlü; uzun ve karmaşık metinleri rahatça takip edebiliyor.');
    you.push('Okuduğunu iyi anlıyorsun; uzun metinleri rahatça takip edebiliyorsun.');
    adj.push('okuduğunu iyi anlayan');
  }
  if (has('ac_logic_high')) {
    third.push('Mantık yürütme becerisi güçlü; kurallar ve örüntüler arasında bağlantı kurabiliyor.');
    you.push('Mantık yürütmede güçlüsün; örüntüleri ve bağlantıları hızla görüyorsun.');
    adj.push('akıl yürütmesi güçlü');
  }
  if (has('ac_math_high')) {
    third.push('Matematiksel muhakemede güçlü bir temeli var.');
    you.push('Matematikte sağlam bir temelin var.');
    adj.push('matematikte güçlü');
  }
  if (has('ac_high') && !has('ac_read_high') && !has('ac_logic_high') && !has('ac_math_high')) {
    third.push('Temel akademik becerilerinde sağlam bir zemini var.');
    you.push('Temel akademik becerilerin sağlam.');
    adj.push('akademik temeli sağlam');
  }
  const study = analyses.find((a) => a.testId === 'calisma-davranisi');
  if (has('st_good')) {
    third.push('Düzenli ve planlı çalışma alışkanlığı büyük ölçüde yerleşmiş.');
    you.push('Düzenli ve planlı çalışabiliyorsun.');
    adj.push('düzenli çalışan');
  } else if (study) {
    const hi = studyLevels(study).filter((r) => r.level >= 4).sort((x, y) => y.pct - x.pct).slice(0, 2);
    if (hi.length) {
      third.push(`${capFirst(joinTr(hi.map((r) => STUDY_THIRD[r.key])))} güçlü yanları arasında.`);
      you.push(`${capFirst(joinTr(hi.map((r) => STUDY_YOU[r.key])))}.`);
      adj.push(STUDY_ADJ[hi[0].key]);
    }
  }
  if (has('att_good') && !has('att_impulsive')) {
    third.push('Dikkatini uzun süre ve doğru biçimde sürdürebiliyor.');
    you.push('Dikkatini uzun süre toplayabiliyorsun.');
    adj.push('dikkatini iyi sürdürebilen');
  }
  if (has('anx_low')) {
    third.push('Sınavlara karşı sakin ve dengeli bir tutumu var.');
    you.push('Sınavlarda sakin kalabiliyorsun; bu büyük bir avantaj.');
    adj.push('sınavlara sakin yaklaşan');
  }
  if (has('att_slow') && !has('att_low')) {
    third.push('Doğruluğa önem veriyor; dikkat gerektiren işlerde az hata yapıyor.');
    you.push('Dikkat gerektiren işlerde az hata yapıyorsun.');
    adj.push('doğruluğa önem veren');
  } else if (has('att_mid') && !has('att_impulsive')) {
    third.push('Dikkatini toplayıp makul bir süre sürdürebiliyor.');
    you.push('Dikkatini toplayıp bir süre sürdürebiliyorsun.');
    adj.push('dikkatini toplayabilen');
  }
  // Sınav kaygısında düşük çıkan alt boyutlar güçlü yan olarak anılır
  const anx = analyses.find((a) => a.testId === 'sinav-kaygisi');
  if (anx && !has('anx_low')) {
    const LOW_TXT: Record<string, [string, string]> = {
      'Genel sınav kaygısı': ['Sınavlara karşı genel gerginliği düşük.', 'Sınavlara karşı genel gerginliğin düşük.'],
      'Hazırlıksızlık endişesi': ['"Yeterince çalışmadım" duygusu düşük; hazırlığına güveniyor.', 'Hazırlığına güveniyorsun.'],
      'Gelecek endişesi': ['Sınav sonucunu geleceğin tamamı gibi görmüyor.', 'Bir sınavı geleceğin tamamı gibi görmüyorsun.'],
      'Başkalarının ne düşüneceği': ['Başkalarının ne düşüneceği konusunda fazla endişelenmiyor.', 'Başkalarının ne düşüneceğini fazla dert etmiyorsun.'],
      'Kendine yönelik endişe': ['Kendine yönelik beklentileri dengeli.', 'Kendine yönelik beklentilerin dengeli.'],
      'Bedensel belirtiler': ['Kaygı bedenine fazla yansımıyor.', 'Kaygı bedenine fazla yansımıyor.'],
      'Sınav sırasında zihnin boşalması': ['Sınav sırasında zihninin boşalması pek yaşanmıyor.', 'Sınav sırasında zihnin pek boşalmıyor.'],
    };
    anx.levels.filter((r) => r.level <= 2).slice(0, 2).forEach((r) => {
      const t = LOW_TXT[r.label];
      if (t) {
        third.push(t[0]);
        you.push(t[1]);
      }
    });
  }
  if (has('rd_fast') && has('rd_comp_high')) {
    third.push('Hem hızlı hem anlayarak okuyor.');
    you.push('Hem hızlı hem anlayarak okuyorsun.');
    adj.push('hızlı ve anlayarak okuyan');
  } else if (has('rd_comp_high')) {
    third.push('Okuduğunu anlama oranı yüksek; okurken ayrıntıları kaçırmıyor.');
    you.push('Okuduğunu iyi anlıyorsun; ayrıntıları kaçırmıyorsun.');
    adj.push('okuduğunu dikkatle anlayan');
  } else if (has('rd_fast')) {
    third.push('Okuma hızı iyi düzeyde.');
    you.push('Hızlı okuyabiliyorsun.');
  }
  if (has('br_right')) {
    third.push('Konulara önce bütünden bakmayı, sezgi ve hayal gücünü kullanmayı seviyor.');
    you.push('Konulara önce bütünden bakmayı ve hayal gücünü kullanmayı seviyorsun.');
    adj.push('bütüne bakabilen ve hayal gücü geniş');
  } else if (has('br_left')) {
    third.push('Adım adım ilerlemeyi, sırayı ve ayrıntıyı izlemeyi seviyor.');
    you.push('Adım adım ilerlemeyi ve ayrıntıları izlemeyi seviyorsun.');
    adj.push('adım adım ve düzenli düşünen');
  } else if (has('br_bal')) {
    third.push('Hem bütüne hem ayrıntıya bakabiliyor; konuya göre yöntem değiştirebiliyor.');
    you.push('Hem bütüne hem ayrıntıya bakabiliyorsun.');
    adj.push('hem bütüne hem ayrıntıya bakabilen');
  }
  const mi = analyses.find((a) => a.testId === 'coklu-zeka');
  const top = ((mi?.facts as Record<string, unknown> | undefined)?.top as string[] | undefined) ?? [];
  if (top[0]) {
    third.push(`${MI_LABEL[top[0]]} alana belirgin ilgisi var; ${MI_INFO[top[0]]?.learn ?? ''} öğrenmeye yatkın.`);
    you.push(`${capFirst(MI_YOU[top[0]] ?? '')}.`);
    adj.push(MI_ADJ[top[0]]);
    // Kişilik testi yoksa ikinci ilgi alanı da anılır
    if (top[1] && analyses.length <= 2 && !analyses.some((a) => a.testId === 'enneagram')) {
      third.push(`${MI_LABEL[top[1]]} alana da ilgisi yüksek.`);
      you.push(`${capFirst(MI_YOU[top[1]] ?? '')}.`);
      adj.push(MI_ADJ[top[1]]);
    }
  }
  const vark = analyses.find((a) => a.testId === 'vark');
  if (vark) {
    const d = String((vark.facts as Record<string, unknown>).dominant);
    const words: Record<string, string> = { V: 'Görsel malzemeyle (şema, tablo, renkli not)', A: 'Dinleyerek ve konuşarak', R: 'Okuyup yazarak', K: 'Yaparak ve deneyerek' };
    third.push(`${words[d] ?? ''} öğrenmeye belirgin bir ilgisi var.`);
    you.push(`${words[d] ?? ''} öğrenmek sana daha kolay geliyor.`);
    if (!top[0]) adj.push(VARK_ADJ[d]);
  }
  const hol = analyses.find((a) => a.testId === 'holland');
  const code = hol ? String((hol.facts as Record<string, unknown>).code ?? '') : '';
  if (code) {
    third.push(`${HOLLAND_LABEL[code[0]]} ilgi alanı belirgin; ${HOLLAND_INFO[code[0]]?.act ?? ''} gerektiren etkinlikler ona keyif veriyor.`);
    you.push(`${capFirst(HOLLAND_INFO[code[0]]?.act ?? '')} gerektiren etkinlikler sana keyif veriyor.`);
    if (!top[0]) adj.push(HOL_ADJ[code[0]]);
  }
  return { third, you, adj: adj.filter(Boolean) };
}

function growthItems(traits: TraitMap, analyses: TestAnalysis[]): string[] {
  const has = (k: string) => (traits[k] ?? 0) > 0;
  const out: string[] = [];
  if (has('st_conscious_low')) out.push('Kitabı kapatıp kendini sınama ve düzenli tekrar alışkanlığı kazanmak.');
  if (has('st_start_low')) out.push('Çalışmaya zamanında başlamak ve planı sürdürmek.');
  if (has('st_exam_low')) out.push('Sınavlara planlı hazırlanmak ve sınavda zamanı yönetmek.');
  if (has('st_notes_low')) out.push('Derste dinleme ve not tutma alışkanlığını güçlendirmek.');
  if (has('st_reading_low')) out.push('Düzenli okuma alışkanlığı kazanmak.');
  if (has('st_homework_low')) out.push('Ödevleri zamanında ve düzenli hazırlamak.');
  if (has('anx_blank') && !has('anx_high')) out.push('Sınav anında zihnin boşalmasını önleyecek sakinleşme tekniklerini öğrenmek.');
  if (has('att_late_drop') || has('att_fluct')) out.push('Uzun görevlerde odağı son bölüme kadar korumak.');
  if (has('att_impulsive')) out.push('Acele etmeden, cevabı kontrol ederek çalışmak.');
  if (has('att_mid') && !has('att_late_drop') && !has('att_fluct')) out.push('Dikkatini daha uzun süre aynı düzeyde tutabilmek.');
  const ac = analyses.find((a) => a.testId === 'akademik-analiz');
  const weak = ((ac?.facts as Record<string, unknown> | undefined)?.weakSkills as string[] | undefined) ?? [];
  if (ac && weak.length) {
    const rows = [...ac.levels].sort((x, y) => (x.pct ?? 0) - (y.pct ?? 0));
    if (rows[0] && rows[0].level <= 3) out.push(`${capFirst(joinTr(weak))} konularında hedefli çalışmak.`);
  }
  // Testin kendisinden doğan gelişim adımları (zayıf alan çıkmayan testlerde de boş kalmasın)
  const mi = analyses.find((a) => a.testId === 'coklu-zeka');
  const bottom = ((mi?.facts as Record<string, unknown> | undefined)?.bottom as string[] | undefined) ?? [];
  if (bottom.length) out.push(`Daha az ilgi duyduğu ${joinTr(bottom.slice(0, 2).map((k) => MI_LABEL[k].toLocaleLowerCase('tr-TR')))} alanları küçük ve keyifli etkinliklerle tanımak.`);
  else if (mi) out.push('İlgi duyduğu alanları okul derslerinde de kullanabileceği yollar bulmak.');
  const vark = analyses.find((a) => a.testId === 'vark');
  if (vark) {
    const f = vark.facts as Record<string, unknown>;
    const order = (f.order as string[] | undefined) ?? [];
    const low = order.length >= 3 ? order[order.length - 1] : undefined;
    out.push(`Daha az kullandığı öğrenme yollarını${low ? ` (ör. ${VARK_LABEL[low].replace(/\s*\(.*\)/, '').toLocaleLowerCase('tr-TR')})` : ''} da deneyerek çalışma yöntemlerini çeşitlendirmek.`);
  }
  const hol = analyses.find((a) => a.testId === 'holland');
  if (hol) out.push(has('hol_flat') ? 'İlgilerini netleştirmek için farklı alanları kulüp, proje ve gönüllü çalışmalarla denemek.' : 'İlgi alanlarını kulüp, proje ve atölye gibi somut deneyimlerle sınamak.');
  if (has('br_right')) out.push('Ayrıntı ve sıra gerektiren işlerde adım adım ilerleme becerisini geliştirmek.');
  else if (has('br_left')) out.push('Konulara önce bütünden bakma ve farklı çözüm yolları üretme becerisini geliştirmek.');
  else if (has('br_bal')) out.push('İki düşünme tarzını konuya göre bilinçli olarak seçmek.');
  if (has('rd_comp_high') && !has('rd_fast')) out.push('Anlamayı koruyarak okuma hızını kademeli olarak artırmak.');
  else if (has('rd_fast') && has('rd_comp_high')) out.push('Güçlü okuma becerisini uzun ve zor metinlerde de sürdürmek.');
  if (has('att_good') && !has('att_impulsive') && analyses.length === 1) out.push('Güçlü dikkatini uzun sınavlarda da korumak için sınav provası yapmak.');
  return out;
}

/** Sonuçlardan "sentez" profil kurar. persona yoksa raporun anlatım omurgası olur. */
export function syntheticProfile(traits: TraitMap, analyses: TestAnalysis[], hasPersona: boolean): Profile {
  const raw = (k: string) => (traits[k] ?? 0) > 0;
  // Çalışma düzeni "orta" olsa bile başlama/sürdürme ya da sınava hazırlanma zayıfsa
  // rapor bunu çalışma düzeni sorunu olarak ele alır (bağlamdaki profil seçimiyle aynı kural).
  const has = (k: string) =>
    k === 'st_weak'
      ? raw('st_weak') || (raw('st_mid') && (raw('st_start_low') || raw('st_exam_low')))
      : k === 'ac_both_low'
        ? raw('ac_math_low') && raw('ac_read_low')
        : raw(k);
  const s = strengthItems(traits, analyses);
  const g = growthItems(traits, analyses);
  const issue = ISSUES.find((i) => has(i.trait));
  const p: Profile = { id: 'synthetic', weight: hasPersona ? 5 : 9.5, strengths: s.third.slice(0, 4), growth: g.slice(0, 3), youStrengths: s.you.slice(0, 4) };
  // Çalışma davranışında zayıf alt alanlara özel küçük adımlar ve riskler
  const qw: string[] = [];
  const rk: string[] = [];
  if (raw('st_reading_low')) {
    qw.push('Her gün 15 dakika ilgisini çeken bir metni okumak');
    rk.push('Okuma alışkanlığının zayıf kalması, zamanla tüm derslerde okuduğunu anlamayı etkileyebilir.');
  }
  if (raw('st_notes_low')) {
    qw.push('Derste kısa anahtar kelime notları tutmak ve akşam bu notlara 5 dakika göz atmak');
    rk.push('Dersten yeterince yararlanılamaması, evdeki çalışma yükünü artırabilir.');
  }
  if (raw('st_exam_low')) {
    qw.push('Sınavdan bir hafta önce kısa bir tekrar planı hazırlamak');
    rk.push('Sınava son günlerde hazırlanmak, bilinen konuların da sınavda verimli kullanılmasını zorlaştırabilir.');
  }
  if (qw.length) p.quickWins = qw;
  if (rk.length) p.risks = rk;
  const miA = analyses.find((a) => a.testId === 'coklu-zeka');
  const miTop = ((miA?.facts as Record<string, unknown> | undefined)?.top as string[] | undefined) ?? [];
  const MI_WAYS: Record<string, string> = {
    sozel: 'Konuyu kendi cümlelerinle yaz ya da birine anlat.',
    mantiksal: 'Konuları tablo ve şemayla çalış; kuralın nedenini sorgula.',
    gorsel: 'Zihin haritası ve renkli şemalarla not tut.',
    muziksel: 'Ezberlemen gereken bilgileri ritim ya da kafiyeyle çalış.',
    dogaci: 'Konuları gerçek hayattan ve doğadan örneklerle ilişkilendir.',
    sosyal: 'Bir arkadaşınla soru-cevap yaparak çalış.',
    bedensel: 'Çalışırken kısa hareket molaları ver; model ve deneylerle öğren.',
    icsel: 'Kendi hedeflerini koy ve ilerlemeni kendin takip et.',
  };
  const ways = miTop.slice(0, 2).map((k) => MI_WAYS[k]).filter(Boolean);
  if (ways.length && !hasPersona) p.youWays = ways;
  if (hasPersona) return p;

  const adj = s.adj.slice(0, 3);
  const joinAdj = (xs: string[]) => (xs.some((x) => / ve /.test(x)) ? xs.join(', ') : joinTr(xs));
  const head = adj.length ? `{ad}, ${joinAdj(adj)} bir öğrenci` : '{adın} sonuçları dengeli bir tablo çiziyor';
  const next = g[0] ? ` Bundan sonraki adım: ${lc(g[0])}` : '';
  const issue2 = issue ? ISSUES.find((i) => i !== issue && has(i.trait) && !(issue.trait === 'ac_both_low' && /^ac_(math|read)_low$/.test(i.trait))) : undefined;
  const issueTxt = issue ? (adj.length ? `${head}; ancak ${issue.clause}.` : `{adın} sonuçlarında öne çıkan nokta şu: ${capFirst(issue.clause)}.`) : '';
  p.kisaca = issue ? `${issueTxt} ${issue.close}${issue2 ? ` Buna ek olarak ${issue2.theme} öne çıkıyor.` : ''}` : `${head}.${next}`;
  p.familyOneLine = issue
    ? `{ad}, ${adj.length ? `${joinAdj(adj)}; ` : ''}${issue.family} ama doğru yapı ve tutarlı bir destekle potansiyelini çok daha iyi gösterebilecek biri.`
    : adj.length
      ? `{ad}, ${joinAdj(adj)} ve desteklendiğinde bu güçlü yanlarını her alanda daha iyi kullanabilecek biri.`
      : '{ad}, desteklendiğinde güçlü yanlarını her alanda daha iyi kullanabilecek biri.';
  // "Güçlü Yanların" listesini tekrar etmemek için burada sıfatlar kullanılır.
  const youHead = adj.length ? `{ad}, sen ${joinAdj(adj)} birisin.` : '{ad}, bu değerlendirme seni daha iyi tanımak için bir başlangıç.';
  p.youAre = `${youHead} ${issue ? issue.you : ''} Bu rapor, seni daha iyi tanıman ve kendine en uygun çalışma yollarını bulman için hazırlandı.`.replace(/\s+/g, ' ').trim();
  if (issue) p.caseTheme = `${issue.theme}${issue2 ? `; buna ek olarak ${issue2.theme}` : ''}`;
  else {
    const only = analyses.length === 1 ? analyses[0].testId : '';
    const THEME: Record<string, string> = {
      'coklu-zeka': 'ilgi ve öğrenme tercihlerinin haritalanması',
      vark: 'öğrenme tercihlerinin çalışma yöntemlerine aktarılması',
      holland: 'meslek ilgilerinin keşfi ve netleştirilmesi',
      'hizli-okuma': 'okuma hızı ve anlama dengesinin korunması',
      'sag-sol-beyin': 'düşünme tercihinin öğrenme yöntemlerine yansıtılması',
      'd2-dikkat': 'dikkat performansının korunması ve sürdürülmesi',
      'burdon-dikkat': 'dikkat performansının korunması ve sürdürülmesi',
      'calisma-davranisi': 'çalışma alışkanlıklarının korunması ve geliştirilmesi',
      'akademik-analiz': 'akademik becerilerin dengeli biçimde geliştirilmesi',
      'sinav-kaygisi': 'sınav dönemindeki duygusal dengenin korunması',
    };
    if (THEME[only]) p.caseTheme = THEME[only];
  }
  const mi = analyses.find((a) => a.testId === 'coklu-zeka');
  const top = ((mi?.facts as Record<string, unknown> | undefined)?.top as string[] | undefined) ?? [];
  if (top.length) {
    const fields = [...new Set(top.slice(0, 2).flatMap((k) => MI_INFO[k]?.careers ?? []))].slice(0, 4);
    const ints = top.slice(0, 2).map((k) => MI_INFO[k]?.interest ?? '');
    p.youFuture = `İlgilerin en çok ${ints.length > 1 ? `${ints[0]}; ayrıca ${ints[1]}` : ints[0]} yönünde. ${fields.length ? `${capFirst(joinList(fields))} gibi alanlar ileride keşfetmeye değer olabilir. ` : ''}Bunlar bir meslek kararı değil, sadece ipuçları.`;
  }
  const vark = analyses.find((a) => a.testId === 'vark');
  if (vark) {
    const d = String((vark.facts as Record<string, unknown>).dominant);
    p.learning = [`{ad} ${VARK_INFO[d]?.pref ?? ''} tercih ediyor.`];
  }
  // Tek test raporlarında teste özel öncelik, deneme önerisi ve uzman soruları
  if (analyses.length === 1) {
    const id = analyses[0].testId;
    const f = analyses[0].facts as Record<string, unknown>;
    const S: Partial<Pick<Profile, 'priority' | 'youTry' | 'questions' | 'priorities' | 'quickWins' | 'risks'>> = {};
    if (id === 'coklu-zeka') {
      const t = ((f.top as string[]) ?? []).slice(0, 2).map((k) => MI_LABEL[k].toLocaleLowerCase('tr-TR'));
      S.priority = `Önümüzdeki dönemin önceliği, öne çıkan ${joinTr(t)} ilgilerini hem derslerde hem okul dışı etkinliklerde kullanabileceği fırsatlar yaratmak.`;
      S.youTry = [`İlgi keşfi: Bu ay ${t[0] ?? 'ilgi duyduğun'} alanda yeni bir etkinlik dene (bir kulüp, kitap ya da atölye).`, 'Ders köprüsü: Zorlandığın bir dersi, en sevdiğin alanın yöntemiyle çalışmayı dene ve farkı not et.'];
      S.questions = ['Okulda ya da okul dışında en çok hangi etkinlikte zamanın nasıl geçtiğini anlamıyorsun?', 'Hangi derste kendini en çok "ben bunu seviyorum" diye hissediyorsun?'];
      S.priorities = [['İlgi alanlarının derslerle bağlanması', 'İlgiyle bağ kurulan dersler, çalışma isteğini ve kalıcılığı artırır.']];
      S.quickWins = ['İlgi alanına uygun bir kulüp ya da etkinliğe katılmak'];
      S.risks = ['İlgi alanlarının dikkate alınmaması, derslere karşı isteğin azalmasına yol açabilir.'];
    } else if (id === 'vark') {
      const d = String(f.dominant);
      S.priority = `Önümüzdeki dönemin önceliği, ${VARK_LABEL[d]?.replace(/\s*\(.*\)/, '').toLocaleLowerCase('tr-TR') ?? ''} öğrenme tercihine uygun yöntemleri derslere taşımak ve diğer yolları da deneyerek çalışma yöntemlerini çeşitlendirmek.`;
      S.youTry = ['Yöntem denemesi: Bu ay bir dersi en sevdiğin yöntemle, bir dersi de hiç denemediğin bir yöntemle çalış ve farkı not et.', 'Not dönüşümü: Bir konunun notlarını kendi tarzına (şema, ses kaydı, liste ya da örnek soru) çevir.'];
      S.questions = ['Bir konuyu en kolay hangi yolla öğreniyorsun: görerek, dinleyerek, okuyarak mı, yaparak mı?', 'Hangi derslerde çalışma yöntemin işe yaramıyor gibi hissediyorsun?'];
      S.priorities = [['Çalışma yöntemlerinin çeşitlendirilmesi', 'Tercih edilen yolu kullanmak ve diğer yolları da denemek öğrenmeyi kalıcı kılar.']];
      S.quickWins = ['Her ders için en uygun bir çalışma yöntemini seçip iki hafta denemek'];
      S.risks = ['Tek bir yönteme sıkışmak, o yönteme uymayan derslerde zorlanmaya yol açabilir.'];
    } else if (id === 'holland') {
      S.priority = 'Önümüzdeki dönemin önceliği, öne çıkan ilgi alanlarını kulüp, proje ve tanıtım günleri gibi somut deneyimlerle sınamak.';
      S.youTry = ['Meslek sohbeti: İlgi alanındaki bir meslekte çalışan biriyle 15 dakika konuş ve ona günlük işini sor.', 'Keşif listesi: Merak ettiğin üç meslek hakkında kısa bir araştırma yap ve en çok hoşuna gideni işaretle.'];
      S.questions = ['Gelecekte kendini hangi ortamda çalışırken hayal ediyorsun?', 'Bugüne kadar en çok keyif aldığın proje ya da etkinlik neydi?'];
      S.priorities = [['İlgilerin somut deneyimlerle sınanması', 'İlgiler bu yaşlarda şekillenmeye devam eder; deneyim, tercihleri netleştirir.']];
      S.quickWins = ['İlgi alanıyla ilgili bir tanıtım gününe ya da atölyeye katılmak'];
      S.risks = ['İlgileri sınamadan erken karar vermek, ileride tercih değişikliğine yol açabilir.'];
    } else if (id === 'hizli-okuma' && !has('rd_rushing') && !has('rd_slow')) {
      S.priority = has('rd_comp_high') ? 'Önümüzdeki dönemin önceliği, güçlü anlama becerisini koruyarak okuma hızını kademeli olarak artırmak.' : 'Önümüzdeki dönemin önceliği, düzenli okuma alışkanlığıyla hem hızı hem anlamayı birlikte geliştirmek.';
      S.youTry = ['Okuma kaydı: Haftada bir kez 5 dakika süre tutarak oku; hızını ve anladıklarını bir deftere yaz.', 'Günlük okuma: Her gün ilgini çeken bir metinden 15 dakika oku.'];
      S.questions = ['Uzun metinleri okurken nerede zorlanıyorsun: hızda mı, anlamada mı?'];
      S.priorities = [['Okuma hızının anlamayı koruyarak artırılması', 'Uzun metinli sınavlarda zaman kazandırır.']];
    } else if (id === 'sag-sol-beyin') {
      S.priority = 'Önümüzdeki dönemin önceliği, düşünme tercihine uygun çalışma yöntemlerini kullanırken diğer yaklaşımı da geliştirmek.';
      S.youTry = ['Diğer yol: Bu ay bir konuyu, alışık olmadığın düşünme yoluyla (şema yerine madde ya da tersi) çalışmayı dene.', 'Önce büyük resim: Yeni bir konuya başlamadan önce konunun bir sayfalık özetine göz at.'];
      S.questions = ['Yeni bir konuyu öğrenirken önce genel resmi mi, yoksa ayrıntıları mı görmek istersin?'];
      S.priorities = [['İki düşünme tarzının da geliştirilmesi', 'Konuya göre yöntem seçebilmek öğrenmeyi esnek ve kalıcı kılar.']];
      S.quickWins = ['Bir dersin notlarını hem şema hem madde hâlinde çıkarmayı denemek'];
      S.risks = ['Tek bir düşünme tarzına sıkışmak, o tarza uymayan konularda zorlanmaya yol açabilir.'];
    } else if ((id === 'd2-dikkat' || id === 'burdon-dikkat') && !has('att_low')) {
      S.priority = has('att_good') ? 'Önümüzdeki dönemin önceliği, güçlü dikkatini uzun sınavlarda da koruyabilmek için deneme sınavlarıyla dayanıklılık kazanmak.' : 'Önümüzdeki dönemin önceliği, dikkati daha uzun süre aynı düzeyde tutabilmek: 25-30 dakikalık bloklar, kısa molalar ve sade bir çalışma ortamı.';
      S.youTry = ['Odak bloğu: Her gün 25 dakikalık bir çalışma bloğunda telefonu başka odaya bırak ve kaç soru çözdüğünü yaz.', 'Mola düzeni: Her bloktan sonra 5 dakika ekransız mola ver.'];
      S.questions = ['Derste ya da ders çalışırken dikkatinin en çok ne zaman dağıldığını fark ediyor musun?', 'Uzun sınavların hangi bölümünde daha çok yoruluyorsun?'];
      S.priorities = [['Dikkatin uzun görevlerde korunması', 'Uzun sınavlarda son bölümlerdeki verimi belirler.']];
      S.quickWins = ['25-30 dakikalık çalışma blokları ve aralarında kısa molalar'];
      S.risks = ['Uzun ve molasız çalışma, dikkatin görev sonuna doğru düşmesine yol açabilir.'];
    } else if (id === 'calisma-davranisi' && has('st_good')) {
      S.priority = 'Önümüzdeki dönemin önceliği, yerleşmiş çalışma düzenini korumak ve görece daha düşük kalan alanı güçlendirmek.';
      S.youTry = ['Haftalık plan: Her pazar bir sonraki haftanın planını 10 dakikada hazırla.'];
    } else if (id === 'sinav-kaygisi' && has('anx_low')) {
      S.priority = 'Önümüzdeki dönemin önceliği, sınavlardaki sakinliğini korumak ve hazırlık dönemini düzenli bir planla sürdürmek.';
    } else if (id === 'akademik-analiz' && has('ac_both_low')) {
      S.priority = 'Önümüzdeki dönemin önceliği, okuduğunu anlama ve matematikteki eksikleri kısa ve düzenli çalışmalarla kapatmak: her gün 15 dakika okuma ve haftada üç kez hedefli matematik seti.';
      S.priorities = [['Okuduğunu anlama ve matematik', 'İki alan da en çok desteklenmesi gereken alanlar; okuma becerisi matematikteki sözel problemleri de etkiliyor.']];
    }
    Object.assign(p, S);
  }
  p.youLast = issue
    ? `{ad}, güçlü yanların sandığından fazla. ${issue.trait.startsWith('anx') ? 'Bildiğini sakin kalarak gösterebilmek öğrenilebilen bir beceri.' : 'Küçük ama düzenli adımlar, emeğinin karşılığını almanın en kısa yolu.'} Kendi hızında ilerlediğin her hafta, bir öncekinden daha güçlü olacaksın.`
    : '{ad}, güçlü yanlarını fark ettikçe ve onları kullandıkça daha da ilerleyeceksin. Kendi yolunda attığın her küçük adım değerli.';
  return p;
}
