'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User, Lock, Mail, Key, ArrowRight, ArrowLeft,
  AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthLayout from '@/components/ui/AuthLayout';

/**
 * Veli Kayıt — 2 Adımlı E-posta Doğrulama Akışı
 *   1) Form doldur (Ad, Soyad, E-posta, Öğrenci Kodu, Şifre)
 *      → POST /api/auth/send-code (e-postaya 6 haneli kod)
 *   2) Kod gir + Onayla
 *      → POST /api/auth/parent-register (kod doğrula + hesap oluştur + bağla)
 */
export default function VeliRegisterPage() {
  const supabase = createClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    studentCode: '',
  });
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const validate = (): string | null => {
    if (!form.firstName.trim() || !form.lastName.trim()) return 'Ad ve soyad girin.';
    if (!form.email.trim() || !form.email.includes('@')) return 'Geçerli bir e-posta girin.';
    if (form.password.length < 6) return 'Şifre en az 6 karakter olmalı.';
    const code = form.studentCode.trim().toUpperCase();
    if (code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
      return 'Öğrenci kodu 6 karakter, büyük harf ve rakam olmalı.';
    }
    return null;
  };

  // ── ADIM 1: Form valide et + kod gönder ──
  const sendCode = async () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Doğrulama kodu gönderilemedi.');
        setLoading(false);
        return;
      }
      setStep(2);
    } catch {
      setError('Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // ── ADIM 2: Kodu doğrula + hesap oluştur + auto-login ──
  const verifyAndRegister = async () => {
    setError('');
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('6 haneli doğrulama kodunu eksiksiz girin.');
      return;
    }

    setLoading(true);
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const studentCode = form.studentCode.trim().toUpperCase();
    const email = form.email.trim().toLowerCase();

    let registerRes: Response;
    try {
      registerRes = await fetch('/api/auth/parent-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password: form.password,
          student_code: studentCode,
          code,
        }),
      });
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
      setLoading(false);
      return;
    }

    const registerData = await registerRes.json().catch(() => ({}));
    if (!registerRes.ok) {
      setError(registerData.error || 'Kayıt oluşturulamadı.');
      setLoading(false);
      return;
    }

    // Otomatik giriş
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password: form.password,
    });

    if (signInErr) {
      setSuccess('Hesabınız oluşturuldu. Giriş sayfasına yönlendiriliyorsun...');
      setTimeout(() => {
        window.location.href = '/login/veli';
      }, 1200);
      return;
    }

    if (registerData.approval_pending) {
      setSuccess('Kayıt başarılı! Bağlantınız öğretmen onayı bekliyor. Panele yönlendiriliyorsun...');
    } else {
      setSuccess(
        registerData.child_linked
          ? 'Kayıt başarılı! Panele yönlendiriliyorsun...'
          : 'Kayıt başarılı! Çocuğunuzu eklemek için yönlendiriliyorsun...',
      );
    }
    setTimeout(() => {
      window.location.href = registerData.child_linked
        ? '/parent/dashboard'
        : '/parent/my-children';
    }, 1200);
  };

  // ── Kodu yeniden gönder ──
  const resendCode = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Kod gönderilemedi.');
    } catch {
      setError('Bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────── BAŞARI ───────────────────
  if (success) {
    return (
      <AuthLayout
        role="parent"
        title="Kayıt Başarılı!"
        subtitle="Yönlendiriliyorsunuz..."
      >
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm text-emerald-900 dark:text-emerald-100 font-semibold leading-relaxed">
            {success}
          </p>
        </div>
      </AuthLayout>
    );
  }

  // ─────────────────── ADIM 2: KOD GIR ───────────────────
  if (step === 2) {
    return (
      <AuthLayout
        role="parent"
        title="E-posta Doğrulaması"
        subtitle="E-posta adresinize gönderilen 6 haneli kodu girin"
        footer={
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setCode('');
              setError('');
            }}
            className="text-[13px] text-gray-500 hover:text-pink-600 font-semibold transition"
          >
            ← Bilgileri düzenle
          </button>
        }
      >
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-gray-500 font-semibold uppercase tracking-wider">Kod gönderildi</p>
              <p className="text-sm font-extrabold text-emerald-700 break-all">
                {form.email.trim().toLowerCase()}
              </p>
              <p className="text-[12px] text-gray-600 mt-1.5">
                E-postanı kontrol et. Spam klasörünü de kontrol etmeyi unutma.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              6 Haneli Doğrulama Kodu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && code.length === 6) verifyAndRegister();
              }}
              placeholder="000000"
              autoFocus
              className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-center text-2xl font-bold tracking-[0.5em] tabular-nums"
            />
            <p className="text-[11.5px] text-gray-500 mt-1.5 text-center">
              Kod 10 dakika içinde geçerlidir
            </p>
          </div>

          <button
            type="button"
            onClick={verifyAndRegister}
            disabled={loading || code.length !== 6}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-extrabold shadow-lg shadow-pink-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Kayıt tamamlanıyor...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Onayla ve Kayıt Ol
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resendCode}
            disabled={loading}
            className="w-full py-2.5 text-[12.5px] text-gray-500 hover:text-pink-600 font-semibold transition disabled:opacity-50"
          >
            Kodu almadın mı? Yeni kod gönder
          </button>
        </div>
      </AuthLayout>
    );
  }

  // ─────────────────── ADIM 1: FORM ───────────────────
  return (
    <AuthLayout
      role="parent"
      title="Veli Hesabı Oluştur"
      subtitle="Çocuğunuzun gelişimini takip etmek için kayıt olun"
      footer={
        <p className="text-[13px] text-gray-500">
          Zaten hesabın var mı?{' '}
          <Link href="/login/veli" className="text-pink-600 font-extrabold hover:text-pink-700 hover:underline transition">
            Giriş Yap →
          </Link>
        </p>
      }
    >
      <div className="w-full max-w-md">
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-pink-200/60 dark:border-slate-700 rounded-2xl p-6 shadow-lg space-y-4">
          {/* Ad / Soyad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Ad</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  placeholder="Adınız"
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                  autoComplete="given-name"
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Soyad</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                placeholder="Soyadınız"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* E-posta */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5">E-posta</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="ornek@email.com"
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Şifre */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Öğrenci Kodu */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Öğrenci Kodu
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.studentCode}
                onChange={(e) => update('studentCode', e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                maxLength={6}
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 uppercase tracking-[0.2em] font-bold"
              />
            </div>
            <p className="text-[11.5px] text-gray-500 mt-1.5">
              Çocuğunuzun öğretmeninden aldığınız 6 haneli kod
            </p>
          </div>

          <button
            type="button"
            onClick={sendCode}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-extrabold shadow-lg shadow-pink-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Doğrulama kodu gönderiliyor...
              </>
            ) : (
              <>
                Doğrulama Kodu Gönder
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
