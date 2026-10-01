// ============================================================
// Rapor v2 — Rapor kurucu
// ============================================================
// Test sonuçlarından, örnek raporlardaki 8 bölümlü "Bütünsel Değerlendirme
// Raporu"nu kurar:
//   Kapak · 1 Bu Rapor Hakkında · 2 Kısaca · 3 Değerlendirme Sonuçları ·
//   4 Bütünsel Değerlendirme · 5 Öğrenci İçin · 6 Aile İçin · 7 Uzman İçin ·
//   8 Son Söz
// Yapay zekâ kullanılmaz; metinler içerik kütüphanesinden kurallarla seçilir.

import type { Block, ReportV2, ReportStudent, Section, AppliedTest } from './types';
import { analyzeTest, mergeTraits, MI_LABEL, type TestAnalysis } from './analyze';
import { makeCtx, P, BUL, KEY, type Ctx } from './context';
import { buildHolistic } from './holistic';
import { testNote, testParagraphs, VARK_INFO, HOLLAND_INFO } from './content/tests';
import { firstNameOf, joinList, joinTr, trDate, capFirst, tidy } from './tr';
import { normalizeTestType, testColor } from '@/lib/tests/colors';

export const REPORT_NAVY = '#245B8F';

// ── Paket tanımları (rapor açısından) ────────────────────────

export type ReportPackageId = 'potansiyel-mizac' | 'akademik-performans' | 'sinav-strateji' | 'kariyer-gelecek' | 'vip';

interface PackageSpec {
  title: string;
  subtitle: string;
  scope: string;
  holistic: string[];
  retest: string;
}

export const PACKAGE_SPECS: Record<ReportPackageId, PackageSpec> = {
  'potansiyel-mizac': {
    title: 'Potansiyel & Mizaç Paketi',
    subtitle: 'Bütünsel Değerlendirme Raporu',
    scope: 'mizaç, kişilik ve ilgi eğilimlerini',
    holistic: ['portrait', 'motivation', 'resources', 'blindspots', 'communication', 'stress', 'conflict', 'interests', 'learning', 'futureHints'],
    retest: 'Öğrenciler bu yıllarda hızla değiştiği için yaklaşık bir yıl sonra bir tekrar değerlendirme yapılması önerilir.',
  },
  'akademik-performans': {
    title: 'Akademik Performans Paketi',
    subtitle: 'Bütünsel Değerlendirme Raporu',
    scope: 'akademik becerilerini, çalışma alışkanlıklarını, dikkatini ve öğrenme tercihlerini',
    holistic: ['academicPicture', 'skillsInteract', 'learningPrefs', 'studyHabits', 'effortGap', 'potentialGap', 'subjectTips', 'quickWins', 'risks', 'top3', 'tracking'],
    retest: 'Akademik beceriler ve çalışma alışkanlıkları düzenli çalışmayla değişebildiği için dönem sonunda bir tekrar değerlendirme yapılması önerilir.',
  },
  'sinav-strateji': {
    title: 'Sınav Strateji Paketi',
    subtitle: 'Bütünsel Değerlendirme Raporu',
    scope: 'sınava hazırlık durumunu, kaygı ve dikkat profilini, çalışma düzenini',
    holistic: ['readiness', 'targetRange', 'anxietyProfile', 'anxietyImpact', 'focus', 'studyAttention', 'mockExams', 'examAdvantages', 'examRisks', 'examStrategy', 'tracking', 'proSupport'],
    retest: 'Hazırlık süreci boyunca yaklaşık üç ay sonra kısa bir ara değerlendirme, sınav döneminin sonunda ise tam bir tekrar değerlendirme önerilir.',
  },
  'kariyer-gelecek': {
    title: 'Kariyer & Gelecek Paketi',
    subtitle: 'Bütünsel Değerlendirme Raporu',
    scope: 'ilgi ve kişilik temelli kariyer yönelimini',
    holistic: ['careerIdentity', 'interestProfile', 'workEnvironment', 'motivationCareer', 'skillMap', 'productiveAreas', 'drains', 'careerFields', 'majorsMap', 'selfDevelopment', 'decisionTips', 'roadmap'],
    retest: 'İlgiler bu yıllarda şekillenmeye devam ettiği için yaklaşık bir yıl sonra bir tekrar değerlendirme yapılması önerilir.',
  },
  vip: {
    title: 'VIP Tam Kapsamlı Eğitim Check-Up Paketi',
    subtitle: '360° Bütünsel Değerlendirme Raporu',
    scope: 'kişilik, akademik, dikkat, kaygı ve kariyer alanlarındaki durumunu',
    holistic: ['atAGlance', 'portrait', 'strengthsGrowth', 'communication', 'academicAndLearning', 'studyHabitsVip', 'subjectTips', 'focusVip', 'examAnxietyVip', 'interestFit', 'careerFields', 'personalityAcademic', 'anxietySource', 'efficiencySource', 'targetDistance', 'potentialGap', 'consistency', 'overall'],
    retest: 'Kişilik ve ilgi alanları için yaklaşık bir yıl sonra; akademik beceriler, çalışma düzeni ve sınav kaygısı için ise dönem sonunda bir tekrar değerlendirme yapılması önerilir.',
  },
};

