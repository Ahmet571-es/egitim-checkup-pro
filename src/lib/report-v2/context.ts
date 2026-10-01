// ============================================================
// Rapor v2 — Kurulum bağlamı
// ============================================================
// Bölüm kurucuların ortak kullandığı yardımcılar: öğrencinin adı ve hâl ekleri,
// test analizleri, özellikler ve sıralanmış içerik profilleri.

import type { TestAnalysis, TraitMap } from './analyze';
import type { Profile } from './content/types';
import { syntheticProfile } from './content/synthetic';
import type { Block, ReportStudent } from './types';
import { fill, nameForms, type NameForms } from './tr';
import { ENNEAGRAM_PROFILES } from './content/index-enneagram';
import {
  ANX_HIGH, ANX_LOW, ANX_MID, AC_GOOD, AC_HIGH, AC_LOW, AC_MID, ATT_MID, ATTITUDE_LOW, ATT_FLUCT, ATT_GOOD, ATT_IMPULSIVE, ATT_LOW, ATT_SLOW,
  GENERIC, MATH_LOW, OVERCONF, READ_LOW, RD_RUSH, RD_SLOW, STUDY_GOOD, STUDY_WEAK, UNDERCONF,
} from './content/academic';

export interface Ctx {
  forms: NameForms;
  student: ReportStudent;
  analyses: TestAnalysis[];
  traits: TraitMap;
  profiles: Profile[];
  /** Öncelikli kişilik profili (Enneagram varsa). */
  persona?: Profile;
  /** Metin doldurma: ad yer tutucularını çözer. */
  f: (s: string) => string;
  get: (testId: string) => TestAnalysis | undefined;
  has: (trait: string) => boolean;
  /** İlk dolu alan (profiller sırasıyla). */
  first: <K extends keyof Profile>(key: K) => Profile[K] | undefined;
  /** Liste alanlarını profiller sırasıyla birleştirir (tekrarsız, üst sınırlı). */
  collect: <T>(key: keyof Profile, max: number, minBeforeGeneric?: number) => T[];
}

function pickProfiles(traits: TraitMap, analyses: TestAnalysis[]): { list: Profile[]; persona?: Profile } {
  const out: Profile[] = [];
  let persona: Profile | undefined;
  const enn = analyses.find((a) => a.testId === 'enneagram');
  if (enn) {
    const main = Number((enn.facts as Record<string, unknown>).main);
    persona = ENNEAGRAM_PROFILES[main];
    if (persona) out.push(persona);
  }
  const t = (k: string) => (traits[k] ?? 0) > 0;
  if (t('anx_high')) out.push(ANX_HIGH);
  else if (t('anx_mid')) out.push(ANX_MID);
  else if (t('anx_low')) out.push(ANX_LOW);
  if (t('st_weak')) out.push(STUDY_WEAK);
  else if (t('st_mid') && (t('st_start_low') || t('st_exam_low'))) out.push(STUDY_WEAK);
  else if (t('st_good')) out.push(STUDY_GOOD);
  if (t('st_attitude_low')) out.push(ATTITUDE_LOW);
  if (t('att_low')) out.push(ATT_LOW);
  if (t('att_impulsive')) out.push(ATT_IMPULSIVE);
  if (t('att_slow')) out.push(ATT_SLOW);
  if (t('att_fluct') || t('att_late_drop')) out.push(ATT_FLUCT);
  if (t('att_good') && !t('att_impulsive')) out.push(ATT_GOOD);
  else if (t('att_mid') && !t('att_low')) out.push(ATT_MID);
  if (t('ac_low')) out.push(AC_LOW);
  else if (t('ac_mid')) out.push(AC_MID);
  else if (t('ac_good')) out.push(AC_GOOD);
  else if (t('ac_high')) out.push(AC_HIGH);
  if (t('ac_read_low')) out.push(READ_LOW);
  if (t('ac_math_low')) out.push(MATH_LOW);
  if (t('ac_underconf')) out.push(UNDERCONF);
  if (t('ac_overconf')) out.push(OVERCONF);
  if (t('rd_rushing')) out.push(RD_RUSH);
  else if (t('rd_slow')) out.push(RD_SLOW);
  out.push(syntheticProfile(traits, analyses, !!persona));
  // Ağırlığa göre sırala (eşitlikte ekleme sırası korunur), en sona genel yedek
  const sorted = out
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (b.p.weight ?? 0) - (a.p.weight ?? 0) || a.i - b.i)
    .map((x) => x.p);
  sorted.push(GENERIC);
  return { list: sorted, persona };
}

export function makeCtx(student: ReportStudent, analyses: TestAnalysis[], traits: TraitMap): Ctx {
  const forms = nameForms(student.firstName);
  const { list, persona } = pickProfiles(traits, analyses);
  const f = (s: string) => fill(s, forms);
  const ctx: Ctx = {
    forms,
    student,
    analyses,
    traits,
    profiles: list,
    persona,
    f,
    get: (id) => analyses.find((a) => a.testId === id || (id === 'dikkat' && (a.testId === 'd2-dikkat' || a.testId === 'burdon-dikkat'))),
    has: (k) => (traits[k] ?? 0) > 0,
    first: (key) => {
      for (const p of list) {
        const v = p[key];
        if (v === undefined || v === null) continue;
        if (Array.isArray(v) && v.length === 0) continue;
        if (typeof v === 'string' && !v.trim()) continue;
        return v;
      }
      return undefined;
    },
    collect: <T,>(key: keyof Profile, max: number, minBeforeGeneric = 2): T[] => {
      const seen = new Set<string>();
      const res: T[] = [];
      for (const p of list) {
        // Genel yedek profil, yalnızca özel profiller yeterli içerik vermediyse eklenir.
        if (p.id === 'generic' && res.length >= Math.min(max, minBeforeGeneric)) break;
        const v = p[key] as unknown;
        if (!Array.isArray(v)) continue;
        for (const item of v as T[]) {
          const sig = JSON.stringify(item);
          if (seen.has(sig)) continue;
          seen.add(sig);
          res.push(item);
          if (res.length >= max) return res;
        }
      }
      return res;
    },
  };
  return ctx;
}

// ── Blok kısayolları ─────────────────────────────────────────

export const P = (text: string): Block => ({ t: 'p', text });
export const BUL = (items: string[]): Block => ({ t: 'bullets', items });
export const KEY = (text: string, title?: string): Block => ({ t: 'callout', tone: 'key', text, title });
export const NOTE = (text: string, title?: string): Block => ({ t: 'callout', tone: 'note', text, title });
