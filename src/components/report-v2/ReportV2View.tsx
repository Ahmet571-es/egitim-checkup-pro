'use client';

/**
 * Rapor v2 — Ekran görünümü
 *
 * Örnek raporlardaki "Bütünsel Değerlendirme Raporu" tasarımının ekran hâli:
 * kapak kartı, bölüm etiketleri, hedef kitleye göre renkli kenar şeridi,
 * renkli kutular, 5 kademeli seviye çubukları ve 3D görünümlü grafikler.
 * PDF ve Word çıktılarıyla aynı veri modelini kullanır.
 */

import React from 'react';
import type { Audience, Block, LevelRow, ReportV2, Section } from '@/lib/report-v2/types';
import { renderChartSvg } from '@/lib/report-v2/charts';

const AUDIENCE: Record<Audience, { color: string; label: string }> = {
  general: { color: '#245B8F', label: '' },
  student: { color: '#1F7A7A', label: 'Öğrenci için' },
  family: { color: '#B5591F', label: 'Aile için' },
  expert: { color: '#4A5568', label: 'Uzman için' },
};

const LEVEL_TXT = ['', 'Düşük', 'Orta altı', 'Orta', 'Orta üstü', 'Yüksek'];

/** **kalın** işaretlerini <strong>'a çevirir. */
function Rich({ text }: { text: string }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i} className="font-semibold text-gray-900 dark:text-slate-100">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
}

function LevelBar({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex gap-[3px]" aria-label={LEVEL_TXT[level]}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="h-[7px] w-5 rounded-sm" style={{ backgroundColor: i <= level ? color : '#E5E7EB' }} />
      ))}
    </div>
  );
}

function Levels({ rows, color }: { rows: LevelRow[]; color: string }) {
  return (
    <div className="my-3 divide-y divide-gray-100 dark:divide-slate-700/60">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_8.5rem] items-center gap-x-4 gap-y-1 py-1.5">
          <span className="text-[13px] text-gray-800 dark:text-slate-200">{r.label}</span>
          <LevelBar level={r.level} color={color} />
          <span className="col-span-2 sm:col-span-1 text-[11.5px] text-gray-500 dark:text-slate-400">{LEVEL_TXT[r.level]}</span>
        </div>
      ))}
    </div>
  );
}

function Chart({ svg, caption }: { svg: string; caption?: string }) {
  if (!svg) return null;
  return (
    <figure className="my-4">
      <div
        className="mx-auto max-w-[520px] rounded-xl bg-white p-2 [&>svg]:h-auto [&>svg]:w-full"
        // SVG yalnızca kendi grafik kodumuzla üretilir; metinler kaçışlanır.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {caption && <figcaption className="mt-1 text-center text-[11px] italic text-gray-500 dark:text-slate-400">{caption}</figcaption>}
    </figure>
  );
}

