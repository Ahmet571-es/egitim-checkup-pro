'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Award, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export interface ScoreItem {
  label: string;
  value: string | number;
  pct?: number;
  color?: string;
  icon?: string;
}

export interface TestResultProps {
  testName: string;
  testIcon: string;
  mainResult: string;
  mainDescription: string;
  scores: ScoreItem[];
  report?: string;
  accentColor?: string;
  onRetake?: () => void;
}

/** Madde 17: Animated score bar */

// ── Renkli bar gradient paleti ──
const BAR_COLORS = [
  'linear-gradient(90deg, #10b981, #34d399)',  // Yeşil
  'linear-gradient(90deg, #3b82f6, #60a5fa)',  // Mavi
  'linear-gradient(90deg, #8b5cf6, #a78bfa)',  // Mor
  'linear-gradient(90deg, #f59e0b, #fbbf24)',  // Sarı
  'linear-gradient(90deg, #ef4444, #f87171)',  // Kırmızı
  'linear-gradient(90deg, #06b6d4, #22d3ee)',  // Cyan
  'linear-gradient(90deg, #ec4899, #f472b6)',  // Pembe
  'linear-gradient(90deg, #f97316, #fb923c)',  // Turuncu
  'linear-gradient(90deg, #14b8a6, #2dd4bf)',  // Teal
  'linear-gradient(90deg, #6366f1, #818cf8)',  // İndigo
];

/** Markdown raporu renkli HTML'e çevirir — metin barları (█░) görsel barlara dönüşür */
function renderReportHTML(report: string): string {
  let colorIdx = 0;
  const getColor = () => BAR_COLORS[colorIdx++ % BAR_COLORS.length];

  // Her satırı işle
  const lines = report.split('\n');
  let html = '';
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Markdown tablo satırı mı?
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Separator satırı (|---|---|) → atla
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
        continue;
      }
      // Tablo hücreleri
      const cells = trimmed.split('|').filter(c => c.trim() !== '');
      if (!inTable) {
        inTable = true;
        tableRows = [];
        colorIdx = 0; // Her tablo için renkleri sıfırla
      }
      tableRows.push(cells.map(c => c.trim()));
      continue;
    }

    // Tablo bittiyse render et
    if (inTable) {
      html += renderTable(tableRows, getColor);
      inTable = false;
      tableRows = [];
    }

    // Başlıklar
    if (trimmed.startsWith('# ')) {
      html += `<h1 style="font-size:1.3rem;font-weight:800;margin:20px 0 8px;color:#fff;">${esc(trimmed.slice(2))}</h1>`;
    } else if (trimmed.startsWith('## ')) {
      html += `<h2 style="font-size:1.1rem;font-weight:700;margin:18px 0 6px;color:#fff;">${esc(trimmed.slice(3))}</h2>`;
    } else if (trimmed.startsWith('### ')) {
      html += `<h3 style="font-size:0.95rem;font-weight:700;margin:14px 0 4px;color:rgba(255,255,255,0.9);">${esc(trimmed.slice(4))}</h3>`;
    }
    // Liste öğeleri
    else if (trimmed.startsWith('- ')) {
      html += `<div style="padding:3px 0 3px 16px;position:relative;"><span style="position:absolute;left:0;">•</span>${formatBold(esc(trimmed.slice(2)))}</div>`;
    }
    // Ayırıcı
    else if (trimmed === '---') {
      html += `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.15);margin:14px 0;"/>`;
    }
    // Boş satır
    else if (trimmed === '') {
      html += '<div style="height:6px;"></div>';
    }
    // Normal paragraf
    else {
      html += `<p style="margin:4px 0;line-height:1.6;">${formatBold(esc(trimmed))}</p>`;
    }
  }

  // Son kalan tablo
  if (inTable && tableRows.length > 0) {
    html += renderTable(tableRows, getColor);
  }

  return html;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatBold(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff;">$1</strong>');
}

