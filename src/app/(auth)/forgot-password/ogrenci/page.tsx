'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/components/ui/AuthLayout';

/**
 * Öğrenci için şifremi unuttum akışı.
 * /forgot-password/ogretmen ile aynı endpoint'leri kullanır —
 * password-reset-send ve password-reset-verify endpoint'leri rol
 * ayrımı yapmaz, email üzerinden çalışır.
 */
export default function StudentForgotPasswordPage() {
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
    if (!trimmed || !trimmed.includes('@')) {
      setError('Geçerli bir e-posta girin.');
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
      role="student"
      title="Şifremi Unuttum"
      subtitle="Öğrenci veya veli hesabınız için yeni şifre belirleyin"
      footer={
        <p className="text-[13px] text-gray-500">
          <Link href="/login" className="text-sky-600 font-extrabold hover:text-sky-700 hover:underline transition">
            ← Giriş sayfasına dön
          </Link>
        </p>
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
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">E-posta Adresi</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                aria-label="E-posta"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                autoComplete="email"
              />
            </div>
          </div>
          <button
            onClick={sendCode}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? 'Gönderiliyor...' : <>Doğrulama Kodu Gönder <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-[13px] text-sky-800">
            <strong>{email}</strong> adresine 6 haneli kod gönderildi.
            Gelen kutunuzu ve spam klasörünü kontrol edin.
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Doğrulama Kodu</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 haneli kod"
                maxLength={6}
                aria-label="Doğrulama kodu"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-center text-lg font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                autoComplete="one-time-code"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setStep(1); setError(''); setCode(''); }}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Geri
            </button>
            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
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
                placeholder="En az 8 karakter"
                maxLength={72}
                aria-label="Yeni şifre"
                className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
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
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Geri
            </button>
            <button
              onClick={submitNewPassword}
              disabled={loading || newPassword.length < 8}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Kaydediliyor...' : <>Şifreyi Güncelle <CheckCircle2 className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/40">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-lg font-extrabold text-[#0f2847] mb-2">Şifreniz Güncellendi!</h2>
          <p className="text-sm text-gray-600 mb-6">
            Yeni şifrenizle giriş yapabilirsiniz.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Giriş Sayfasına Git <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
