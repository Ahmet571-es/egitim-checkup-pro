/**
 * Faz 5: iyzico ödeme planları ve tipler
 */

export type PlanKey = 'baslangic' | 'profesyonel' | 'kurumsal';

export interface SubscriptionPlan {
  key: PlanKey;
  name: string;
  price: number; // TRY (KDV dahil)
  maxStudents: number | null; // null = sınırsız
  durationDays: number;
  features: string[];
  popular?: boolean;
}

export const PLANS: Record<PlanKey, SubscriptionPlan> = {
  baslangic: {
    key: 'baslangic',
    name: 'Başlangıç',
    price: 4999,
    maxStudents: 50,
    durationDays: 365,
    features: [
      '50 öğrenciye kadar',
      '11 test türü',
      'AI destekli 3\'lü rapor',
      'E-posta destek',
    ],
  },
  profesyonel: {
    key: 'profesyonel',
    name: 'Profesyonel',
    price: 14999,
    maxStudents: 200,
    durationDays: 365,
    popular: true,
    features: [
      '200 öğrenciye kadar',
      '11 test türü',
      'AI destekli 3\'lü rapor',
      'Toplu rapor dışa aktarımı',
      'Öncelikli destek',
    ],
  },
  kurumsal: {
    key: 'kurumsal',
    name: 'Kurumsal',
    price: 29999,
    maxStudents: null,
    durationDays: 365,
    features: [
      'Sınırsız öğrenci',
      '11 test türü',
      'AI destekli 3\'lü rapor',
      'Toplu rapor dışa aktarımı',
      'Özel entegrasyon desteği',
      '7/24 destek',
    ],
  },
};

export const PLAN_LIST: SubscriptionPlan[] = [
  PLANS.baslangic,
  PLANS.profesyonel,
  PLANS.kurumsal,
];

export function getPlan(key: string): SubscriptionPlan | null {
  if (key in PLANS) return PLANS[key as PlanKey];
  return null;
}

export function formatTRY(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---- Payment DB row ----
export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface PaymentRow {
  id: string;
  school_id: string;
  plan_key: PlanKey;
  plan_name: string;
  amount: number;
  currency: string;
  conversation_id: string;
  payment_id: string | null;
  status: PaymentStatus;
  error_message: string | null;
  raw_response: unknown;
  created_at: string;
  updated_at: string;
}
