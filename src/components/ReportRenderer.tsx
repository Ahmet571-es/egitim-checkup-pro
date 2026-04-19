'use client';

import React from 'react';

/**
 * Renkli, zengin AI rapor render bileşeni.
 *
 * Markdown text'i parse edip:
 * - H1/H2/H3 başlıklara emoji bazlı tema renk
 * - Tabloları şık card-style render
 * - "█████░░ XX%" tarzı text progress bar'ları renkli CSS bar'lara çevirir
 * - Yüzdelik (%XX) badge'leri
 * - Madde işaretlerini renkli ikonlarla
 * - Risk seviyesi (🔴 🟡 🟢) badge'leri
 * - Bold (**), italic (*), inline code (`)
 */

type Block =
  | { kind: 'h1'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'h4'; text: string }
  | { kind: 'progress'; label: string; pct: number; rest: string }
  | { kind: 'table'; rows: string[][]; header: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'hr' }
  | { kind: 'p'; text: string }
  | { kind: 'codeblock'; text: string };

const themeFromEmoji = (text: string) => {
  const e = text.match(/[📋📊🧠💪🌱🎯📌🎓⭐💡🔍🏆⚠️📈]/);
  switch (e?.[0]) {
    case '📋': return { from: 'from-sky-500',    to: 'to-blue-600',    text: 'text-sky-700' };
    case '📊': return { from: 'from-violet-500', to: 'to-purple-600',  text: 'text-violet-700' };
    case '🧠': return { from: 'from-pink-500',   to: 'to-rose-600',    text: 'text-pink-700' };
    case '💪': return { from: 'from-emerald-500',to: 'to-teal-600',    text: 'text-emerald-700' };
    case '🌱': return { from: 'from-lime-500',   to: 'to-green-600',   text: 'text-lime-700' };
    case '🎯': return { from: 'from-amber-500',  to: 'to-orange-600',  text: 'text-amber-700' };
    case '📌': return { from: 'from-rose-500',   to: 'to-pink-600',    text: 'text-rose-700' };
    case '🎓': return { from: 'from-indigo-500', to: 'to-violet-600',  text: 'text-indigo-700' };
    case '⭐': return { from: 'from-yellow-500', to: 'to-amber-600',   text: 'text-yellow-700' };
    case '💡': return { from: 'from-cyan-500',   to: 'to-sky-600',     text: 'text-cyan-700' };
    case '🏆': return { from: 'from-amber-400',  to: 'to-yellow-500',  text: 'text-amber-700' };
    case '⚠️': return { from: 'from-red-500',    to: 'to-rose-600',    text: 'text-red-700' };
    case '📈': return { from: 'from-teal-500',   to: 'to-emerald-600', text: 'text-teal-700' };
    default:   return { from: 'from-slate-600',  to: 'to-gray-700',    text: 'text-slate-700' };
  }
};

const colorByPct = (pct: number) => {
  if (pct >= 70) return { bar: 'from-emerald-400 to-green-600', text: 'text-emerald-700' };
  if (pct >= 50) return { bar: 'from-sky-400 to-blue-600',      text: 'text-sky-700' };
  if (pct >= 30) return { bar: 'from-amber-400 to-orange-500',  text: 'text-amber-700' };
  return            { bar: 'from-rose-400 to-red-600',          text: 'text-rose-700' };
};

