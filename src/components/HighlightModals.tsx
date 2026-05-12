'use client';

import { useEffect } from 'react';
import { X, Brain, TrendingUp, Award, AlertTriangle, CheckCircle2,
  Sparkles, Target, BookOpen, Heart, Zap, Trophy, Flag, Compass } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';

/* ═══════════════════════════════════════════════════
   MODAL WRAPPER
═══════════════════════════════════════════════════ */
function ModalShell({
  open, onClose, icon: Icon, title, subtitle, accent, children,
}: {
  open: boolean;
  onClose: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  accent: string; // tailwind gradient classes e.g. "from-violet-500 to-purple-600"
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-2 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="highlight-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-4xl my-4 sm:my-8 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[modal-pop_0.3s_cubic-bezier(0.22,1,0.36,1)]">
        {/* Header */}
        <div className={`relative bg-gradient-to-br ${accent} p-5 sm:p-7 text-white`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur transition flex items-center justify-center"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 shadow-lg">
              <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="min-w-0 pr-10">
              <h2 id="highlight-modal-title" className="text-xl sm:text-2xl font-extrabold leading-tight">{title}</h2>
              <p className="text-white/90 text-sm sm:text-base mt-1">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-8 max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modal-pop {
          from { opacity: 0; transform: translateY(20px) scale(0.96) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   1) DERİNLEMESİNE ANALİZ — Sınav Kaygısı raporu
═══════════════════════════════════════════════════ */
const kaygiBarData = [
  { boyut: 'Bilişsel', skor: 72, esik: 50 },
  { boyut: 'Duyuşsal', skor: 81, esik: 50 },
  { boyut: 'Fizyolojik', skor: 64, esik: 50 },
  { boyut: 'Kaçınma', skor: 58, esik: 50 },
];

const kaygiRadarData = [
  { konu: 'Hazırlık', ogrenci: 55, ortalama: 70 },
  { konu: 'Özgüven', ogrenci: 48, ortalama: 72 },
  { konu: 'Zaman Yön.', ogrenci: 62, ortalama: 68 },
  { konu: 'Uyku', ogrenci: 53, ortalama: 75 },
  { konu: 'Aile Beklent.', ogrenci: 38, ortalama: 65 },
  { konu: 'Sosyal Destek', ogrenci: 60, ortalama: 70 },
];

function DerinAnalizContent() {
  return (
    <div className="space-y-7 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
      {/* Üst bilgi şeridi */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-violet-50 dark:bg-violet-950/40 rounded-xl p-3 border border-violet-100 dark:border-violet-900/50">
          <p className="text-[11px] uppercase tracking-wider text-violet-600 dark:text-violet-300 font-semibold">Öğrenci</p>
          <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">Zeynep K.</p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-950/40 rounded-xl p-3 border border-violet-100 dark:border-violet-900/50">
          <p className="text-[11px] uppercase tracking-wider text-violet-600 dark:text-violet-300 font-semibold">Sınıf</p>
          <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">11-A</p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-950/40 rounded-xl p-3 border border-violet-100 dark:border-violet-900/50">
          <p className="text-[11px] uppercase tracking-wider text-violet-600 dark:text-violet-300 font-semibold">Test</p>
          <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">Sınav Kaygısı</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3 border border-rose-100 dark:border-rose-900/50">
          <p className="text-[11px] uppercase tracking-wider text-rose-600 dark:text-rose-300 font-semibold">Genel Skor</p>
          <p className="font-bold text-rose-700 dark:text-rose-300 mt-0.5">68 / 100 · Yüksek</p>
        </div>
      </div>

      {/* Yönetici özeti */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          <Sparkles className="w-5 h-5 text-amber-500" /> Yönetici Özeti
        </h3>
        <p>
          Zeynep&apos;in sınav kaygısı genel skoru <strong>68/100</strong> ile <strong>yüksek</strong> bölgede
          konumlanmaktadır. Profilin en belirgin yükselişi <strong>duyuşsal kaygı (81)</strong> alanında olup,
          bu bulgu sınav anında yaşanan tedirginlik, gerginlik ve olumsuz duygusal yüklenmenin baskın olduğuna
          işaret etmektedir. Hazırlık ve özgüven alt boyutlarındaki düşük skorlar (sırasıyla 55 ve 48), kaygının
          yalnızca sınav anına değil, sınav öncesi sürece de yayıldığını göstermektedir. Aşağıdaki bulgular ve
          öneriler, akademik performansı korurken kaygıyı yönetilebilir bir düzeye çekmek için yapılandırılmıştır.
        </p>
      </section>

      {/* Grafik 1 — Bar */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">
          <AlertTriangle className="w-5 h-5 text-rose-500" /> Kaygı Boyutları (0–100)
        </h3>
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={kaygiBarData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="boyut" tick={{ fontSize: 12, fill: '#475569' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="esik" name="Klinik Eşik" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="skor" name="Zeynep" fill="#e11d48" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-3">
            <strong>Yorum:</strong> Dört alt boyutun tamamı klinik eşiği (50) aşmaktadır.
            <strong> Duyuşsal kaygı (81)</strong>, akranlarına göre belirgin biçimde yüksektir; bu skor
            sınav anında ortaya çıkan otomatik olumsuz düşüncelerin (&quot;Yine yapamayacağım&quot;,
            &quot;Hayal kırıklığı yaratacağım&quot;) sıklığına işaret eder.
          </p>
        </div>
      </section>

      {/* Grafik 2 — Radar */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">
          <Target className="w-5 h-5 text-violet-500" /> Koruyucu Faktör Profili (Akran Ortalamasıyla)
        </h3>
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={kaygiRadarData}>
              <PolarGrid stroke="#cbd5e1" />
              <PolarAngleAxis dataKey="konu" tick={{ fontSize: 11, fill: '#475569' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Radar name="Akran Ort." dataKey="ortalama" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.25} />
              <Radar name="Zeynep" dataKey="ogrenci" stroke="#7c3aed" fill="#8b5cf6" fillOpacity={0.45} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-3">
            <strong>Yorum:</strong> Aile beklentisi alt boyutundaki düşük skor (38) ve özgüven puanı (48)
            kaygının iki temel kaynağına işaret eder: dışsal baskı ve içsel yetersizlik algısı. Zaman yönetimi
            (62) ve sosyal destek (60) ise mevcut <em>koruyucu kaynaklar</em>; müdahalede bu güçlü yönler
            üzerine inşa etmek faydalı olabilir.
          </p>
        </div>
      </section>

      {/* Tavsiyeler */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Bilimsel Temelli Öneriler
        </h3>
        <div className="space-y-3">
          {[
            {
              t: '1. Bilişsel Yeniden Yapılandırma',
              d: 'Duyuşsal kaygı skorunun (81) yüksekliği, otomatik olumsuz düşüncelerin sıklığına işaret ettiği için, sınav öncesi bu düşünceleri yazıya dökmeyi ve gerçekçi alternatiflerle değiştirmeyi denemen faydalı olabilir. Beck modeli temelli bir kaygı günlüğü uygulaması, ilk 4 hafta içinde belirgin azalma sağladığı için önerilir.',
            },
            {
              t: '2. Kademeli Maruz Bırakma Denemeleri',
              d: 'Hazırlık alt boyutundaki düşük skor (55), sınav benzeri ortamlardan kaçınma eğilimini düşündürmektedir. Bu nedenle haftada 2 kez, gerçek sınav koşullarını taklit eden 40 dakikalık deneme çalışmaları planlaman faydalı olabilir; bu yaklaşım sistematik duyarsızlaştırma ilkesine dayanır.',
            },
            {
              t: '3. Diyafram Nefesi ve Topraklama',
              d: 'Fizyolojik kaygı skorun (64) klinik eşiğin üzerinde olduğu için, sınava girmeden hemen önce 4-7-8 nefes tekniğini 3 tur uygulaman önerilir. Bu teknik, parasempatik sinir sistemini aktive ederek kalp atışı ve titreme gibi somatik belirtileri azaltır.',
            },
            {
              t: '4. Aile Beklentisi Üzerine İletişim',
              d: 'Aile beklentisi alt skorunun (38) düşüklüğü, algılanan baskının yüksek olduğunu göstermektedir. Veli görüşmesinde sonuç odaklı değil <em>süreç odaklı</em> geri bildirim kullanımı önerilebilir; bu yaklaşım, performans-değer ayrımının kurulmasına yardımcı olur.',
            },
            {
              t: '5. Uyku Hijyeni',
              d: 'Uyku skorunun (53) düşüklüğü dikkate alındığında, sınav haftalarında ekran kullanımının uykudan 60 dk önce sınırlandırılması ve sabit yatış saati denenebilir. REM uykusu konsolide bilgi pekiştirmesini desteklediği için bu adım hem kaygıyı hem performansı iyileştirir.',
            },
          ].map((rec, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{rec.t}</p>
                <p className="text-[14px] text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: rec.d }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer kapanış */}
      <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border border-violet-100 dark:border-violet-900/50 p-4">
        <p className="text-[13px] text-slate-700 dark:text-slate-300">
          <strong>Not:</strong> Bu rapor örnek bir öğrenci üzerinden hazırlanmış demo niteliğindedir.
          Gerçek raporlar Claude AI motoru ile her öğrenci için bireysel skorlar üzerinden üretilir,
          ayrıca PDF/DOCX olarak dışa aktarılabilir.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   2) GELİŞİM TAKİBİ — 2 aylık ilerleme
═══════════════════════════════════════════════════ */
const gelisimData = [
  { hafta: 'Hf 1',  kaygi: 78, dikkat: 42, calisma: 48, beyin: 100 },
  { hafta: 'Hf 2',  kaygi: 75, dikkat: 46, calisma: 52, beyin: 100 },
  { hafta: 'Hf 3',  kaygi: 71, dikkat: 51, calisma: 56, beyin: 100 },
  { hafta: 'Hf 4',  kaygi: 66, dikkat: 55, calisma: 61, beyin: 100 },
  { hafta: 'Hf 5',  kaygi: 62, dikkat: 60, calisma: 65, beyin: 100 },
  { hafta: 'Hf 6',  kaygi: 58, dikkat: 64, calisma: 70, beyin: 100 },
  { hafta: 'Hf 7',  kaygi: 54, dikkat: 68, calisma: 74, beyin: 100 },
  { hafta: 'Hf 8',  kaygi: 49, dikkat: 72, calisma: 78, beyin: 100 },
];

function GelisimTakibiContent() {
  return (
    <div className="space-y-7 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
      {/* Üst bilgi */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-sky-50 dark:bg-sky-950/40 rounded-xl p-3 border border-sky-100 dark:border-sky-900/50">
          <p className="text-[11px] uppercase tracking-wider text-sky-600 dark:text-sky-300 font-semibold">Öğrenci</p>
          <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">Mert A.</p>
        </div>
        <div className="bg-sky-50 dark:bg-sky-950/40 rounded-xl p-3 border border-sky-100 dark:border-sky-900/50">
          <p className="text-[11px] uppercase tracking-wider text-sky-600 dark:text-sky-300 font-semibold">Takip Süresi</p>
          <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">8 hafta</p>
        </div>
        <div className="bg-sky-50 dark:bg-sky-950/40 rounded-xl p-3 border border-sky-100 dark:border-sky-900/50">
          <p className="text-[11px] uppercase tracking-wider text-sky-600 dark:text-sky-300 font-semibold">Ölçüm Sayısı</p>
          <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">3 test × 8 ölçüm</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/50">
          <p className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-300 font-semibold">Net Değişim</p>
          <p className="font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">+%34 iyileşme</p>
        </div>
      </div>

      {/* Grafik — paragraf başına */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">
          <TrendingUp className="w-5 h-5 text-sky-500" /> 2 Aylık Longitudinal Trend
        </h3>
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={gelisimData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hafta" tick={{ fontSize: 12, fill: '#475569' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="kaygi" name="Sınav Kaygısı (↓ iyi)" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="dikkat" name="Dikkat Skoru (↑ iyi)" stroke="#0891b2" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="calisma" name="Çalışma Davranışı (↑ iyi)" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Anlatım paragrafı */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          <Sparkles className="w-5 h-5 text-amber-500" /> Sekiz Haftalık Süreç Anlatımı
        </h3>
        <p>
          Mert&apos;in <strong>1 Mart – 26 Nisan 2026</strong> aralığını kapsayan 8 haftalık longitudinal takibinde
          üç farklı psikometrik test düzenli aralıklarla uygulandı: <strong>Sınav Kaygısı</strong>,
          <strong> Dikkat ve Odaklanma</strong> ve <strong>Çalışma Davranışı</strong>. Süreç başında sınav kaygısı
          skoru <strong>78</strong> ile klinik eşiğin oldukça üzerindeyken, dikkat skoru yalnızca <strong>42</strong>
          ve çalışma davranışı <strong>48</strong> seviyesindeydi; bu profil, yüksek kaygı zemininde yürütme işlevlerinin
          zayıfladığı tipik bir tabloya işaret ediyordu.
        </p>
        <p className="mt-3">
          İlk 4 hafta boyunca uygulanan müdahale paketi (haftalık 3 nefes egzersizi, Pomodoro temelli çalışma
          rutini ve haftada 2 deneme sınav simülasyonu) sayesinde kaygı skoru <strong>78&rarr;66</strong> bandına
          gerilemiş, dikkat ise <strong>42&rarr;55</strong> seviyesine yükselmiştir. Bu dönemde en belirgin
          değişim Çalışma Davranışı testinde gözlemlenmiş (<strong>+13 puan</strong>); özellikle planlama ve
          zaman yönetimi alt boyutlarındaki ilerleme, akademik rutinin oturmaya başladığını göstermektedir.
        </p>
        <p className="mt-3">
          İkinci 4 haftada (5–8. haftalar) iyileşmenin <em>hız kesmeden</em> sürmesi, müdahale stratejisinin
          öğrenci tarafından içselleştirildiğini düşündürmektedir. 8. hafta sonu itibarıyla sınav kaygısı
          <strong> 49</strong> seviyesine inerek klinik eşiğin altına gerilemiş; dikkat skoru <strong>72</strong>,
          çalışma davranışı ise <strong>78</strong> ile beklenen orta-üst banda taşınmıştır. Üç ölçütteki
          değişimlerin <em>eşzamanlı</em> ilerleme göstermesi, kaygı azaldıkça bilişsel kaynakların yürütücü
          işlevlere yönlendirildiği hipotezini desteklemektedir. Sürecin önümüzdeki 4 haftada da haftalık
          mikro-değerlendirmelerle takip edilmesi, kazanımların kalıcılığı açısından önemlidir.
        </p>
      </section>

      {/* Kazanım kutuları */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">
          <Trophy className="w-5 h-5 text-amber-500" /> Süreç Kazanımları
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-rose-600 dark:text-rose-300">Sınav Kaygısı</p>
            <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 mt-1">78 → 49</p>
            <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-1">-29 puan · %37 azalma</p>
          </div>
          <div className="rounded-xl p-4 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/40">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-cyan-600 dark:text-cyan-300">Dikkat</p>
            <p className="text-2xl font-extrabold text-cyan-700 dark:text-cyan-300 mt-1">42 → 72</p>
            <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-1">+30 puan · %71 artış</p>
          </div>
          <div className="rounded-xl p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-300">Çalışma Davranışı</p>
            <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">48 → 78</p>
            <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-1">+30 puan · %63 artış</p>
          </div>
        </div>
      </section>

      <div className="rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 border border-sky-100 dark:border-sky-900/50 p-4">
        <p className="text-[13px] text-slate-700 dark:text-slate-300">
          <strong>Not:</strong> Eğitim Check-Up Pro&apos;da her test sonucu kalıcı olarak saklanır; öğretmen ve
          veliler longitudinal değişimi gerçek zamanlı izleyebilir.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   3) KOÇLUK SİSTEMİ — Testlerin öğrenciye katkıları
═══════════════════════════════════════════════════ */
function KoclukContent() {
  const benefits = [
    { icon: Compass, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300',
      t: 'Öz-Farkındalık',
      d: 'Enneagram, Çoklu Zekâ ve Sağ-Sol Beyin testleri sayesinde öğrenci, hangi alanlarda doğal olarak güçlü olduğunu ve hangi alanlarda gelişime ihtiyaç duyduğunu somut verilerle görür. Bu bilinç, kariyer kararlarından günlük çalışma alışkanlıklarına kadar pek çok seçimi rasyonelleştirir.' },
    { icon: BookOpen, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300',
      t: 'Kişiselleştirilmiş Çalışma Yöntemi',
      d: 'VARK Öğrenme Stilleri ve Çalışma Davranışı testleri, öğrenciye <em>nasıl öğrendiğini</em> öğretir. Görsel ağırlıklı öğrenen bir öğrenciye işitsel anlatım dayatmak verimlilik kaybı yaratır; bu testlerin sonuçları, çalışma stratejisini bilime dayalı bir zemine oturtur.' },
    { icon: Heart, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300',
      t: 'Duygusal Düzenleme',
      d: 'Sınav Kaygısı testi yalnızca skor üretmez; kaygının bilişsel, duyuşsal ve fizyolojik kaynaklarını ayrıştırır. Bu ayrışma, öğrenci ve veliye <em>hangi müdahalenin nereye uygulanacağını</em> net biçimde gösterir.' },
    { icon: Compass, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300',
      t: 'Kariyer Yönlendirmesi',
      d: 'Holland RIASEC temelli Meslek Testi ve Akademik Analiz, öğrencinin ilgi alanları ile akademik güçlü yönlerini eşleştirir. Bu eşleşme, lise-üniversite geçişinde tahmine değil veriye dayalı tercih yapılmasını sağlar.' },
    { icon: Zap, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300',
      t: 'Bilişsel Performans Artışı',
      d: 'Dikkat ve Hızlı Okuma testleri, sürekli dikkat, görsel tarama hızı ve okuma anlama oranı gibi yürütücü işlevleri ölçer. Bu veriler, koçluk sürecinde haftalık mikro-egzersizlerle çalışılarak akademik performansın temel altyapısı güçlendirilir.' },
    { icon: Trophy, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300',
      t: 'Motivasyon ve Süreklilik',
      d: 'Haftalık görevler, ilerleme rozetleri ve gelişim grafikleri sayesinde öğrenci somut başarı görür. Davranışsal psikolojide <em>küçük kazanımların pekiştirilmesi</em> uzun vadeli alışkanlık oluşumunun en güçlü mekanizmasıdır.' },
  ];

  return (
    <div className="space-y-7 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
      {/* Tanıtım paragrafı */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          <Sparkles className="w-5 h-5 text-amber-500" /> Test Sonuçları Veriye, Veriler Aksiyona Dönüşür
        </h3>
        <p>
          Eğitim Check-Up&apos;ta uygulanan <strong>10 farklı psikometrik test</strong>, öğrenciye yalnızca bir
          puan değil; <em>kişiye özel bir yol haritası</em> sunar. Koçluk sistemi, bu yol haritasını haftalık
          mikro-hedeflere böler ve öğrenciyi aksiyon almaya teşvik eder. Aşağıdaki altı başlık, testlerin
          öğrenciye sağladığı somut kazanımları özetlemektedir.
        </p>
      </section>

      {/* Kazanım kartları */}
      <section>
        <div className="grid sm:grid-cols-2 gap-3">
          {benefits.map((b, i) => (
            <div key={i} className={`rounded-xl p-4 border ${b.color} border-current/10`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-sm">
                  <b.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold mb-1">{b.t}</p>
                  <p className="text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200/90"
                     dangerouslySetInnerHTML={{ __html: b.d }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sürdürülebilir gelişim paragrafı */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          <Flag className="w-5 h-5 text-emerald-500" /> Sürdürülebilir Akademik Gelişimin Üç Direği
        </h3>
        <p>
          Eğitim psikolojisindeki güncel araştırmalar, kalıcı akademik başarının üç temel direği üzerinde
          yükseldiğini göstermektedir: <strong>(1) kendini tanıma</strong>, <strong>(2) etkili
          stratejilerle çalışma</strong> ve <strong>(3) sürekli geri bildirim</strong>. Eğitim Check-Up
          test paketi bu üç direği aynı anda destekler; Enneagram ve Çoklu Zekâ testleri birinci direği,
          VARK ve Çalışma Davranışı ikinci direği, gelişim takibi ile haftalık koçluk görevleri ise üçüncü
          direği oluşturur.
        </p>
        <p className="mt-3">
          Sistemin asıl gücü <em>entegrasyondadır</em>: her test, bir sonrakinin yorumunu zenginleştirir.
          Örneğin yüksek sınav kaygısı skoru tek başına anlamlı bir veridir; ancak Çalışma Davranışı
          skorlarıyla birlikte okunduğunda, kaygının <em>plansızlıktan</em> mı yoksa <em>aşırı mükemmeliyetçilikten</em>
          mi beslendiği netleşir. Koçluk sistemi bu çok katmanlı okumayı yapay zekâ desteğiyle otomatikleştirerek,
          her öğrenciye <strong>haftalık 3–5 dakikalık mikro-hedefler</strong> ve <strong>aylık ilerleme raporları</strong>
          sunar.
        </p>
      </section>

      <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-100 dark:border-amber-900/50 p-4">
        <p className="text-[13px] text-slate-700 dark:text-slate-300">
          <strong>Sonuç:</strong> Test sonuçları bir &quot;etiket&quot; değil; öğrenciyi tanıyan,
          ona yol gösteren ve gelişimini sürekli besleyen bir <em>koçluk altyapısının</em> başlangıç
          noktasıdır.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PUBLIC EXPORT — Tek bir kontrolör
═══════════════════════════════════════════════════ */
export type HighlightKey = 'analiz' | 'gelisim' | 'kocluk' | null;

export default function HighlightModals({
  active, onClose,
}: {
  active: HighlightKey;
  onClose: () => void;
}) {
  return (
    <>
      <ModalShell
        open={active === 'analiz'}
        onClose={onClose}
        icon={Brain}
        title="Derinlemesine Analiz — Örnek Rapor"
        subtitle="Zeynep K. · Sınav Kaygısı Testi · Bilimsel Temelli Yorum + Öneriler"
        accent="from-violet-500 to-purple-600"
      >
        <DerinAnalizContent />
      </ModalShell>

      <ModalShell
        open={active === 'gelisim'}
        onClose={onClose}
        icon={TrendingUp}
        title="Gelişim Takibi — 8 Haftalık Süreç"
        subtitle="Mert A. · Sınav Kaygısı + Dikkat + Çalışma Davranışı"
        accent="from-sky-500 to-blue-600"
      >
        <GelisimTakibiContent />
      </ModalShell>

      <ModalShell
        open={active === 'kocluk'}
        onClose={onClose}
        icon={Award}
        title="Koçluk Sistemi — Testlerin Öğrenciye Katkıları"
        subtitle="10 psikometrik test · Veriden aksiyona dönüşen bir öğrenme deneyimi"
        accent="from-amber-500 to-orange-600"
      >
        <KoclukContent />
      </ModalShell>
    </>
  );
}
