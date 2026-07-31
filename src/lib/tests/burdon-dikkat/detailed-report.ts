/**
 * Burdon Dikkat Testi — DERİNLEMESİNE ANALİZ (deterministik, API'SIZ).
 *
 * Performans metriği: doğruluk, atlama (omission) / yanlış (commission) hataları,
 * dikkat örüntüsü ve paragraf bazlı yorgunluk eğrisi.
 * Öz-beyan değil, GÖZLENEN performanstır.
 */
import {
  clampPct, statGrid, gauge, barsBlock, insight,
  compareBlock, chainBlock, timelineBlock, quadrantBlock, donutBlock, heatmapBlock,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';
import { tamlayan, belirtme, yonelme } from '@/lib/utils/turkish';

interface BurdonResult {
  totalCorrect?: number; totalOmission?: number; totalCommission?: number; totalTargets?: number;
  overallAccuracy?: number; overallScore?: number;
  attentionPattern?: string; patternTitle?: string; patternFinding?: string; patternSuggestion?: string;
  paragraphErrors?: [number, number, number] | number[];
}

/** Dikkat boyutlarının okul görevlerine yansıması (0–1). Ölçüm değil. */
const TASK_LOAD: Record<string, { dogruluk: number; sureklilik: number }> = {
  'Uzun sınav (2+ ders saati)': { dogruluk: 0.8, sureklilik: 1.0 },
  'Optik form işaretleme':      { dogruluk: 1.0, sureklilik: 0.6 },
  'Uzun metin okuma':           { dogruluk: 0.7, sureklilik: 1.0 },
  'Yazım / imla kontrolü':      { dogruluk: 1.0, sureklilik: 0.6 },
  'Hesaplama / işlem':          { dogruluk: 1.0, sureklilik: 0.7 },
  'Ders anlatımını takip':      { dogruluk: 0.5, sureklilik: 1.0 },
};

export function buildBurdonDikkatDetailedReport(scores: BurdonResult, student: StudentInfo): string {
  const name = safeName(student);
  const acc = clampPct(scores.overallAccuracy ?? 0);
  const score = clampPct(scores.overallScore ?? 0);
  const omission = Math.max(0, Math.round(scores.totalOmission ?? 0));      // atlama
  const commission = Math.max(0, Math.round(scores.totalCommission ?? 0));  // yanlış işaretleme
  const eTot = omission + commission;
  const correct = Math.max(0, Math.round(scores.totalCorrect ?? 0));

  const hataTipi = eTot === 0 ? 'Hata yok'
    : omission > commission * 1.5 ? 'Atlama ağırlıklı'
    : commission > omission * 1.5 ? 'Acelecilik ağırlıklı' : 'Karma';

  // Paragraf bazlı yorgunluk eğrisi (3 paragraf)
  const pErr = Array.isArray(scores.paragraphErrors) ? scores.paragraphErrors.map((x) => Math.max(0, Math.round(Number(x) || 0))) : [];
  const hasCurve = pErr.length >= 2;
  const artis = hasCurve ? pErr[pErr.length - 1] - pErr[0] : 0;

  // Hız ekseni: doğru işaretleme hacmi (tarama verimi)
  const kapsam = clampPct(scores.totalTargets ? (correct / scores.totalTargets) * 100 : acc);

  const P: string[] = [];

  // ═══ KÜNYE + TEK BAKIŞTA ═══
  P.push(reportHeader('✏️ BURDON DİKKAT TESTİ — DERİNLEMESİNE ANALİZ RAPORU', 'Burdon — Dikkat ve Tarama Analizi', student));
  P.push(statGrid([
    { label: 'Dikkat Skoru', value: score, unit: '%', theme: score >= 70 ? 'success' : score >= 40 ? 'warning' : 'danger', icon: 'target' },
    { label: 'Doğruluk', value: acc, unit: '%', theme: 'primary', icon: 'award' },
    { label: 'Hata Tipi', value: hataTipi, theme: eTot === 0 ? 'success' : 'info', icon: 'activity' },
    { label: 'Örüntü', value: scores.patternTitle || scores.attentionPattern || '—', theme: 'info', icon: 'compass' },
  ], 4));
  P.push('---\n');

  // ═══ NE ÖLÇER / NE ÖLÇMEZ ═══
  P.push(`## 🔎 Bu Rapor Neyi Ölçer, Neyi Ölçmez?\n`);
  P.push(
    `Burdon testi, metin içindeki hedef harfleri bulma görevi üzerinden **seçici dikkati** ve ` +
    `**tarama doğruluğunu** ölçer. Diğer testlerden farklı olarak bu bir **öz-beyan değil, gözlenen performanstır**.\n`,
  );
  P.push(insight('note', 'Kapsam — Önemli',
    `**Ölçer:** O oturumdaki tarama doğruluğu, hata örüntüsü ve dikkat sürekliliği.\n\n` +
    `**Ölçmez:** Dikkat eksikliği, hiperaktivite veya herhangi bir nörogelişimsel durum.\n\n` +
    `Bu test bir **tanı aracı değildir**. Tek oturumluk performans; uyku, açlık, motivasyon ve ` +
    `günün saati sonucu belirgin şekilde etkiler.`));
  P.push('---\n');

  // ═══ 1. YÖNETİCİ ÖZETİ ═══
  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** dikkat skoru **%${score}**, doğruluk **%${acc}** olarak görünüyor. ` +
    `${scores.patternFinding ? scores.patternFinding + ' ' : ''}` +
    `${eTot > 0 ? `Hatalar **${hataTipi.toLocaleLowerCase('tr')}** (atlama ${omission}, acele ${commission}). ` : 'Hata görülmedi. '}` +
    `${hasCurve ? `Paragraflar arası hata seyri: ${pErr.join(' → ')}. ` : ''}\n`,
  );
  P.push('---\n');

  // ═══ 2. PROFİL ═══
  P.push(`## 📊 2. Dikkat Profili\n`);
  P.push(gauge('Dikkat Skoru', score, { zones: 'Düşük:0-40,Orta:40-70,Yüksek:70-100', caption: 'Yüksek bölge güçlü tarama becerisini gösterir' }));
  P.push(donutBlock('İşaretleme Dağılımı', [
    ['Doğru işaretleme', correct],
    ['Atlama', omission],
    ['Yanlış işaretleme', commission],
  ], `%${acc}`));
  P.push(barsBlock('Doğruluk ve Hata (%)', [
    ['Doğruluk', acc],
    ['Atlama payı', clampPct(eTot ? (omission / eTot) * 100 : 0)],
    ['Acelecilik payı', clampPct(eTot ? (commission / eTot) * 100 : 0)],
  ]));
  P.push(statGrid([
    { label: 'Doğru Hedef', value: correct, theme: 'success', icon: 'award' },
    { label: 'Atlama', value: omission, theme: omission > commission ? 'warning' : 'info', icon: 'target' },
    { label: 'Yanlış İşaretleme', value: commission, theme: commission > omission ? 'warning' : 'info', icon: 'activity' },
  ]));
  P.push('---\n');

  // ═══ 3. NEDEN — HATA TÜRÜ ═══
  P.push(`## 🧩 3. NEDEN Bu Sonuç Çıktı? — İki Hata Türü\n`);
  P.push(
    `Tarama görevinde iki farklı hata yapılır ve **ikisi tamamen farklı şey anlatır**:\n\n` +
    `- **Atlama:** Hedef harfi görüp işaretlememek. Hızlı tarama veya dikkat kaymasına işaret edebilir.\n` +
    `- **Yanlış işaretleme:** Hedef olmayanı işaretlemek. Acele karar vermeye işaret edebilir.\n\n` +
    `Genel "hata sayısı" bu ikisini birleştirir; ayrıştırınca ${tamlayan(name)} örüntüsü görünür hâle gelir.\n`,
  );
  P.push(compareBlock(
    'Hata Türlerinin Dağılımı',
    [['Hata payı', clampPct(eTot ? (omission / eTot) * 100 : 0), clampPct(eTot ? (commission / eTot) * 100 : 0)]],
    { selfLabel: 'Atlama', refLabel: 'Acelecilik' },
  ));
  P.push(insight(
    eTot === 0 ? 'strength' : hataTipi === 'Acelecilik ağırlıklı' ? 'action' : 'note',
    `Hata Örüntüsü — ${hataTipi}`,
    eTot === 0
      ? 'Bu oturumda hata görülmedi. Hem tarama hem kontrol tarafı sağlam çalışmış görünüyor.'
      : hataTipi === 'Atlama ağırlıklı'
        ? `Hatalar ağırlıklı olarak **atlama** (${omission} atlama / ${commission} acele). ${name} hızlı tarıyor ama bazı hedefleri gözden kaçırıyor olabilir. ` +
          `Sınavda karşılığı: soru kökündeki "değildir" gibi bir kelimeyi atlamak. Yaklaşım: kalemle satır takibi.`
        : hataTipi === 'Acelecilik ağırlıklı'
          ? `Hatalar ağırlıklı olarak **acelecilik** (${commission} acele / ${omission} atlama). Karar vermeden önce yeterince kontrol edilmiyor olabilir. ` +
            `Sınavda karşılığı: şıkları okumadan ilk uyana işaretlemek. Yaklaşım: "işaretlemeden önce bir kez daha bak" kuralı.`
          : `Hatalar iki türe dengeli dağılmış (atlama ${omission}, acele ${commission}). Genel bir dikkat dalgalanması söz konusu olabilir.`));
  if (scores.patternFinding) P.push(insight('note', `Dikkat Örüntüsü: ${scores.patternTitle || ''}`, scores.patternFinding));
  P.push('---\n');

  // ═══ 4. DOĞRULUK × KAPSAM ═══
  P.push(`## ⚖️ 4. Kapsam × Doğruluk Dengesi\n`);
  P.push(
    `Tarama görevinde iki şey birlikte istenir: **çok hedef bulmak** (kapsam) ve **yanlış işaretlememek** (doğruluk). ` +
    `İkisi birbirini dengeler.\n`,
  );
  P.push(quadrantBlock(
    'Kapsam × Doğruluk Konumu',
    kapsam, acc,
    'Kapsam (bulunan hedef)', 'Doğruluk',
    ['Gelişmekte', 'Geniş ama hatalı', 'Dikkatli ama dar', 'Geniş ve doğru'],
    'Sağ üst çeyrek hedeftir. Sol üst (dikkatli ama dar) sınavda süre sorunu yaratabilir.',
  ));
  P.push('---\n');

  // ═══ 5. YORGUNLUK EĞRİSİ ═══
  if (hasCurve) {
    P.push(`## 📉 5. Dikkat Sürekliliği — Paragraflar Boyunca\n`);
    P.push(
      `Testin en değerli bilgisi tek bir puan değil, **hata sayısının zaman içindeki seyridir**. ` +
      `Aşağıdaki grafik her paragraftaki hata sayısını sırayla gösterir.\n`,
    );
    P.push(barsBlock('Paragraf Bazında Hata Sayısı', pErr.map((v, i) => [`${i + 1}. paragraf`, v] as [string, number])));
    P.push(compareBlock(
      'İlk Paragraf ↔ Son Paragraf',
      [['Hata sayısı', pErr[pErr.length - 1], pErr[0]]],
      { selfLabel: 'Son paragraf', refLabel: 'İlk paragraf' },
    ));
    P.push(insight(
      artis >= 3 ? 'risk' : artis <= -2 ? 'strength' : 'note',
      artis >= 3 ? 'Dikkat Yorgunluğu Gözleniyor' : artis <= -2 ? 'Isınma Etkisi' : 'Süreklilik Korunuyor',
      artis >= 3
        ? `Son paragrafta hata sayısı ${artis} arttı (${pErr[0]} → ${pErr[pErr.length - 1]}). ` +
          `${name} dikkatini uzun süre korumakta zorlanıyor olabilir. Sınavda karşılığı: son sorularda hata artışı. ` +
          `Yaklaşım: uzun sınavlarda 15–20 dakikada bir kısa göz dinlendirme; çalışmayı bloklara bölmek.`
        : artis <= -2
          ? `Son paragrafta hata sayısı ${Math.abs(artis)} **azaldı** (${pErr[0]} → ${pErr[pErr.length - 1]}). ` +
            `Isınma süresine ihtiyaç duyuyor olabilir. Sınavda karşılığı: ilk sorularda tereddüt. ` +
            `Yaklaşım: sınav öncesi 2–3 kolay soruyla ısınmak.`
          : `Hata sayısı paragraflar boyunca dengeli seyretti (${pErr.join(' → ')}). Dikkat sürekliliği korunmuş görünüyor.`));
    P.push('---\n');
  }

  // ═══ 6. NİÇİN — ZİNCİRLER ═══
  P.push(`## 🔗 6. NİÇİN Önemli? — Neden, Etki ve Sonuç\n`);
  P.push(chainBlock('Dikkat Performansının Sınıfa Yansıması', [
    [`Dikkat skoru %${score}, doğruluk %${acc}`,
      score >= 70 ? 'Tarama gerektiren görevlerde güvenilir olabilir' : 'Tarama görevlerinde gözden kaçırma olabilir',
      score >= 70 ? 'Optik form ve uzun sınavda avantajlı olabilir' : 'Kontrol adımı eklemek hatayı azaltabilir'],
    [eTot === 0 ? 'Hata görülmedi' : `Hata örüntüsü: ${hataTipi}`,
      hataTipi === 'Acelecilik ağırlıklı' ? 'Kontrol etmeden ilerleme eğilimi olabilir' : hataTipi === 'Atlama ağırlıklı' ? 'Hızlı tarama sırasında ayrıntı kaçabilir' : 'Genel dikkat dalgalanması olabilir',
      hataTipi === 'Acelecilik ağırlıklı' ? '"Bir kez daha bak" kuralı hatayı azaltabilir' : 'Kalemle takip ederek okuma hatayı azaltabilir'],
    [hasCurve ? (artis >= 3 ? 'Son paragrafta hata arttı' : 'Hata seyri dengeli') : 'Dikkat sürekliliği',
      artis >= 3 ? 'Dikkat süresi sınırlı olabilir' : 'Dikkat süresi görev boyunca korunabiliyor',
      artis >= 3 ? 'Uzun sınavlarda mola stratejisi gerekebilir' : 'Uzun görevler planlanabilir'],
    ['Uyku ve günün saati',
      'Dikkat performansı bu iki etkene çok duyarlıdır',
      'Dikkat gerektiren görevleri zinde saatlere almak fark yaratabilir'],
  ]));
  P.push('---\n');

  // ═══ 7. GÖREV UYUM HARİTASI ═══
  P.push(`## 🗺️ 7. Hangi Görevde Ne Beklenir?\n`);
  P.push(
    `Aşağıdaki tablo, ${tamlayan(name)} doğruluk ve süreklilik profilini okul görevleriyle birleştirir. ` +
    `Düşük değer başarısızlık değil, **o görevde ek strateji gerekebileceği** anlamına gelir.\n`,
  );
  {
    const sureklilik = hasCurve ? clampPct(100 - Math.max(0, artis) * 8) : score;
    const rows: [string, number[]][] = Object.keys(TASK_LOAD).map((t) => {
      const w = TASK_LOAD[t];
      return [t, [clampPct(acc * w.dogruluk), clampPct(sureklilik * w.sureklilik)]];
    });
    P.push(heatmapBlock('Görev × Dikkat Boyutu', ['Doğruluk', 'Süreklilik'], rows,
      'Bu tablo bir başarı tahmini değil, performans profilinden türetilmiş bir uyum göstergesidir.'));
    const ranked = rows.map(([t, v]) => [t, Math.min(...v)] as [string, number]).sort((a, b) => a[1] - b[1]);
    P.push(`En çok strateji desteği gerekebilecek görev: **${ranked[0][0].toLocaleLowerCase('tr')}**.\n`);
  }
  P.push('---\n');

  // ═══ 8. SONUÇ — YOL HARİTASI ═══
  P.push(`## 🎯 8. SONUÇ — Dikkat Geliştirme Yol Haritası\n`);
  if (scores.patternSuggestion) P.push(insight('action', 'Örüntüye Özel Öneri', scores.patternSuggestion));
  P.push(timelineBlock('8 Haftalık Dikkat Planı', [
    ['Zinde saati bulun', 'Bir hafta boyunca günün hangi saatinde daha odaklı olduğunu not edin.', '1. hafta'],
    ['Çalışmayı bloklara böl', 'Pomodoro: 25 dakika çalışma, 5 dakika mola.', '1–2. hafta'],
    [hataTipi === 'Acelecilik ağırlıklı' ? '"Bir kez daha bak" kuralı' : 'Kalemle takip ederek okuma',
      hataTipi === 'Acelecilik ağırlıklı' ? 'İşaretlemeden önce şıkları bir kez daha okusun.' : 'Kalemle satır takip ederek okusun; atlama azalır.', '2–3. hafta'],
    ['Dikkat dağıtıcıları kaldır', 'Telefon başka odada, masa sade — en hızlı sonuç veren tek değişiklik.', '3–4. hafta'],
    [artis >= 3 ? 'Mola stratejisi kur' : 'Blok süresini uzat',
      artis >= 3 ? 'Uzun sınavda 15–20 dakikada bir kısa göz dinlendirme provası yapın.' : 'Çalışma bloğunu 25 dakikadan 35 dakikaya çıkarmayı deneyin.', '4–5. hafta'],
    ['Tarama pratiği', 'Günde 10 dakika: metinde belirli bir harfi bulma, farkı bul, sudoku.', '5–6. hafta'],
    ['Sınav provası', 'Gerçek süreyle deneme çözsün; son sorulardaki hata sayısını sayın.', '6–7. hafta'],
    ['Değerlendir', 'Hata sayısı ve odak süresini karşılaştırın.', '8. hafta'],
  ]));
  P.push('---\n');

  // ═══ 9. ÖĞRETMEN KARTI ═══
  P.push(`## 👩‍🏫 9. Öğretmen İçin Hızlı Kart\n`);
  P.push(insight('strength', 'İşe Yarayabilecekler',
    `- Hata tipi: **${hataTipi}**. ${hataTipi === 'Acelecilik ağırlıklı' ? 'Kontrol alışkanlığı kazandırmak hatayı hızla azaltabilir.' : hataTipi === 'Atlama ağırlıklı' ? 'Kalemle takip ederek okuma, atlamayı belirgin azaltabilir.' : 'Mola düzeni ve çalışma saati seçimi işe yarayabilir.'}\n` +
    (hasCurve && artis >= 3 ? `- Son paragrafta hata ${artis} arttı. Uzun sınavlarda ara vermek performansı koruyabilir.\n` : `- Dikkat sürekliliği korunuyor; uzun görevler planlanabilir.\n`) +
    (scores.patternSuggestion ? `- ${scores.patternSuggestion}\n` : '') +
    `- Dikkat gerektiren görevleri günün zinde saatlerine almak fark yaratabilir.`));
  P.push(insight('risk', 'Dikkat Edilebilecekler',
    `- Bu test **tanı aracı değildir**. Düşük skor bir dikkat bozukluğu anlamına gelmez.\n` +
    `- Tek oturum ölçümü: uyku, açlık ve motivasyon sonucu belirgin etkiler.\n` +
    `- "Dikkatini toplayamıyorsun" etiketi motivasyonu düşürür; somut stratejiye odaklanmak daha etkilidir.\n` +
    `- Sürekli ve belirgin dikkat güçlüğü gözleniyorsa okul rehberlik servisiyle görüşmek yerinde olur.`));
  P.push('---\n');

  // ═══ 10. AİLE ═══
  P.push(`## 👨‍👩‍👦 10. Aile İçin Rehber\n`);
  P.push(
    `- Çalışma kısa bloklara bölünebilir; uzun oturuşlar verimi düşürür.\n` +
    `- Dikkat gerektiren görevler günün en zinde saatine denk getirilebilir.\n` +
    `- Uyku düzeni, dikkat üzerinde en güçlü etkiye sahip tek etkendir.\n`,
  );
  P.push(insight('action', 'Küçük Bir Deney',
    `Bir hafta boyunca ${yonelme(name)} telefonu başka odada bırakarak çalıştırın. ` +
    `Sonunda ${belirtme(name)} sorun: "Fark ettin mi?" Bu tek değişiklik, çoğu dikkat egzersizinden daha hızlı sonuç verir.`));
  P.push('---\n');

  // ═══ 11. SINIRLILIKLAR ═══
  P.push(`## 📌 11. Sınırlılıklar ve Doğru Kullanım\n`);
  P.push(insight('note', 'Bu Rapor Nasıl Okunmalı?',
    `- Sonuç **tek bir oturumun** performansıdır; farklı günde farklı çıkabilir.\n` +
    `- Uyku, açlık, motivasyon ve günün saati sonucu belirgin şekilde etkiler.\n` +
    `- Bu test **DEHB veya başka bir durumun tanısını koymaz**; tarama aracı bile değildir.\n` +
    `- Dikkat, düzenli pratikle gelişebilen bir beceridir; sabit bir özellik değildir.\n` +
    `- Sürekli dikkat güçlüğü gözleniyorsa uzman değerlendirmesi gerekir.`));
  P.push(
    `\n### Kapanış Notu\n` +
    `Dikkat, kas gibi çalıştırıldıkça güçlenir. ${name} için düzenli pratik ve uygun çalışma düzeni, ` +
    `zamanla belirgin gelişim getirebilir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
