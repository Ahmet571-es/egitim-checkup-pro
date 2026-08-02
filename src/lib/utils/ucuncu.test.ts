import { describe, it, expect } from 'vitest';
import { ucuncuSahis as u } from '@/lib/utils/turkish';
describe('3. şahıs',()=>{it('dönüşüm',()=>{
  const cases: [string,string][] = [
    ['Bağımsız çalışma gerektiren ortamlarda güçlüsün.', 'Bağımsız çalışma gerektiren ortamlarda güçlü olabilir.'],
    ['Stres altında Tip 7\'ye kayarsın: dağınık ve hiperaktif olabilirsin.', 'Stres altında Tip 7\'ye kayar: dağınık ve hiperaktif olabilir.'],
    ['Gelişim yolunda Tip 8\'e yönelirsin: harekete geçer, liderlik edebilirsin.', 'Gelişim yolunda Tip 8\'e yönelir: harekete geçer, liderlik edebilir.'],
    ['Bağımsızlığına saygı duyan birini ararsın.', 'Bağımsızlığına saygı duyan birini arar.'],
    ['Sen dünyaya merakla bakıyorsun.', 'dünyaya merakla bakıyor.'],
    ['disiplin ve yapıya kavuşursun.', 'disiplin ve yapıya kavuşur.'],
    ['Bu alanda daha rahat ilerler.', 'Bu alanda daha rahat ilerler.'],
    ['Öğrenci bunu yapabilir.', 'Öğrenci bunu yapabilir.'],
  ];
  for (const [i,o] of cases) { console.log(`  ${u(i)===o?'✅':'❌'} ${u(i)}`); expect(u(i)).toBe(o); }
});});
