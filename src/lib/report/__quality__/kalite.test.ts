import { describe, it } from 'vitest';
import { buildDeterministicReport } from '@/lib/report/detailed-report-router';
import { calculateSagSolBeyin } from '@/lib/tests/sag-sol-beyin/engine';
import { calculateVark } from '@/lib/tests/vark/engine';
import { calculateHolland } from '@/lib/tests/holland/engine';
import { calculateEnneagram } from '@/lib/tests/enneagram/engine';
import { calculateCokluZekaLise } from '@/lib/tests/coklu-zeka/engine';
import { calculateSinavKaygisi } from '@/lib/tests/sinav-kaygisi/engine';
import { calculateCalismaDavranisi } from '@/lib/tests/calisma-davranisi/engine';
import { calculateAkademik } from '@/lib/tests/akademik-analiz/engine';
import { generateD2Test, calculateD2, D2_CONFIG } from '@/lib/tests/d2-dikkat/engine';
import { generateBurdonTest, calculateBurdon } from '@/lib/tests/burdon-dikkat/engine';
import { calculateSpeedReading, getPassageForGrade } from '@/lib/tests/hizli-okuma/engine';
import { SAG_SOL_BEYIN_QUESTIONS } from '@/lib/tests/sag-sol-beyin/data';
import { VARK_QUESTIONS } from '@/lib/tests/vark/data';
import { HOLLAND_QUESTIONS } from '@/lib/tests/holland/data';
import { ENNEAGRAM_QUESTIONS } from '@/lib/tests/enneagram/data';
import { COKLU_ZEKA_QUESTIONS_LISE } from '@/lib/tests/coklu-zeka/data';
import { SINAV_KAYGISI_QUESTIONS } from '@/lib/tests/sinav-kaygisi/data';
import { CALISMA_DAVRANISI_QUESTIONS } from '@/lib/tests/calisma-davranisi/data';

const st: any = { studentName: 'Kasım Eser', studentGrade: 11, studentAge: 14 };
function rng(s0:number){let s=s0;return()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};}
function ch(qs:any[],sd:number,ls:string[]){const r=rng(sd);const o:any={};for(const q of qs)o[String(q.id)]=ls[Math.floor(r()*ls.length)];return o;}
function lk(qs:any[],sd:number,a:number,b:number){const r=rng(sd);const o:any={};for(const q of qs)o[String(q.id)]=a+Math.floor(r()*(b-a+1));return o;}
const stored=(x:any)=>JSON.parse(JSON.stringify({_full:x}));