function renderTable(rows: string[][], getColor: () => string): string {
  if (rows.length === 0) return '';
  const header = rows[0];
  const dataRows = rows.slice(1);

  // "Grafik" sütunu var mı? (█░ barları içeren)
  const grafIdx = header.findIndex(h => /grafik/i.test(h));
  // "Yüzde" sütunu var mı?
  const pctIdx = header.findIndex(h => /yüzde|%/i.test(h));

  let html = '<div style="margin:10px 0 14px;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.12);">';

  // Header
  html += '<div style="display:grid;grid-template-columns:repeat(' + header.length + ',1fr);background:rgba(255,255,255,0.08);padding:10px 14px;gap:8px;">';
  for (let j = 0; j < header.length; j++) {
    // Grafik sütun başlığını gizle (yerine "Görsel" yaz)
    const hText = (j === grafIdx) ? 'Görsel' : header[j];
    html += `<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:rgba(255,255,255,0.5);">${esc(hText)}</div>`;
  }
  html += '</div>';

  // Rows
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const color = getColor();
    const bgColor = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)';

    // Yüzde değerini al (bar genişliği için)
    let pctVal = 0;
    if (pctIdx >= 0 && row[pctIdx]) {
      const match = row[pctIdx].match(/(\d+(?:\.\d+)?)/);
      if (match) pctVal = parseFloat(match[1]);
    }
    // Grafik sütunundan yüzde tahmini (█ sayısı × 10)
    if (grafIdx >= 0 && row[grafIdx] && pctVal === 0) {
      const fullBlocks = (row[grafIdx].match(/█/g) || []).length;
      pctVal = fullBlocks * 10;
    }

    html += `<div style="display:grid;grid-template-columns:repeat(${header.length},1fr);padding:10px 14px;gap:8px;background:${bgColor};border-top:1px solid rgba(255,255,255,0.06);align-items:center;">`;

    for (let j = 0; j < header.length; j++) {
      const cell = (row[j] || '').trim();

      if (j === grafIdx) {
        // ★ Grafik sütunu → renkli bar
        const w = Math.min(100, Math.max(5, pctVal));
        html += `<div style="position:relative;height:22px;background:rgba(255,255,255,0.08);border-radius:11px;overflow:hidden;">`;
        html += `<div style="position:absolute;top:0;left:0;height:100%;width:${w}%;background:${color};border-radius:11px;transition:width 0.8s cubic-bezier(0.16,1,0.3,1);box-shadow:0 0 12px rgba(255,255,255,0.15);"></div>`;
        html += `</div>`;
      } else {
        // Normal hücre
        const isFirst = j === 0;
        const style = isFirst
          ? 'font-weight:600;color:rgba(255,255,255,0.95);font-size:0.85rem;'
          : 'color:rgba(255,255,255,0.7);font-size:0.82rem;';
        html += `<div style="${style}">${esc(cell)}</div>`;
      }
    }
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function MiniBar({ pct, color = '#10b981', delay = 0 }: { pct: number; color?: string; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(Math.min(100, Math.max(0, pct))), 100 + delay);
    return () => clearTimeout(timer);
  }, [pct, delay]);

  // Yüzde değeri zaten bar'ın üstündeki item.value'da gösteriliyor (BUG P2 fix).
  // MiniBar yalnızca görsel barı render eder; metni tekrar etmez.
  return (
    <div className="flex items-center gap-2 mt-1 w-32 max-w-full" aria-hidden="true">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}, ${color}dd)` }}
        />
      </div>
    </div>
  );
}

/** Madde 17: Confetti particle component */
function Confetti() {
  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#06b6d4'];
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 1}s`,
    duration: `${1.5 + Math.random() * 1.5}s`,
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/** Madde 17: Circular score ring */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  return (
    <svg width="120" height="120" className="mx-auto">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
      <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
    </svg>
  );
}

/** Madde 17: Premium test result with confetti, bounce, animated scores */
export default function TestResult({
  testName, testIcon, mainResult, mainDescription,
  scores, report, accentColor = '#10b981', onRetake,
}: TestResultProps) {
  const [showReport, setShowReport] = React.useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2847] via-[#1a3a5c] to-[#0d1f35] p-4 pb-10">
      {/* Confetti */}
      {showConfetti && <Confetti />}

      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Success Header — bounce in ── */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 text-center"
             style={{ animation: 'bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
               style={{ backgroundColor: accentColor + '33', border: `2px solid ${accentColor}` }}>
            <CheckCircle size={32} style={{ color: accentColor }} />
          </div>
          <p className="text-white/60 text-sm mb-1">Test Tamamlandı</p>
          <h1 className="text-white font-extrabold text-2xl mb-2">
            {testIcon} {testName}
          </h1>
          <div
            className="inline-block px-4 py-2 rounded-full font-bold text-white text-lg"
            style={{ backgroundColor: accentColor }}
          >
            {mainResult}
          </div>
          <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-sm mx-auto">
            {mainDescription}
          </p>
        </div>

        {/* ── Score Table — staggered fade-in ── */}
        {scores.length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5"
               style={{ animation: 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards', opacity: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <Award size={18} style={{ color: accentColor }} />
              <h2 className="text-white font-bold">Sonuç Detayları</h2>
            </div>
            <div className="space-y-3">
              {scores.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3"
                     style={{ animation: `fade-in-up 0.3s ease-out ${0.4 + i * 0.1}s forwards`, opacity: 0 }}>
                  <div className="flex items-center gap-2 min-w-0">
                    {item.icon && <span className="text-base flex-shrink-0">{item.icon}</span>}
                    <span className="text-white/70 text-sm truncate">{item.label}</span>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-white font-semibold text-sm">{item.value}</span>
                    {item.pct != null && (
                      <MiniBar pct={item.pct} color={item.color ?? accentColor} delay={i * 200} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Report ── */}
        {report && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
               style={{ animation: 'fade-in-up 0.4s ease-out 0.6s forwards', opacity: 0 }}>
            <button
              onClick={() => setShowReport(!showReport)}
              className="w-full flex items-center justify-between px-5 py-4 text-white font-semibold hover:bg-white/5 transition-colors"
            >
              <span>📄 Detaylı Raporu Görüntüle</span>
              <span className={`text-white/50 text-sm transition-transform duration-200 ${showReport ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {showReport && (
              <div className="px-5 pb-5 border-t border-white/10" style={{ animation: 'fade-in-up 0.2s ease-out forwards' }}>
                <div className="text-white/80 text-xs sm:text-sm leading-relaxed mt-4 max-h-[32rem] overflow-y-auto pr-2 report-styled"
                     dangerouslySetInnerHTML={{ __html: renderReportHTML(report) }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Action Buttons — delayed appearance ── */}
        <div className="grid grid-cols-2 gap-3"
             style={{ animation: 'fade-in-up 0.4s ease-out 0.8s forwards', opacity: 0 }}>
          {onRetake && (
            <button
              onClick={onRetake}
              className="touch-feedback flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/15 active:scale-95 transition-all"
            >
              <RotateCcw size={16} />
              Tekrar Yap
            </button>
          )}
          <Link
            href="/student/my-tests"
            className="touch-feedback flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 pulse-glow"
            style={{ backgroundColor: accentColor }}
          >
            <Home size={16} />
            Testlerime Dön
          </Link>
        </div>

      </div>
    </div>
  );
}
