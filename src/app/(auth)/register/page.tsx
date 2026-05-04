'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight, AlertCircle, CheckCircle2, Mail, Calendar, Eye, EyeOff, BookOpen, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { STUDENT_GRADES } from '@/types';
import AuthLayout from '@/components/ui/AuthLayout';

// Doğum tarihinden yaş hesapla
function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    grade: '',
    isGraduated: false,
    password: '',
    kvkk: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const submittingRef = useRef(false);
  const router = useRouter();

  const calculatedAge = useMemo(() => calculateAge(form.birthDate), [form.birthDate]);

  const update = (key: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');

    // Ad/Soyad
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Ad ve soyad alanları boş olamaz.');
      submittingRef.current = false;
      return;
    }

    // E-posta
    const email = form.email.trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Geçerli bir e-posta adresi girin.');
      submittingRef.current = false;
      return;
    }

    // Doğum tarihi
    if (!form.birthDate) {
      setError('Doğum tarihi zorunludur.');
      submittingRef.current = false;
      return;
    }
    if (calculatedAge === null || calculatedAge < 5 || calculatedAge > 100) {
      setError('Geçerli bir doğum tarihi girin.');
      submittingRef.current = false;
      return;
    }

    // Sınıf (mezun değilse zorunlu)
    if (!form.isGraduated && !form.grade) {
      setError('Sınıf seçimi zorunludur. (Mezun iseniz "Mezunum" kutucuğunu işaretleyin.)');
      submittingRef.current = false;
      return;
    }

    // Şifre
    if (form.password.trim().length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      submittingRef.current = false;
      return;
    }

    // KVKK
    if (!form.kvkk) {
      setError('KVKK aydınlatma metnini onaylamanız gerekir.');
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;

    let res: Response;
    try {
      res = await fetch('/api/auth/student-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password: form.password,
          birth_date: form.birthDate,
          age: calculatedAge,
          grade: form.isGraduated ? '' : form.grade,
          is_graduated: form.isGraduated,
        }),
      });
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
      setLoading(false);
      submittingRef.current = false;
      return;
    }

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
      localStorage.setItem('ecup_just_registered_email', email);
    }

    setSuccess(true);
    setTimeout(() => {
      window.location.href = '/login?pending=1';
    }, 2500);
  };

  if (success) {
    return (
      <AuthLayout
        role="student"
        title="Kayıt Başarılı!"
        subtitle="Giriş sayfasına yönlendiriliyorsunuz..."
      >
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40 reg-success-bounce">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 mb-3">
            <p className="text-[12px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">E-posta adresiniz</p>
            <p className="text-base font-extrabold text-violet-600 break-all">{form.email.trim().toLowerCase()}</p>
          </div>
          <p className="text-[12.5px] text-gray-600 flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Giriş yaparken bu e-postayı ve şifrenizi kullanacaksınız.</span>
          </p>
        </div>
        <style>{`
          @keyframes reg-success-bounce {
            0% { transform: scale(0) rotate(-180deg); opacity: 0; }
            50% { transform: scale(1.15) rotate(10deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          .reg-success-bounce {
            animation: reg-success-bounce 700ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
          }
        `}</style>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      role="student"
      title="Kayıt Ol"
      subtitle="Yeni bir öğrenci hesabı oluşturun"
      footer={
        <p className="text-[13px] text-gray-500">
          Zaten hesabınız var mı?{' '}
          <Link href="/login" className="text-violet-600 font-extrabold hover:text-violet-700 hover:underline transition">
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
        {/* Tarayıcı autofill tuzağı */}
        <input type="text" name="prevent_autofill_user" style={{ display: 'none' }} tabIndex={-1} />
        <input type="password" name="prevent_autofill_pass" style={{ display: 'none' }} tabIndex={-1} />

        {/* Ad Soyad */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Ad <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="Ad" maxLength={50} className="w-full pl-11 pr-3 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" required />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Soyad <span className="text-red-500">*</span></label>
            <input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Soyad" maxLength={50} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" required />
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
              onChange={(e) => update('email', e.target.value.trim().toLowerCase())}
              placeholder="ornek@email.com"
              maxLength={100}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Doğum Tarihi */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
            Doğum Tarihi <span className="text-red-500">*</span>
            {calculatedAge !== null && (
              <span className="text-emerald-600 font-normal ml-1">({calculatedAge} yaş)</span>
            )}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => update('birthDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              min="1950-01-01"
              className="w-full pl-11 pr-3 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              required
            />
          </div>
        </div>

        {/* Sınıf */}
        {!form.isGraduated && (
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Sınıf <span className="text-red-500">*</span></label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={form.grade}
                onChange={(e) => update('grade', e.target.value)}
                className="w-full pl-11 pr-3 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all appearance-none"
                required={!form.isGraduated}
              >
                <option value="">Seçin</option>
                {STUDENT_GRADES.filter(g => g.value !== 'mezun').map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Mezun checkbox — sınıf altında */}
        <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
          <input
            type="checkbox"
            checked={form.isGraduated}
            onChange={(e) => update('isGraduated', e.target.checked)}
            className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
          />
          <Award className="w-4 h-4 text-amber-600" />
          <span className="text-[13px] font-semibold text-amber-700">Mezunum</span>
        </label>

        {/* Şifre */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Şifre <span className="text-red-500">*</span></label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="Min. 6 karakter"
              maxLength={72}
              name="ecup_pass_register"
              className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* KVKK */}
        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={form.kvkk}
            onChange={(e) => update('kvkk', e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            required
          />
          <span className="text-[13px] text-gray-600">
            <Link href="/kvkk" className="text-emerald-600 font-semibold hover:underline">KVKK Aydınlatma Metni</Link>&apos;ni okudum ve onaylıyorum.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 text-white text-[14px] font-extrabold shadow-lg shadow-violet-500/40 hover:shadow-xl hover:shadow-violet-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
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