/** Etiketli alıntı bloklarını gövdeden ayıklar (oradaki 2. şahıs kasıtlı). */
function govde(rep: string): string {
  const lines = rep.split('\n');
  const out: string[] = [];
  let inQuote = false;
  for (const l of lines) {
    if (/Öğrenciye anlatım|anlatım dilinde/.test(l)) { inQuote = true; continue; }
    if (/Öğrenciye önerilebilecek yaklaşım|öneri: "/.test(l)) continue;   // etiketli öğrenci ipucu
    if (inQuote && (l.trim() === '' || l.startsWith('**Sınıfta') || l.startsWith('[/!') || l.startsWith('##'))) inQuote = false;
    if (!inQuote) out.push(l);
  }
  return out.join('\n');
}

interface Bulgu { tip: string; ornek: string; }
function denetle(rep: string): Bulgu[] {
  const b: Bulgu[] = [];
  const g = govde(rep);
  const add = (tip: string, m: RegExpMatchArray | null) => { if (m) b.push({ tip, ornek: m[0].slice(0, 62) }); };

  // Tırnak içindeki örnek ifadeler ("Sen şusun" gibi) kasıtlıdır.
  const gTemiz = g.replace(/"[^"]{0,160}"/g, '""');
  add('2. şahıs', gTemiz.match(/\b(Sen |sensin|güçlüsün|ararsın|bakıyorsun|öğrenicisin|birisin|kayarsın|yönelirsin|olabilirsin|edebilirsin|kavuşursun|olursun|hissedersin|başlarsın|duyarlılığın var|senin en)/));
  add('İngilizce parantez', rep.match(/\((Visual|Aural|Read\/Write|Kinesthetic|Artistic|Investigative|Realistic|Enterprising|Conventional|Social)\)/));
  add('emir kipi tırnakta', rep.match(/"[^"]{0,70}(yap|çiz|oku|dene|kullan|ayır|dinle|yaz)\.\s*"/));
  // Blok BAŞLIKLARINDA emoji serbest (rapor genelinde tutarlı); yalnızca
  // alıntılanmış ipuçlarının başındaki emoji sorundur.
  add('tırnakta emoji', rep.match(/(?<!title=)"\s*[\u{1F300}-\u{1FAFF}]/u));
  add('undefined/NaN', rep.match(/\bundefined\b|\bNaN\b|\[object Object\]/));
  add('ham markdown blok', rep.match(/\[!\w+[^\]]*\](?![\s\S]*?\[\/!)/) && null);
  add('footer yok', /Klinik tanı içermez/.test(rep) ? null : ['footer disclaimer eksik'] as any);
  add('"yapay zeka"', rep.match(/yapay zek/i));
  // uç metrikler
  const stats = [...rep.matchAll(/label="([^"]+)" value="(\d+)"/g)];
  const uc = stats.filter(m => (m[2] === '0' || m[2] === '100') && /Esneklik|Denge|Netlik|Tutarlılık|Farklılaşma|Süreklilik/.test(m[1]));
  if (uc.length) b.push({ tip: 'uç metrik', ornek: uc.map(m => `${m[1]}=${m[2]}`).join(', ').slice(0, 62) });
  const q = rep.match(/x="(\d+)" y="(\d+)"/);
  if (q && ((q[1] === '0' || q[1] === '100') && (q[2] === '0' || q[2] === '100'))) b.push({ tip: 'quadrant uçta', ornek: `x=${q[1]} y=${q[2]}` });
  // çelişki: düşük yüzdeli başlığın hemen altında "en iyi/en etkili"
  const cel = rep.match(/### [^\n]*%([0-9]|1[0-9]|2[0-4]) [^\n]*\n\n[^\n]{0,120}(en iyi|en etkili|en güçlü)/);
  if (cel) b.push({ tip: 'düşük skor "en iyi" diye anlatılıyor', ornek: cel[0].slice(0, 62).replace(/\n/g, ' ') });
  return b;
}

describe('11 RAPOR — KALİTE DENETİMİ', () => {
  it('tam tarama', () => {
    const eq:any[]=[];for(const [tp,ar] of Object.entries(ENNEAGRAM_QUESTIONS as any))(ar as string[]).forEach((_,i)=>eq.push({id:`${tp}_${i}`}));
    const cq:any[]=[];for(const [k,ar] of Object.entries(COKLU_ZEKA_QUESTIONS_LISE as any))(ar as any[]).forEach((q,i)=>cq.push({id:q.id??`${k}_${i}`}));
    const ak:any={};for(let i=1;i<=40;i++)ak[`q${i}`]=String(1+(i%5));
    const set: [string, any][] = [
      ['vark', calculateVark(ch(VARK_QUESTIONS as any,2,['a','b','c','d']))],
      ['sag-sol-beyin', calculateSagSolBeyin(ch(SAG_SOL_BEYIN_QUESTIONS as any,1,['a','b']))],
      ['holland', calculateHolland(lk(HOLLAND_QUESTIONS as any,3,1,5))],
      ['enneagram', calculateEnneagram(lk(eq,4,1,5))],
      ['coklu-zeka', calculateCokluZekaLise(lk(cq,5,1,5))],
      ['sinav-kaygisi', calculateSinavKaygisi(ch(SINAV_KAYGISI_QUESTIONS as any,6,['D','Y']))],
      ['calisma-davranisi', (() => {
        // Motor cevabı question.key ile karşılaştırır; rastgele değer tüm
        // kategorileri 'azami güçlük' yapıp raporu uç değerlere itiyordu.
        const r = rng(7); const o: any = {};
        for (const q of (CALISMA_DAVRANISI_QUESTIONS as any)) {
          const k = (q as any).key;
          o[String(q.id)] = r() < 0.62 ? k : (k === 'E' ? 'H' : 'E');
        }
        return calculateCalismaDavranisi(o);
      })()],
      ['akademik-analiz', calculateAkademik(ak)],
      ['d2-dikkat', (() => { const rows=generateD2Test(42); const r=rng(9);
        return calculateD2(rows.map((row:any)=>({symbols:row,selected:(row as any[]).map(s=>s.is_target?r()<0.85:r()<0.04),elapsed_time:18})) as any, D2_CONFIG.timePerRow); })()],
      ['burdon-dikkat', (() => { const sec=generateBurdonTest(); const r=rng(10);
        return calculateBurdon(sec as any,(sec as any[]).map(s=>({section:s.index,responses:s.rows.map((row:any[],ri:number)=>({row:ri,markedCells:row.map((c,ci)=>({c,ci})).filter(x=>x.c.isTarget?r()<0.88:r()<0.03).map(x=>x.ci)})),completed:true,timeTakenSeconds:60,reachedRow:s.rows.length})) as any); })()],
      ['hizli-okuma', (() => { const pg=getPassageForGrade(9); const a:any={};
        (pg.passage as any).questions.forEach((q:any,i:number)=>{a[String(q.id)]=i%4===0?'x':String(q.answer??'a');});
        return calculateSpeedReading(a, pg.passage as any, 95, pg.kademe as any); })()],
    ];
    console.log('\n╔════════════ 11 RAPOR — KALİTE DENETİMİ ════════════');
    let toplam = 0;
    for (const [t, sc] of set) {
      const rep = buildDeterministicReport(t, stored(sc), st) || '';
      const bul = denetle(rep);
      toplam += bul.length;
      const blok = (rep.match(/\[!\w+/g)||[]).length;
      console.log(`║ ${bul.length ? '❌' : '✅'} ${t.padEnd(18)} ${String(rep.length).padStart(6)} kar · ${String(blok).padStart(2)} blok`);
      for (const x of bul) console.log(`║      ↳ ${x.tip}: ${x.ornek}`);
    }
    console.log(`╟─────────────────────────────────────────────────────`);
    console.log(`║ TOPLAM BULGU: ${toplam}`);
    console.log('╚═════════════════════════════════════════════════════\n');
  });
});
