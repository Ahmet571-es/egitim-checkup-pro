'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  GraduationCap, User, Lock, Phone, Mail, ArrowRight,
  AlertCircle, CheckCircle2, Eye, EyeOff,
} from 'lucide-react';
import AuthLayout from '@/components/ui/AuthLayout';

function validatePassword(pw: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (pw.length < 6) errors.push('Şifre en az 6 karakter olmalıdır.');
  if (pw.length > 72) errors.push('Şifre en fazla 72 karakter olabilir.');
  return { valid: errors.length === 0, errors };
}

export default function TeacherRegisterPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '',
    email: '', password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const submittingRef = useRef(false);

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));
  const pwResult = validatePassword(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Ad ve soyad zorunludur.');
      submittingRef.current = false;
      return;
    }
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Geçerli bir telefon numarası girin.');
      submittingRef.current = false;
      return;
    }
    const email = form.email.trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Geçerli bir e-posta adresi girin.');
      submittingRef.current = false;
      return;
    }
    if (!pwResult.valid) {
      setError(pwResult.errors[0]);
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    try {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;

      const res = await fetch('/api/auth/teacher-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password: form.password,
          phone: digits,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409) {
          setError('Bu e-posta adresi zaten kayıtlı.');
        } else {
          setError(data.error || 'Kayıt oluşturulamadı.');
        }
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      // Login sayfasında auto-fill için
      if (typeof window !== 'undefined') {
        localStorage.setItem('ecup_teacher_email', email);
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/login/ogretmen?pending=1';
      }, 2500);
    } catch {
      setError('Beklenmeyen bir hata oluştu.');
      setLoading(false);
      submittingRef.current = false;
    }
  };

  if (success) {
    return (
      <AuthLayout
        role="teacher"
        title="Kayıt Başarılı!"
        subtitle="Yönetici onayı bekleniyor..."
      >
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <p className="text-sm text-gray-700 mb-2">
            Kaydınız alındı. Okul yöneticiniz hesabınızı onayladıktan sonra
            giriş yapabilirsiniz.
          </p>
          <p className="text-[12.5px] text-gray-500">
            Giriş sayfasına yönlendiriliyorsunuz...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      role="teacher"
      title="Öğretmen Kayıt"
      subtitle="Yeni bir öğretmen hesabı oluşturun"
      footer={
        <p className="text-[13px] text-gray-500">
          Zaten hesabınız var mı?{' '}
          <Link href="/login/ogretmen" className="text-emerald-600 font-extrabold hover:text-emerald-700 hover:underline transition">
            Giriş Yapın →
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

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <input type="text" name="prevent_autofill_user" style={{ display: 'none' }} tabIndex={-1} />
        <input type="password" name="prevent_autofill_pass" style={{ display: 'none' }} tabIndex={-1} />

        {/* Ad / Soyad */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Ad <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                placeholder="Ad"
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Soyad <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              placeholder="Soyad"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Telefon <span className="text-red-500">*</span></label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="0532 555 55 55"
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
          </div>
        </div>

        {/* E-posta */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">E-posta <span className="text-red-500">*</span></label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="ornek@email.com"
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Şifre */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Şifre <span className="text-red-500">*</span></label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="En az 6 karakter"
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              autoComplete="new-password"
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[14px] font-extrabold shadow-lg shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Kayıt yapılıyor...
            </>
          ) : (
            <>Kayıt Ol <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