const renderInline = (text: string): React.ReactNode => {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let rest = text;
  let key = 0;
  rest = rest.replace(/🔴/g, '◆🔴◆').replace(/🟡/g, '◆🟡◆').replace(/🟢/g, '◆🟢◆');

  while (rest.length > 0) {
    const boldM = rest.match(/^\*\*([^*]+)\*\*/);
    if (boldM) { parts.push(<strong key={key++} className="font-bold text-[#0f2847] dark:text-slate-100">{boldM[1]}</strong>); rest = rest.slice(boldM[0].length); continue; }
    const italM = rest.match(/^\*([^*]+)\*/);
    if (italM) { parts.push(<em key={key++} className="italic">{italM[1]}</em>); rest = rest.slice(italM[0].length); continue; }
    const codeM = rest.match(/^`([^`]+)`/);
    if (codeM) { parts.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[0.85em] font-mono">{codeM[1]}</code>); rest = rest.slice(codeM[0].length); continue; }
    const riskM = rest.match(/^◆🔴◆\s*([A-ZÇĞİÖŞÜa-zçğıöşü]+)?/);
    if (riskM) { parts.push(<span key={key++} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[0.8em] font-bold">🔴 {riskM[1] || ''}</span>); rest = rest.slice(riskM[0].length); continue; }
    const yelM = rest.match(/^◆🟡◆\s*([A-ZÇĞİÖŞÜa-zçğıöşü]+)?/);
    if (yelM) { parts.push(<span key={key++} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[0.8em] font-bold">🟡 {yelM[1] || ''}</span>); rest = rest.slice(yelM[0].length); continue; }
    const grnM = rest.match(/^◆🟢◆\s*([A-ZÇĞİÖŞÜa-zçğıöşü]+)?/);
    if (grnM) { parts.push(<span key={key++} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[0.8em] font-bold">🟢 {grnM[1] || ''}</span>); rest = rest.slice(grnM[0].length); continue; }
    const pctM = rest.match(/^%(\d+)/);
    if (pctM) {
      const pct = parseInt(pctM[1]);
      const c = colorByPct(pct);
      parts.push(<span key={key++} className={`inline-block px-1.5 py-0.5 rounded-md ${c.text} font-bold text-[0.95em]`}>%{pct}</span>);
      rest = rest.slice(pctM[0].length);
      continue;
    }
    parts.push(rest[0]);
    rest = rest.slice(1);
  }
  return <>{parts}</>;
};

const parseBlocks = (text: string): Block[] => {
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }

    if (trimmed.startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { buf.push(lines[i]); i++; }
      i++;
      const progressLines: { label: string; pct: number; rest: string }[] = [];
      let allProgress = true;
      for (const cb of buf) {
        const pm = cb.match(/^([^:]+):\s*([█▓▒░]+)\s*(\d+)%(.*)$/);
        if (pm) progressLines.push({ label: pm[1].trim(), pct: parseInt(pm[3]), rest: pm[4].trim() });
        else if (cb.trim()) { allProgress = false; break; }
      }
      if (allProgress && progressLines.length > 0) {
        for (const p of progressLines) blocks.push({ kind: 'progress', ...p });
      } else {
        blocks.push({ kind: 'codeblock', text: buf.join('\n') });
      }
      continue;
    }

    if (trimmed.startsWith('# ')) { blocks.push({ kind: 'h1', text: trimmed.slice(2) }); i++; continue; }
    if (trimmed.startsWith('## ')) { blocks.push({ kind: 'h2', text: trimmed.slice(3) }); i++; continue; }
    if (trimmed.startsWith('### ')) { blocks.push({ kind: 'h3', text: trimmed.slice(4) }); i++; continue; }
    if (trimmed.startsWith('#### ')) { blocks.push({ kind: 'h4', text: trimmed.slice(5) }); i++; continue; }
    if (/^[-*_]{3,}$/.test(trimmed)) { blocks.push({ kind: 'hr' }); i++; continue; }

    const inlineProgM = line.match(/^([^:]+):\s*([█▓▒░]+)\s*(\d+)%(.*)$/);
    if (inlineProgM) {
      blocks.push({ kind: 'progress', label: inlineProgM[1].trim(), pct: parseInt(inlineProgM[3]), rest: inlineProgM[4].trim() });
      i++; continue;
    }

    if (trimmed.startsWith('|') && i + 1 < lines.length && /^\|[\s|:-]+\|$/.test(lines[i + 1].trim())) {
      const header = trimmed.split('|').slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].trim().split('|').slice(1, -1).map((c) => c.trim());
        if (cells.length > 0) rows.push(cells);
        i++;
      }
      blocks.push({ kind: 'table', header, rows });
      continue;
    }

    if (/^\d+[.)]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    if (/^[-*•]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    const buf: string[] = [trimmed];
    i++;
    while (i < lines.length && lines[i].trim() && !/^[#>|`]|^[-*•]\s|^\d+[.)]\s|^[-*_]{3,}$|^[^:]+:\s*[█▓▒░]/.test(lines[i].trim())) {
      buf.push(lines[i].trim());
      i++;
    }
    blocks.push({ kind: 'p', text: buf.join(' ') });
  }
  return blocks;
};

