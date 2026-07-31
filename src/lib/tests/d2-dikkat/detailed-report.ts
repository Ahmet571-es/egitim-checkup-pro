/**
 * D2 Dikkat Testi — DERİNLEMESİNE ANALİZ (deterministik, API'SIZ).
 *
 * Performans metriği: konsantrasyon (CP), hız/doğruluk dengesi, tutarlılık.
 * Öz-beyan değil, GÖZLENEN performanstır — bu yüzden yorum dili de farklıdır.
 *
 * Ayırt edici okuma: iki hata türü ayrı ayrı anlamlıdır —
 *   E1 (atlama)         : hedefi görememe → tarama hızı / dikkat kayması
 *   E2 (yanlış işaretleme): hedef olmayanı işaretleme → acelecilik / dürtüsellik
 * İkisi farklı müdahale gerektirir.
 */
import {
  clampPct, statGrid, gauge, barsBlock, insight,
  compareBlock, chainBlock, timelineBlock, quadrantBlock, donutBlock, heatmapBlock,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';
import { tamlayan, belirtme, yonelme } from '@/lib/utils/turkish';

interface D2Result {
  cpPct?: number; hitRate?: number; errorPct?: number;
  TN?: number; E?: number; E1?: number; E2?: number;
  TN_E?: number; FR?: number;
  totalTargets?: number; totalCorrect?: number;
  level?: string; levelDesc?: string;
  balance?: string; balanceDesc?: string;
  consistency?: string; consistencyDesc?: string;
  rowPerformances?: number[];
}

/** Dikkat performansının sınıf içi görevlere yansıması (0–1). Ölçüm değil. */
const TASK_LOAD: Record<string, { hiz: number; dogruluk: number; sureklilik: number }> = {
  'Uzun sınav (2+ ders saati)': { hiz: 0.6, dogruluk: 0.8, sureklilik: 1.0 },
  'Test çözme / optik form':    { hiz: 1.0, dogruluk: 1.0, sureklilik: 0.6 },
  'Uzun metin okuma':           { hiz: 0.5, dogruluk: 0.7, sureklilik: 1.0 },
  'Ders anlatımını takip':      { hiz: 0.4, dogruluk: 0.5, sureklilik: 1.0 },
  'Hesaplama / işlem':          { hiz: 0.7, dogruluk: 1.0, sureklilik: 0.7 },
  'Yazım / imla kontrolü':      { hiz: 0.5, dogruluk: 1.0, sureklilik: 0.6 },
};

export function buildD2DikkatDetailedReport(scores: D2Result, student: StudentInfo): string {
  const name = safeName(student);
  const first = name.split(' ')[0] || name;
  const cp = clampPct(scores.cpPct ?? 0);
  const hit = clampPct(scores.hitRate ?? 0);
  const err = clampPct(scores.errorPct ?? 0);

  const e1 = Math.max(0, Math.round(scores.E1 ?? 0));   // atlama
  const e2 = Math.max(0, Math.round(scores.E2 ?? 0));   // yanlış işaretleme
  const eTot = e1 + e2;
  const hataTipi = eTot === 0 ? 'Hata yok'
    : e1 > e2 * 1.5 ? 'Atlama ağırlıklı'
    : e2 > e1 * 1.5 ? 'Acelecilik ağırlıklı' : 'Karma';

  // Hız ve doğruluk eksenleri (0–100)
  const dogruluk = clampPct(hit);
  const hiz = clampPct(Math.min(100, ((scores.TN ?? 0) / Math.max(1, scores.totalTargets ?? 1)) * 55));

  // Dikkat sürekliliği — satır bazlı performans zaman serisi
  const rows = Array.isArray(scores.rowPerformances) ? scores.rowPerformances.filter((x) => Number.isFinite(x)) : [];
  const half = Math.floor(rows.length / 2);
  const ilkYari = half > 0 ? clampPct(rows.slice(0, half).reduce((a, b) => a + b, 0) / half) : 0;
  const sonYari = half > 0 ? clampPct(rows.slice(half).reduce((a, b) => a + b, 0) / (rows.length - half)) : 0;
  const dusus = ilkYari - sonYari;

  const P: string[] = [];

  // ═══ KÜNYE + TEK BAKIŞTA ═══
  P.push(reportHeader('🎯 D2 DİKKAT TESTİ — DERİNLEMESİNE ANALİZ RAPORU', 'D2 — Dikkat ve Konsantrasyon Analizi', student));
  P.push(statGrid([
    { label: 'Dikkat Düzeyi', value: scores.level || '—', theme: cp >= 70 ? 'success' : cp >= 40 ? 'warning' : 'danger', icon: 'target' },
    { label: 'Konsantrasyon', value: cp, unit: '%', theme: 'primary', icon: 'brain' },
    { label: 'Hata Tipi', value: hataTipi, theme: eTot === 0 ? 'success' : 'info', icon: 'activity' },
    { label: 'Tutarlılık', value: scores.consistency || '—', theme: 'info', icon: 'compass' },
  ], 4));
  P.push('---\n');

  // ═══ NE ÖLÇER / NE ÖLÇMEZ ═══
  P.push(`## 🔎 Bu Rapor Neyi Ölçer, Neyi Ölçmez?\n`);
  P.push(
    `D2 Dikkat Testi **seçici dikkati** ve **konsantrasyon sürekliliğini** ölçer: ` +
    `belirli hedefleri, benzer uyaranlar arasından hızlı ve doğru seçebilme becerisi. ` +
    `Diğer testlerden farklı olarak bu bir **öz-beyan değil, gözlenen performanstır**.\n`,
  );
  P.push(insight('note', 'Kapsam — Önemli',
    `**Ölçer:** O oturumdaki seçici dikkat, tarama hızı ve doğruluk dengesi.\n\n` +
    `**Ölçmez:** Dikkat eksikliği, hiperaktivite veya herhangi bir nörogelişimsel durum.\n\n` +
    `Bu test bir **tanı aracı değildir**. Tek oturumluk performans; uyku, açlık, motivasyon ve ` +
    `günün saati sonucu belirgin şekilde etkiler. DEHB şüphesi yalnızca uzman değerlendirmesiyle ele alınır.`));
  P.push('---\n');

  // ═══ 1. YÖNETİCİ ÖZETİ ═══
  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** dikkat performansı **${scores.level || '—'}** düzeyinde görünüyor. ${scores.levelDesc || ''} ` +
    `Konsantrasyon oranı %${cp}, doğru işaretleme %${hit}, hata oranı %${err}. ` +
    `${eTot > 0 ? `Hatalar **${hataTipi.toLocaleLowerCase('tr')}** (atlama ${e1}, acele ${e2}). ` : 'Hata görülmedi. '}` +
    `${rows.length ? `Dikkat sürekliliği açısından: ilk yarı %${ilkYari}, son yarı %${sonYari}. ` : ''}` +
    `İşaretleme dengesi ${scores.balance ? `"${scores.balance.toLocaleLowerCase('tr')}"` : '—'}, ` +
    `satırlar arası tutarlılık ${scores.consistency ? `"${scores.consistency.toLocaleLowerCase('tr')}"` : '—'}.\n`,
  );
  P.push('---\n');

  // ═══ 2. PROFİL ═══
  P.push(`## 📊 2. Dikkat Profili\n`);
  P.push(gauge('Konsantrasyon Performansı', cp, { zones: 'Düşük:0-40,Orta:40-70,Yüksek:70-100', caption: scores.levelDesc || 'Yüksek bölge güçlü odaklanmayı gösterir' }));
  P.push(donutBlock('İşaretleme Dağılımı', [
    ['Doğru işaretleme', Math.max(0, Math.round(scores.totalCorrect ?? 0))],
    ['Atlama (E1)', e1],
    ['Yanlış işaretleme (E2)', e2],
  ], `%${cp}`));
  P.push(barsBlock('Hız-Doğruluk Dağılımı (%)', [['Doğru İşaretleme', hit], ['Hata Oranı', err]]));
  P.push(statGrid([
    { label: 'İşlenen Uyaran', value: scores.TN ?? '—', theme: 'info', icon: 'activity' },
    { label: 'Toplam Hata', value: scores.E ?? eTot, theme: err >= 20 ? 'warning' : 'success', icon: 'target' },
    { label: 'Doğru Hedef', value: scores.totalCorrect ?? '—', theme: 'success', icon: 'award' },
  ]));
  P.push('---\n');

  // ═══ 3. NEDEN — HATA TÜRÜ AYRIMI ═══
  P.push(`## 🧩 3. NEDEN Bu Sonuç Çıktı? — İki Hata Türü\n`);
  P.push(
    `Dikkat testinde iki farklı hata yapılır ve **ikisi tamamen farklı şey anlatır**:\n\n` +
    `- **Atlama (E1):** Hedefi görüp işaretlememek. Tarama hızının yüksekliğine veya dikkatin kaymasına işaret edebilir.\n` +
    `- **Yanlış işaretleme (E2):** Hedef olmayanı işaretlemek. Acele karar vermeye veya kontrol etmeden ilerlemeye işaret edebilir.\n\n` +
    `Genel "hata oranı" bu ikisini birleştirdiği için yanıltıcı olabilir. Ayrıştırdığımızda ${tamlayan(name)} tablosu şöyle:\n`,
  );
  P.push(compareBlock(
    'Hata Türlerinin Dağılımı',
    [['Atlama (E1)', clampPct(eTot ? (e1 / eTot) * 100 : 0), clampPct(eTot ? (e2 / eTot) * 100 : 0)]],
    { selfLabel: 'Atlama', refLabel: 'Acelecilik' },
  ));
  P.push(insight(
    eTot === 0 ? 'strength' : hataTipi === 'Acelecilik ağırlıklı' ? 'action' : 'note',
    `Hata Örüntüsü — ${hataTipi}`,
    eTot === 0
      ? 'Bu oturumda hata görülmedi. Hem tarama hem kontrol tarafı sağlam çalışmış görünüyor.'
      : hataTipi === 'Atlama ağırlıklı'
        ? `Hatalar ağırlıklı olarak **atlama** (${e1} atlama / ${e2} acele). ${name} hızlı tarıyor ama bazı hedefleri gözden kaçırıyor olabilir. ` +
          `Sınavda karşılığı: soruyu okurken bir şıkkı veya bir kelimeyi atlamak. Yaklaşım: hızı biraz düşürüp **parmakla/kalemle takip** ederek okuma denenebilir.`
        : hataTipi === 'Acelecilik ağırlıklı'
          ? `Hatalar ağırlıklı olarak **acelecilik** (${e2} acele / ${e1} atlama). ${name} karar vermeden önce yeterince kontrol etmiyor olabilir. ` +
            `Sınavda karşılığı: şıkları okumadan ilk uyana işaretlemek. Yaklaşım: **"işaretlemeden önce bir kez daha bak"** kuralı denenebilir.`
          : `Hatalar iki türe dengeli dağılmış (atlama ${e1}, acele ${e2}). Genel bir dikkat dalgalanması söz konusu olabilir; ` +
            `mola düzeni ve çalışma saati seçimi işe yarayabilir.`));
  P.push('---\n');

  // ═══ 4. HIZ × DOĞRULUK ═══
  P.push(`## ⚖️ 4. Hız × Doğruluk Dengesi\n`);
  P.push(
    `Dikkat performansında hız ve doğruluk birbirini dengeler. İkisinden birini abartmak diğerini düşürür. ` +
    `${tamlayan(name)} konumu:\n`,
  );
  P.push(quadrantBlock(
    'Hız × Doğruluk Konumu',
    hiz, dogruluk,
    'Tarama hızı', 'Doğruluk',
    ['Gelişmekte', 'Hızlı ama hatalı', 'Yavaş ama dikkatli', 'Hızlı ve doğru'],
    'Sağ üst çeyrek hedeftir. Sol üst (yavaş ama dikkatli) sınavda süre sorunu yaratabilir.',
  ));
  if (scores.balanceDesc) P.push(insight('note', `İşaretleme Dengesi: ${scores.balance || ''}`, scores.balanceDesc));
  P.push('---\n');

  // ═══ 5. DİKKAT SÜREKLİLİĞİ ═══
  if (rows.length >= 4) {
    P.push(`## 📉 5. Dikkat Sürekliliği — Zamanla Ne Oldu?\n`);
    P.push(
      `Dikkat testinin en değerli bilgisi tek bir puan değil, **performansın zaman içindeki seyridir**. ` +
      `Aşağıdaki grafik her satırdaki performansı sırasıyla gösterir.\n`,
    );
    P.push(barsBlock('Satır Bazında Performans (%)', rows.map((v, i) => [`${i + 1}. satır`, clampPct(v)] as [string, number])));
    P.push(compareBlock(
      'İlk Yarı ↔ Son Yarı',
      [['Ortalama performans', sonYari, ilkYari]],
      { selfLabel: 'Son yarı', refLabel: 'İlk yarı' },
    ));
    P.push(insight(
      dusus >= 15 ? 'risk' : dusus <= -10 ? 'strength' : 'note',
      dusus >= 15 ? 'Dikkat Yorgunluğu Gözleniyor' : dusus <= -10 ? 'Isınma Etkisi' : 'Süreklilik Korunuyor',
      dusus >= 15
        ? `Son yarıda performans ${Math.round(dusus)} puan düştü (%${ilkYari} → %${sonYari}). ` +
          `${name} dikkatini uzun süre korumakta zorlanıyor olabilir. Sınavda karşılığı: son sorularda hata artışı. ` +
          `Yaklaşım: uzun sınavlarda 15–20 dakikada bir 20 saniyelik göz dinlendirme; çalışmayı kısa bloklara bölmek.`
        : dusus <= -10
          ? `Son yarıda performans ${Math.abs(Math.round(dusus))} puan **yükseldi** (%${ilkYari} → %${sonYari}). ` +
            `Isınma süresine ihtiyaç duyuyor olabilir. Sınavda karşılığı: ilk sorularda tereddüt. ` +
            `Yaklaşım: sınav öncesi 2–3 kolay soruyla ısınmak faydalı olabilir.`
          : `Performans test boyunca dengeli seyretti (%${ilkYari} → %${sonYari}). ` +
            `Dikkat sürekliliği bu oturumda korunmuş görünüyor.`));
    if (scores.consistencyDesc) P.push(insight('note', `Tutarlılık: ${scores.consistency || ''}`, scores.consistencyDesc));
    P.push('---\n');
  } else if (scores.consistencyDesc) {
    P.push(`## 📉 5. Dikkat Sürekliliği\n`);
    P.push(insight('note', `Tutarlılık: ${scores.consistency || ''}`, scores.consistencyDesc));
    P.push('---\n');
  }

  // ═══ 6. NİÇİN — ZİNCİRLER ═══
  P.push(`## 🔗 6. NİÇİN Önemli? — Neden, Etki ve Sonuç\n`);
  P.push(chainBlock('Dikkat Performansının Sınıfa Yansıması', [
    [`Konsantrasyon %${cp} (${scores.level || '—'})`,
      cp >= 70 ? 'Uzun görevlerde odağını koruyabiliyor olabilir' : 'Uzun görevlerde odak kayması yaşanabilir',
      cp >= 70 ? 'Uzun sınavlarda avantajlı olabilir' : 'Kısa bloklu çalışma daha verimli olabilir'],
    [eTot === 0 ? 'Hata görülmedi' : `Hata örüntüsü: ${hataTipi}`,
      hataTipi === 'Acelecilik ağırlıklı' ? 'Kontrol etmeden ilerleme eğilimi olabilir' : hataTipi === 'Atlama ağırlıklı' ? 'Hızlı tarama sırasında ayrıntı kaçabilir' : 'Genel dikkat dalgalanması olabilir',
      hataTipi === 'Acelecilik ağırlıklı' ? '"Bir kez daha bak" kuralı hatayı azaltabilir' : 'Takip ederek okuma hatayı azaltabilir'],
    [rows.length >= 4 ? (dusus >= 15 ? 'Son yarıda performans düştü' : 'Performans dengeli seyretti') : `Tutarlılık: ${scores.consistency || '—'}`,
      dusus >= 15 ? 'Dikkat süresi sınırlı olabilir' : 'Dikkat süresi görev boyunca korunabiliyor',
      dusus >= 15 ? 'Uzun sınavlarda mola stratejisi gerekebilir' : 'Uzun görevler planlanabilir'],
    ['Uyku ve günün saati',
      'Dikkat performansı bu iki etkene çok duyarlıdır',
      'Dikkat gerektiren görevleri zinde saatlere almak fark yaratabilir'],
  ]));
  P.push('---\n');

  // ═══ 7. GÖREV UYUM HARİTASI ═══
  P.push(`## 🗺️ 7. Hangi Görevde Ne Beklenir?\n`);
  P.push(
    `Aşağıdaki tablo, ${tamlayan(name)} hız / doğruluk / süreklilik profilini okul görevleriyle birleştirir. ` +
    `Düşük değer başarısızlık değil, **o görevde ek strateji gerekebileceği** anlamına gelir.\n`,
  );
  {
    const sureklilik = rows.length >= 4 ? clampPct(100 - Math.max(0, dusus) * 3) : cp;
    const rows2: [string, number[]][] = Object.keys(TASK_LOAD).map((t) => {
      const w = TASK_LOAD[t];
      return [t, [clampPct(hiz * w.hiz), clampPct(dogruluk * w.dogruluk), clampPct(sureklilik * w.sureklilik)]];
    });
    P.push(heatmapBlock('Görev × Dikkat Boyutu', ['Hız', 'Doğruluk', 'Süreklilik'], rows2,
      'Bu tablo bir başarı tahmini değil, performans profilinden türetilmiş bir uyum göstergesidir.'));
    const ranked = rows2.map(([t, v]) => [t, Math.min(...v)] as [string, number]).sort((a, b) => a[1] - b[1]);
    P.push(`En çok strateji desteği gerekebilecek görev: **${ranked[0][0].toLocaleLowerCase('tr')}**.\n`);
  }
  P.push('---\n');

  // ═══ 8. SONUÇ — YOL HARİTASI ═══
  P.push(`## 🎯 8. SONUÇ — Dikkat Geliştirme Yol Haritası\n`);
  P.push(insight(cp >= 70 ? 'strength' : cp >= 40 ? 'note' : 'action', `Dikkat Düzeyi: ${scores.level || '—'}`, scores.levelDesc || 'Dikkat performansı değerlendirildi.'));
  P.push(timelineBlock('8 Haftalık Dikkat Planı', [
    ['Zinde saati bulun', 'Bir hafta boyunca günün hangi saatinde daha odaklı olduğunu not edin.', '1. hafta'],
    ['Çalışmayı bloklara böl', 'Pomodoro: 25 dakika çalışma, 5 dakika mola.', '1–2. hafta'],
    [hataTipi === 'Acelecilik ağırlıklı' ? '"Bir kez daha bak" kuralı' : 'Takip ederek okuma',
      hataTipi === 'Acelecilik ağırlıklı' ? 'İşaretlemeden önce şıkları bir kez daha okusun.' : 'Kalemle satır takip ederek okusun; atlama azalır.', '2–3. hafta'],
    ['Dikkat dağıtıcıları kaldır', 'Telefon başka odada, masa sade — en hızlı sonuç veren tek değişiklik.', '3–4. hafta'],
    [dusus >= 15 ? 'Mola stratejisi kur' : 'Blok süresini uzat',
      dusus >= 15 ? 'Uzun sınavda 15–20 dakikada bir 20 saniye göz dinlendirme provası yapın.' : 'Çalışma bloğunu 25 dakikadan 35 dakikaya çıkarmayı deneyin.', '4–5. hafta'],
    ['Dikkat oyunları', 'Günde 10–15 dakika: sudoku, farkı bul, satranç.', '5–6. hafta'],
    ['Sınav provası', 'Gerçek süreyle deneme çözsün; son sorulardaki hata sayısını sayın.', '6–7. hafta'],
    ['Değerlendir', 'Ne değişti — hata sayısı ve odak süresi karşılaştırın.', '8. hafta'],
  ]));
  P.push(`**Genel destekleyiciler:** yeterli uyku, düzenli mola, dikkat gerektiren görevleri zinde saatlere almak.\n`);
  P.push('---\n');

  // ═══ 9. ÖĞRETMEN KARTI ═══
  P.push(`## 👩‍🏫 9. Öğretmen İçin Hızlı Kart\n`);
  P.push(insight('strength', 'İşe Yarayabilecekler',
    `- Hata tipi: **${hataTipi}**. ${hataTipi === 'Acelecilik ağırlıklı' ? 'Kontrol alışkanlığı kazandırmak (işaretlemeden önce tekrar okuma) hatayı hızla azaltabilir.' : hataTipi === 'Atlama ağırlıklı' ? 'Kalemle takip ederek okuma, atlamayı belirgin azaltabilir.' : 'Mola düzeni ve çalışma saati seçimi işe yarayabilir.'}\n` +
    (dusus >= 15 ? `- Son yarıda ${Math.round(dusus)} puanlık düşüş var. Uzun sınavlarda ara vermek performansı koruyabilir.\n` : `- Dikkat sürekliliği korunuyor; uzun görevler planlanabilir.\n`) +
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
    `Dikkat, kas gibi çalıştırıldıkça güçlenir. ${name} için düzenli ve keyifli dikkat pratikleri, ` +
    `uygun çalışma düzeniyle birleştiğinde zamanla belirgin gelişim getirebilir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