/** Tek test raporlarında "Bütünsel Değerlendirme" alt bölümleri. */
const SINGLE_HOLISTIC: Record<string, string[]> = {
  enneagram: ['portrait', 'motivation', 'resources', 'blindspots', 'communication', 'stress', 'conflict', 'learning', 'futureHints'],
  'coklu-zeka': ['interests', 'learning', 'futureHints'],
  vark: ['learningPrefs', 'subjectTips', 'tracking'],
  holland: ['careerIdentity', 'interestProfile', 'skillMap', 'careerFields', 'majorsMap', 'decisionTips', 'roadmap'],
  'sinav-kaygisi': ['anxietyProfile', 'anxietyImpact', 'examStrategy', 'proSupport'],
  'calisma-davranisi': ['studyHabits', 'effortGap', 'quickWins', 'risks', 'top3', 'tracking'],
  'akademik-analiz': ['academicPicture', 'skillsInteract', 'potentialGap', 'subjectTips', 'quickWins', 'risks', 'tracking'],
  'd2-dikkat': ['focus', 'mockExams', 'quickWins', 'tracking'],
  'burdon-dikkat': ['focus', 'mockExams', 'quickWins', 'tracking'],
  'hizli-okuma': ['reading', 'quickWins', 'tracking'],
  'sag-sol-beyin': ['thinkingStyle', 'subjectTips', 'tracking'],
};

const SINGLE_RETEST_TERM = new Set(['akademik-analiz', 'calisma-davranisi', 'sinav-kaygisi', 'd2-dikkat', 'burdon-dikkat', 'hizli-okuma']);

const SINGLE_TITLE: Record<string, string> = {
  enneagram: 'Enneagram Kişilik Değerlendirmesi',
  'coklu-zeka': 'Çoklu Zekâ Değerlendirmesi',
  vark: 'Öğrenme Stilleri Değerlendirmesi',
  holland: 'Mesleki Yatkınlık Değerlendirmesi',
  'sinav-kaygisi': 'Sınav Kaygısı Değerlendirmesi',
  'calisma-davranisi': 'Çalışma Davranışı Değerlendirmesi',
  'akademik-analiz': 'Akademik Analiz Değerlendirmesi',
  'd2-dikkat': 'D2 Dikkat Değerlendirmesi',
  'burdon-dikkat': 'Burdon Dikkat Değerlendirmesi',
  'hizli-okuma': 'Hızlı Okuma Değerlendirmesi',
  'sag-sol-beyin': 'Düşünme Tercihi Değerlendirmesi',
};

const SINGLE_SCOPE: Record<string, string> = {
  enneagram: 'mizaç ve kişilik eğilimlerini',
  'coklu-zeka': 'ilgi ve öğrenme tercihlerini',
  vark: 'öğrenme tercihlerini',
  holland: 'meslek ilgilerini',
  'sinav-kaygisi': 'sınav kaygısı profilini',
  'calisma-davranisi': 'çalışma alışkanlıklarını',
  'akademik-analiz': 'temel akademik becerilerini',
  'd2-dikkat': 'dikkat ve odaklanma performansını',
  'burdon-dikkat': 'dikkat ve odaklanma performansını',
  'hizli-okuma': 'okuma hızını ve anlama düzeyini',
  'sag-sol-beyin': 'düşünme tercihini',
};

/** Raporda ölçülmeyen alanlar (öğrenci ve aile bölümünde belirtilir). */
const DOMAINS: { name: string; tests: string[] }[] = [
  { name: 'akademik başarı', tests: ['akademik-analiz'] },
  { name: 'dikkat', tests: ['d2-dikkat', 'burdon-dikkat'] },
  { name: 'sınav kaygısı', tests: ['sinav-kaygisi'] },
  { name: 'meslek uyumu', tests: ['holland'] },
  { name: 'kişilik', tests: ['enneagram'] },
];

// ── Girdi ────────────────────────────────────────────────────

export interface BuildInputTest {
  test_type: string;
  scores: unknown;
  date?: string | Date | null;
}

export interface BuildInput {
  kind: 'package' | 'single';
  packageId?: ReportPackageId;
  tests: BuildInputTest[];
  student: { fullName: string; grade?: number | null; birthDate?: string | null; school?: string | null; target?: string | null };
  generatedAt?: Date;
}

function ageFrom(birth?: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 3 && age < 100 ? age : null;
}

function gradeLabel(s: ReportStudent): string {
  const parts: string[] = [];
  if (s.grade) parts.push(`${s.grade}. sınıf`);
  if (s.age) parts.push(`${s.age} yaş`);
  return parts.join(' · ');
}

