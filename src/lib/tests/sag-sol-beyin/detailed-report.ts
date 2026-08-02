/**
 * Sağ-Sol Beyin Baskınlığı — DERİNLEMESİNE ANALİZ (deterministik, API'SIZ).
 * dominant: sag | sol | dengeli. İyi/kötü yok; farklı düşünme stilleri.
 *
 * Rapor omurgası: Künye → Tek Bakışta → Ne ölçer/ölçmez → Yönetici özeti
 *   → Profil haritası → NEDEN → Denge analizi → NİÇİN (zincirler)
 *   → Ders alanı uyumu → Derin yorum → SONUÇ (plan) → Öğretmen → Aile
 *   → Kariyer → Sınırlılıklar
 */
import { SAG_SOL_BEYIN_DATA } from './data';
import type { SagSolBeyinScores } from '../types';
import {
  clampPct, statGrid, gauge, barsBlock, insight,
  compareBlock, chainBlock, timelineBlock, quadrantBlock, donutBlock, heatmapBlock,
  reportHeader, reportFooter, safeName, ogrenciIpucu, type StudentInfo,
} from '../../report/report-blocks';
import { tamlayan, belirtme, yonelme, ucuncuSahis } from '@/lib/utils/turkish';
import {
  bilimselTemel, ucPencere, gozlemListesi, akademikYansima,
  ilerlemeTakibi, sikSorulanlar, gelecekPenceresi, gorusmeSorulari, okumaKilavuzu, butceliEkle,
} from '../../report/common-sections';

/** Ders alanlarının sol/sağ düşünme yüküne dair sabit ağırlıklar (0–1). Ölçüm değil. */
const SUBJECT_LOAD: Record<string, { sol: number; sag: number }> = {
  'Matematik':            { sol: 1.0, sag: 0.4 },
  'Fen / Fizik':          { sol: 0.9, sag: 0.5 },
  'Türkçe / Edebiyat':    { sol: 0.6, sag: 0.9 },
  'Sosyal / Tarih':       { sol: 0.7, sag: 0.7 },
  'Yabancı dil':          { sol: 0.8, sag: 0.6 },
  'Görsel sanat / Müzik': { sol: 0.3, sag: 1.0 },
};

const LENS = {
  sol: {
    classroom: 'Adım adım ilerleyen anlatımı iyi takip eder; kural ve formül netliğinden hoşlanır.',
    exam: 'Sistemli tekrar ve soru çözümü işine yarayabilir; açık uçlu yorum sorularında zorlanabilir.',
    risk: 'Belirsiz ya da serbest formatlı görevlerde başlangıç yapmakta gecikebilir.',
    social: 'Tartışmada mantık kurgusuna odaklanır; duygusal tonu ikinci planda bırakabilir.',
  },
  sag: {
    classroom: 'Büyük resmi hızlı yakalar; ayrıntılı sıralı yönergelerde dikkati dağılabilir.',
    exam: 'Görselleştirme ve hikâyeleştirme kalıcılığı artırabilir; süre yönetimi zorlayabilir.',
    risk: 'Planlama ve teslim tarihi takibinde desteğe ihtiyaç duyabilir.',
    social: 'Empati kurması güçlü olabilir; grup içinde fikir üretiminde öne çıkar.',
  },
  dengeli: {
    classroom: 'Hem sıralı hem bütüncül anlatıma uyum sağlayabilir.',
    exam: 'Farklı soru tiplerine esnek yaklaşabilir; yöntem seçiminde kararsızlık yaşayabilir.',
    risk: 'Net bir yöntem tercihi olmadığı için dağınık çalışabilir; yapı kurmak faydalı olur.',
    social: 'Farklı düşünme biçimleri arasında köprü kurabilir.',
  },
} as const;

