/**
 * D2 Dikkat Testi — DETAYLI ANALİZ (deterministik, API'SIZ).
 * Performans metriği: konsantrasyon (CP), hız/doğruluk, denge, tutarlılık.
 */
import {
  clampPct, statGrid, gauge, barsBlock, insight,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';

interface D2Result {
  cpPct?: number; hitRate?: number; errorPct?: number;
  TN?: number; E?: number; totalTargets?: number; totalCorrect?: number;
  level?: string; levelDesc?: string;
  balance?: string; balanceDesc?: string;
  consistency?: string; consistencyDesc?: string;
}

export function buildD2DikkatDetailedReport(scores: D2Result, student: StudentInfo): string {
  const name = safeName(student);
  const cp = clampPct(scores.cpPct ?? 0);
  const hit = clampPct(scores.hitRate ?? 0);
  const err = clampPct(scores.errorPct ?? 0);

  const P: string[] = [];

  P.push(reportHeader('🎯 D2 DİKKAT TESTİ — DETAYLI ANALİZ RAPORU', 'D2 — Dikkat ve Konsantrasyon Analizi', student));
  P.push(statGrid([
    { label: 'Dikkat Düzeyi', value: scores.level || '—', theme: cp >= 70 ? 'success' : cp >= 40 ? 'warning' : 'danger', icon: 'target' },
    { label: 'Konsantrasyon', value: cp, unit: '%', theme: 'primary', icon: 'brain' },
    { label: 'Tutarlılık', value: scores.consistency || '—', theme: 'info', icon: 'activity' },
  ]));
  P.push('---\n');

  P.push(`## 🔎 Bu Rapor Neyi Ölçüyor?\n`);
  P.push(
    `D2 Dikkat Testi, **seçici dikkati** ve **konsantrasyon sürekliliğini** ölçer: ` +
    `belirli hedefleri, benzer uyaranlar arasından hızlı ve doğru seçebilme becerisi. ` +
    `Bu rapor **"${name} dikkatini ne kadar odaklı, hızlı ve tutarlı kullanabiliyor?"** sorusuna yanıt arar.\n`,
  );
  P.push('---\n');

  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${name}**'in dikkat performansı **${scores.level || '—'}** düzeyinde görünüyor. ${scores.levelDesc || ''} ` +
    `Konsantrasyon oranı %${cp}; işaretleme dengesi ${scores.balance ? `"${scores.balance.toLowerCase()}"` : '—'} ve satırlar arası tutarlılık ${scores.consistency ? `"${scores.consistency.toLowerCase()}"` : '—'} olarak beliriyor. ` +
    `Aşağıdaki bölümler; hız-doğruluk dengesini, tutarlılığı ve dikkat geliştirme önerilerini ayrıntılandırır.\n`,
  );
  P.push('---\n');

  P.push(`## 📊 2. Dikkat Profili\n`);
  P.push(gauge('Konsantrasyon Performansı', cp, { zones: 'Düşük:0-40,Orta:40-70,Yüksek:70-100', caption: scores.levelDesc || 'Yüksek bölge güçlü odaklanmayı gösterir' }));
  P.push(barsBlock('Hız-Doğruluk Dağılımı (%)', [['Doğru İşaretleme', hit], ['Hata Oranı', err]]));
  P.push(statGrid([
    { label: 'İşlenen Uyaran', value: scores.TN ?? '—', theme: 'info', icon: 'activity' },
    { label: 'Toplam Hata', value: scores.E ?? '—', theme: err >= 20 ? 'warning' : 'success', icon: 'target' },
    { label: 'Doğru Hedef', value: scores.totalCorrect ?? '—', theme: 'success', icon: 'award' },
  ]));
  P.push('---\n');

  P.push(`## 🧠 3. Performansın Derinlemesine Yorumu\n`);
  P.push(insight(cp >= 70 ? 'strength' : cp >= 40 ? 'note' : 'action', `Dikkat Düzeyi: ${scores.level || '—'}`, scores.levelDesc || 'Dikkat performansı değerlendirildi.'));
  if (scores.balanceDesc) P.push(insight('note', `İşaretleme Dengesi: ${scores.balance || ''}`, scores.balanceDesc));
  if (scores.consistencyDesc) P.push(insight('note', `Tutarlılık: ${scores.consistency || ''}`, scores.consistencyDesc));
  P.push('---\n');

  P.push(`## 🎯 4. Dikkat Geliştirme Yol Haritası\n`);
  P.push(`*Dikkat, düzenli pratikle güçlenebilen bir beceridir. ${name} için denenebilecek yaklaşımlar:*\n`);
  P.push(
    (cp >= 70
      ? `- Güçlü konsantrasyonu korumak için düzenli, molalı çalışma sürdürülebilir.\n- Daha zorlayıcı dikkat oyunları (satranç, stratejik oyunlar) beceriyi ileri taşıyabilir.\n`
      : `- Kısa ve odaklı çalışma blokları (Pomodoro: 25 dk çalışma, 5 dk mola) denenebilir.\n- Dikkat dağıtıcılar (telefon, gürültü) çalışma ortamından uzaklaştırılabilir.\n- Günlük 10-15 dk dikkat oyunları (bul-boya, farkı bul, sudoku) faydalı olabilir.\n`) +
    `- ${err >= 20 ? 'Hata oranı için: hızdan çok doğruluğa odaklanmak dengeyi iyileştirebilir.\n' : 'Mevcut hız-doğruluk dengesi olumlu görünüyor.\n'}` +
    `- Yeterli uyku ve molalar, dikkat sürekliliğini destekleyebilir.\n`,
  );
  P.push('---\n');

  P.push(`## 👨‍👩‍👦 5. Aile ve 👩‍🏫 Öğretmen İçin\n`);
  P.push(`- ${name}'in dikkat süresi göz önünde bulundurularak, çalışma kısa bloklara bölünebilir.\n- Dikkat gerektiren görevler, günün en zinde olduğu saatlere denk getirilebilir.\n- Sürekli ve belirgin dikkat güçlüğü gözlenirse, okul rehberlik servisiyle görüşmek faydalı olabilir.\n`);
  P.push('---\n');

  P.push(`## 📌 6. Öncelik Özeti\n`);
  P.push(insight(cp >= 70 ? 'strength' : 'action', 'Genel Durum', `Konsantrasyon %${cp} (${scores.level || '—'}). ${scores.levelDesc || ''}`));
  P.push(insight('action', 'Öncelikli Adım', cp >= 70 ? 'Güçlü dikkati zorlayıcı görevlerle beslemek gelişimi sürdürebilir.' : 'Kısa, odaklı çalışma blokları ve dikkat oyunları düzenli denenebilir.'));
  P.push(
    `\n### Kapanış Notu\n` +
    `Dikkat, kas gibi çalıştırıldıkça güçlenir. ${name} için düzenli ve keyifli dikkat pratikleri, zamanla belirgin gelişim getirebilir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
