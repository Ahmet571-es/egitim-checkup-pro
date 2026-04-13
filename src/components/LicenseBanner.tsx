'use client';
/**
 * Faz 5: Trial / Expired kullanıcıya uyarı bandı
 */
import Link from 'next/link';
import { AlertTriangle, Clock, Sparkles } from 'lucide-react';

interface Props {
  status: 'trial' | 'active' | 'expired';
  daysLeft: number;
  studentCount: number;
  maxStudents: number;
  billingHref?: string;
}

export default function LicenseBanner({
  status,
  daysLeft,
  studentCount,
  maxStudents,
  billingHref = '/school/billing',
}: Props) {
  if (status === 'active') return null;

  if (status === 'expired') {
    return (
      <div
        data-test="license-banner-expired"
        className="mb-5 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 flex items-center gap-3 shadow-sm"
      >
        <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold text-red-700">
            Lisansınız sona erdi
          </p>
          <p className="text-[12px] text-red-600/80">
            Öğrenci ekleme ve test atama gibi işlemler devre dışı. Planınızı
            yenileyerek devam edebilirsiniz.
          </p>
        </div>
        <Link
          href={billingHref}
          className="shrink-0 px-4 py-2 rounded-xl bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors"
        >
          Planları Gör
        </Link>
      </div>
    );
  }

  // trial
  const warn = daysLeft <= 3;
  return (
    <div
      data-test="license-banner-trial"
      className={`mb-5 rounded-2xl border p-4 flex items-center gap-3 shadow-sm ${
        warn
          ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'
          : 'border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 ${
          warn ? 'bg-amber-500' : 'bg-sky-500'
        }`}
      >
        {warn ? <Clock className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13.5px] font-semibold ${warn ? 'text-amber-800' : 'text-sky-800'}`}>
          {warn ? `Deneme süreniz ${daysLeft} gün içinde bitiyor` : 'Ücretsiz deneme sürümü aktif'}
        </p>
        <p className={`text-[12px] ${warn ? 'text-amber-700/80' : 'text-sky-700/80'}`}>
          Kalan: <b>{daysLeft} gün</b> · Kapasite:{' '}
          <b>
            {studentCount}/{maxStudents}
          </b>{' '}
          öğrenci
        </p>
      </div>
      <Link
        href={billingHref}
        className={`shrink-0 px-4 py-2 rounded-xl text-white text-[13px] font-semibold transition-colors ${
          warn ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sky-600 hover:bg-sky-700'
        }`}
      >
        Planı Yükselt
      </Link>
    </div>
  );
}
