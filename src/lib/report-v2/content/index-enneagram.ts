// Enneagram tip numarasından profile erişim.
import type { Profile } from './types';
import { ENN1, ENN2, ENN3 } from './enneagram-a';
import { ENN4, ENN5, ENN6 } from './enneagram-b';
import { ENN7, ENN8, ENN9 } from './enneagram-c';

export const ENNEAGRAM_PROFILES: Record<number, Profile> = {
  1: ENN1,
  2: ENN2,
  3: ENN3,
  4: ENN4,
  5: ENN5,
  6: ENN6,
  7: ENN7,
  8: ENN8,
  9: ENN9,
};
