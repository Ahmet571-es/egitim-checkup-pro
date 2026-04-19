'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { User, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ROLE_PATHS } from '@/types';
import type { UserRole } from '@/types';
import AuthLayout from '@/components/ui/AuthLayout';

function toAscii(s: string): string {
  const map: Record<string, string> = { 'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','İ':'i','ö':'o','Ö':'o','ş':'s','Ş':'s','ü':'u','Ü':'u' };
  return s.replace(/[çÇğĞıİöÖşŞüÜ]/g, c => map[c] || c);
}

function TeacherLoginInner() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingMsg, setPendingMsg] = useState(false);
  const submittingRef = useRef(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('pending') === '1') {
      setPendingMsg(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;

    if (!firstName.trim() || !lastName.trim()) {
      setError('Ad ve soyad alanlarını doldurun.');
      submittingRef.current = false;
      return;
    }
    if (password.length !== 7) {
      setError('Şifre 7 karakter olmalıdır.');
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    setError('');
    setPendingMsg(false);

    try {
      const supabase = createClient();
      const ad = toAscii(firstName.trim().toLowerCase()).replace(/[^a-z]/g, '');
      const soyad = toAscii(lastName.trim().toLowerCase()).replace(/[^a-z]/g, '');
      const authEmail = `${ad}_${soyad}@ogretmen.egitimcheckup.com`;

      const { error: authError, data } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'Ad-soyad veya şifre hatalı.'
            : authError.message
        );
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      const isApproved = data.user?.user_metadata?.is_approved;
      if (isApproved === false) {
        await supabase.auth.signOut();
        setPendingMsg(true);
        setError('');
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      let role: UserRole | undefined = data.user?.user_metadata?.role as UserRole | undefined;
      if (!role && data.user?.id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();
          if (profile?.role) role = profile.role as UserRole;
        } catch { /* ignore */ }
      }
      const target = ROLE_PATHS[role ?? 'teacher'] ?? '/teacher/dashboard';
      window.location.href = target;
    } catch {
      setError('Beklenmeyen bir hata oluştu.');
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <AuthLayout
      role="teacher"
      title="Öğretmen Girişi"
      subtitle="Ad-Soyad ve 7 haneli şifrenizle giriş yapın"
      footer={
        <p className="text-[13px] text-gray-500">
          Hesabınız yok mu?{' '}
          <Link href="/register/ogretmen" className="text-emerald-600 font-extrabold hover:text-emerald-700 hover:underline transition">
            Öğretmen Kayıt →
          </Link>
        </p>
      }
    >
      {pendingMsg && (
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-start gap-2.5 text-sm text-amber-800">
          <Clock className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">Hesabınız henüz onaylanmadı</p>
            <p className="text-[12.5px] text-amber-700">Yönetici onayı bekleniyor. Onaylandığında size bilgi verilecek.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <input type="text" name="prevent_autofill" style={{ display: 'none' }} tabIndex={-1} />
        <input type="password" name="prevent_autofill_pw" style={{ display: 'none' }} tabIndex={-1} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Ad</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md pointer-events-none">
                <User className="w-4 h-4 text-white" />
              </div>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Adınız"
                className="w-full pl-14 pr-3 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                required
                autoComplete="nope"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Soyad</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Soyadınız"
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              required
              autoComplete="nope"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
            Şifre <span className="text-gray-400 font-normal">(7 haneli)</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-md pointer-events-none">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value.slice(0, 7))}
              placeholder="Örn: Ab12345"
              maxLength={7}
              className="w-full pl-14 pr-12 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11.5px] text-gray-500 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            Kayıt olurken belirlediğiniz 7 haneli şifre
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white text-[14px] font-extrabold shadow-lg shadow-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Giriş yapılıyor...
            </>
          ) : (
            <>Giriş Yap <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 text-violet-700 text-[13px] font-bold border border-violet-200 transition-all active:scale-[0.98] group"
        >
          <span>Öğrenci misiniz? Öğrenci Girişi</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function TeacherLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <TeacherLoginInner />
    </Suspense>
  );
}
