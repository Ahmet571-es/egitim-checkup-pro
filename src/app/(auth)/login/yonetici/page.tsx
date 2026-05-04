'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2,
  Eye, EyeOff, Shield,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthLayout from '@/components/ui/AuthLayout';

const STORAGE_KEY_EMAIL = 'ecup_admin_email';
const STORAGE_KEY_REMEMBER = 'ecup_admin_remember';

function AdminLoginInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submittingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Her login sayfasına geliş → intro flag'lerini temizle
    sessionStorage.removeItem('ecup_intro_seen_student');
    sessionStorage.removeItem('ecup_intro_seen_teacher');
    sessionStorage.removeItem('ecup_intro_seen_parent');

    // Hatırla beni
    const savedRemember = localStorage.getItem(STORAGE_KEY_REMEMBER);
    const savedEmail = localStorage.getItem(STORAGE_KEY_EMAIL);
    if (savedRemember === 'true' && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');

    const loginEmail = email.trim().toLowerCase();
    if (!loginEmail || !password) {
      setError('E-posta ve şifre zorunludur.');
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError, data } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'E-posta veya şifre hatalı.'
            : authError.message,
        );
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      // Role kontrolü — sadece admin / school_admin
      const role = data.user?.user_metadata?.role as string | undefined;
      let actualRole = role;
      if (!actualRole && data.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();
        actualRole = profile?.role;
      }

      if (actualRole !== 'admin' && actualRole !== 'school_admin') {
        await supabase.auth.signOut();
        setError('Bu hesap yönetici hesabı değil. Lütfen rolünüze uygun giriş sayfasını kullanın.');
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      // is_approved kontrolü
      const isApproved = data.user?.user_metadata?.is_approved;
      if (isApproved === false) {
        await supabase.auth.signOut();
        setError('Hesabınız henüz onaylanmadı.');
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      // Hatırla
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY_EMAIL, loginEmail);
        localStorage.setItem(STORAGE_KEY_REMEMBER, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_EMAIL);
        localStorage.removeItem(STORAGE_KEY_REMEMBER);
      }

      // Yönlendirme
      const target = actualRole === 'school_admin' ? '/school/dashboard' : '/admin/dashboard';
      window.location.href = target;
    } catch (err) {
      setError('Beklenmeyen bir hata oluştu.');
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <AuthLayout
      role="admin"
      title="Yönetici Girişi"
      subtitle="E-posta ve şifrenizle giriş yapın"
      footer={
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-amber-600 font-semibold transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Ana sayfaya dön
        </Link>
      }
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <input type="text" name="prevent_autofill_user" style={{ display: 'none' }} tabIndex={-1} />
        <input type="password" name="prevent_autofill_pw" style={{ display: 'none' }} tabIndex={-1} />

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
            E-posta Adresi
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md pointer-events-none">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              autoComplete="email"
              className="w-full pl-14 pr-3 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
            Şifre
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md pointer-events-none">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifreniz"
              autoComplete="current-password"
              className="w-full pl-14 pr-12 py-3.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-1.5 text-right">
            <Link
              href="/forgot-password/ogrenci"
              className="text-[12px] text-amber-600 hover:text-amber-700 font-semibold underline"
            >
              Şifremi unuttum
            </Link>
          </div>
        </div>

        <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          />
          E-postamı hatırla
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-[14px] font-extrabold shadow-lg shadow-amber-500/40 hover:shadow-xl hover:shadow-amber-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Giriş yapılıyor...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Giriş Yap
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <AdminLoginInner />
    </Suspense>
  );
}
