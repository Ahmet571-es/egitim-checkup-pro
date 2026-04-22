'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Lock, Mail, Key, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthLayout from '@/components/ui/AuthLayout';

export default function VeliRegisterPage() {
  const supabase = createClient();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    studentCode: '',
  });
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

  const handleSubmit = async () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);

    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const code = form.studentCode.trim().toUpperCase();

    // Yeni self-serve kayıt API'si — Supabase built-in email tetiklenmez
    let registerRes: Response;
    try {
      registerRes = await fetch('/api/auth/parent-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email: form.email.trim().toLowerCase(),
          password: form.password,
          student_code: code,
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

    // Hesap oluştu + çocuk bağlandı → otomatik giriş yapmak için signInWithPassword
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });

    if (signInErr) {
      // Hesap oluştu ama otomatik giriş fail — kullanıcıya login'e yönlendir
      setSuccess('Hesabınız oluşturuldu. Giriş sayfasına yönlendiriliyorsun...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1200);
      return;
    }

    // Başarılı giriş → dashboard veya my-children
    // API'den gelen approval_pending flag'ine göre mesajı özelleştir
    if (registerData.approval_pending) {
      setSuccess(
        'Kayıt başarılı! Bağlantınız öğretmen onayı bekliyor. Panele yönlendiriliyorsun...',
      );
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

  return (
    <AuthLayout
      role="parent"
      title="Veli Hesabı Oluştur"
      subtitle="Çocuğunuzun gelişimini takip etmek için kayıt olun"
    >
      <div className="w-full max-w-md">

        {success ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-emerald-900 dark:text-emerald-100 font-semibold leading-relaxed">
              {success}
            </p>
          </div>
        ) : (
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
                    aria-label="Ad"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Soyad</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => update('lastName', e.target.value)}
                    aria-label="Soyad"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="ornek@email.com"
                  aria-label="E-posta"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="En az 6 karakter"
                  aria-label="Şifre"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Şifreyi göster/gizle"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Öğrenci kodu */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Çocuğunuzun Öğrenci Kodu
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.studentCode}
                  onChange={(e) => update('studentCode', e.target.value.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  aria-label="Öğrenci kodu"
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-sm text-center text-base font-bold tracking-[0.35em] font-mono text-pink-700 dark:text-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                6 karakter. Kodu öğretmenden/okul rehberlik servisinden alabilirsiniz.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
            >
              {loading ? 'Kayıt oluşturuluyor...' : (<>Veli Hesabı Oluştur <ArrowRight className="w-4 h-4" /></>)}
            </button>

            <div className="text-center text-xs text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-800">
              Zaten hesabın var mı?{' '}
              <Link href="/login" className="text-pink-600 dark:text-pink-400 font-semibold hover:underline">
                Giriş yap
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