function dateRangeLabel(dates: Date[], fallback: Date): { label: string; range: boolean } {
  const ds = dates.filter((d) => !Number.isNaN(d.getTime())).sort((a, b) => a.getTime() - b.getTime());
  if (!ds.length) return { label: trDate(fallback), range: false };
  const first = ds[0];
  const last = ds[ds.length - 1];
  if (trDate(first) === trDate(last)) return { label: trDate(last), range: false };
  if (first.getFullYear() === last.getFullYear() && first.getMonth() === last.getMonth()) {
    return { label: `${trDate(first).split(' ')[0]}–${trDate(last)}`, range: true };
  }
  if (first.getFullYear() === last.getFullYear()) {
    return { label: `${trDate(first).replace(/\s\d{4}$/, '')} – ${trDate(last)}`, range: true };
  }
  return { label: `${trDate(first)} – ${trDate(last)}`, range: true };
}

function personWord(s: ReportStudent): string {
  const age = s.age ?? (s.grade ? s.grade + 6 : null);
  if (age !== null && age <= 11) return 'bir çocuğun';
  return 'bir gencin';
}

// ── Bölümler ─────────────────────────────────────────────────

function aboutSection(c: Ctx, kind: 'package' | 'single'): Section {
  const s = c.student;
  const ageTxt = s.age ? `${s.age} yaşındaki ${personWord(s)}` : `bu yaştaki ${personWord(s)}`;
  return {
    id: 'about',
    kicker: 'BAŞLARKEN',
    title: 'Bu Rapor Hakkında',
    audience: 'general',
    newPage: true,
    blocks: [
      P(c.f(`Bu rapor, {adı} daha yakından tanımanız için hazırlandı. ${kind === 'package' ? 'Uygulanan değerlendirmelerin sonuçlarını önce tek tek, sonra birlikte ele alıyor; ' : 'Uygulanan değerlendirmenin sonuçlarını ele alıyor; '}{adın} neyle güç kazandığını, neyle zorlandığını ve nasıl desteklenebileceğini anlatıyor. Raporu bir çırpıda okumak yerine, bölüm bölüm ve zaman zaman geri dönerek okumanızı öneririz. Kendi gözlemlerinizle örtüşen ve örtüşmeyen yerleri not etmeniz, raporu çok daha değerli kılacaktır.`)),
      P(c.f(`Bu rapor bir etiket değil, bir fotoğraftır. {adın} bugünkü eğilimlerini gösterir; ${ageTxt} bu eğilimleri yaşadıkça, denedikçe ve desteklendikçe değişebilir. Burada yazanları "{ad} böyledir" diye değil, "{ad} bugün çoğu zaman böyle davranmaya eğilimli" diye okumak en doğrusu olur.`)),
    ],
  };
}

function summarySection(c: Ctx): Section {
  const leads: string[] = [];
  const k1 = c.first('kisaca');
  if (k1) leads.push(c.f(k1));
  // İkinci alandan (ör. kişilik + akademik) bir cümle daha ekle
  const second = c.profiles.find((p) => p.kisaca && p.kisaca !== k1 && p.id !== 'generic');
  if (second?.kisaca && c.persona && second.id !== c.persona.id && second.id !== 'synthetic') leads.push(c.f(second.kisaca.split('. ')[0].replace(/\.$/, '') + '.'));
  const strengths = c.collect<string>('strengths', 4).map(c.f);
  let growth = c.collect<string>('growth', 3).map(c.f);
  if (!growth.length) growth = c.collect<string>('develop', 2).map(c.f);
  const priority = c.first('priority');
  const blocks: Block[] = [{ t: 'lead', text: leads.join(' ') }];
  if (strengths.length && growth.length) {
    blocks.push({ t: 'twoCol', tone: 'strengths', left: { title: 'Güçlü yanları', items: strengths }, right: { title: 'Gelişime açık alanları', items: growth } });
  } else if (strengths.length || growth.length) {
    blocks.push(P(strengths.length ? '**Güçlü yanları**' : '**Gelişime açık alanları**'), BUL(strengths.length ? strengths : growth));
  }
  if (priority) blocks.push({ t: 'priority', title: 'ÖNÜMÜZDEKİ DÖNEMİN ÖNCELİĞİ', text: c.f(priority) });
  return { id: 'summary', kicker: 'ÖZET', title: c.f('Kısaca {ad}'), audience: 'general', blocks };
}

function resultsSection(c: Ctx): Section {
  const blocks: Block[] = c.analyses.map((a) => ({
    t: 'testResult' as const,
    testId: a.testId,
    name: a.name,
    color: a.color,
    description: a.description,
    headline: a.testId === 'enneagram' ? undefined : a.headline,
    levels: a.testId === 'enneagram' ? [] : a.levels,
    chart: a.chart,
    paragraphs: testParagraphs(a).map(c.f),
    note: a.partial ? 'Not: Bu testin bazı alt boyutlarına ait veri eksik olduğu için yalnızca mevcut boyutlar gösterildi.' : testNote(a.testId),
  }));
  return { id: 'results', kicker: 'HER DEĞERLENDİRME AYRI AYRI', title: 'Değerlendirme Sonuçları', audience: 'general', newPage: true, blocks };
}

