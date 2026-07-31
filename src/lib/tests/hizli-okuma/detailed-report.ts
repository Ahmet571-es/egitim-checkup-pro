/**
 * Hızlı Okuma — DERİNLEMESİNE ANALİZ (deterministik, API'SIZ).
 *
 * Metrik: okuma hızı (WPM) + anlama (%) + etkin okuma skoru (hız×0.4 + anlama×0.6).
 * Öz-beyan değil, GÖZLENEN performanstır.
 *
 * Raporun merkezi: HIZ–ANLAMA TAKASI. Yüksek hız tek başına iyi değildir;
 * anlama düşükse hız bir kazanç değil, kayıptır.
 */
import {
  clampPct, statGrid, gauge, barsBlock, insight,
  compareBlock, chainBlock, timelineBlock, quadrantBlock, donutBlock, heatmapBlock,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';
import type { SpeedReadingScores } from '../types';
import { tamlayan, belirtme, yonelme } from '@/lib/utils/turkish';

/** Kademeye göre yaklaşık beklenen okuma hızı aralığı (kelime/dakika). Kaba referans. */
const EXPECTED_WPM: Record<string, number> = {
  ilkokul: 100, ortaokul: 150, lise: 200,
};

/** Ders görevlerinin hız ve anlama yükü (0–1). Ölçüm değil. */
const TASK_LOAD: Record<string, { hiz: number; anlama: number }> = {
  'Uzun paragraf soruları':   { hiz: 1.0, anlama: 1.0 },
  'Sınavda soru kökü okuma':  { hiz: 0.9, anlama: 0.9 },
  'Ders kitabı çalışma':      { hiz: 0.5, anlama: 1.0 },
  'Roman / hikâye okuma':     { hiz: 0.7, anlama: 0.7 },
  'Yönerge takibi':           { hiz: 0.4, anlama: 1.0 },
  'Not alarak okuma':         { hiz: 0.4, anlama: 0.9 },
};

export function buildHizliOkumaDetailedReport(scores: SpeedReadingScores, student: StudentInfo): string {
  const name = safeName(student);
  const wpm = Math.max(0, Math.round(scores.wpm ?? 0));
  const comp = clampPct(scores.comprehensionPct ?? 0);
  const eff = clampPct(scores.effectiveScore ?? 0);
  const correct = Math.max(0, Math.round(scores.correct ?? 0));
  const total = Math.max(0, Math.round(scores.total ?? 0));
  const yanlis = Math.max(0, total - correct);

  const kademe = String(scores.kademe || 'lise');
  const beklenenWpm = EXPECTED_WPM[kademe] ?? 200;
  const hizEkseni = clampPct((wpm / (beklenenWpm * 1.6)) * 100);   // 0–100 ölçeğe indir

  const profil = scores.profile || (
    hizEkseni >= 50 && comp >= 60 ? 'Hızlı & Anlayan Okuyucu'
      : hizEkseni >= 50 ? 'Hızlı Ama Yüzeysel Okuyucu'
      : comp >= 60 ? 'Yavaş Ama Derinlemesine Okuyucu' : 'Destek İhtiyacı Olan Okuyucu'
  );

  const P: string[] = [];

  // ═══ KÜNYE + TEK BAKIŞTA ═══
  P.push(reportHeader('📖 HIZLI OKUMA — DERİNLEMESİNE ANALİZ RAPORU', 'Hızlı Okuma — Hız ve Anlama Analizi', student));
  P.push(statGrid([
    { label: 'Okuma Hızı', value: wpm, unit: ' kel/dk', theme: 'primary', icon: 'trending' },
    { label: 'Anlama', value: comp, unit: '%', theme: comp >= 70 ? 'success' : comp >= 40 ? 'warning' : 'danger', icon: 'book' },
    { label: 'Etkin Okuma', value: eff, unit: '%', theme: 'info', icon: 'award' },
    { label: 'Profil', value: profil.replace(/^[^\wÇĞİÖŞÜçğıöşü]+\s*/, ''), theme: comp >= 60 ? 'success' : 'warning', icon: 'compass' },
  ], 4));
  P.push('---\n');

  // ═══ NE ÖLÇER / NE ÖLÇMEZ ═══
  P.push(`## 🔎 Bu Rapor Neyi Ölçer, Neyi Ölçmez?\n`);
  P.push(
    `Değerlendirme iki şeyi **birlikte** ölçer: **okuma hızı** (dakikada kelime / WPM) ve **anlama düzeyi**. ` +
    `İkisi ayrı ayrı anlamsızdır — asıl bilgi ikisinin birlikte oluşturduğu dengededir.\n`,
  );
  P.push(insight('note', 'Kapsam',
    `**Ölçer:** Tek bir metindeki okuma hızı ve o metni anlama düzeyi.\n\n` +
    `**Ölçmez:** Genel okuma becerisi, okuduğunu anlama yeteneği veya öğrenme güçlüğü.\n\n` +
    `Tek metinlik ölçümdür. Metnin konusu tanıdıksa hız ve anlama yükselir; ` +
    `yabancı bir konuda ikisi de düşebilir. Bu bir **tanı aracı değildir**.`));
  P.push('---\n');

  // ═══ 1. YÖNETİCİ ÖZETİ ═══
  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** okuma hızı **${wpm} kelime/dakika**, anlama düzeyi **%${comp}** ` +
    `(${correct}/${total} doğru), etkin okuma skoru **%${eff}**. ` +
    `${scores.kademLabel ? `${scores.kademLabel} düzeyinde beklenen hız yaklaşık ${beklenenWpm} kel/dk. ` : ''}` +
    `Profil: **${profil}**. ${scores.speedComment || ''}\n`,
  );
  P.push('---\n');

  // ═══ 2. OKUMA PROFİLİ ═══
  P.push(`## 📊 2. Okuma Profili\n`);
  P.push(gauge('Etkin Okuma Skoru', eff, { zones: 'Gelişmeli:0-40,Orta:40-70,Güçlü:70-100', caption: 'Hız ve anlamanın birleşimi' }));
  P.push(barsBlock('Hız ve Anlama (%)', [['Hız (ölçeklenmiş)', hizEkseni], ['Anlama', comp], ['Etkin okuma', eff]]));
  if (total > 0) {
    P.push(donutBlock('Anlama Soruları', [['Doğru', correct], ['Yanlış', yanlis]], `%${comp}`));
  }
  P.push(statGrid([
    { label: 'Metin Uzunluğu', value: scores.wordCount ?? '—', unit: ' kelime', theme: 'info', icon: 'book' },
    { label: 'Okuma Süresi', value: Math.round(scores.readingTimeSeconds ?? 0), unit: ' sn', theme: 'info', icon: 'activity' },
    { label: 'Doğru Yanıt', value: total ? `${correct}/${total}` : '—', theme: comp >= 70 ? 'success' : 'warning', icon: 'award' },
  ]));
  P.push('---\n');

  // ═══ 3. NEDEN — HIZ-ANLAMA TAKASI ═══
  P.push(`## 🧩 3. NEDEN Bu Profil Çıktı? — Hız–Anlama Takası\n`);
  P.push(
    `Okumada hız ve anlama birbiriyle **takas** hâlindedir. Hızı artırmak genelde anlamayı düşürür, ` +
    `yavaşlamak ise anlamayı yükseltir. En iyi okuyucu **en hızlı okuyan değil**, ` +
    `hız ile anlamayı dengede tutabilen okuyucudur.\n\n` +
    `Bu yüzden tek başına "${wpm} kelime/dakika" bir başarı ölçüsü değildir. Asıl soru şudur: ` +
    `**bu hızda okurken ne kadarını anlıyor?**\n`,
  );
  P.push(compareBlock(
    'Hız ve Anlamanın Karşılaştırması',
    [['Denge', hizEkseni, comp]],
    { selfLabel: 'Hız', refLabel: 'Anlama' },
  ));
  if (scores.kademLabel) {
    P.push(compareBlock(
      `Okuma Hızı — ${scores.kademLabel} Düzeyi Beklentisiyle`,
      [['Okuma hızı (kel/dk)', clampPct((wpm / (beklenenWpm * 2)) * 100), clampPct(50)]],
      { selfLabel: `${wpm} kel/dk`, refLabel: `~${beklenenWpm} kel/dk beklenen` },
    ));
  }
  P.push('---\n');

  // ═══ 4. HIZ × ANLAMA KONUMU ═══
  P.push(`## ⚖️ 4. Hız × Anlama Konumu\n`);
  P.push(quadrantBlock(
    'Okuma Profili Haritası',
    hizEkseni, comp,
    'Okuma hızı', 'Anlama',
    ['Destek gerekiyor', 'Hızlı ama yüzeysel', 'Yavaş ama derinlemesine', 'Hızlı ve anlayan'],
    'Sağ üst çeyrek hedeftir. Sol üst köşe sınavda süre sorunu, sağ alt köşe anlama kaybı yaratır.',
  ));
  P.push(insight(
    comp >= 70 && hizEkseni >= 50 ? 'strength' : comp < 40 ? 'action' : 'note',
    `Profil Okuması — ${profil}`,
    comp >= 70 && hizEkseni >= 50
      ? `Hem hız hem anlama iyi durumda (hız ${wpm} kel/dk · anlama %${comp}). ` +
        `Bu tabloda yapılacak şey mevcut dengeyi korumak ve daha zor metinlerle beslemektir.`
      : hizEkseni >= 50 && comp < 60
        ? `Hız yeterli ama anlama geride (hız ${wpm} kel/dk · anlama %${comp}). ` +
          `${name} metni gözüyle tarıyor ama zihninde işlemiyor olabilir. Sınavda karşılığı: paragraf sorusunu okuyup ` +
          `"ne diyordu?" diye geri dönmek. **Yaklaşım: hızı bilinçli düşürmek.** Anlama yükselene kadar yavaşlamak, ` +
          `uzun vadede hem hızı hem anlamayı yükseltir.`
        : comp >= 60 && hizEkseni < 50
          ? `Anlama iyi ama hız düşük (anlama %${comp} · hız ${wpm} kel/dk). ` +
            `${name} okuduğunu iyi anlıyor, ancak sınavda süre sorunu yaşayabilir. ` +
            `**Yaklaşım: anlamayı bozmadan hızı kademeli artırmak** — parmakla takip, geri dönüşleri azaltma, ` +
            `sessiz okuma (içinden seslendirmeyi bırakma).`
          : `Hem hız hem anlama desteğe ihtiyaç duyuyor (hız ${wpm} kel/dk · anlama %${comp}). ` +
            `Bu tabloda **önce anlamadan** başlanması yerinde olur; hız, anlama oturduktan sonra kendiliğinden artar. ` +
            `Kısa ve ilgi çekici metinlerle başlamak direnci azaltır.`));
  P.push('---\n');

  // ═══ 5. NİÇİN — ZİNCİRLER ═══
  P.push(`## 🔗 5. NİÇİN Önemli? — Neden, Etki ve Sonuç\n`);
  P.push(chainBlock('Okuma Profilinin Yansımaları', [
    [`Anlama %${comp}`,
      comp >= 70 ? 'Metni bir okumada kavrayabiliyor olabilir' : 'Metne birden çok kez dönme ihtiyacı olabilir',
      comp >= 70 ? 'Sınavda paragraf sorularında avantajlı olabilir' : 'Sınav süresinin önemli kısmı tekrar okumaya gidebilir'],
    [`Okuma hızı ${wpm} kel/dk`,
      hizEkseni >= 50 ? 'Uzun metinleri süresinde bitirebilir' : 'Uzun metinlerde süre yetmeyebilir',
      hizEkseni >= 50 ? 'Süre baskısı düşük olabilir' : 'Sınav sonunda soru boş kalabilir'],
    ['Okuma, tüm derslerin ortak aracıdır',
      'Matematik problemi de, fen sorusu da önce okunur',
      'Okuma gelişince tek bir ders değil, tüm dersler etkilenir'],
    [comp < 60 ? 'Anlama önceliklendirilirse' : 'Hız kademeli artırılırsa',
      comp < 60 ? 'Zihin metni işlemeye alışır' : 'Anlama korunarak süre kazanılır',
      'Etkin okuma skoru yükselir'],
  ]));
  P.push('---\n');

  // ═══ 6. GÖREV UYUM HARİTASI ═══
  P.push(`## 🗺️ 6. Hangi Görevde Ne Beklenir?\n`);
  P.push(
    `Aşağıdaki tablo, ${tamlayan(name)} hız ve anlama profilini okul görevleriyle birleştirir. ` +
    `Düşük değer başarısızlık değil, **o görevde ek strateji gerekebileceği** anlamına gelir.\n`,
  );
  {
    const rows: [string, number[]][] = Object.keys(TASK_LOAD).map((t) => {
      const w = TASK_LOAD[t];
      return [t, [clampPct(hizEkseni * w.hiz), clampPct(comp * w.anlama)]];
    });
    P.push(heatmapBlock('Görev × Okuma Boyutu', ['Hız', 'Anlama'], rows,
      'Bu tablo bir başarı tahmini değil, performans profilinden türetilmiş bir uyum göstergesidir.'));
    const ranked = rows.map(([t, v]) => [t, Math.min(...v)] as [string, number]).sort((a, b) => a[1] - b[1]);
    P.push(`En çok strateji desteği gerekebilecek görev: **${ranked[0][0].toLocaleLowerCase('tr')}**.\n`);
  }
  P.push('---\n');

  // ═══ 7. DERİN YORUM ═══
  P.push(`## 🧠 7. Derinlemesine Yorum\n`);
  if (scores.speedComment) P.push(insight('note', `Hız: ${scores.speedLabel || ''}`, scores.speedComment));
  P.push(insight(comp >= 70 ? 'strength' : comp >= 40 ? 'note' : 'action',
    `Anlama: ${scores.compLevel || '—'}`,
    comp >= 70
      ? `Anlama düzeyi güçlü (%${comp}). Metni bir okumada kavrayabiliyor olması, tüm derslerde avantaj sağlar.`
      : comp >= 40
        ? `Anlama düzeyi orta (%${comp}). Okuduktan sonra kendi cümleleriyle özetlemek kavramayı yükseltebilir.`
        : `Anlama düzeyi desteğe ihtiyaç duyuyor (%${comp}). Kısa metinlerle, her paragraf sonunda durup özetleyerek çalışmak faydalı olabilir.`));
  P.push(insight('note', `Etkin Okuma: ${scores.effLevel || '—'}`,
    `Etkin okuma skoru (%${eff}), hız ve anlamanın birleşimidir. Tek başına hızdan daha anlamlı bir göstergedir; ` +
    `çünkü anlamadan hızlı okumak zaman kazandırmaz, kaybettirir.`));
  P.push('---\n');

  // ═══ 8. SONUÇ — YOL HARİTASI ═══
  P.push(`## 🎯 8. SONUÇ — Okuma Geliştirme Yol Haritası\n`);
  P.push(timelineBlock(
    comp < 60 ? '8 Haftalık Plan — Önce Anlama' : '8 Haftalık Plan — Anlamayı Koruyarak Hız',
    comp < 60
      ? [
        ['Kısa metinle başla', 'İlgisini çeken 1 sayfalık metinler seçin; uzunluk değil süreklilik önemli.', '1. hafta'],
        ['Paragraf sonu duraklama', 'Her paragraf sonunda durup "ne dedi?" diye kendine sorsun.', '1–2. hafta'],
        ['Kendi cümlesiyle özet', 'Metin bitince 2 cümleyle özetlesin — anlamanın en güçlü testi budur.', '2–3. hafta'],
        ['Bilinmeyen kelime avı', 'Anlamadığı kelimeleri işaretleyip sonra baksın; anlama boşluğu çoğu zaman buradadır.', '3–4. hafta'],
        ['Soru sorarak oku', 'Okumadan önce başlığa bakıp "bu metin neyi anlatacak?" diye tahmin etsin.', '4–5. hafta'],
        ['Metin uzunluğunu artır', 'Anlama %60 üstüne çıkınca metinleri uzatın.', '5–6. hafta'],
        ['Süre tutmaya başla', 'Anlama oturduktan sonra hız ölçümüne geçin.', '6–7. hafta'],
        ['Yeniden ölç', 'Testi tekrar alın; anlama ve hızı karşılaştırın.', '8. hafta'],
      ]
      : [
        ['Mevcut düzeyi sabitle', 'Anlama iyi; önce bunu bozmamak esas.', '1. hafta'],
        ['Parmak/kalem takibi', 'Satırı parmakla takip etmek, göz sıçramalarını düzenler ve hızı artırır.', '1–2. hafta'],
        ['Geri dönüşleri azalt', 'Aynı satıra dönme alışkanlığını fark etsin; ilk okumada kalmayı denesin.', '2–3. hafta'],
        ['İçinden seslendirmeyi bırak', 'Kelimeleri içinden söylemek hızı sınırlar; göz ile okumaya geçiş denenebilir.', '3–4. hafta'],
        ['Süre tutarak oku', 'Aynı uzunlukta metinlerde süreyi haftalık kaydedin.', '4–5. hafta'],
        ['Anlama kontrolü', 'Hız artarken anlama düşüyor mu — her ölçümde 3 soru sorun.', '5–6. hafta'],
        ['Sınav provası', 'Gerçek süreyle paragraf sorusu çözsün.', '6–7. hafta'],
        ['Yeniden ölç', 'Testi tekrar alın; etkin okuma skorunu karşılaştırın.', '8. hafta'],
      ],
  ));
  P.push('---\n');

  // ═══ 9. ÖĞRETMEN KARTI ═══
  P.push(`## 👩‍🏫 9. Öğretmen İçin Hızlı Kart\n`);
  P.push(insight('strength', 'İşe Yarayabilecekler',
    `- Profil: **${profil}**. ${comp < 60 && hizEkseni >= 50 ? 'Hızı bilinçli düşürtmek gerekir; bu öğrenci için "daha hızlı oku" tavsiyesi ters etki yapar.' : comp >= 60 && hizEkseni < 50 ? 'Anlama sağlam; süre stratejisi (kolay soruyu önce çözme) fayda sağlayabilir.' : comp >= 60 ? 'Denge iyi; daha zor metinlerle beslemek gelişimi sürdürür.' : 'Kısa metinlerle ve anlama odaklı başlamak yerinde olur.'}\n` +
    `- Okuma tüm derslerin ortak aracıdır; buradaki gelişim tek bir dersi değil hepsini etkiler.\n` +
    `- Okuduğunu kendi cümleleriyle özetletmek, anlamayı ölçmenin en pratik yoludur.`));
  P.push(insight('risk', 'Dikkat Edilebilecekler',
    `- Tek metinlik ölçümdür; metnin konusu tanıdıksa sonuç yüksek çıkar.\n` +
    (comp < 60 && hizEkseni >= 50 ? `- "Hızlı okuyor" diye olumlu yorumlamak yanıltıcı olur; anlama %${comp}.\n` : '') +
    `- Hız tek başına bir başarı ölçüsü değildir; etkin okuma skoru daha anlamlıdır.\n` +
    `- Sürekli okuma güçlüğü gözleniyorsa (harf karıştırma, satır atlama) uzman değerlendirmesi gerekir.`));
  P.push('---\n');

  // ═══ 10. AİLE ═══
  P.push(`## 👨‍👩‍👦 10. Aile İçin Rehber\n`);
  P.push(
    `- Düzenli okuma alışkanlığı, hız ve anlamayı birlikte geliştiren en güçlü etkendir.\n` +
    `- İlgisini çeken türde kitap seçmesine izin vermek, süreklilik sağlar.\n` +
    `- "Kaç sayfa okudun" yerine "ne anlattı" diye sormak anlamayı besler.\n`,
  );
  P.push(insight('action', 'Küçük Bir Deney',
    `Bu hafta ${yonelme(name)} her akşam 15 dakika okutun. Sonunda tek bir soru sorun: ` +
    `"Bugün okuduğunda seni en çok ne şaşırttı?" Sayfa sayısı sormak yerine içeriği sormak, ` +
    `${belirtme(name)} okurken zihnini açık tutmaya alıştırır.`));
  P.push('---\n');

  // ═══ 11. SINIRLILIKLAR ═══
  P.push(`## 📌 11. Sınırlılıklar ve Doğru Kullanım\n`);
  P.push(insight('note', 'Bu Rapor Nasıl Okunmalı?',
    `- Sonuç **tek bir metne** dayanır; farklı konuda farklı çıkabilir.\n` +
    `- Metnin konusu tanıdıksa hız ve anlama yükselir; yabancı konuda ikisi de düşer.\n` +
    `- Bu test **okuma güçlüğü tanısı koymaz**; tarama aracı bile değildir.\n` +
    `- Hız tek başına anlamlı değildir; etkin okuma skoru esas alınmalıdır.\n` +
    `- Okuma becerisi düzenli pratikle gelişir; sabit bir özellik değildir.`));
  P.push(
    `\n### Kapanış Notu\n` +
    `Okuma, tüm derslerin ortak aracıdır. ${tamlayan(name)} okuma becerisindeki her gelişme ` +
    `tek bir derse değil, öğrenmenin tamamına yansır. Hızdan çok **anlamayı** merkeze alan düzenli pratik, ` +
    `zamanla ikisini birden yükseltir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
