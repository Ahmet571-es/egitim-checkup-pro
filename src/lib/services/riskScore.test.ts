import { describe, it, expect } from 'vitest';
import { getRiskLevel } from './riskScore';

/**
 * Risk seviyesi eşikleri — yanlış eşik = yanlış "kritik/izlenmeli/sağlıklı" etiketi.
 * Eşikler: <30 kritik, ≤60 izlenmeli, >60 sağlıklı.
 */
describe('getRiskLevel', () => {
  it('30 altı → kritik', () => {
    expect(getRiskLevel(0).level).toBe('kritik');
    expect(getRiskLevel(29).level).toBe('kritik');
    expect(getRiskLevel(29.9).level).toBe('kritik');
  });

  it('30–60 arası → izlenmeli (sınır dahil)', () => {
    expect(getRiskLevel(30).level).toBe('izlenmeli');
    expect(getRiskLevel(45).level).toBe('izlenmeli');
    expect(getRiskLevel(60).level).toBe('izlenmeli');
  });

  it('60 üstü → sağlıklı', () => {
    expect(getRiskLevel(60.1).level).toBe('saglikli');
    expect(getRiskLevel(85).level).toBe('saglikli');
    expect(getRiskLevel(100).level).toBe('saglikli');
  });

  it('her seviye etiket + emoji + renk döndürür', () => {
    const r = getRiskLevel(50);
    expect(r.label).toBeTruthy();
    expect(r.emoji).toBeTruthy();
    expect(r.color).toContain('text-');
  });
});