function holisticSection(c: Ctx, order: string[], kind: 'package' | 'single'): Section {
  return {
    id: 'holistic',
    kicker: kind === 'package' ? 'TÜM SONUÇLAR BİRLİKTE' : 'SONUÇLARIN ANLAMI',
    title: kind === 'package' ? 'Bütünsel Değerlendirme' : 'Sonuçların Yorumu',
    audience: 'general',
    newPage: true,
    blocks: buildHolistic(c, order),
  };
}

function numbered(blocks: Block[], items: { title: string; blocks: Block[] }[]): Block[] {
  let n = 0;
  for (const it of items) {
    if (!it.blocks.length) continue;
    n++;
    blocks.push({ t: 'h3', num: String(n).padStart(2, '0'), text: it.title });
    blocks.push(...it.blocks);
  }
  return blocks;
}

function notMeasured(c: Ctx): string[] {
  const ids = new Set(c.analyses.map((a) => a.testId));
  return DOMAINS.filter((d) => !d.tests.some((t) => ids.has(t))).map((d) => d.name);
}

function studentSection(c: Ctx): Section {
  const items: { title: string; blocks: Block[] }[] = [];
  const youAre = c.first('youAre');
  items.push({ title: 'Sen Nasıl Birisin', blocks: youAre ? [P(c.f(youAre))] : [] });
  const ys = c.collect<string>('youStrengths', 4).map(c.f);
  items.push({ title: 'Güçlü Yanların', blocks: ys.length ? [BUL(ys)] : [] });
  const growthTexts: string[] = [];
  const words = (x: string) => new Set(x.toLocaleLowerCase('tr-TR').split(/[^a-zçğıöşü]+/).filter((w) => w.length > 4));
  for (const p of c.profiles) {
    if (!p.youGrowth || growthTexts.length >= 2) continue;
    const t = c.f(p.youGrowth);
    // Aynı konuyu ikinci kez anlatan metni ekleme (ör. kişilik + çalışma düzeni "plan" vurgusu)
    const w = words(t);
    const dup = growthTexts.some((g) => [...words(g)].filter((x) => w.has(x)).length >= 3);
    if (!dup) growthTexts.push(t);
  }
  items.push({ title: 'Üzerinde Çalışabileceğin Alanlar', blocks: growthTexts.map((t) => P(t)) });
  const ways = c.collect<string>('youWays', 5).map(c.f);
  const vark = c.get('vark');
  if (vark && ways.length < 5) {
    const d = String((vark.facts as Record<string, unknown>).dominant);
    const tips: Record<string, string> = {
      V: 'Konuları şemaya ve zihin haritasına dök; renkli kalemler kullan.',
      A: 'Konuyu sesli anlatarak tekrar et; bir arkadaşınla soru-cevap yap.',
      R: 'Okuduğunu kendi cümlelerinle özetle; maddeler hâlinde not tut.',
      K: 'Bol örnek ve uygulama sorusu çöz; çalışırken kısa hareket molaları ver.',
    };
    if (tips[d]) ways.push(tips[d]);
  }
  items.push({ title: 'Sana İyi Gelen Çalışma Yolları', blocks: ways.length ? [BUL(ways.slice(0, 5))] : [] });
  const comm = c.first('youComm');
  items.push({ title: 'İletişimde Seni Anlatan Özellikler', blocks: comm ? [P(c.f(comm))] : [] });
  const hol = c.get('holland');
  let futureTxt = c.first('youFuture');
  if (hol) {
    const code = String((hol.facts as Record<string, unknown>).code ?? '');
    if (code) {
      const jobs = (HOLLAND_INFO[code[0]]?.jobs ?? []).slice(0, 3);
      futureTxt = `En çok ${HOLLAND_INFO[code[0]]?.like ?? ''} seviyorsun.${code[1] ? ` Bunun yanında ${HOLLAND_INFO[code[1]]?.act ?? ''} gerektiren işler de ilgini çekiyor.` : ''}${jobs.length ? ` ${capFirst(joinList(jobs))} gibi alanlar keşfetmeye değer olabilir.` : ''} Bunlar bir meslek kararı değil, ipuçları; bu alanları kulüpler, projeler ve tanıtım günleriyle denemen en iyisi.`;
    }
  }
  items.push({ title: 'Gelecekle İlgili İpuçları', blocks: futureTxt ? [P(c.f(futureTxt))] : [] });
  // Şu anki durumun
  const nowTxt = c.first('youNow');
  const nowParts: string[] = [];
  if (nowTxt && c.profiles.find((p) => p.youNow)?.id !== 'generic') nowParts.push(c.f(nowTxt));
  else nowParts.push('Şu an kendini tanıma yolunda güzel bir yerdesin. Üzerinde çalışabileceğin alanlara küçük adımlarla yöneldiğinde, güçlü yanlarını çok daha rahat kullanabileceksin.');
  items.push({ title: 'Şu Anki Durumun', blocks: [P(nowParts.join(' '))] });
  const tries = c.collect<string>('youTry', 3, 3).map(c.f);
  items.push({ title: tries.length === 3 ? 'Bu Ay Deneyebileceğin 3 Şey' : 'Bu Ay Deneyebileceklerin', blocks: tries.length ? [BUL(tries)] : [] });
  const last = c.first('youLast');
  items.push({ title: 'Son Bir Söz', blocks: last ? [P(c.f(last))] : [] });
  return { id: 'student', kicker: 'BU BÖLÜM SANA ÖZEL', title: c.f('{ad} İçin'), audience: 'student', newPage: true, blocks: numbered([], items) };
}

