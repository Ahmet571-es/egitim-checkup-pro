/**
 * Deterministik (API'SIZ) detaylı rapor yönlendiricisi.
 *
 * test_type'a göre ilgili motoru çağırır. Deterministik motoru olan testler
 * için rapor döndürür; olmayanlar için `null` döndürür (çağıran taraf AI'a düşer).
 *
 * Yeni bir test motoru eklendiğinde yalnızca buraya bir case eklenir.
 */
import type { StudentInfo } from './report-blocks';
import { buildCokluZekaDetailedReport } from '../tests/coklu-zeka/detailed-report';
import { buildVarkDetailedReport } from '../tests/vark/detailed-report';
import { buildHollandDetailedReport } from '../tests/holland/detailed-report';
import { buildEnneagramDetailedReport } from '../tests/enneagram/detailed-report';
import type { CokluZekaScores, VarkScores, HollandScores, EnneagramScores } from '../tests/types';

/**
 * @returns Deterministik rapor (markdown) veya motoru yoksa `null`.
 */
export function buildDeterministicReport(
  testType: string,
  scores: unknown,
  student: StudentInfo,
): string | null {
  switch (testType) {
    case 'coklu-zeka':
    case 'coklu_zeka':
      return buildCokluZekaDetailedReport(scores as CokluZekaScores, student);
    case 'vark':
      return buildVarkDetailedReport(scores as VarkScores, student);
    case 'holland':
      return buildHollandDetailedReport(scores as HollandScores, student);
    case 'enneagram':
      return buildEnneagramDetailedReport(scores as EnneagramScores, student);
    default:
      return null;
  }
}

/** Deterministik motoru olan test_type'lar (bilgi amaçlı). */
export const DETERMINISTIC_TEST_TYPES = ['coklu-zeka', 'coklu_zeka', 'vark', 'holland', 'enneagram'];