export function buildSagSolBeyinDetailedReport(scores: SagSolBeyinScores, student: StudentInfo): string {
  const name = safeName(student);
  const first = name.split(' ')[0] || name;
  const sol = clampPct(scores.solYuzde ?? 0);
  const sag = clampPct(scores.sagYuzde ?? 0);
  const dom = (scores.dominant || (sol > sag ? 'sol' : sag > sol ? 'sag' : 'dengeli')) as 'sol' | 'sag' | 'dengeli';
  const d = SAG_SOL_BEYIN_DATA[dom];
  const lens = LENS[dom] ?? LENS.dengeli;

  const fark = Math.abs(sol - sag);
  const denge = clampPct(100 - fark * 2);   // iki yarım birbirine yakınsa yüksek
  const other = dom === 'sol' ? SAG_SOL_BEYIN_DATA.sag : dom === 'sag' ? SAG_SOL_BEYIN_DATA.sol : SAG_SOL_BEYIN_DATA.dengeli;

  // Alt kırılım (varsa): sözel bölüm ve görsel bölüm ayrı ayrı sol eğilimi
  const textSol = scores.textSol != null ? clampPct(scores.textSol) : null;
  const visualSol = scores.visualSol != null ? clampPct(scores.visualSol) : null;

  const P: string[] = [];

  // ═══ KÜNYE + TEK BAKIŞTA ═══
  P.push(reportHeader('🧠 SAĞ-SOL BEYİN BASKINLIĞI — DERİNLEMESİNE ANALİZ RAPORU', 'Beyin Baskınlığı ve Düşünme Stili Analizi', student));
  P.push(statGrid([
    { label: 'Baskın Yön', value: d.title, theme: 'success', icon: 'brain' },
    { label: 'Sol (Analitik)', value: sol, unit: '%', theme: 'info', icon: 'activity' },
    { label: 'Sağ (Yaratıcı)', value: sag, unit: '%', theme: 'primary', icon: 'sparkles' },
    { label: 'Denge', value: denge, unit: '%', theme: denge >= 60 ? 'success' : 'warning', icon: 'compass' },
  ], 4));
  P.push('---\n');

  // ═══ NE ÖLÇER / NE ÖLÇMEZ ═══
  P.push(`## 🔎 Bu Rapor Neyi Ölçer, Neyi Ölçmez?\n`);
  P.push(
    `Sol yarımküre genelde **mantık, analiz ve sıralı düşünme** ile; sağ yarımküre ise ` +
    `**yaratıcılık, sezgi ve bütüncül düşünme** ile ilişkilendirilir. Bu rapor, ` +
    `${tamlayan(name)} hangi düşünme yaklaşımını daha çok tercih ettiğini gösterir.\n`,
  );
  P.push(insight('note', 'Bilimsel Çerçeve — Önemli',
    `**Ölçer:** Tercih edilen düşünme yaklaşımı (analitik mi, bütüncül mü).\n\n` +
    `**Ölçmez:** Beyin aktivitesi, zekâ veya yetenek.\n\n` +
    `"Sol beyinli / sağ beyinli insan" ayrımı bir **benzetmedir**. Sinirbilimde iki yarımküre ` +
    `neredeyse her işte birlikte çalışır. Bu rapor bir beyin ölçümü değil, ` +
    `**düşünme tarzı haritasıdır** — ve bu hâliyle çalışma yöntemi seçmekte işe yarar.`));
  P.push('---\n');

  // ═══ 1. YÖNETİCİ ÖZETİ ═══
  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** düşünme stili **${d.title.toLocaleLowerCase('tr')}** yönünde eğilim gösteriyor ` +
    `(Sol %${sol} · Sağ %${sag}, fark ${fark} puan). ${ucuncuSahis(d.description)} ` +
    `${dom === 'dengeli'
      ? 'Dengeli profil, her iki stili de esnekçe kullanabildiğine işaret edebilir. '
      : denge >= 60
        ? 'Eğilim belirgin ama uçlarda değil; diğer stili de kullanabiliyor olabilir. '
        : 'Eğilim belirgin; bu stili çalışma yönteminin merkezine almak verimi artırabilir. '}\n`,
  );
  P.push('---\n');

  // ═══ 2. PROFİL HARİTASI ═══
  P.push(`## 📊 2. Profil Haritası\n`);
  P.push(donutBlock('Yarımküre Dağılımı', [['Sol Beyin (Analitik)', sol], ['Sağ Beyin (Yaratıcı)', sag]], d.title.split(' ')[0]));
  P.push(gauge('Sağ Beyin Eğilimi', sag, { zones: 'Sol Baskın:0-40,Dengeli:40-60,Sağ Baskın:60-100', caption: `Sol %${sol} · Sağ %${sag}` }));
  P.push(barsBlock('Yarımküre Dağılımı (%)', [['Sol Beyin (Analitik)', sol], ['Sağ Beyin (Yaratıcı)', sag]]));
  P.push('---\n');

  // ═══ 3. NEDEN ═══
  P.push(`## 🧩 3. NEDEN Böyle Bir Sonuç Çıktı?\n`);
  P.push(
    `Testteki sorular iki tip seçenek sunar: biri sıralı-analitik, diğeri bütüncül-sezgisel yaklaşımı temsil eder. ` +
    `${tamlayan(name)} seçimleri **${dom === 'sol' ? 'analitik' : dom === 'sag' ? 'bütüncül' : 'her iki'}** yönde ` +
    `${dom === 'dengeli' ? 'dengeli dağıldığı' : 'yoğunlaştığı'} için bu sonuç oluştu.\n`,
  );
  P.push(compareBlock(
    'Yarımküre Payları — Tam Dengeyle Karşılaştırma',
    [['Sol Beyin (Analitik)', sol, 50], ['Sağ Beyin (Yaratıcı)', sag, 50]],
    { selfLabel: first, refLabel: 'Tam denge' },
  ));
  if (textSol != null && visualSol != null) {
    P.push(`### Alt Kırılım — Sözel ve Görsel Bölümler\n`);
    P.push(
      `Test iki bölümden oluşur. Aşağıdaki karşılaştırma, ${tamlayan(name)} eğiliminin ` +
      `**her iki bölümde de tutarlı olup olmadığını** gösterir.\n`,
    );
    P.push(compareBlock(
      'Sol Beyin Eğilimi — Bölüm Bazında',
      [['Sözel bölüm', textSol, 50], ['Görsel bölüm', visualSol, 50]],
      { selfLabel: 'Sol eğilim', refLabel: 'Tam denge' },
    ));
    const tutarli = Math.abs(textSol - visualSol) <= 20;
    P.push(
      tutarli
        ? `İki bölüm birbirine yakın (fark ${Math.abs(textSol - visualSol)} puan). Eğilim **tutarlı** görünüyor; sonuç güvenilir okunabilir.\n`
        : `İki bölüm arasında ${Math.abs(textSol - visualSol)} puanlık fark var. Eğilim **bağlama göre değişiyor** olabilir — ` +
          `${textSol > visualSol ? 'sözel görevlerde daha analitik, görsel görevlerde daha bütüncül' : 'görsel görevlerde daha analitik, sözel görevlerde daha bütüncül'} bir yaklaşım söz konusu olabilir. Bu, esnekliğin göstergesi de olabilir.\n`,
    );
  }
  P.push('---\n');

  // ═══ 4. DENGE ANALİZİ ═══
  P.push(`## ⚖️ 4. Denge Analizi\n`);
  P.push(quadrantBlock(
    'Analitik × Yaratıcı Konumu',
    sol, sag,
    'Analitik güç', 'Yaratıcı güç',
    ['Gelişmekte', 'Analitik odaklı', 'Yaratıcı odaklı', 'Çift yönlü güçlü'],
    'Konum bir sıralama değildir; hangi yaklaşımın daha erişilebilir olduğunu gösterir.',
  ));
  P.push(gauge('Denge Skoru', denge, { zones: 'Belirgin eğilim:0-40,Orta:40-65,Dengeli:65-100', caption: 'İki stil arasındaki yakınlık' }));
  P.push('---\n');

  // ═══ 5. NİÇİN — ZİNCİRLER ═══
  P.push(`## 🔗 5. NİÇİN Önemli? — Neden, Etki ve Sonuç\n`);
  P.push(chainBlock('Düşünme Stilinin Yansımaları', [
    [`${d.title} eğilimi (Sol %${sol} · Sağ %${sag})`, lens.classroom, 'Uygun anlatım biçiminde kavrama hızlanabilir'],
    ['Sınav ve ödev davranışı', lens.exam, 'Hazırlık yöntemi buna göre seçilirse verim artabilir'],
    ['Zorlanabileceği durum', lens.risk, 'Öğretmen bu noktada ek yapı sunabilir'],
    ['Grup ve sınıf içi etkileşim', lens.social, 'Rol dağılımı bu güce göre yapılabilir'],
  ]));
  P.push('---\n');

  // ═══ 6. DERS ALANI UYUMU ═══
  P.push(`## 🗺️ 6. Ders Alanlarına Uyum Haritası\n`);
  P.push(
    `Aşağıdaki tablo, ${tamlayan(name)} düşünme eğilimi ile ders alanlarının bilinen düşünme yükünü birleştirir. ` +
    `Yüksek değer, o alanın mevcut eğilimle **daha kolay eşleşebileceğini** gösterir. Düşük değer başarısızlık değil, ` +
    `**ek strateji gerekebileceği** anlamına gelir.\n`,
  );
  {
    const subjects = Object.keys(SUBJECT_LOAD);
    const rows: [string, number[]][] = subjects.map((s) => [
      s,
      [clampPct(sol * SUBJECT_LOAD[s].sol * 1.6), clampPct(sag * SUBJECT_LOAD[s].sag * 1.6)],
    ]);
    P.push(heatmapBlock('Ders Alanı × Düşünme Stili Uyumu', ['Analitik yol', 'Yaratıcı yol'], rows,
      'Bu tablo bir başarı tahmini değil, yöntem seçimine yardımcı bir uyum göstergesidir.'));
    const best = rows.map(([s, v]) => [s, Math.max(...v)] as [string, number]).sort((a, b) => b[1] - a[1])[0];
    const low = rows.map(([s, v]) => [s, Math.max(...v)] as [string, number]).sort((a, b) => a[1] - b[1])[0];
    P.push(`En yüksek uyum **${best[0].toLocaleLowerCase('tr')}** alanında. En çok strateji desteği gerekebilecek alan: **${low[0].toLocaleLowerCase('tr')}**.\n`);
  }
  P.push('---\n');

  // ═══ 7. DERİN YORUM ═══
  P.push(`## 🧠 7. Düşünme Stilinin Derinlemesine Yorumu — ${d.title}\n`);
  // SAG_SOL_BEYIN_DATA açıklamaları öğrenciye 2. tekil şahısla yazılmıştır;
  // öğretmen raporunun 3. şahıs anlatımına ham karışmasın diye etiketli alıntı.
  P.push(`> **Öğrenciye anlatım:** "${d.description}"\n`);
  P.push(`**Sınıfta nasıl görünür:** ${lens.classroom}\n`);
  P.push(`**Sınav ve ödevde:** ${lens.exam}\n`);
  P.push(insight('strength', 'Güçlü Yönler', d.strengths.map((s) => `• ${ucuncuSahis(s)}`).join('\n')));
  P.push(insight('action', 'Gelişim Alanları', d.developmentAreas.map((s) => `• ${ucuncuSahis(s)}`).join('\n')));
  P.push('---\n');

  // ═══ 8. SONUÇ — YOL HARİTASI ═══
  P.push(`## 🎯 8. SONUÇ — Uygulama Yol Haritası\n`);
  P.push(timelineBlock(`${d.title} Eğilimine Uygun 8 Haftalık Plan`, [
    ['Mevcut yöntemi konuş', `${name} şu an nasıl çalışıyor — birlikte yazın.`, '1. hafta'],
    ['Güçlü yönü merkeze al', ogrenciIpucu(d.studyTips[0]), '1–2. hafta'],
    ['Tek derste dene', 'En zorlandığı derste bu yöntemi uygulayın.', '2–3. hafta'],
    ['Sonucu ölç', 'Aynı konuda öncesi/sonrası farkı konuşun.', '3. hafta'],
    ['İkinci yöntemi ekle', ogrenciIpucu(d.studyTips[1] ?? d.studyTips[0]), '4–5. hafta'],
    ['Diğer stili besle', `${other.title} tarafını geliştiren bir etkinlik — ${ogrenciIpucu(other.studyTips[0], 'öneri')}`, '5–6. hafta'],
    ['Sınav provası', lens.exam, '6–7. hafta'],
    ['Rutine dönüştür', 'İşe yarayan yöntemleri haftalık plana sabitleyin.', '8. hafta'],
  ]));
  P.push('---\n');

  // ═══ 9. ÖĞRETMEN KARTI ═══
  P.push(`## 👩‍🏫 9. Öğretmen İçin Hızlı Kart\n`);
  P.push(insight('strength', 'İşe Yarayabilecekler',
    `- ${yonelme(name)} anlatırken ${dom === 'sol' ? 'adım adım yapı ve net kurallar' : dom === 'sag' ? 'büyük resim, görsel ve hikâye' : 'hem yapı hem büyük resim'} sunmak kavramayı kolaylaştırabilir.\n` +
    `- ${ogrenciIpucu(d.studyTips[0])}\n` +
    `- Güçlü yönü: ${d.strengths[0].toLocaleLowerCase('tr')} — sınıf içi rol dağılımında bundan yararlanılabilir.`));
  P.push(insight('risk', 'Dikkat Edilebilecekler',
    `- ${lens.risk}\n` +
    `- Gelişim alanı: ${d.developmentAreas[0].toLocaleLowerCase('tr')}\n` +
    `- Bu sonuç bir etiket değildir; ${name} diğer düşünme stilini de geliştirebilir.`));
  P.push('---\n');

  // ═══ 10. AİLE ═══
  P.push(`## 👨‍👩‍👦 10. Aile İçin Rehber\n`);
  P.push(`${tamlayan(name)} doğal düşünme stilini desteklemek öğrenmeyi kolaylaştırabilir. Diğer yarımküreyi besleyen etkinlikler ise dengeyi güçlendirir.\n`);
  P.push(`### Evde Denenebilecekler\n${d.studyTips.slice(0, 4).map((t) => `- ${ogrenciIpucu(t, 'öneri')}`).join('\n')}\n`);
  P.push(insight('action', 'Küçük Bir Deney',
    `Bir hafta boyunca ödevlerini ${dom === 'sol' ? 'önce plan çıkararak' : 'önce görselleştirerek'} yaptırın. ` +
    `Sonunda ${belirtme(name)} sorun: "Böyle daha kolay mı geldi?" Cevap, yöntemi birlikte seçmenizi sağlar.`));
  P.push('---\n');

  // ═══ 11. KARİYER ═══
  P.push(`## 🧭 11. İlgi ve Kariyer Penceresi\n`);
  P.push(insight('note', 'İlişkili Alanlar', d.careerAreas.join(' · ')));
  P.push(
    `Bu alanlar bir yönlendirme değil, sohbet başlatıcıdır. Meslek seçimi; ilgi, yetenek, değerler ve koşullar ` +
    `birlikte değerlendirilerek yapılır. Holland (RIASEC) ve Çoklu Zekâ sonuçlarıyla birlikte okunması daha sağlıklı olur.\n`,
  );
  P.push('---\n');

  // ═══ 12. SINIRLILIKLAR ═══
  P.push(`## 📌 12. Sınırlılıklar ve Doğru Kullanım\n`);
  P.push(insight('note', 'Bu Rapor Nasıl Okunmalı?',
    `- Sonuç ${tamlayan(name)} kendi beyanına dayanır; ruh hâli cevapları etkileyebilir.\n` +
    `- Yarımküre baskınlığı bir benzetmedir; kesin bir nöroloji bulgusu değildir.\n` +
    `- Düşünme stili sabit değildir; desteklenen taraf zamanla güçlenir.\n` +
    `- Bu rapor tanı aracı değildir; öğrenme güçlüğü şüphesinde uzman değerlendirmesi gerekir.`));
  P.push(
    `\n### Kapanış Notu\n` +
    `Düşünme stili bir sınır değil, bir başlangıç noktasıdır. ${name} her iki yaklaşımı da zamanla geliştirebilir; ` +
    `güçlü yönü merkeze alan bir plan en verimli sonucu getirebilir. 🌱\n`,
  );
  // ── Ortak zenginleştirme (hedef ~18.000 karakter) ──
  const kapanis = P.pop() || '';
  P.push(...butceliEkle(P.join('\n'), [
    () => ucPencere({
      ad: name,
      anaBulgu: `düşünme stili ${d.title.toLocaleLowerCase('tr')} yönünde (Sol %${sol} · Sağ %${sag})`,
      ogretmen: {
        yarin: [
          dom === 'sol' ? 'Yeni konuya kural ve adım listesiyle girin; büyük resmi sonra verin.'
            : dom === 'sag' ? 'Yeni konuya büyük resimle girin; ayrıntıyı sonra ekleyin.'
            : 'Aynı konuyu hem adım listesiyle hem görsel özetle sunun; ikisine de uyum sağlıyor.',
          'Ödev yönergesini iki biçimde verin: maddeler hâlinde ve tek cümlelik özet olarak.',
          'Grup çalışmasında rolü bu güce göre dağıtın.',
        ],
        kacin: [
          'Bu sonucu sabit bir etiket gibi kullanmak; düşünme stili gelişir.',
          '"Sağ beyinli/sol beyinli" ayrımını nöroloji bulgusu gibi sunmak.',
        ],
      },
      veli: {
        buHafta: [
          dom === 'sol' ? 'Ödeve başlamadan önce yapılacakları maddeleyerek yazmasını önerin.' : 'Ödeve başlamadan konuyu tek cümleyle anlatmasını isteyin.',
          'Çalışma düzenini onun tercih ettiği biçimde kurmasına izin verin.',
          'Diğer tarafı besleyen bir etkinlik ekleyin (bulmaca, çizim, müzik).',
        ],
        kacin: ['Kendi çalışma tarzınızı dayatmak.', 'Sonucu bir kapasite ölçüsü gibi anlamak.'],
      },
      ogrenci: {
        deneyebilir: [
          dom === 'sol' ? 'Konuya başlarken önce adımları yaz, sonra çöz.' : 'Konuya başlarken önce şema çiz, sonra ayrıntıya in.',
          'Zorlandığın derste diğer yöntemi de bir kez dene.',
          'Hangi yöntemin işe yaradığını not et.',
        ],
        hatirlat: 'Bu bir kapasite ölçüsü değil, tercih haritası. İki yaklaşımı da öğrenebilirsin.',
      },
    }),
    () => gozlemListesi({
      ad: name,
      destekleyen: [
        dom === 'sol' ? 'Adım adım anlatımı rahat takip ediyor; serbest ödevde başlamakta gecikiyor.' : 'Büyük resmi hızlı yakalıyor; sıralı yönergede takılıyor.',
        'Not tutma biçimi bu eğilimi yansıtıyor (liste mi, şema mı).',
        'Problem çözerken önce plan mı yapıyor, önce deniyor mu.',
      ],
      celisen: [
        'Derse göre yaklaşımı belirgin değişiyor.',
        'Sevdiği konuda tam tersi biçimde çalışıyor.',
        'Zaman baskısı altında farklı davranıyor.',
      ],
    }),
    () => akademikYansima({
      ad: name,
      dersler: [
        ['Matematik', clampPct(sol * 1.6), 'Kural ve işlem sırası analitik yaklaşımla eşleşir.'],
        ['Fen Bilimleri', clampPct(sol * 1.3 + sag * 0.5), 'Hem kural hem model kurma gerektirir.'],
        ['Türkçe / Edebiyat', clampPct(sag * 1.4 + sol * 0.4), 'Yorum ve bütüncül okuma öne çıkar.'],
        ['Görsel sanatlar / Müzik', clampPct(sag * 1.7), 'Bütüncül ve sezgisel yaklaşımla eşleşir.'],
        ['Sosyal / Tarih', clampPct(sol * 0.8 + sag * 0.9), 'Kronoloji ile bağlam birlikte gerekir.'],
      ],
    }),
    () => ilerlemeTakibi({
      ad: name,
      hafta4: 'Yeni yöntemi denediği derste ödeve başlama süresi kısaldı mı?',
      hafta8: 'Kendi yöntemini kendisi seçip uygulayabiliyor mu?',
      hafta12: 'Zorlandığı derste yaklaşımını değiştirebiliyor mu?',
      olcut: '**Ödeve başlama süresi.** Masaya oturduktan kaç dakika sonra gerçekten başlıyor? Bu süre kısalıyorsa yöntem oturuyor demektir.',
    }),
    () => sikSorulanlar({
      ad: name,
      sorular: [
        ['Sağ beyin / sol beyin ayrımı gerçek mi?',
         'Bir benzetmedir. Sinirbilimde iki yarımküre neredeyse her işte birlikte çalışır. Bu rapor beyin ölçümü değil, tercih edilen düşünme yaklaşımının haritasıdır — ve bu hâliyle yöntem seçmekte işe yarar.'],
        ['Diğer tarafı geliştirebilir miyiz?',
         'Evet. Az kullanılan yaklaşım, o tarzı gerektiren etkinliklerle desteklenerek güçlenir. Amaç birini bırakmak değil, ikisini de kullanabilmektir.'],
        ['Bu sonuç meslek seçimini belirler mi?',
         'Hayır. Yalnızca hangi ortamda daha rahat çalışılabileceğine dair ipucu verir. Meslek seçimi ilgi, yetenek ve değerlerle birlikte konuşulur.'],
      ],
    }),
    () => gorusmeSorulari({
      ad: name,
      acilis: ['Yeni bir konuya başlarken önce ne yaparsın?', 'Hangi ders sana daha kolay geliyor, neden?', 'Ödeve başlamak mı zor, bitirmek mi?'],
      derinlestiren: ['Bir problemi çözerken önce plan mı yaparsın, hemen mi denersin?', 'Not tutarken liste mi yazarsın, şema mı çizersin?', 'Serbest ödev mi kolay, kurallı ödev mi?'],
      kapanis: ['Bu hafta zorlandığın derste farklı bir yöntem denemek ister misin?', 'Hangi yöntemin işe yaradığını not eder misin?', 'Bir hafta sonra karşılaştıralım mı?'],
    }),
    () => okumaKilavuzu({
      ad: name,
      anaMesaj: `Bu raporun tek mesajı: bu bir **kapasite ölçüsü değil, tercih haritasıdır**. ${tamlayan(name)} doğal yaklaşımını bilmek, hangi yöntemle çalışacağını seçmesini kolaylaştırır.`,
      yanlisOkumalar: [
        ['"Sağ beyinli, sayısal olamaz."', 'Düşünme stili ders başarısını belirlemez. Yalnızca hangi yolun daha rahat geldiğini gösterir.'],
        ['"Bu bir beyin taraması."', 'Değildir. Öz-beyana dayanan bir tercih ölçümüdür; nörolojik bulgu içermez.'],
        ['"Zayıf taraf geliştirilemez."', 'Geliştirilir. Desteklenen taraf zamanla güçlenir.'],
        ['"Sonuç kesin ve kalıcı."', 'Düşünme stili yaşla ve deneyimle değişir.'],
      ],
    }),
    () => gelecekPenceresi({
      ad: name,
      guclu: [
        dom === 'sol' ? 'Sistemli düşünme; mühendislik, hukuk, finans gibi alanlarda doğrudan avantajdır.'
          : dom === 'sag' ? 'Bütüncül ve yaratıcı düşünme; tasarım, iletişim, girişimcilik gibi alanlarda öne çıkar.'
          : 'İki yaklaşımı da kullanabilmek, ekip içinde köprü rolü oynamayı kolaylaştırır.',
        'Kendi düşünme tarzını bilmek, iş hayatında doğru rolü seçmeyi kolaylaştırır.',
      ],
      gelistirilecek: ['Az kullanılan yaklaşımı desteklemek, esnekliği artırır.', 'Farklı düşünen insanlarla çalışma pratiği, uzun vadede en değerli beceridir.'],
      alanlar: d.careerAreas,
    }),
    () => bilimselTemel({
      modelAdi: 'Yarımküre baskınlığı (düşünme stili) yaklaşımı',
      gelistiren: 'Roger Sperry\'nin yarımküre çalışmalarından esinlenen eğitim modelleri',
      nedirTekCumle: 'Analitik-sıralı düşünme ile bütüncül-sezgisel düşünme arasındaki tercihi inceler.',
      neyeDayanir: 'Öğrencinin kendi beyanına dayalı tercih ifadeleri; sözel ve görsel olmak üzere iki bölümde ölçülür.',
      kanitDurumu: 'Eğitimde yaygın kullanılan bir çerçevedir. Ancak sinirbilim açısından "sol beyinli / sağ beyinli insan" ayrımı bir basitleştirmedir; iki yarımküre neredeyse her işte birlikte çalışır.',
      siniri: 'Beyin aktivitesi ölçmez. Tercih edilen düşünme yaklaşımının haritasıdır; bu hâliyle yöntem seçmekte yararlıdır.',
    }),
  ]));
  P.push(kapanis);
  P.push(reportFooter());
  return P.join('\n');
}
