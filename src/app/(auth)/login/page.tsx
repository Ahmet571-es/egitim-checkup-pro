'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ROLE_PATHS } from '@/types';
import type { UserRole } from '@/types';
import AuthLayout from '@/components/ui/AuthLayout';

const STORAGE_KEY_EMAIL = 'ecup_email';
const STORAGE_KEY_REMEMBER = 'ecup_remember';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromRegister, setFromRegister] = useState(false);
  const submittingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Her login sayfasına geliş = potansiyel yeni oturum başlangıcı
    // → intro video flag'lerini temizle ki yeni login sonrası video tekrar oynasın
    sessionStorage.removeItem('ecup_intro_seen_student');
    sessionStorage.removeItem('ecup_intro_seen_teacher');
    sessionStorage.removeItem('ecup_intro_seen_parent');

    const savedRemember = localStorage.getItem(STORAGE_KEY_REMEMBER);
    const oldStored = localStorage.getItem(STORAGE_KEY_EMAIL);
    if (savedRemember === 'true' && oldStored) {
      setEmail(oldStored);
      setRememberMe(true);
    } else if (oldStored) {
      localStorage.removeItem(STORAGE_KEY_EMAIL);
    }

    const regEmail = localStorage.getItem('ecup_just_registered_email');
    if (regEmail) {
      setEmail(regEmail);
      setFromRegister(true);
      localStorage.removeItem('ecup_just_registered_email');
    }
  }, []);

  const handleEmailChange = (val: string) => {
    const clean = val.trim().toLowerCase();
    setEmail(clean);
    if (rememberMe && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_EMAIL, clean);
    }
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

    const input = email.trim().toLowerCase();
    if (!input) {
      setError('E-posta veya kullanıcı adınızı girin.');
      submittingRef.current = false;
      return;
    }
    if (password.trim().length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    setError('');
    setFromRegister(false);

    try {
      const supabase = createClient();

      // Geri uyum: email formatı ise direkt kullan, yoksa eski sentetik email'e çevir
      const loginEmail = input.includes('@')
        ? input
        : `${input.replace(/\s/g, '')}@ogrenci.egitimcheckup.com`;

      const { error: authError, data } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'Bilgileriniz hatalı. Eski hesabınız varsa kullanıcı adınızı girmeyi deneyin.'
            : authError.message
        );
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
        } catch {
          // ignore
        }
      }
      const target = ROLE_PATHS[role ?? 'student'] ?? '/student/dashboard';

      if (typeof window !== 'undefined') {
        window.location.href = target;
      } else {
        router.push(target);
      }
    } catch (err) {
      console.error('[login] unexpected error:', err);
      setError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <AuthLayout
      role="student"
      title="Giriş Yap"
      subtitle="E-posta/kullanıcı adı ve şifrenizle giriş yapın"
      footer={
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-slate-100 to-gray-100 hover:from-slate-200 hover:to-gray-200 text-[#0f2847] text-[13px] font-bold border border-slate-200 transition-all active:scale-[0.98] group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Ana Menü</span>
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-[13px] font-bold shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all active:scale-[0.98] group"
          >
            <span>Öğrenci Kayıt</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      }
    >
      {fromRegister && email && !error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">Kayıt başarılı! Şifrenizi girerek giriş yapabilirsiniz.</span>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <input type="text" name="prevent_autofill_user" style={{ display: 'none' }} tabIndex={-1} />
        <input type="password" name="prevent_autofill_pass" style={{ display: 'none' }} tabIndex={-1} />

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5">E-posta Adresi</label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shrink-0 pointer-events-none">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <input
              type="text"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="E-posta veya kullanıcı adınız"
              maxLength={100}
              name="ecup_user_login"
              className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
              required
              autoComplete="username"
            />
          </div>
          <p className="text-[11.5px] text-gray-400 mt-1.5 pl-1">Eski kullanıcıysanız kullanıcı adınızla da giriş yapabilirsiniz.</p>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Şifre</label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-md shrink-0 pointer-events-none">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              maxLength={72}
              name="ecup_pass_login"
              className="w-full pl-14 pr-12 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11.5px] text-gray-500 mt-1.5 text-right">
            <Link href="/forgot-password/ogrenci" className="text-sky-600 hover:text-sky-700 font-semibold underline">
              Şifremi unuttum
            </Link>
          </p>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => handleRememberChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
          />
          <span className="text-[13px] text-gray-600 font-medium group-hover:text-gray-800 transition">E-postamı hatırla</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 text-white text-[14px] font-extrabold shadow-lg shadow-violet-500/40 hover:shadow-xl hover:shadow-violet-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
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

    </AuthLayout>
  );
}