function familySection(c: Ctx): Section {
  const items: { title: string; blocks: Block[] }[] = [];
  const one = c.first('familyOneLine');
  items.push({ title: c.f('{adı} Bir Cümlede Anlamak'), blocks: one ? [KEY(c.f(one))] : [] });
  const appr = c.collect<{ do: string; why: string }>('approaches', 6);
  items.push({ title: 'İşe Yarayan Yaklaşımlar', blocks: appr.length ? [BUL(appr.map((a) => `**${c.f(a.do)}** Neden: ${c.f(a.why)}`))] : [] });
  const dos = c.collect<string>('doList', 5).map(c.f);
  const donts = c.collect<string>('dontList', 5).map(c.f);
  items.push({ title: 'Kaçınılması Gerekenler', blocks: dos.length || donts.length ? [{ t: 'twoCol', tone: 'doDont', left: { title: 'Bunları yapın', items: dos }, right: { title: 'Bunlardan kaçının', items: donts } }] : [] });
  const seenInstead = new Set<string>();
  const dialog = c
    .collect<{ instead: string; tryThis: string }>('dialog', 8)
    .map((d) => ({ instead: c.f(d.instead), tryThis: c.f(d.tryThis) }))
    .filter((d) => {
      const k = d.instead.toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü ]/g, '').trim();
      if (seenInstead.has(k)) return false;
      seenInstead.add(k);
      return true;
    })
    .slice(0, 5);
  items.push({ title: 'Evde Konuşma Dili', blocks: dialog.length ? [{ t: 'dialog', leftTitle: 'Bunun yerine…', rightTitle: 'Şunu deneyin…', pairs: dialog }] : [] });
  const home = c.collect<string>('homeEnv', 2).map(c.f);
  items.push({ title: 'Ders ve Çalışma Ortamı', blocks: home.map((t) => P(t)) });
  const grade = c.first('gradeTalk');
  const gradeBlocks: Block[] = [];
  const ids = new Set(c.analyses.map((a) => a.testId));
  if (!ids.has('akademik-analiz') && !ids.has('sinav-kaygisi')) gradeBlocks.push(P(c.f('Bu değerlendirmede akademik başarı ve sınav kaygısı ölçülmedi. Yine de {adın} sonuçları düşünüldüğünde not konuşmalarında şunlar işe yarayabilir:')));
  if (grade?.length) gradeBlocks.push(...grade.map((t) => P(c.f(t))));
  items.push({ title: 'Not ve Sınav Konuşmaları', blocks: gradeBlocks });
  const cmp = c.first('compare');
  items.push({
    title: 'Karşılaştırma Tuzağı',
    blocks: cmp ? [P(c.f(cmp)), P(c.f('Onu yalnızca kendi dünkü hâliyle karşılaştırın: "Geçen ay şunu yapmakta zorlanıyordun, bu hafta iki kez başardın" gibi. Onun ilerlemesini kendi hızında ve kendi yolunda görmek, hem kendine güvenini hem de sizinle olan bağını güçlendirecektir.'))] : [],
  });
  const signs = c.collect<string>('supportSigns', 5).map(c.f);
  items.push({ title: 'Ne Zaman Destek Almalı', blocks: signs.length ? [P(c.f('Aşağıdaki işaretler birkaç hafta sürerse okulun rehber öğretmeni ya da bir psikolojik danışmanla görüşmek faydalı olur:')), BUL(signs)] : [] });
  const plan = c.first('plan');
  if (plan) {
    const extra = c.profiles.find((p) => p.plan && p.plan !== plan && p.id !== 'generic')?.plan;
    const add = (i: number) => (extra?.[i] ? ` ${c.f(extra[i]).split('. ')[0].replace(/\.$/, '')}.` : '');
    items.push({
      title: '90 Günlük Aile Planı',
      blocks: [
        {
          t: 'plan',
          rows: [
            { period: '1–30. gün', title: 'Gözlem ve güven', text: c.f(plan[0]) + add(0) },
            { period: '31–60. gün', title: 'Küçük adımlar', text: c.f(plan[1]) + add(1) },
            { period: '61–90. gün', title: 'Değerlendirme', text: c.f(plan[2]) + add(2) },
          ],
        },
      ],
    });
  }
  return { id: 'family', kicker: 'ANNE VE BABAYA ÖZEL', title: 'Aile İçin', audience: 'family', newPage: true, blocks: numbered([], items) };
}

