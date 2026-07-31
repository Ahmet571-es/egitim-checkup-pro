/**
 * Burdon Dikkat Testi — DETAYLI ANALİZ (deterministik, API'SIZ).
 * Performans metriği: doğruluk, atlama (omission) / yanlış (commission) hataları, dikkat örüntüsü.
 */
import {
  clampPct, statGrid, gauge, barsBlock, insight,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';
import { tamlayan } from '@/lib/utils/turkish';

interface BurdonResult {
  totalCorrect?: number; totalOmission?: number; totalCommission?: number; totalTargets?: number;
  overallAccuracy?: number; overallScore?: number;
  attentionPattern?: string; patternTitle?: string; patternFinding?: string; patternSuggestion?: string;
}

export function buildBurdonDikkatDetailedReport(scores: BurdonResult, student: StudentInfo): string {
  const name = safeName(student);
  const acc = clampPct(scores.overallAccuracy ?? 0);
  const score = clampPct(scores.overallScore ?? 0);
  const omission = scores.totalOmission ?? 0;
  const commission = scores.totalCommission ?? 0;

  const P: string[] = [];

  P.push(reportHeader('✏️ BURDON DİKKAT TESTİ — DETAYLI ANALİZ RAPORU', 'Burdon — Dikkat ve Tarama Analizi', student));
  P.push(statGrid([
    { label: 'Dikkat Skoru', value: score, unit: '%', theme: score >= 70 ? 'success' : score >= 40 ? 'warning' : 'danger', icon: 'target' },
    { label: 'Doğruluk', value: acc, unit: '%', theme: 'primary', icon: 'award' },
    { label: 'Dikkat Örüntüsü', value: scores.patternTitle || scores.attentionPattern || '—', theme: 'info', icon: 'activity' },
  ]));
  P.push('---\n');

  P.push(`## 🔎 Bu Rapor Neyi Ölçüyor?\n`);
  P.push(
    `Burdon Dikkat Testi, **görsel tarama** ve **sürdürülebilir dikkat** becerisini ölçer: ` +
    `bir metin içinden belirli harfleri/hedefleri, dikkati dağıtmadan bulup işaretleme. ` +
    `Bu rapor **"${name} dikkatini ne kadar doğru ve sürekli kullanabiliyor?"** sorusuna yanıt arar.\n`,
  );
  P.push('---\n');

  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** dikkat skoru %${score}, doğruluk oranı %${acc} olarak görünüyor. ` +
    `Dikkat örüntüsü **${scores.patternTitle || scores.attentionPattern || '—'}** olarak beliriyor. ${scores.patternFinding || ''} ` +
    `Aşağıdaki bölümler; hata türlerini (atlama/yanlış), dikkat örüntüsünü ve geliştirme önerilerini ayrıntılandırır.\n`,
  );
  P.push('---\n');

  P.push(`## 📊 2. Dikkat Profili\n`);
  P.push(gauge('Genel Dikkat Skoru', score, { zones: 'Düşük:0-40,Orta:40-70,Yüksek:70-100', caption: `Doğruluk %${acc}` }));
  P.push(statGrid([
    { label: 'Doğru İşaret', value: scores.totalCorrect ?? '—', theme: 'success', icon: 'award' },
    { label: 'Atlama Hatası', value: omission, theme: omission >= 10 ? 'warning' : 'success', icon: 'eye' },
    { label: 'Yanlış İşaret', value: commission, theme: commission >= 10 ? 'warning' : 'success', icon: 'target' },
  ]));
  if (omission + commission > 0) P.push(barsBlock('Hata Türü Dağılımı', [['Atlama (gözden kaçan)', omission], ['Yanlış (fazladan işaret)', commission]]));
  P.push('---\n');

  P.push(`## 🧠 3. Dikkat Örüntüsünün Yorumu\n`);
  P.push(insight(score >= 70 ? 'strength' : 'note', scores.patternTitle || 'Dikkat Örüntüsü', scores.patternFinding || 'Dikkat performansı değerlendirildi.'));
  if (scores.patternSuggestion) P.push(insight('action', 'Öneri', scores.patternSuggestion));
  P.push(
    `**Hata türlerinin anlamı:**\n` +
    `- **Atlama hataları (${omission}):** ${omission >= 10 ? 'hedefleri gözden kaçırma eğilimi; tarama hızını biraz düşürmek yardımcı olabilir.' : 'düşük düzeyde; hedefleri iyi yakalıyor.'}\n` +
    `- **Yanlış işaretler (${commission}):** ${commission >= 10 ? 'aceleci işaretleme eğilimi; doğruluğa odaklanmak dengeyi iyileştirebilir.' : 'düşük düzeyde; seçici dikkati iyi kullanıyor.'}\n`,
  );
  P.push('---\n');

  P.push(`## 🎯 4. Dikkat Geliştirme Yol Haritası\n`);
  P.push(`*${name} için denenebilecek pratikler:*\n`);
  P.push(
    (score >= 70
      ? `- Güçlü tarama becerisini korumak için düzenli okuma ve dikkat oyunları sürdürülebilir.\n- Daha hızlı ve doğru tarama için zamanlı alıştırmalar denenebilir.\n`
      : `- Günlük 10-15 dk görsel tarama oyunları (farkı bul, harf/kelime bulmaca) faydalı olabilir.\n- Kısa, odaklı çalışma blokları (Pomodoro) dikkat sürekliliğini destekleyebilir.\n`) +
    `- ${omission >= 10 ? 'Atlama hataları için: tarama hızını biraz düşürüp her satırı dikkatle taramak denenebilir.\n' : ''}` +
    `${commission >= 10 ? '- Yanlış işaretler için: işaretlemeden önce kısa bir doğrulama alışkanlığı yardımcı olabilir.\n' : ''}` +
    `- Yeterli uyku ve molalar, dikkat kalitesini artırabilir.\n`,
  );
  P.push('---\n');

  P.push(`## 👨‍👩‍👦 5. Aile ve 👩‍🏫 Öğretmen İçin\n`);
  P.push(`- ${tamlayan(name)} dikkat örüntüsü göz önünde bulundurularak, görevler kısa ve net adımlara bölünebilir.\n- Doğruluğu övmek (hızdan çok), sağlıklı bir dikkat alışkanlığı geliştirebilir.\n- Sürekli ve belirgin dikkat güçlüğünde okul rehberlik servisiyle görüşmek faydalı olabilir.\n`);
  P.push('---\n');

  P.push(`## 📌 6. Öncelik Özeti\n`);
  P.push(insight(score >= 70 ? 'strength' : 'action', 'Genel Durum', `Dikkat skoru %${score}, doğruluk %${acc}. ${scores.patternFinding || ''}`));
  if (scores.patternSuggestion) P.push(insight('action', 'Öncelikli Adım', scores.patternSuggestion));
  P.push(
    `\n### Kapanış Notu\n` +
    `Dikkat ve tarama becerisi, düzenli pratikle gelişir. ${name} için keyifli ve düzenli alıştırmalar, zamanla belirgin fark yaratabilir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