const RenderBlock: React.FC<{ block: Block; idx: number }> = ({ block, idx }) => {
  switch (block.kind) {
    case 'h1': {
      const t = themeFromEmoji(block.text);
      return (
        <h1 key={idx} className={`text-2xl sm:text-3xl font-extrabold mt-8 mb-4 px-5 py-3 rounded-2xl bg-gradient-to-r ${t.from} ${t.to} text-white shadow-lg`}>
          {renderInline(block.text)}
        </h1>
      );
    }
    case 'h2': {
      const t = themeFromEmoji(block.text);
      return (
        <h2 key={idx} className={`text-xl sm:text-2xl font-extrabold mt-7 mb-3 flex items-center gap-2`}>
          <span className={`inline-block w-1.5 h-7 rounded-full bg-gradient-to-b ${t.from} ${t.to}`} />
          <span className={t.text}>{renderInline(block.text)}</span>
        </h2>
      );
    }
    case 'h3': {
      const t = themeFromEmoji(block.text);
      return (
        <h3 key={idx} className={`text-lg font-extrabold mt-6 mb-2 ${t.text}`}>
          {renderInline(block.text)}
        </h3>
      );
    }
    case 'h4':
      return <h4 key={idx} className="text-base font-bold mt-5 mb-2 text-[#0f2847] dark:text-slate-100">{renderInline(block.text)}</h4>;
    case 'hr':
      return <hr key={idx} className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />;
    case 'progress': {
      const c = colorByPct(block.pct);
      return (
        <div key={idx} className="mb-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-[#0f2847] dark:text-slate-100">{block.label}</span>
            <span className={`text-[13px] font-extrabold ${c.text}`}>%{block.pct}</span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 dark:bg-slate-700/60 overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${c.bar} transition-all duration-700`} style={{ width: `${block.pct}%` }} />
          </div>
          {block.rest && <p className="mt-2 text-[12px] text-gray-500 dark:text-slate-400 italic">{renderInline(block.rest)}</p>}
        </div>
      );
    }
    case 'table':
      return (
        <div key={idx} className="my-4 overflow-x-auto rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gradient-to-r from-violet-50 via-purple-50 to-pink-50">
                {block.header.map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-left text-[12px] font-extrabold text-violet-700 border-b border-violet-100">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className={`${ri % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-800/60/50'} hover:bg-amber-50/40 transition-colors`}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2.5 text-gray-700 dark:text-slate-300 border-b border-gray-50 align-top">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'ul':
      return (
        <ul key={idx} className="my-3 space-y-1.5 pl-1">
          {block.items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-[14px] text-gray-700 dark:text-slate-300 leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shrink-0" />
              <span>{renderInline(it)}</span>
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={idx} className="my-3 space-y-1.5 pl-1">
          {block.items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-[14px] text-gray-700 dark:text-slate-300 leading-relaxed">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span>{renderInline(it)}</span>
            </li>
          ))}
        </ol>
      );
    case 'codeblock':
      return <pre key={idx} className="my-3 p-3 rounded-xl bg-slate-900 text-slate-100 text-[12px] font-mono overflow-x-auto">{block.text}</pre>;
    case 'p':
      return <p key={idx} className="my-2.5 text-[14px] text-gray-700 dark:text-slate-300 leading-relaxed">{renderInline(block.text)}</p>;
  }
};

export default function ReportRenderer({
  text,
  scores,      // eski API uyumluluğu — şu an kullanılmıyor ama type compat
  testType,    // eski API uyumluluğu — şu an kullanılmıyor ama type compat
}: {
  text: string;
  scores?: Record<string, unknown>;
  testType?: string;
}) {
  // İleride scores/testType ile rapor başına grafik üretmek için opsiyonel
  void scores; void testType;
  if (!text || !text.trim()) return <p className="text-gray-400 dark:text-slate-500 italic">Rapor içeriği boş.</p>;
  const blocks = parseBlocks(text);
  return (
    <div className="report-renderer">
      {blocks.map((b, i) => <RenderBlock key={i} block={b} idx={i} />)}
    </div>
  );
}
