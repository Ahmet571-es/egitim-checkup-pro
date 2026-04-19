'use client';
/**
 * Faz 5: Plan kartı (client component — ödeme butonu akışı için)
 */
import { secureFetch } from '@/lib/csrf-client';
import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { SubscriptionPlan } from '@/lib/payment/types';
import { formatTRY } from '@/lib/payment/types';

interface Props {
  plan: SubscriptionPlan;
  currentMaxStudents?: number;
  disabled?: boolean;
}

export default function BillingPlanCard({ plan, currentMaxStudents, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isCurrent =
    currentMaxStudents != null &&
    ((plan.maxStudents ?? 0) === currentMaxStudents ||
      (plan.maxStudents === null && currentMaxStudents === 0));

  const handleBuy = async () => {
    if (disabled || loading) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await secureFetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey: plan.key }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || 'Ödeme başlatılamadı');
        setLoading(false);
        return;
      }
      if (data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl;
        return;
      }
      setErr('Ödeme yönlendirme URL alınamadı');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-test={`plan-card-${plan.key}`}
      className={`relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border shadow-sm p-6 flex flex-col ${
        plan.popular
          ? 'border-sky-400 ring-2 ring-sky-300/50'
          : 'border-white/40 dark:border-slate-700/60'
      }`}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg">
          En popüler
        </span>
      )}

      <h3 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100 mb-1">{plan.name}</h3>
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
        {plan.maxStudents === null
          ? 'Sınırsız öğrenci'
          : `Yıllık · ${plan.maxStudents} öğrenci`}
      </p>

      <div className="mb-5">
        <span className="text-3xl font-black text-[#0f2847] dark:text-slate-100">
          {formatTRY(plan.price)}
        </span>
        <span className="text-sm text-gray-400 dark:text-slate-500 font-semibold"> / yıl</span>
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13px] text-gray-700 dark:text-slate-300">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleBuy}
        disabled={disabled || loading || isCurrent}
        data-test={`plan-buy-${plan.key}`}
        className={`w-full px-4 py-3 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center gap-2 ${
          isCurrent
            ? 'bg-gray-100 dark:bg-slate-700/60 text-gray-400 dark:text-slate-500 cursor-default'
            : plan.popular
            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:opacity-90 shadow-lg'
            : 'bg-[#0f2847] text-white hover:bg-[#1a3a5f]'
        } disabled:opacity-60`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Yönlendiriliyor...
          </>
        ) : isCurrent ? (
          'Mevcut Plan'
        ) : (
          'Satın Al'
        )}
      </button>

      {err && (
        <p className="mt-2 text-xs text-red-600 text-center" data-test="plan-error">
          {err}
        </p>
      )}
    </div>
  );
}