function BlockView({ b, accent }: { b: Block; accent: string }) {
  switch (b.t) {
    case 'p':
      return (
        <p className="my-2.5 text-[14px] leading-relaxed text-gray-700 dark:text-slate-300">
          <Rich text={b.text} />
        </p>
      );
    case 'lead':
      return (
        <div className="my-4 rounded-r-xl border-l-4 p-4 font-serif text-[15.5px] leading-relaxed text-[#1E3A5F] dark:text-slate-100" style={{ borderColor: accent, backgroundColor: `${accent}14` }}>
          <Rich text={b.text} />
        </div>
      );
    case 'h3':
      return (
        <h3 className="mb-2 mt-6 flex items-baseline gap-3 text-[15px] font-bold text-gray-900 dark:text-slate-100">
          {b.num && <span style={{ color: accent }}>{b.num}</span>}
          <span>{b.text}</span>
        </h3>
      );
    case 'bullets':
      return (
        <ul className="my-2 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-gray-700 marker:text-gray-400 dark:text-slate-300">
          {b.items.map((x, i) => (
            <li key={i}>
              <Rich text={x} />
            </li>
          ))}
        </ul>
      );
    case 'callout':
      return (
        <div className="my-4 rounded-r-xl border-l-4 px-4 py-3 text-[13.5px] leading-relaxed text-gray-800 dark:text-slate-200" style={{ borderColor: b.tone === 'warn' ? '#B42318' : accent, backgroundColor: `${b.tone === 'warn' ? '#B42318' : accent}12` }}>
          {b.title && <div className="mb-1 text-[12px] font-bold" style={{ color: accent }}>{b.title}</div>}
          <Rich text={b.text} />
        </div>
      );
    case 'priority':
      return (
        <div className="my-4 rounded-xl p-4 text-white" style={{ backgroundColor: accent }}>
          <div className="mb-1.5 text-[11px] font-bold tracking-wider opacity-90">{b.title}</div>
          <div className="text-[14.5px] leading-relaxed">
            <Rich text={b.text} />
          </div>
        </div>
      );
    case 'twoCol': {
      const dd = b.tone === 'doDont';
      return (
        <div className="my-4 grid gap-0.5 overflow-hidden rounded-xl sm:grid-cols-2">
          <div className="bg-[#EAF5EE] p-4 dark:bg-emerald-950/40">
            <div className="mb-2 text-[13px] font-bold text-[#2F7D4F] dark:text-emerald-300">{b.left.title}</div>
            <ul className="space-y-1.5 text-[13.5px] leading-snug text-gray-800 dark:text-slate-200">
              {b.left.items.map((x, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-bold text-[#2F7D4F]">{dd ? '✓' : '•'}</span>
                  <span>
                    <Rich text={x} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className={`${dd ? 'bg-[#FBEAEA] dark:bg-red-950/40' : 'bg-[#FBEFE6] dark:bg-orange-950/40'} p-4`}>
            <div className={`mb-2 text-[13px] font-bold ${dd ? 'text-[#B42318] dark:text-red-300' : 'text-[#B5591F] dark:text-orange-300'}`}>{b.right.title}</div>
            <ul className="space-y-1.5 text-[13.5px] leading-snug text-gray-800 dark:text-slate-200">
              {b.right.items.map((x, i) => (
                <li key={i} className="flex gap-2">
                  <span className={`font-bold ${dd ? 'text-[#B42318]' : 'text-[#B5591F]'}`}>{dd ? '✕' : '•'}</span>
                  <span>
                    <Rich text={x} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    case 'testResult':
      return (
        <article className="my-6 border-b border-gray-100 pb-5 dark:border-slate-700/60">
          <header className="flex gap-3">
            <span className="w-1.5 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
            <div>
              <h3 className="text-[16px] font-bold" style={{ color: b.color }}>
                {b.name}
              </h3>
              <p className="mt-0.5 text-[12px] italic text-gray-500 dark:text-slate-400">{b.description}</p>
            </div>
          </header>
          {b.headline && (
            <p className="mt-3 text-[13.5px] font-semibold text-gray-800 dark:text-slate-200">
              <Rich text={b.headline} />
            </p>
          )}
          {b.levels.length > 0 && <Levels rows={b.levels} color={b.color} />}
          {b.chart && <Chart svg={renderChartSvg(b.chart)} />}
          {b.paragraphs.map((p, i) => (
            <p key={i} className="my-2.5 text-[14px] leading-relaxed text-gray-700 dark:text-slate-300">
              <Rich text={p} />
            </p>
          ))}
          {b.note && <p className="mt-2 text-[11.5px] italic text-gray-500 dark:text-slate-400">{b.note}</p>}
        </article>
      );
    case 'dialog':
      return (
        <div className="my-4 overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="grid grid-cols-2 text-[12px] font-bold text-white" style={{ backgroundColor: accent }}>
            <div className="px-3 py-2">{b.leftTitle}</div>
            <div className="px-3 py-2">{b.rightTitle}</div>
          </div>
          {b.pairs.map((p, i) => (
            <div key={i} className="grid grid-cols-2 border-t border-gray-100 text-[13px] italic dark:border-slate-700/60">
              <div className="px-3 py-2 text-[#9B2C2C] dark:text-red-300">“{p.instead}”</div>
              <div className="px-3 py-2 text-[#276749] dark:text-emerald-300">“{p.tryThis}”</div>
            </div>
          ))}
        </div>
      );
    case 'plan':
      return (
        <div className="my-4 space-y-1 overflow-hidden rounded-xl">
          {b.rows.map((r, i) => (
            <div key={i} className="grid gap-0.5 sm:grid-cols-[9rem_1fr]">
              <div className="px-3 py-2.5 text-[12.5px] font-bold" style={{ color: accent, backgroundColor: `${accent}18` }}>
                {r.period}
                <br />
                {r.title}
              </div>
              <div className="bg-gray-50 px-3 py-2.5 text-[13.5px] leading-relaxed text-gray-700 dark:bg-slate-800/60 dark:text-slate-300">
                <Rich text={r.text} />
              </div>
            </div>
          ))}
        </div>
      );
    case 'table':
      return (
        <div className="my-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-white" style={{ backgroundColor: accent }}>
                <th className="w-[38%] px-3 py-2 font-bold">{b.head[0]}</th>
                <th className="px-3 py-2 font-bold">{b.head[1]}</th>
              </tr>
            </thead>
            <tbody>
              {b.rows.map(([x, y], i) => (
                <tr key={i} className={i % 2 ? 'bg-white dark:bg-slate-900/30' : 'bg-gray-50 dark:bg-slate-800/50'}>
                  <td className="px-3 py-2 align-top font-semibold text-gray-800 dark:text-slate-200">
                    <Rich text={x} />
                  </td>
                  <td className="px-3 py-2 align-top text-gray-700 dark:text-slate-300">
                    <Rich text={y} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'chart':
      return <Chart svg={renderChartSvg(b.chart)} caption={b.caption} />;
    default:
      return null;
  }
}

function SectionView({ s, accent }: { s: Section; accent: string }) {
  const a = AUDIENCE[s.audience];
  const color = s.audience === 'general' ? accent : a.color;
  return (
    <section className="relative mt-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40 sm:p-7" style={s.audience !== 'general' ? { borderRight: `6px solid ${a.color}` } : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-bold tracking-[0.08em]" style={{ color }}>
          {s.kicker}
        </div>
        {a.label && (
          <span className="rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: a.color }}>
            {a.label}
          </span>
        )}
      </div>
      <h2 className="mt-1 font-serif text-[24px] font-bold text-gray-900 dark:text-slate-100">{s.title}</h2>
      <div className="mb-4 mt-2 h-[3px] w-10 rounded-full" style={{ backgroundColor: color }} />
      {s.blocks.map((b, i) => (
        <BlockView key={i} b={b} accent={color} />
      ))}
    </section>
  );
}

export default function ReportV2View({ report }: { report: ReportV2 }) {
  const s = report.student;
  const meta: [string, React.ReactNode][] = [['Öğrenci', <strong key="n">{s.fullName}</strong>]];
  const gl = [s.grade ? `${s.grade}. sınıf` : '', s.age ? `${s.age} yaş` : ''].filter(Boolean).join(' · ');
  if (gl) meta.push(['Sınıf / Yaş', gl]);
  if (s.school) meta.push(['Okul', s.school]);
  if (s.target) meta.push(['Hedef', s.target]);
  meta.push(['Değerlendirme tarihi', report.dateLabel]);
  return (
    <div className="report-v2 mx-auto max-w-[860px]">
      <div className="overflow-hidden rounded-2xl shadow-sm">
        <div className="px-6 pb-8 pt-6 text-white sm:px-8" style={{ backgroundColor: report.accent }}>
          <div className="flex justify-between text-[11px] font-bold tracking-[0.12em] opacity-90">
            <span>EĞİTİM CHECK-UP</span>
            <span className="hidden font-normal tracking-normal sm:inline">Kişiye Özel Değerlendirme Raporu</span>
          </div>
          <h1 className="mt-10 font-serif text-[28px] font-bold leading-tight sm:text-[32px]">{report.title}</h1>
          <p className="mt-2 text-[14px] opacity-85">{report.subtitle}</p>
        </div>
        <div className="grid gap-6 bg-white p-6 dark:bg-slate-900/60 sm:grid-cols-2 sm:p-8">
          <dl className="space-y-2 text-[13.5px]">
            {meta.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[9rem_1fr] gap-2 border-b border-gray-100 pb-2 dark:border-slate-700/60">
                <dt className="text-gray-500 dark:text-slate-400">{k}</dt>
                <dd className="text-gray-900 dark:text-slate-100">{v}</dd>
              </div>
            ))}
            <div className="grid grid-cols-[9rem_1fr] gap-2">
              <dt className="text-gray-500 dark:text-slate-400">Uygulanan değerlendirmeler</dt>
              <dd className="space-y-1">
                {report.tests.map((t) => (
                  <div key={t.testId} className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </div>
                ))}
              </dd>
            </div>
          </dl>
          <div>
            <div className="mb-3 text-[11px] font-bold tracking-[0.08em]" style={{ color: report.accent }}>
              BU RAPORDA
            </div>
            <ol className="grid grid-cols-1 gap-x-6 gap-y-2 text-[13.5px] text-gray-800 dark:text-slate-200 sm:grid-cols-2">
              {report.toc.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-bold" style={{ color: report.accent }}>
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      {report.sections.map((sec) => (
        <SectionView key={sec.id} s={sec} accent={report.accent} />
      ))}
      <p className="mt-6 text-[11.5px] text-gray-500 dark:text-slate-400">{report.footerNote}</p>
    </div>
  );
}
