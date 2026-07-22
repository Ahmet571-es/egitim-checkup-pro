/**
 * Sağ-Sol Beyin Baskınlığı — DETAYLI ANALİZ (deterministik, API'SIZ).
 * dominant: sag | sol | dengeli. İyi/kötü yok; farklı düşünme stilleri.
 */
import { SAG_SOL_BEYIN_DATA } from './data';
import type { SagSolBeyinScores } from '../types';
import {
  clampPct, statGrid, gauge, barsBlock, insight,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';

export function buildSagSolBeyinDetailedReport(scores: SagSolBeyinScores, student: StudentInfo): string {
  const name = safeName(student);
  const sol = clampPct(scores.solYuzde ?? 0);
  const sag = clampPct(scores.sagYuzde ?? 0);
  const dom = scores.dominant || (sol > sag ? 'sol' : sag > sol ? 'sag' : 'dengeli');
  const d = SAG_SOL_BEYIN_DATA[dom];

  const P: string[] = [];

  P.push(reportHeader('🧠 SAĞ-SOL BEYİN BASKINLIĞI — DETAYLI ANALİZ RAPORU', 'Beyin Baskınlığı ve Düşünme Stili Analizi', student));
  P.push(statGrid([
    { label: 'Baskın Yön', value: d.title, theme: 'success', icon: 'brain' },
    { label: 'Sol Beyin', value: sol, unit: '%', theme: 'info', icon: 'activity' },
    { label: 'Sağ Beyin', value: sag, unit: '%', theme: 'primary', icon: 'sparkles' },
  ]));
  P.push('---\n');

  P.push(`## 🔎 Bu Rapor Neyi Ölçüyor?\n`);
  P.push(
    `Sol beyin genelde **mantık, analiz ve sıralı düşünme** ile; sağ beyin ise **yaratıcılık, sezgi ve bütüncül düşünme** ile ilişkilendirilir. ` +
    `Bu bir yetenek ölçümü değil, bir **düşünme stili eğilimidir** — "iyi/kötü" yoktur. ` +
    `Amaç, ${name}'in doğal eğilimini anlayıp çalışma yöntemini buna göre düzenlemektir.\n`,
  );
  P.push('---\n');

  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${name}**'in düşünme stili **${d.title.toLowerCase()}** yönünde eğilim gösteriyor (Sol %${sol} · Sağ %${sag}). ` +
    `${d.description} ` +
    `${dom === 'dengeli' ? 'Dengeli profil, her iki stili de esnekçe kullanabildiğine işaret edebilir. ' : 'Bu eğilimi çalışma yönteminin merkezine almak verimi artırabilir. '}` +
    `Aşağıdaki bölümler; güçlü yönleri, gelişim alanlarını, çalışma stratejilerini ve ilgi alanlarını ayrıntılandırır.\n`,
  );
  P.push('---\n');

  P.push(`## 📊 2. Beyin Baskınlık Profili\n`);
  P.push(gauge('Sağ Beyin Eğilimi', sag, { zones: 'Sol Baskın:0-40,Dengeli:40-60,Sağ Baskın:60-100', caption: `Sol %${sol} · Sağ %${sag}` }));
  P.push(barsBlock('Beyin Yarımküre Dağılımı (%)', [['Sol Beyin (Analitik)', sol], ['Sağ Beyin (Yaratıcı)', sag]]));
  if (scores.textSol != null && scores.visualSol != null) {
    P.push(`*Alt kırılım:* Sözel bölümde sol/sağ eğilimi ile görsel bölümde sol/sağ eğilimi birlikte değerlendirildi.\n`);
  }
  P.push('---\n');

  P.push(`## 🧠 3. Düşünme Stilinin Derinlemesine Yorumu — ${d.title}\n`);
  P.push(`${d.description}\n`);
  P.push(insight('strength', 'Güçlü Yönler', d.strengths.map((s) => `• ${s}`).join('\n')));
  P.push(insight('action', 'Gelişim Alanları', d.developmentAreas.map((s) => `• ${s}`).join('\n')));
  P.push('---\n');

  P.push(`## 🎯 4. Çalışma Yol Haritası\n`);
  P.push(`*${name}'in ${d.title.toLowerCase()} eğilimine uygun çalışma yöntemleri.*\n`);
  P.push(`${d.studyTips.map((t) => `- ${t}`).join('\n')}\n`);
  P.push('---\n');

  P.push(`## 🧭 5. İlgi ve Kariyer Alanları\n`);
  P.push(insight('note', 'İlişkili Alanlar', d.careerAreas.join(' · ')));
  P.push('---\n');

  P.push(`## 👨‍👩‍👦 6. Aile ve 👩‍🏫 Öğretmen İçin\n`);
  P.push(`- ${name}'in doğal düşünme stilini (${d.title.toLowerCase()}) desteklemek, öğrenmeyi kolaylaştırabilir.\n- Diğer yarımküreyi de geliştiren etkinlikler (örn. analitik için bulmaca, yaratıcı için sanat) dengeyi besleyebilir.\n`);
  P.push('---\n');

  P.push(`## 📌 7. Öncelik Özeti\n`);
  P.push(insight('strength', 'Merkeze Al', `${d.strengths[0]}`));
  P.push(insight('action', 'Geliştir', `${d.developmentAreas[0]}`));
  P.push(
    `\n### Kapanış Notu\n` +
    `Beyin baskınlığı bir sınır değil, bir başlangıç noktasıdır. ${name} her iki stili de zamanla geliştirebilir; ` +
    `güçlü yönü merkeze alan bir yaklaşım en verimli sonucu getirebilir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
