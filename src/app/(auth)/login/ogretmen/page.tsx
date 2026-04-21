'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ROLE_PATHS } from '@/types';
import type { UserRole } from '@/types';
import AuthLayout from '@/components/ui/AuthLayout';

const STORAGE_KEY_EMAIL = 'ecup_teacher_email';
const STORAGE_KEY_REMEMBER = 'ecup_teacher_remember';

function TeacherLoginInner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingMsg, setPendingMsg] = useState(false);
  const submittingRef = useRef(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Onay bekliyor query param'ı (register'dan yönlendirme)
    if (searchParams.get('pending') === '1') {
      setPendingMsg(true);
    }

    // Kayıt sonrası otomatik doldurulan email (tek seferlik)
    const justRegistered = localStorage.getItem('ecup_teacher_email');
    const savedRemember = localStorage.getItem(STORAGE_KEY_REMEMBER);

    if (justRegistered) {
      setEmail(justRegistered);
      localStorage.removeItem('ecup_teacher_email');
    }

    if (savedRemember === 'true') {
      setRememberMe(true);
      const savedEmail = localStorage.getItem(STORAGE_KEY_EMAIL);
      if (savedEmail && !justRegistered) setEmail(savedEmail);
    }
  }, [searchParams]);

  const handleEmailChange = (val: string) => {
    setEmail(val.trim().toLowerCase());
  };

  const handleRememberChange = (checked: boolean) => {
    setRememberMe(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_REMEMBER, String(checked));
      if (checked) {
        localStorage.setItem(STORAGE_KEY_EMAIL, email);
      } else {
        localStorage.removeItem(STORAGE_KEY_EMAIL);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;

    if (!email.trim() || !email.includes('@')) {
      setError('Geçerli bir e-posta adresi girin.');
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

      const { error: authError, data } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'E-posta veya şifre hatalı.'
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

      if (typeof window !== 'undefined' && rememberMe) {
        localStorage.setItem(STORAGE_KEY_EMAIL, email.trim().toLowerCase());
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
      subtitle="E-posta ve 7 haneli şifrenizle giriş yapın"
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

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5">E-posta Adresi</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md pointer-events-none">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="ornek@email.com"
              className="w-full pl-14 pr-3 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              required
              autoComplete="email"
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
              autoComplete="current-password"
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

        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => handleRememberChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-[13px] text-gray-600 font-medium group-hover:text-gray-800 transition">E-postamı hatırla</span>
        </label>

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
