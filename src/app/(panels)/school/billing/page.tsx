/**
 * Faz 5: Okul faturalandırma sayfası (Server Component)
 */
import Link from 'next/link';
import { Sparkles, CreditCard, Shield, Crown } from 'lucide-react';
import { checkLicense } from '@/lib/license/check';
import { getCurrentProfile } from '@/lib/actions/auth';
import { PLAN_LIST, type SubscriptionPlan } from '@/lib/payment/types';
import BillingPlanCard from './BillingPlanCard';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const profile = await getCurrentProfile();
  const state = await checkLicense(profile?.school_id || null);

  const statusLabel =
    state.status === 'active'
      ? 'Aktif'
      : state.status === 'trial'
      ? 'Deneme'
      : 'Sona Erdi';
  const statusColor =
    state.status === 'active'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : state.status === 'trial'
      ? 'bg-sky-50 text-sky-700 border-sky-200'
      : 'bg-red-50 text-red-700 border-red-200';

  return (
    <div data-test="billing-page">
      <h1 className="text-2xl font-extrabold text-[#0f2847] mb-2 flex items-center gap-2">
        <CreditCard className="w-6 h-6 text-sky-600" /> Faturalandırma
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Okulunuzun aboneliğini yönetin ve plan yükseltin.
      </p>

      {/* Mevcut plan */}
      <div
        data-test="current-plan-card"
        className="mb-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-6"
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Mevcut Plan
            </p>
            <h2 className="text-xl font-extrabold text-[#0f2847]">
              {state.school?.name || 'Okulunuz'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Kapasite:{' '}
              <b className="text-[#0f2847]">
                {state.studentCount}/{state.maxStudents}
              </b>{' '}
              öğrenci
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${statusColor}`}
            >
              <Shield className="w-3 h-3" />
              {statusLabel}
            </span>
            {state.status !== 'expired' && state.endDate && (
              <p className="text-[11px] text-gray-400">
                Bitiş: {new Date(state.endDate).toLocaleDateString('tr-TR')} ·{' '}
                <b>{state.daysLeft}</b> gün kaldı
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Planlar */}
      <h3 className="text-lg font-extrabold text-[#0f2847] mb-3 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500" /> Planlar
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_LIST.map((plan: SubscriptionPlan) => (
          <BillingPlanCard
            key={plan.key}
            plan={plan}
            currentMaxStudents={state.maxStudents}
            disabled={!profile?.school_id}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 bg-sky-50/70 border border-sky-200 rounded-2xl p-5 text-sm text-sky-900">
        <p className="font-semibold mb-1 flex items-center gap-2">
          <Crown className="w-4 h-4" /> Güvenli ödeme
        </p>
        <p className="text-sky-800/80 text-[13px] leading-relaxed">
          Ödemeler iyzico altyapısı üzerinden 3D Secure ile alınır. Kart
          bilgileriniz Eğitim Check-Up sunucularında saklanmaz. Fatura isteyebilir
          ya da KVKK haklarınız için{' '}
          <Link href="/kvkk" className="underline font-semibold">
            KVKK metnimizi
          </Link>{' '}
          inceleyebilirsiniz.
        </p>
      </div>
    </div>
  );
}

