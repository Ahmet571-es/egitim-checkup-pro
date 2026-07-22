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
import { buildSinavKaygisiDetailedReport } from '../tests/sinav-kaygisi/detailed-report';
import { buildCalismaDavranisiDetailedReport } from '../tests/calisma-davranisi/detailed-report';
import { buildSagSolBeyinDetailedReport } from '../tests/sag-sol-beyin/detailed-report';
import { buildD2DikkatDetailedReport } from '../tests/d2-dikkat/detailed-report';
import { buildBurdonDikkatDetailedReport } from '../tests/burdon-dikkat/detailed-report';
import { buildHizliOkumaDetailedReport } from '../tests/hizli-okuma/detailed-report';
import { buildAkademikDetailedReport } from '../tests/akademik-analiz/detailed-report';
import type { CokluZekaScores, VarkScores, HollandScores, EnneagramScores, SinavKaygisiScores, CalismaDavranisiScores, SagSolBeyinScores, SpeedReadingScores, AkademikScores } from '../tests/types';

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
    case 'sinav-kaygisi':
      return buildSinavKaygisiDetailedReport(scores as SinavKaygisiScores, student);
    case 'calisma-davranisi':
      return buildCalismaDavranisiDetailedReport(scores as CalismaDavranisiScores, student);
    case 'sag-sol-beyin':
      return buildSagSolBeyinDetailedReport(scores as SagSolBeyinScores, student);
    case 'hizli-okuma':
      return buildHizliOkumaDetailedReport(scores as SpeedReadingScores, student);
    case 'akademik-analiz':
      return buildAkademikDetailedReport(scores as AkademikScores, student);
    case 'd2-dikkat':
      return buildD2DikkatDetailedReport(scores as Parameters<typeof buildD2DikkatDetailedReport>[0], student);
    case 'burdon-dikkat':
      return buildBurdonDikkatDetailedReport(scores as Parameters<typeof buildBurdonDikkatDetailedReport>[0], student);
    default:
      return null;
  }
}

/** Deterministik motoru olan test_type'lar (bilgi amaçlı). */
export const DETERMINISTIC_TEST_TYPES = ['coklu-zeka', 'coklu_zeka', 'vark', 'holland', 'enneagram', 'sinav-kaygisi', 'calisma-davranisi', 'sag-sol-beyin', 'hizli-okuma', 'akademik-analiz', 'd2-dikkat', 'burdon-dikkat'];