function expertSection(c: Ctx): Section {
  const items: { title: string; blocks: Block[] }[] = [];
  const s = c.student;
  const schoolGrade = [s.school, s.grade ? `${s.grade}. sınıf` : ''].filter(Boolean).join(' ');
  const who = [s.age ? `${s.age} yaşında` : '', schoolGrade ? `${schoolGrade} öğrencisi` : ''].filter(Boolean).join(', ');
  const themes = c.profiles.filter((p) => p.caseTheme && p.id !== 'generic').slice(0, 2).map((p) => p.caseTheme as string);
  const caseTxt = `${c.forms.ad}${who ? `, ${who}` : ''}. ${themes.length ? `Öne çıkan tablo: ${c.f(themes[0])}${themes[1] ? `; buna ek olarak ${c.f(themes[1])}` : ''}.` : ''} Uygulanan değerlendirmeler: ${joinTr(c.analyses.map((a) => a.name))}.`;
  items.push({ title: 'Kısa Vaka Özeti', blocks: [P(caseTxt)] });
  const findings = c.collect<string>('findings', 6).map(c.f);
  const fBlocks: Block[] = [];
  if (findings.length && c.persona) fBlocks.push(P('Kişilik (Enneagram) kaynaklı bulgular eğilim düzeyindedir ve görüşmelerle doğrulanması gereken hipotezler olarak ele alınmalıdır; diğer bulgular ilgili testlerin sonuçlarına dayanır.'));
  if (findings.length) fBlocks.push(BUL(findings));
  items.push({ title: 'Öne Çıkan Bulgular', blocks: fBlocks });
  const cog = c.collect<string>('cognitive', 4).map(c.f);
  items.push({ title: 'Bilişsel Destek Önerileri', blocks: cog.length ? [BUL(cog)] : [] });
  const emo = c.collect<string>('emotional', 4).map(c.f);
  items.push({ title: 'Duygusal Destek Önerileri', blocks: emo.length ? [BUL(emo)] : [] });
  const acad = c.collect<string>('academicSupport', 3).map(c.f);
  const acadBlocks: Block[] = [];
  const ids = new Set(c.analyses.map((a) => a.testId));
  const nm = notMeasured(c).filter((x) => x !== 'kişilik');
  if (nm.length) acadBlocks.push(P(c.f(`${capFirst(joinTr(nm))} bu değerlendirmede doğrudan ölçülmedi; ${nm.length > 1 ? 'bu alanlardaki' : 'bu alandaki'} yorumlar dolaylı ipuçlarıdır ve gerekirse ayrıca değerlendirilmelidir.`)));
  if (acad.length) acadBlocks.push(BUL(acad));
  const hol = c.get('holland');
  if (hol) {
    const code = String((hol.facts as Record<string, unknown>).code ?? '');
    if (code) acadBlocks.push(P(c.f(`Kariyer açısından ${code} ilgi kodu öne çıkıyor. Kariyer görüşmelerinde ${HOLLAND_INFO[code[0]]?.act ?? ''} odaklı alanların keşfedilmesi ve ilgi, yetenek ve değerlerin birlikte ele alınması önerilir.`)));
  } else if (!acad.length && ids.has('enneagram')) {
    acadBlocks.push(P('Çalışma alışkanlığı açısından kısa ve net hedefler, yazılı yönergeler ve sakin bir çalışma ortamı önerilir.'));
  }
  const mi = c.get('coklu-zeka');
  if (mi && !hol) {
    const top = ((mi.facts as Record<string, unknown>).top as string[]) ?? [];
    if (top.length) acadBlocks.push(P(c.f(`Öne çıkan ilgi alanları (${joinTr(top.slice(0, 2).map((k) => MI_LABEL[k].toLocaleLowerCase('tr-TR')))}), derslerde proje ve performans görevleri seçilirken ve konu anlatımında örnek seçerken kullanılabilir.`)));
  }
  const att = c.get('dikkat');
  if (att && !ids.has('akademik-analiz')) {
    const l = att.levels[0]?.level ?? 3;
    acadBlocks.push(P(l >= 4 ? 'Dikkat performansı güçlü; akademik destek planında dikkat dışındaki etkenlere (çalışma düzeni, konu eksikleri, kaygı) odaklanılabilir.' : 'Sınıf içinde uzun görevlerin parçalara bölünmesi, yönergelerin kısa ve tek tek verilmesi ve kontrol için süre tanınması dikkat performansını destekleyebilir.'));
  }
  if (c.get('hizli-okuma')) acadBlocks.push(P('Okuma hızı ve anlama oranı dönemde bir kez yeniden ölçülerek izlenebilir; hız artışı hedeflenirken anlama oranının korunması esas alınmalıdır.'));
  if (c.get('sag-sol-beyin')) acadBlocks.push(P('Konu anlatımında hem genel çerçeve (şema, özet) hem adım adım yönergeler sunmak, her iki düşünme tercihini de destekler.'));
  if (c.get('vark')) {
    const d = String((c.get('vark')!.facts as Record<string, unknown>).dominant);
    acadBlocks.push(P(`Öğretim önerisi: ${joinTr((VARK_INFO[d]?.tips ?? []).slice(0, 2).map((x) => x.toLocaleLowerCase('tr-TR')))} gibi yöntemler, öğrencinin tercihleriyle uyumludur; ancak tek bir yönteme sınırlanmamalıdır.`));
  }
  items.push({ title: 'Akademik / Kariyer Destek Önerileri', blocks: acadBlocks });
  const qs = c.collect<string>('questions', 6).map(c.f);
  items.push({ title: 'İlk Görüşmede Sorulabilecek Sorular', blocks: qs.length ? [BUL(qs)] : [] });
  const ver = c.collect<[string, string]>('verify', 4);
  items.push({ title: 'Görüşmelerde Doğrulanacak Noktalar', blocks: ver.length ? [{ t: 'table', head: ['Öngörü', 'Nasıl sınanabilir'], rows: ver.map(([a, b]) => [c.f(a), c.f(b)] as [string, string]) }] : [] });
  const acW = c.get('akademik-analiz')?.levels.slice().sort((x, y) => (x.pct ?? 0) - (y.pct ?? 0))[0];
  const pr = c
    .collect<[string, string]>('priorities', 4)
    .map(([a, b]) => (a === 'En zayıf akademik alanın güçlendirilmesi' && acW ? ([`${acW.label} alanının güçlendirilmesi`, b] as [string, string]) : ([a, b] as [string, string])));
  items.push({ title: 'Öncelik Sırası', blocks: pr.length ? [{ t: 'table', head: ['Öncelik', 'Gerekçe'], rows: pr.map(([a, b], i) => [`${i + 1}. ${a}`, c.f(b)] as [string, string]) }] : [] });
  const refProfiles = c.profiles.filter((p) => p.referral && p.id !== 'generic');
  const refs = (refProfiles.length ? refProfiles : c.profiles.filter((p) => p.referral)).slice(0, 2).map((p) => c.f(p.referral as string));
  items.push({ title: 'Yönlendirme Gerektiren Durumlar', blocks: [...new Set(refs)].map((t) => P(t)) });
  const mons = c.profiles.filter((p) => p.monitoring && p.id !== 'generic').slice(0, 2).map((p) => c.f(p.monitoring as string));
  items.push({ title: 'İzleme ve Takip', blocks: [P(`İlk üç ay ayda bir kısa görüşme önerilir. ${[...new Set(mons)].join(' ')} Aileden alınan gözlemler ile öğrencinin kendi gözlemleri karşılaştırılarak ilerleme izlenebilir; dönem sonunda planın işleyen ve işlemeyen yanları birlikte değerlendirilmelidir.`)] });
  return { id: 'expert', kicker: 'KOÇ, REHBER ÖĞRETMEN VE DANIŞMANA ÖZEL', title: 'Uzman İçin', audience: 'expert', newPage: true, blocks: numbered([], items) };
}

