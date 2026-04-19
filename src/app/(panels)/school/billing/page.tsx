/**
 * Okul Faturalandırma — Premium
 */
import Link from 'next/link';
import { Sparkles, CreditCard, Shield, Crown, Users, Calendar, Lock } from 'lucide-react';
import { checkLicense } from '@/lib/license/check';
import { getCurrentProfile } from '@/lib/actions/auth';
import { PLAN_LIST, type SubscriptionPlan } from '@/lib/payment/types';
import BillingPlanCard from './BillingPlanCard';
import PageHeader from '@/components/ui/PageHeader';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const profile = await getCurrentProfile();
  const state = await checkLicense(profile?.school_id || null);

  const statusLabel =
    state.status === 'active' ? 'Aktif' :
    state.status === 'trial' ? 'Deneme' : 'Sona Erdi';
  const statusColor =
    state.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    state.status === 'trial' ? 'bg-sky-50 text-sky-700 border-sky-200' :
    'bg-red-50 text-red-700 border-red-200';
  const statusGradient =
    state.status === 'active' ? 'from-emerald-500 to-teal-600' :
    state.status === 'trial' ? 'from-sky-500 to-blue-600' :
    'from-red-500 to-rose-600';

  const capacityPct = state.maxStudents > 0 ? Math.min(100, (state.studentCount / state.maxStudents) * 100) : 0;
  const capacityColor = capacityPct >= 90 ? 'bg-red-500' : capacityPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div data-test="billing-page">
      <PageHeader
        role="school_admin"
        icon={CreditCard}
        title="Faturalandırma"
        subtitle="Okulunuzun aboneliğini yönetin, plan yükseltin — iyzico ile güvenli ödeme"
      />

      {/* Mevcut plan */}
      <div
        data-test="current-plan-card"
        className="relative mb-6 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-slate-700/60 shadow-sm p-6 overflow-hidden"
      >
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${statusGradient}`} />
        <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br ${statusGradient} opacity-[0.08] blur-3xl pointer-events-none`} />

        <div className="relative flex items-start justify-between flex-wrap gap-5">
          <div className="min-w-0">
            <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">Mevcut Plan</p>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${statusGradient} text-white flex items-center justify-center shadow-md shrink-0`}>
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100 truncate">{state.school?.name || 'Okulunuz'}</h2>
            </div>

            {/* Capacity */}
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Kapasite: <b className="text-[#0f2847] dark:text-slate-100">{state.studentCount}/{state.maxStudents}</b> öğrenci
              </p>
            </div>
            <div className="h-2 w-60 max-w-full bg-gray-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
              <div className={`h-full ${capacityColor} rounded-full transition-all duration-500`} style={{ width: `${capacityPct}%` }} />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">%{capacityPct.toFixed(0)} dolulukta</p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-extrabold uppercase tracking-wider ${statusColor}`}>
              <Shield className="w-3 h-3" />
              {statusLabel}
            </span>
            {state.status !== 'expired' && state.endDate && (
              <div className="text-right">
                <p className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center gap-1 justify-end">
                  <Calendar className="w-3 h-3" />
                  Bitiş: {new Date(state.endDate).toLocaleDateString('tr-TR')}
                </p>
                <p className="text-[13px] text-[#0f2847] dark:text-slate-100 font-extrabold">
                  <b className={state.daysLeft <= 7 ? 'text-red-600' : state.daysLeft <= 30 ? 'text-amber-600' : 'text-[#0f2847] dark:text-slate-100'}>{state.daysLeft}</b> gün kaldı
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Planlar */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-[17px] font-extrabold text-[#0f2847] dark:text-slate-100">Planlar</h3>
          <p className="text-[12px] text-gray-500 dark:text-slate-400">İhtiyacınıza uygun planı seçin</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 grid-stagger">
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
      <div className="mt-8 relative bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 rounded-2xl p-5 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 opacity-10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="font-extrabold text-[#0f2847] dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500" /> Güvenli Ödeme
            </p>
            <p className="text-sky-900 text-[13px] leading-relaxed">
              Ödemeler iyzico altyapısı üzerinden 3D Secure ile alınır. Kart bilgileriniz Eğitim Check-Up sunucularında saklanmaz. Fatura isteyebilir ya da KVKK haklarınız için{' '}
              <Link href="/kvkk" className="underline font-bold hover:text-sky-700 transition">KVKK metnimizi</Link> inceleyebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
