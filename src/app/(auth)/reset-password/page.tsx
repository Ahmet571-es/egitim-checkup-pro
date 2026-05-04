'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthLayout from '@/components/ui/AuthLayout';

/**
 * Reset Password Sayfası
 * ──────────────────────
 * Kullanıcı, e-postasındaki Supabase reset linkine tıklayınca buraya gelir.
 * URL'de access_token + refresh_token query parametreleri olur (Supabase
 * onPasswordRecovery event'i ile session set edilir).
 *
 * Kullanıcı yeni şifresini belirler → supabase.auth.updateUser
 * → başarılı → /login'e yönlendir.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Sayfa açıldığında Supabase session'ı kontrol et
  // (Reset linkindeki token ile otomatik geçici session oluşur)
  useEffect(() => {
    const supabase = createClient();

    // Recovery flow'u dinle — link'e tıklayınca event fire olur
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      } else if (session) {
        setSessionReady(true);
      }
    });

    // Sayfa direkt yüklenmişse (URL'de token varsa)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Şifre en az bir harf ve bir rakam içermeli.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || 'Şifre güncellenemedi.');
        setLoading(false);
        return;
      }

      // Başarı — session'ı kapat, login'e yönlendir
      await supabase.auth.signOut();
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err) {
      setError('Beklenmeyen bir hata oluştu.');
      setLoading(false);
    }
  };

  // Başarı ekranı
  if (success) {
    return (
      <AuthLayout
        role="student"
        title="Şifreniz Güncellendi!"
        subtitle="Giriş sayfasına yönlendiriliyorsunuz..."
      >
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Yeni şifrenizle giriş yapabilirsiniz.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Giriş Sayfasına Git <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Session yok → link geçersiz/eski
  if (!sessionReady) {
    return (
      <AuthLayout
        role="student"
        title="Şifre Sıfırlama"
        subtitle="Bağlantı doğrulanıyor..."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-sm text-amber-800">
            <p className="font-bold mb-1">Bağlantı kontrol ediliyor...</p>
            <p className="text-[12.5px]">
              Eğer bu sayfa yüklenmezse, e-postanızdaki bağlantının süresi dolmuş veya geçersiz olabilir.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="block text-center py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-all"
          >
            Yeni şifre sıfırlama linki iste
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      role="student"
      title="Yeni Şifre Belirle"
      subtitle="Yeni şifrenizi giriniz"
      footer={
        <Link
          href="/login"
          className="text-[13px] text-gray-500 hover:text-violet-600 font-semibold transition"
        >
          ← Giriş sayfasına dön
        </Link>
      }
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-[13px] text-blue-800">
          <p className="font-bold mb-1">Şifre Kuralları:</p>
          <ul className="space-y-0.5 ml-4 list-disc">
            <li>En az 8 karakter</li>
            <li>En az bir harf ve bir rakam</li>
          </ul>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
            Yeni Şifre
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value.slice(0, 72))}
              placeholder="En az 8 karakter, harf + rakam"
              maxLength={72}
              autoFocus
              autoComplete="new-password"
              className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
              aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
            Yeni Şifreyi Tekrar Girin
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value.slice(0, 72))}
              placeholder="Yeni şifre tekrarı"
              maxLength={72}
              autoComplete="new-password"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || newPassword.length < 8 || !confirmPassword}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-extrabold shadow-lg shadow-violet-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>Şifremi Değiştir <CheckCircle2 className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
