/**
 * Akademik Analiz — DERİNLEMESİNE ANALİZ (deterministik, API'SIZ).
 * Bölüm bazlı performans (%), en güçlü/zayıf, performans–özdeğerlendirme farkı.
 *
 * Bu raporun ayırt edici tarafı: öğrencinin GERÇEK performansı ile KENDİNİ nasıl
 * gördüğü arasındaki fark (öz-algı kalibrasyonu) merkeze alınır. Bu fark, çalışma
 * stratejisini ve motivasyon yaklaşımını doğrudan etkiler.
 */
import { SKILL_LABELS } from './data';
import type { AkademikScores } from '../types';
import {
  clampPct, bar, statGrid, gauge, radarBlock, barsBlock, insight,
  compareBlock, chainBlock, timelineBlock, quadrantBlock, donutBlock, heatmapBlock,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';
import { tamlayan, belirtme, yonelme } from '@/lib/utils/turkish';
import {
  bilimselTemel, ucPencere, gozlemListesi, ilerlemeTakibi,
  sikSorulanlar, gelecekPenceresi, gorusmeSorulari, okumaKilavuzu, butceliEkle,
} from '../../report/common-sections';

/** Baştaki emoji/simgeleri atar. Motor beceri adlarını '📖 Okuma Anlama' gibi
 *  emojili döndürüyor; rapor metninde ve stat kartında tuhaf duruyordu. */
function clean(s: string | undefined | null): string {
  return (s || '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
}

/** Beceri adı — baştaki emoji atılır. */
function label(k: string): string {
  const raw = SKILL_LABELS[k] ?? k.replace(/_/g, ' ');
  return raw.replace(/^[^\p{L}\p{N}]+/u, '').trim();
}

interface Band { risk: '🟢' | '🟡' | '🔴'; label: string; frame: string; }
function perfBand(pct: number): Band {
  const p = clampPct(pct);
  if (p >= 70) return { risk: '🟢', label: 'Güçlü', frame: 'güçlü bir beceri; korunması ve ileri taşınması yerinde olur' };
  if (p >= 50) return { risk: '🟡', label: 'Orta', frame: 'orta düzeyde; hedefli çalışmayla yükseltilebilir' };
  if (p >= 30) return { risk: '🟡', label: 'Gelişime Açık', frame: 'gelişime açık; kademeli destek faydalı olabilir' };
  return { risk: '🔴', label: 'Öncelikli', frame: 'öncelikli bir gelişim alanı; temelden başlamak yerinde olur' };
}

/** Öz-algı tipine göre öğretmene yönelik çerçeve. */
const GAP_LENS: Record<string, { etki: string; sonuc: string; yaklasim: string }> = {
  tutarli: {
    etki: 'Kendi düzeyini gerçekçi değerlendirebiliyor.',
    sonuc: 'Hedef belirlemesi sağlıklı ilerleyebilir.',
    yaklasim: 'Mevcut öz-değerlendirme alışkanlığı desteklenebilir; hedefler öğrenciyle birlikte konulabilir.',
  },
  asiri_ozguvenli: {
    etki: 'Gerçek performansının üzerinde bir öz-algı var; hazırlık süresini olduğundan kısa tahmin edebilir.',
    sonuc: 'Sınav sonuçları beklentisinin altında kalabilir ve motivasyonu ani düşebilir.',
    yaklasim: 'Yargılamadan, somut geri bildirimle çalışmak yerinde olur: deneme sonuçlarını birlikte incelemek farkı görünür kılar.',
  },
  hafif_ozguvenli: {
    etki: 'Kendini bir miktar yüksek değerlendiriyor; küçük bir kalibrasyon sapması var.',
    sonuc: 'Zorlandığı konuları geç fark edebilir.',
    yaklasim: 'Konu sonu kısa öz-testler, farkı erken görmesini sağlayabilir.',
  },
  dusuk_ozguven: {
    etki: 'Gerçek performansının altında bir öz-algı var; başarısını şansa bağlayabilir.',
    sonuc: 'Yapabileceği görevlerden kaçınabilir; potansiyelinin altında kalabilir.',
    yaklasim: 'Somut başarı kanıtlarını görünür kılmak önemlidir: doğru yaptığı işleri adıyla takdir etmek özgüveni besler.',
  },
  hafif_dusuk: {
    etki: 'Kendini bir miktar düşük değerlendiriyor; temkinli bir öz-algısı var.',
    sonuc: 'Zor görevlere başlarken tereddüt edebilir.',
    yaklasim: 'Küçük ve görünür başarılar üzerinden güven inşa etmek faydalı olabilir.',
  },
};

/** Becerilerin ders alanlarına bilinen yükü (0–1). Ölçüm değil; beceri tanımından. */
const SKILL_TO_SUBJECT: Record<string, number> = {};

export function buildAkademikDetailedReport(scores: AkademikScores, student: StudentInfo): string {
  const name = safeName(student);
  const first = name.split(' ')[0] || name;
  const overall = clampPct(scores.overall ?? 0);
  const perf = clampPct(scores.performanceAvg ?? overall);
  const self = clampPct(scores.selfAssessment ?? overall);
  const gap = Math.round(self - perf);
  const gapType = scores.gapType || (Math.abs(gap) <= 10 ? 'tutarli' : gap > 20 ? 'asiri_ozguvenli' : gap > 10 ? 'hafif_ozguvenli' : gap < -20 ? 'dusuk_ozguven' : 'hafif_dusuk');
  const gl = GAP_LENS[gapType] ?? GAP_LENS.tutarli;
  const gapLabelTr = gapType === 'tutarli' ? 'Tutarlı'
    : gapType === 'asiri_ozguvenli' ? 'Yüksek öz-algı'
    : gapType === 'hafif_ozguvenli' ? 'Hafif yüksek'
    : gapType === 'dusuk_ozguven' ? 'Düşük öz-algı' : 'Hafif düşük';

  const sectionList = Object.entries(scores.sections || {})
    .map(([k, v]) => ({ key: k, name: label(k), pct: clampPct(v?.pct ?? 0) }))
    .sort((a, b) => b.pct - a.pct);

  const strongestName = clean(scores.strongest?.name) || sectionList[0]?.name || '—';
  const strongestPct = clampPct(scores.strongest?.pct ?? sectionList[0]?.pct ?? 0);
  const weakestName = clean(scores.weakest?.name) || sectionList[sectionList.length - 1]?.name || '—';
  const weakestPct = clampPct(scores.weakest?.pct ?? sectionList[sectionList.length - 1]?.pct ?? 0);
  const spread = clampPct(strongestPct - weakestPct);

  const strong = sectionList.filter((s) => s.pct >= 60).slice(0, 4);
  const weak = sectionList.filter((s) => s.pct < 50).slice(-4);

  const P: string[] = [];
  void SKILL_TO_SUBJECT;

  // ═══ KÜNYE + TEK BAKIŞTA ═══
  P.push(reportHeader('📚 AKADEMİK ANALİZ — DERİNLEMESİNE RAPOR', `Akademik Beceri Analizi${scores.kademLabel ? ' — ' + scores.kademLabel : ''}`, student));
  P.push(statGrid([
    { label: 'Genel Başarı', value: overall, unit: '%', theme: overall >= 70 ? 'success' : overall >= 50 ? 'warning' : 'danger', icon: 'award' },
    { label: 'Düzey', value: scores.level || '—', theme: 'primary', icon: 'trending' },
    { label: 'En Güçlü Beceri', value: strongestName, theme: 'info', icon: 'star' },
    { label: 'Öz-Algı', value: gapLabelTr, theme: gapType === 'tutarli' ? 'success' : 'warning', icon: 'activity' },
  ], 4));
  P.push('---\n');

  // ═══ NE ÖLÇER / NE ÖLÇMEZ ═══
  P.push(`## 🔎 Bu Rapor Neyi Ölçer, Neyi Ölçmez?\n`);
  P.push(
    `Bu analiz, ${tamlayan(name)} farklı akademik becerilerdeki performansını **ayrı ayrı** inceler. ` +
    `Tek bir not yerine beceri bazında güçlü ve gelişime açık alanları görünür kılar. ` +
    `Ayrıca öğrencinin kendini nasıl değerlendirdiğini ölçüp gerçek performansla karşılaştırır.\n`,
  );
  P.push(insight('note', 'Kapsam',
    `**Ölçer:** Beceri bazında güncel performans ve öz-değerlendirme doğruluğu.\n\n` +
    `**Ölçmez:** Zekâ, potansiyel veya gelecekteki başarı. Karne notunun yerine geçmez.\n\n` +
    `Sonuç **o günkü** performansı yansıtır. Uyku, kaygı ve motivasyon puanları etkileyebilir.`));
  P.push('---\n');

  // ═══ 1. YÖNETİCİ ÖZETİ ═══
  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** genel akademik başarısı **%${overall}** (${scores.level || '—'}) düzeyinde. ${scores.levelDesc || ''} ` +
    `En güçlü beceri **${strongestName} (%${strongestPct})**, en çok gelişime açık beceri **${weakestName} (%${weakestPct})** ` +
    `— aradaki fark ${spread} puan. ` +
    `Öz-değerlendirme tarafında: gerçek performans %${perf}, kendi değerlendirmesi %${self} ` +
    `(${gap >= 0 ? '+' : ''}${gap} puan). ${scores.gapDesc || ''}\n`,
  );
  P.push('---\n');

  // ═══ 2. BECERİ PROFİLİ ═══
  P.push(`## 📊 2. Beceri Profili\n`);
  P.push(gauge('Genel Akademik Başarı', overall, { zones: 'Gelişmeli:0-40,Orta:40-70,Güçlü:70-100', caption: scores.levelDesc || '' }));
  if (sectionList.length >= 3 && sectionList.length <= 8) {
    P.push(radarBlock('Beceri Bazında Başarı (%)', sectionList.map((s) => [s.name, s.pct])));
  } else if (sectionList.length) {
    P.push(barsBlock('Beceri Bazında Başarı (%)', sectionList.slice(0, 6).map((s) => [s.name, s.pct])));
  }
  if (sectionList.length >= 3) {
    P.push(donutBlock('En Güçlü Üç Beceri', sectionList.slice(0, 3).map((s) => [s.name, s.pct]), `%${overall}`));
  }
  if (sectionList.length) {
    P.push(`| Beceri | Başarı | Grafik | Düzey |\n|---|---|---|---|`);
    P.push(sectionList.map((s) => { const b = perfBand(s.pct); return `| ${s.name} | %${s.pct} | ${bar(s.pct)} | ${b.risk} ${b.label} |`; }).join('\n') + '\n');
  }
  P.push('---\n');

  // ═══ 3. NEDEN ═══
  P.push(`## 🧩 3. NEDEN Bu Tablo Çıktı?\n`);
  P.push(
    `Genel başarı, becerilerin ortalamasıdır — ama ortalama tek başına yanıltıcı olabilir. ` +
    `Asıl bilgi, hangi becerinin ortalamanın **üstünde**, hangisinin **altında** kaldığındadır. ` +
    `Aşağıdaki grafik her beceriyi ${tamlayan(name)} kendi genel ortalamasıyla (%${overall}) karşılaştırır.\n`,
  );
  if (sectionList.length) {
    P.push(compareBlock(
      'Beceriler — Kendi Genel Ortalamasıyla Karşılaştırma',
      sectionList.map((s) => [s.name, s.pct, overall] as [string, number, number]),
      { selfLabel: first, refLabel: 'Kendi ortalaması' },
    ));
  }
  P.push(
    spread >= 30
      ? `Beceriler arasında ${spread} puanlık belirgin fark var. Bu, genel notun **profili gizlediği** anlamına gelir: bazı beceriler çok güçlü, bazıları geride. Çalışma planı beceri bazında yapılmalıdır.\n`
      : `Beceriler birbirine yakın (${spread} puan fark). Profil dengeli; genel düzeyi topluca yükseltmeye dönük bir plan işe yarayabilir.\n`,
  );
  P.push('---\n');

  // ═══ 4. ÖZ-ALGI KALİBRASYONU ═══
  P.push(`## 🪞 4. Öz-Algı Kalibrasyonu — Kendini Nasıl Görüyor?\n`);
  P.push(
    `Bu bölüm, bu raporun en pratik parçasıdır. Bir öğrencinin **kendi düzeyini doğru tahmin edebilmesi**, ` +
    `çalışma süresini doğru planlamasının ön koşuludur.\n`,
  );
  P.push(compareBlock(
    'Gerçek Performans ↔ Öz-Değerlendirme',
    [['Genel düzey', self, perf]],
    { selfLabel: 'Kendi değerlendirmesi', refLabel: 'Gerçek performans' },
  ));
  P.push(quadrantBlock(
    'Performans × Öz-Algı Konumu',
    perf, self,
    'Gerçek performans', 'Öz-değerlendirme',
    ['Destek gerekiyor', 'Farkında değil (düşük öz-algı)', 'Gerçekçi olmayan güven', 'Güçlü ve farkında'],
    'Köşegen üzerinde olmak (sağ üst veya sol alt) öz-algının gerçekçi olduğunu gösterir.',
  ));
  P.push(gauge('Öz-Algı Sapması', clampPct(100 - Math.abs(gap) * 2.5), { zones: 'Yüksek sapma:0-40,Orta:40-70,Gerçekçi:70-100', caption: `Fark: ${gap >= 0 ? '+' : ''}${gap} puan` }));
  P.push(insight(
    gapType === 'tutarli' ? 'strength' : Math.abs(gap) > 20 ? 'risk' : 'note',
    `Öz-Değerlendirme Farkı — ${gapLabelTr}`,
    `${scores.gapDesc || ''}\n\n**Ne anlama gelir:** ${gl.etki}\n\n**Neye yol açabilir:** ${gl.sonuc}\n\n**Nasıl yaklaşılabilir:** ${gl.yaklasim}`));
  P.push('---\n');

  // ═══ 5. NİÇİN — ZİNCİRLER ═══
  P.push(`## 🔗 5. NİÇİN Önemli? — Neden, Etki ve Sonuç\n`);
  P.push(chainBlock('Akademik Profilin Yansımaları', [
    [`${strongestName} güçlü (%${strongestPct})`, 'İlgili görevlerde daha az zorlanabilir; bu beceri bir giriş kapısı olarak kullanılabilir', 'Zor konulara bu beceriden başlamak direnci azaltabilir'],
    [`${weakestName} geride (%${weakestPct})`, perfBand(weakestPct).frame, 'Kademeli ve temelden çalışma planı gerekebilir'],
    [`Öz-algı: ${gapLabelTr} (${gap >= 0 ? '+' : ''}${gap} puan)`, gl.etki, gl.sonuc],
    [
      spread >= 30 ? `Beceriler arası fark yüksek (${spread} puan)` : `Beceriler dengeli (${spread} puan)`,
      spread >= 30 ? 'Tek bir genel not, gerçek durumu gizleyebilir' : 'Genel not profili büyük ölçüde temsil ediyor',
      spread >= 30 ? 'Beceri bazlı hedef koymak gerekir' : 'Topluca yükseltmeye dönük plan işe yarayabilir',
    ],
  ]));
  P.push('---\n');

  // ═══ 6. ÖNCELİK HARİTASI ═══
  P.push(`## 🗺️ 6. Öncelik Haritası\n`);
  P.push(
    `Aşağıdaki tablo her beceriyi iki açıdan gösterir: **mevcut düzey** ve **öncelik payı** ` +
    `(ortalamanın ne kadar altında kaldığı). Yüksek öncelik, o beceriye önce eğilmenin ` +
    `genel başarıyı en hızlı yükseltebileceği anlamına gelir.\n`,
  );
  if (sectionList.length) {
    const rows: [string, number[]][] = sectionList.map((s) => [
      s.name,
      [s.pct, clampPct(Math.max(0, overall - s.pct) * 3)],
    ]);
    P.push(heatmapBlock('Beceri × Mevcut Düzey ve Öncelik', ['Mevcut düzey', 'Öncelik payı'], rows,
      'Öncelik payı, becerinin kendi genel ortalamasının ne kadar altında kaldığından türetilir.'));
    const pri = sectionList.filter((s) => s.pct < overall).sort((a, b) => a.pct - b.pct)[0];
    P.push(pri
      ? `İlk odaklanılabilecek beceri: **${pri.name} (%${pri.pct})** — genel ortalamanın ${clampPct(overall - pri.pct)} puan altında.\n`
      : `Tüm beceriler genel ortalamanın üzerinde veya ona yakın. Dengeli bir profil.\n`);
  }
  P.push('---\n');

  // ═══ 7. GÜÇLÜ VE GELİŞİM ALANLARI ═══
  P.push(`## 🧠 7. Güçlü ve Gelişim Alanları\n`);
  if (strong.length) P.push(insight('strength', 'Güçlü Beceriler', strong.map((s) => `• ${s.name} (%${s.pct}) — ${perfBand(s.pct).frame}`).join('\n')));
  if (weak.length) P.push(insight('action', 'Öncelikli Gelişim Alanları', weak.map((s) => `• ${s.name} (%${s.pct}) — ${perfBand(s.pct).frame}`).join('\n')));
  if (!strong.length && !weak.length) P.push(insight('note', 'Dengeli Profil', 'Beceriler birbirine yakın; belirgin bir uç yok. Genel düzeyi topluca yükseltmek verimli olabilir.'));
  P.push('---\n');

  // ═══ 8. SONUÇ — YOL HARİTASI ═══
  P.push(`## 🎯 8. SONUÇ — Çalışma Yol Haritası\n`);
  {
    const focus = weak.length ? weak : sectionList.slice(-2);
    const f0 = focus[0]?.name || weakestName;
    const f1 = focus[1]?.name || '';
    P.push(timelineBlock('Beceri Odaklı 8 Haftalık Plan', [
      ['Sonucu birlikte okuyun', `${belirtme(name)} beceri kırılımını gösterin; hangi sonuca şaşırdığını sorun.`, '1. hafta'],
      [`Öncelikli beceri: ${f0}`, 'Temel kavramları gözden geçirin; kolay örneklerle başlayın.', '1–2. hafta'],
      ['Hata defteri kur', 'Yanlışları tek bir deftere yazsın; haftada bir tekrar etsin.', '2–3. hafta'],
      ['Ara ölçüm yap', 'Aynı beceriden kısa bir test; fark görünür olsun.', '3–4. hafta'],
      [f1 ? `İkinci beceri: ${f1}` : 'İkinci alana geç', 'Aynı yöntemi ikinci gelişim alanına uygulayın.', '4–5. hafta'],
      ['Güçlü beceriyi koru', `${strongestName} alanında düzeyini koruyacak kısa tekrarlar yapsın.`, '5–6. hafta'],
      [gapType === 'tutarli' ? 'Hedefleri birlikte koy' : 'Öz-algıyı kalibre et',
        gapType === 'tutarli' ? 'Öz-değerlendirmesi gerçekçi; hedefleri kendisi koyabilir.' : gl.yaklasim, '6–7. hafta'],
      ['Değerlendir ve sabitle', 'Ne değişti, hangi yöntem işe yaradı — birlikte konuşun.', '8. hafta'],
    ]));
    focus.forEach((s, i) => {
      P.push(`**📌 Öncelik ${i + 1}: ${s.name} (%${s.pct})**\n- Temel kavramları gözden geçirmek faydalı olabilir.\n- Bol ve kademeli örnek çözmek beceriyi pekiştirebilir.\n- Hataları not edip tekrar etmek kalıcılığı artırabilir.\n`);
    });
  }
  P.push('---\n');

  // ═══ 9. ÖĞRETMEN KARTI ═══
  P.push(`## 👩‍🏫 9. Öğretmen İçin Hızlı Kart\n`);
  P.push(insight('strength', 'İşe Yarayabilecekler',
    `- Giriş kapısı: **${strongestName} (%${strongestPct})** — zor konulara bu güçlü beceriden başlamak direnci azaltabilir.\n` +
    `- Öncelik: **${weakestName} (%${weakestPct})** — küçük, düzenli ve kademeli çalışma fark yaratabilir.\n` +
    `- Güçlü becerileri adıyla takdir etmek motivasyonu besler.`));
  P.push(insight('risk', 'Dikkat Edilebilecekler',
    `- Öz-algı durumu: **${gapLabelTr}**. ${gl.yaklasim}\n` +
    (spread >= 30 ? `- Beceriler arası ${spread} puanlık fark var; tek bir genel not bu tabloyu gizler.\n` : '') +
    `- Sonuç o günkü performansı yansıtır; tek ölçümle kalıcı yargıya varmamak gerekir.`));
  P.push('---\n');

  // ═══ 10. AİLE ═══
  P.push(`## 👨‍👩‍👦 10. Aile İçin Rehber\n`);
  P.push(
    `- En çok gelişime açık beceriye (**${weakestName}**) küçük ve düzenli çalışmalarla odaklanmak fark yaratabilir.\n` +
    `- Güçlü becerileri fark ettirmek ve takdir etmek motivasyonu besler.\n` +
    `- Genel not yerine beceri bazında konuşmak, "başarısız" etiketinden uzaklaştırır.\n`,
  );
  P.push(insight('action', 'Küçük Bir Deney',
    gapType === 'dusuk_ozguven' || gapType === 'hafif_dusuk'
      ? `Bir sınav öncesi ${yonelme(name)} "kaç alacaksın sence?" diye sorun, sonucu birlikte karşılaştırın. ` +
        `Tahmininden yüksek aldığını görmek, özgüvenini somut kanıtla besleyebilir.`
      : `Bir sınav öncesi ${yonelme(name)} "kaç alacaksın sence?" diye sorun, sonucu birlikte karşılaştırın. ` +
        `Bu küçük alışkanlık, kendi düzeyini daha gerçekçi tahmin etmesini sağlar.`));
  P.push('---\n');

  // ═══ 11. SINIRLILIKLAR ═══
  P.push(`## 📌 11. Sınırlılıklar ve Doğru Kullanım\n`);
  P.push(insight('note', 'Bu Rapor Nasıl Okunmalı?',
    `- Sonuç **tek bir ölçüme** dayanır; uyku, kaygı ve motivasyon puanları etkileyebilir.\n` +
    `- Karne notunun veya öğretmen gözleminin yerine geçmez; onları tamamlar.\n` +
    `- Düşük beceri "yeteneksizlik" değil, **henüz çalışılmamış alan** anlamına gelebilir.\n` +
    `- Öz-algı farkı bir kişilik özelliği değil, geri bildirimle değişebilen bir alışkanlıktır.\n` +
    `- Bu rapor tanı aracı değildir; öğrenme güçlüğü şüphesinde uzman değerlendirmesi gerekir.`));
  P.push(
    `\n### Kapanış Notu\n` +
    `Akademik beceriler hedefli ve düzenli çalışmayla gelişir. ${name} için güçlü alanları koruyan, ` +
    `gelişim alanlarına odaklanan ve öz-algıyı gerçekçi tutan bir plan, zamanla genel başarıyı yükseltebilir. 🌱\n`,
  );
  // ── Ortak zenginleştirme (hedef ~18.000 karakter) ──
  const kapanis = P.pop() || '';
  P.push(...butceliEkle(P.join('\n'), [
    () => ucPencere({ ad: name, anaBulgu: `genel başarı %${overall}, öz-algı ${gapLabelTr.toLocaleLowerCase('tr')} (${gap >= 0 ? '+' : ''}${gap} puan)`,
      ogretmen: { yarin: [`Zor konuya en güçlü beceriden (${strongestName.toLocaleLowerCase('tr')}) girin; direnç azalır.`,
          `Öncelik: ${weakestName.toLocaleLowerCase('tr')}. Küçük ve kademeli adımlarla başlayın.`,
          gapType === 'tutarli' ? 'Hedefleri onunla birlikte koyun; öz-değerlendirmesi gerçekçi.' : gl.yaklasim],
        kacin: ['Tek bir genel notla konuşmak; beceriler arası fark bu notta gizlenir.', 'Tek ölçümle kalıcı yargıya varmak.'] },
      veli: { buHafta: [`Bir sınav öncesi "kaç alacaksın sence?" diye sorun, sonucu birlikte karşılaştırın.`,
          'Genel not yerine beceri adıyla konuşun ("okuma anlaman iyi" gibi).', 'Doğru yaptığı işleri adıyla takdir edin.'],
        kacin: ['"Başarısız" etiketi; beceri bazlı tablo bunu çürütür.', 'Kardeş/arkadaş karşılaştırması.'] },
      ogrenci: { deneyebilir: ['Sınav öncesi kendine bir tahmin ver, sonra karşılaştır.', 'Yanlışlarını tek deftere yaz, haftada bir tekrar et.', 'En zorlandığın beceriden günde 15 dakika çalış.'],
        hatirlat: 'Genel not seni anlatmaz. Hangi beceride nerede olduğunu bilmek, çalışmayı kolaylaştırır.' } }),
    () => gozlemListesi({ ad: name,
      destekleyen: [gap <= -15 ? 'Bildiği konularda bile emin olamıyor, sık soruyor.' : gap >= 20 ? 'Hazırlık süresini olduğundan kısa tahmin ediyor.' : 'Kendi düzeyini gerçekçi tahmin ediyor.',
        `${weakestName} gerektiren görevlerde belirgin zorlanıyor.`, 'Sınav sonuçları beceri dağılımıyla uyumlu.'],
      celisen: ['Derste güçlü görünen beceride testte düşük çıkmış.', 'Test günü isteksiz veya yorgundu.', 'Sonuçlar karne notlarıyla belirgin çelişiyor.'] }),
    () => ilerlemeTakibi({ ad: name,
      hafta4: `${weakestName} becerisinde kısa bir ara ölçüm yapın; fark var mı?`,
      hafta8: 'Hata defteri düzenli tutuluyor mu, tekrar ediliyor mu?',
      hafta12: 'Testi tekrar alın; beceri dağılımını ve öz-algı farkını karşılaştırın.',
      olcut: gapType === 'tutarli'
        ? `**${weakestName} yüzdesi.** Bugün %${weakestPct}. Bu tek sayının yükselmesi genel başarıyı da yukarı çeker.`
        : `**Tahmin ile sonuç arasındaki fark.** Bugün ${gap >= 0 ? '+' : ''}${gap} puan. Bu fark sıfıra yaklaşıyorsa öz-algı kalibre oluyor demektir.` }),
    () => sikSorulanlar({ ad: name, sorular: [
      ['Bu sonuç karne notunun yerine mi geçer?', 'Hayır. Karne notunu tamamlar. Karne genel bir sonuç verir; bu rapor hangi becerinin nerede olduğunu gösterir.'],
      ['Düşük çıkan beceri yetenek eksikliği mi?', 'Genelde hayır. Çoğu zaman "henüz yeterince çalışılmamış alan" anlamına gelir. Hedefli çalışmayla belirgin gelişir.'],
      ['Öz-algı farkı neden önemli?', 'Kendi düzeyini doğru tahmin edebilen öğrenci, çalışma süresini doğru planlar. Fark büyükse ya yetersiz hazırlanır ya da potansiyelinin altında kalır.'] ] }),
    () => gorusmeSorulari({ ad: name,
      acilis: ['Hangi derste kendini rahat hissediyorsun?', 'Sınav sonucunu görmeden önce kaç alacağını tahmin ediyor musun?', 'En çok hangi konuda zorlandığını biliyor musun?'],
      derinlestiren: ['Bir konuyu anlamadığını nasıl fark ediyorsun?', 'Yanlışlarına sonradan bakıyor musun?', 'Tahminin ile sonucun genelde tutuyor mu?'],
      kapanis: ['Bu hafta bir sınav öncesi tahmin yazmayı denemek ister misin?', 'Hata defteri tutmayı dener misin?', 'Bir ay sonra karşılaştıralım mı?'] }),
    () => okumaKilavuzu({ ad: name,
      anaMesaj: `Bu raporun tek mesajı: **genel not profili gizler**. ${tamlayan(name)} güçlü ve gelişime açık becerileri ayrı ayrı görülmeli; çalışma planı beceri bazında yapılmalı.`,
      yanlisOkumalar: [['"Genel not düşük, başarısız."', 'Beceriler arasında büyük fark olabilir. Bazıları güçlü, bazıları geride — plan buna göre yapılır.'],
        ['"Düşük beceri = yeteneksizlik."', 'Genelde çalışılmamış alan demektir. Hedefli çalışmayla gelişir.'],
        ['"Tek ölçüm kesin sonuç."', 'O günkü performansı yansıtır; uyku, kaygı ve motivasyon etkiler.'],
        ['"Öz-algı farkı kişilik özelliği."', 'Geri bildirimle değişebilen bir alışkanlıktır.'] ] }),
    () => gelecekPenceresi({ ad: name,
      guclu: ['Kendi düzeyini gerçekçi değerlendirebilmek, üniversite ve iş hayatında en değerli becerilerden biridir.', `${strongestName} gücü, ilgili alanlarda doğrudan avantaj sağlar.`],
      gelistirilecek: ['Zayıf beceriyi erken desteklemek, ileride birikmiş açık oluşmasını önler.', 'Öz-değerlendirme alışkanlığı, hayat boyu öğrenmenin temelidir.'] }),
    () => bilimselTemel({ modelAdi: 'Beceri bazlı akademik değerlendirme + öz-algı kalibrasyonu',
      gelistiren: 'biçimlendirici değerlendirme (formative assessment) ve üstbiliş araştırmaları geleneği',
      nedirTekCumle: 'Akademik performansı beceri bazında ölçer ve öğrencinin kendi düzeyini ne kadar doğru tahmin ettiğini karşılaştırır.',
      neyeDayanir: 'Beceri alanlarına göre gruplanmış sorular ile öğrencinin kendi düzeyine ilişkin beyanı.',
      kanitDurumu: 'Öz-değerlendirme doğruluğu (kalibrasyon) ile akademik başarı arasındaki ilişki üstbiliş araştırmalarında iyi belgelenmiştir.',
      siniri: 'Tek ölçüme dayanır; uyku, kaygı ve motivasyon sonucu etkiler. Karne notunun yerine geçmez, onu tamamlar.' }),
  ]));
  P.push(kapanis);
  P.push(reportFooter());
  return P.join('\n');
}