function closingSection(c: Ctx, scope: string, retest: string, date: { label: string; range: boolean }): Section {
  const nm = notMeasured(c);
  const multi = c.analyses.length > 1;
  const parts = [
    `Bu rapor, ${date.label} ${date.range ? 'tarihlerinde' : 'tarihinde'} yapılan ${multi ? 'değerlendirmelere' : 'değerlendirmeye'} göre {adın} ${scope} yansıtıyor.`,
    retest,
  ];
  if (nm.length && nm.length < DOMAINS.length) parts.push(`Bu değerlendirme {adın} ${joinTr(nm)} alanlarını doğrudan ölçmedi; bu alanlarla ilgili bir soru ya da gözleminiz olursa, bunların ayrıca değerlendirilmesi faydalı olacaktır.`);
  parts.push('Raporu {adla} birlikte, onu yargılamak için değil daha iyi anlamak için konuşmanızı dileriz.');
  return { id: 'closing', kicker: 'KAPANIŞ', title: 'Son Söz', audience: 'general', newPage: true, blocks: [P(c.f(parts.join(' ')))] };
}

/** Son temizlik: çift boşluk, boş parantez ve noktalama hataları. */
function tidyBlock(b: Block): Block {
  const t = (x: string) => tidy(x);
  switch (b.t) {
    case 'p':
    case 'lead':
      return { ...b, text: t(b.text) };
    case 'bullets':
      return { ...b, items: b.items.map(t).filter(Boolean) };
    case 'callout':
    case 'priority':
      return { ...b, text: t(b.text) };
    case 'twoCol':
      return { ...b, left: { ...b.left, items: b.left.items.map(t) }, right: { ...b.right, items: b.right.items.map(t) } };
    case 'testResult':
      return { ...b, paragraphs: b.paragraphs.map(t).filter(Boolean), headline: b.headline ? t(b.headline) : b.headline };
    case 'dialog':
      return { ...b, pairs: b.pairs.map((p) => ({ instead: t(p.instead), tryThis: t(p.tryThis) })) };
    case 'plan':
      return { ...b, rows: b.rows.map((r) => ({ ...r, text: t(r.text) })) };
    case 'table':
      return { ...b, rows: b.rows.map((r) => r.map(t) as typeof r) };
    default:
      return b;
  }
}

// ── Ana kurucu ───────────────────────────────────────────────

