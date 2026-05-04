'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail, Lock, ShieldCheck, CheckCircle2, AlertCircle,
  ArrowRight, ArrowLeft, Eye, EyeOff,
} from 'lucide-react';
import AuthLayout from '@/components/ui/AuthLayout';

/**
 * Veli Şifremi Unuttum — 3 adımlı sade akış:
 *   1) E-posta gir → "Eğer kayıtlıysa kod gönderildi" doğrulama mesajı
 *   2) E-postaya gelen 6 haneli kodu gir
 *   3) Yeni şifre belirle → tamamlandı, login'e yönlendir
 */
export default function ParentForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kod gönderilemedi.');
      } else {
        setStep(2);
      }
    } catch {
      setError('Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = () => {
    setError('');
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('6 haneli kodu eksiksiz girin.');
      return;
    }
    setStep(3);
  };

  const submitNewPassword = async () => {
    setError('');
    if (newPassword.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Şifre en az bir harf ve bir rakam içermeli.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Şifre güncellenemedi.');
      } else {
        setStep(4);
      }
    } catch {
      setError('Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      role="parent"
      title="Şifremi Unuttum"
      subtitle={
        step === 1
          ? 'Lütfen geçerli e-posta adresinizi girin'
          : step === 2
            ? 'E-posta adresinize gönderilen kodu girin'
            : step === 3
              ? 'Yeni şifrenizi belirleyin'
              : 'İşlem başarıyla tamamlandı'
      }
      footer={
        step !== 4 && (
          <Link
            href="/login/veli"
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-pink-600 font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Giriş sayfasına dön
          </Link>
        )
      }
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[13px] text-amber-800">
            Kayıtlı e-posta adresinize 6 haneli bir doğrulama kodu göndereceğiz.
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
              E-posta Adresi
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                placeholder="ornek@email.com"
                aria-label="E-posta"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>
          <button
            onClick={sendCode}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-sm font-extrabold shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>Doğrula <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-emerald-700 mb-0.5">
                  ✓ E-posta doğrulandı
                </p>
                <p className="text-[12.5px] text-gray-600 mb-1">
                  <strong className="text-gray-800 break-all">{email}</strong> adresine 6 haneli kod gönderildi.
                </p>
                <p className="text-[11.5px] text-gray-500">
                  Gelen kutunuzu ve spam klasörünü kontrol edin.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
              6 Haneli Doğrulama Kodu
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && verifyCode()}
                placeholder="000000"
                maxLength={6}
                aria-label="Doğrulama kodu"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-center text-2xl font-bold tracking-[0.5em] tabular-nums focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-[11.5px] text-gray-500 mt-1.5 text-center">
                Kod 10 dakika içinde geçerlidir
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(1); setError(''); setCode(''); }}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Geri
            </button>
            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-sm font-extrabold shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              Devam <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-[13px] text-blue-800">
            <p className="font-bold mb-1">Şifre Kuralları:</p>
            <ul className="space-y-0.5 ml-4 list-disc">
              <li>En az 8 karakter</li>
              <li>En az bir harf ve bir rakam</li>
            </ul>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Yeni Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value.slice(0, 72))}
                onKeyDown={(e) => e.key === 'Enter' && newPassword.length >= 8 && submitNewPassword()}
                placeholder="En az 8 karakter, harf + rakam"
                maxLength={72}
                aria-label="Yeni şifre"
                className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                autoComplete="new-password"
                autoFocus
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
          <div className="flex gap-3">
            <button
              onClick={() => { setStep(2); setError(''); }}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Geri
            </button>
            <button
              onClick={submitNewPassword}
              disabled={loading || newPassword.length < 8}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-sm font-extrabold shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
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
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/40">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-lg font-extrabold text-[#0f2847] mb-2">Şifreniz Güncellendi!</h2>
          <p className="text-sm text-gray-600 mb-6">
            Yeni şifrenizle giriş yapabilirsiniz.
          </p>
          <Link
            href="/login/veli"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Giriş Sayfasına Git <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