/** Paket raporlarında testlerin sırası (örnek raporlardaki gibi). */
const RESULT_ORDER = ['enneagram', 'buyuk-besli', 'coklu-zeka', 'akademik-analiz', 'vark', 'calisma-davranisi', 'd2-dikkat', 'burdon-dikkat', 'sinav-kaygisi', 'holland', 'hizli-okuma', 'sag-sol-beyin'];
const SINAV_ORDER = ['sinav-kaygisi', 'calisma-davranisi', 'd2-dikkat', 'burdon-dikkat', 'akademik-analiz'];
const AKADEMIK_ORDER = ['akademik-analiz', 'vark', 'calisma-davranisi', 'coklu-zeka', 'd2-dikkat', 'burdon-dikkat'];
const KARIYER_ORDER = ['holland', 'buyuk-besli', 'enneagram'];

export function buildReportV2(input: BuildInput): ReportV2 {
  const now = input.generatedAt ?? new Date();
  // Aynı testin birden fazla sonucu varsa en yenisi (girdinin sırasıyla ilk gelen) kalır.
  const seen = new Set<string>();
  const analyses: TestAnalysis[] = [];
  const dates: Date[] = [];
  for (const t of input.tests) {
    const id = normalizeTestType(t.test_type);
    if (seen.has(id)) continue;
    const a = analyzeTest(id, t.scores);
    if (!a) continue;
    seen.add(id);
    analyses.push(a);
    if (t.date) dates.push(new Date(t.date));
  }
  const order = input.packageId === 'sinav-strateji' ? SINAV_ORDER : input.packageId === 'kariyer-gelecek' ? KARIYER_ORDER : input.packageId === 'akademik-performans' ? AKADEMIK_ORDER : RESULT_ORDER;
  analyses.sort((a, b) => {
    const ia = order.indexOf(a.testId);
    const ib = order.indexOf(b.testId);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  const student: ReportStudent = {
    fullName: input.student.fullName || 'Öğrenci',
    firstName: firstNameOf(input.student.fullName),
    grade: input.student.grade ?? null,
    age: ageFrom(input.student.birthDate),
    school: input.student.school ?? null,
    target: input.student.target ?? null,
  };
  const c = makeCtx(student, analyses, mergeTraits(analyses));
  const dateInfo = dateRangeLabel(dates, now);
  const dateLabel = dateInfo.label;

  let title: string;
  let subtitle: string;
  let shortTitle: string;
  let accent: string;
  let scope: string;
  let retest: string;
  let holisticOrder: string[];
  let sourceId: string;
  if (input.kind === 'package' && input.packageId && PACKAGE_SPECS[input.packageId]) {
    const spec = PACKAGE_SPECS[input.packageId];
    title = spec.title;
    subtitle = spec.subtitle;
    shortTitle = spec.title;
    accent = REPORT_NAVY;
    scope = spec.scope;
    retest = spec.retest;
    holisticOrder = spec.holistic;
    sourceId = input.packageId;
  } else {
    const id = analyses[0]?.testId ?? normalizeTestType(input.tests[0]?.test_type ?? '');
    title = SINGLE_TITLE[id] ?? analyses[0]?.name ?? 'Değerlendirme Raporu';
    subtitle = 'Kişiye Özel Değerlendirme Raporu';
    shortTitle = title;
    accent = testColor(id);
    scope = SINGLE_SCOPE[id] ?? 'değerlendirme sonuçlarını';
    retest = SINGLE_RETEST_TERM.has(id)
      ? 'Bu alan düzenli çalışmayla değişebildiği için dönem sonunda bir tekrar değerlendirme yapılması önerilir.'
      : 'Öğrenciler bu yıllarda hızla değiştiği için yaklaşık bir yıl sonra bir tekrar değerlendirme yapılması önerilir.';
    holisticOrder = SINGLE_HOLISTIC[id] ?? ['learningPrefs', 'tracking'];
    sourceId = id;
  }

  const sections: Section[] = [
    aboutSection(c, input.kind),
    summarySection(c),
    resultsSection(c),
    holisticSection(c, holisticOrder, input.kind),
    studentSection(c),
    familySection(c),
    expertSection(c),
    closingSection(c, scope, retest, dateInfo),
  ];
  for (const s of sections) s.blocks = s.blocks.map(tidyBlock);
  // Kısaca bölümü "Bu Rapor Hakkında" ile aynı sayfada başlar (örnek rapordaki gibi)
  sections[1].newPage = false;
  // Boş bölümleri çıkar (ör. holistic hiç alt bölüm üretemediyse)
  const finalSections = sections.filter((s) => s.blocks.length > 0);

  const tests: AppliedTest[] = analyses.map((a) => ({ testId: a.testId, name: a.name, color: a.color }));
  const toc = finalSections.map((s) => s.title);

  return {
    v: 2,
    kind: input.kind,
    sourceId,
    title,
    subtitle,
    shortTitle,
    accent,
    student,
    dateLabel,
    generatedAt: now.toISOString(),
    tests,
    toc,
    sections: finalSections,
    footerNote: 'Eğitim Check-Up · Bu rapor, değerlendirmenin yapıldığı tarihteki durumu yansıtır. Tanı koymaz; öğrenciyi tanımaya ve desteklemeye yardımcı olmak için hazırlanmıştır.',
  };
}

export { gradeLabel };
