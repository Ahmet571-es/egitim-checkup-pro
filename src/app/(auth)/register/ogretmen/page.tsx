'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { GraduationCap, User, Lock, Phone, Mail, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthLayout from '@/components/ui/AuthLayout';

// Şifre kuralları — standart 8+ karakter + karmaşıklık
// Eski kural (7 karakter, [A-Z][a-z][0-9]{5}) kaldırıldı — çok kısıtlayıcı
// ve zayıf şifrelere yol açıyordu (Ab12345 gibi kolay tahmin edilebilir).
function validatePassword(pw: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (pw.length < 8) errors.push('Şifre en az 8 karakter olmalıdır.');
  if (pw.length > 72) errors.push('Şifre en fazla 72 karakter olabilir.');
  if (pw.length > 0 && !/[A-Za-z]/.test(pw)) errors.push('Şifre en az bir harf içermeli.');
  if (pw.length > 0 && !/[0-9]/.test(pw)) errors.push('Şifre en az bir rakam içermeli.');
  if (/^(\d+|[a-zA-Z]+)$/.test(pw)) {
    errors.push('Şifre sadece harflerden veya sadece rakamlardan oluşamaz.');
  }
  // Çok yaygın olanları reddet
  const lower = pw.toLowerCase();
  if (['12345678', 'password', 'qwerty12', 'admin123', '11111111'].includes(lower)) {
    errors.push('Bu şifre çok yaygın. Daha güçlü bir şifre seçin.');
  }
  return { valid: errors.length === 0, errors };
}

export default function TeacherRegisterPage() {
  const [step, setStep] = useState(1); // 1: Bilgiler, 2: E-posta Doğrula, 3: Şifre, 4: Başarılı
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '',
    email: '', password: '', verificationCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  const submittingRef = useRef(false);

  // Kayıt başarılı → 3 saniye sonra öğretmen giriş sayfasına yönlendir
  useEffect(() => {
    if (step !== 4) return;
    const t = setTimeout(() => {
      window.location.href = '/login/ogretmen';
    }, 3000);
    return () => clearTimeout(t);
  }, [step]);

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));
  const pwResult = validatePassword(form.password);

  // ADIM 1 doğrulama
  const validateStep1 = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return 'Ad ve soyad zorunludur.';
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 10) return 'Geçerli bir telefon numarası girin.';
    return null;
  };

  // Doğrulama kodu gönder
  const sendCode = async () => {
    if (!form.email.trim() || !form.email.includes('@')) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }
    setSendingCode(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kod gönderilemedi.');
      } else {
        setCodeSent(true);
      }
    } catch {
      setError('Bağlantı hatası.');
    } finally {
      setSendingCode(false);
    }
  };

  // Kodu doğrula
  const verifyCode = async () => {
    if (!form.verificationCode.trim()) {
      setError('Doğrulama kodunu girin.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), code: form.verificationCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kod doğrulanamadı.');
      } else {
        setCodeVerified(true);
        setStep(3);
      }
    } catch {
      setError('Bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  // Kayıt gönder
  const handleSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');

    if (!pwResult.valid) {
      setError('Şifre kurallarına uygun değil.');
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    try {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
      const authEmail = form.email.trim().toLowerCase();

      // Yeni self-serve kayıt — Supabase built-in email HİÇ tetiklenmez
      // (2/saat rate limit tamamen bypass edilir).
      const res = await fetch('/api/auth/teacher-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email: authEmail,
          password: form.password,
          phone: form.phone.replace(/\D/g, ''),
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

      // Giriş bilgilerini localStorage'a kaydet (login sayfasında otomatik doldurulsun)
      if (typeof window !== 'undefined') {
        localStorage.setItem('ecup_teacher_email', authEmail);
      }

      setStep(4);
    } catch {
      setError('Beklenmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  // Başarılı ekranı
  if (step === 4) {
    return (
      <AuthLayout
        role="teacher"
        title="Başvurunuz Alındı!"
        subtitle="Öğretmen giriş sayfasına yönlendiriliyorsunuz..."
      >
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40 reg-success-bounce">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 mb-3">
            <p className="text-[13px] font-extrabold text-amber-800 flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              Yönetici onayı bekleniyor
            </p>
            <p className="text-[12px] text-amber-700 mt-1">Başvurunuz onaylandıktan sonra sisteme giriş yapabileceksiniz.</p>
          </div>
          <p className="text-[12.5px] text-gray-600">Kayıt işleminiz başarıyla tamamlandı.</p>
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
      role="teacher"
      title="Öğretmen Kayıt"
      subtitle="Yeni bir öğretmen hesabı oluşturun"
      wide
      footer={
        <p className="text-[13px] text-gray-500">
          Zaten hesabınız var mı?{' '}
          <Link href="/login/ogretmen" className="text-emerald-600 font-extrabold hover:text-emerald-700 hover:underline transition">
            Giriş Yapın →
          </Link>
        </p>
      }
    >
      {/* İlerleme */}
      <div className="flex gap-1.5 mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            ))}
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* ADIM 1: Kişisel Bilgiler */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Ad <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="Ad" aria-label="Ad" className="w-full pl-11 pr-3 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Soyad <span className="text-red-500">*</span></label>
                  <input type="text" value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Soyad" aria-label="Soyad" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Telefon <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="05XX XXX XX XX" aria-label="Telefon" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" />
                </div>
              </div>
              <button
                onClick={() => { const err = validateStep1(); if (err) { setError(err); } else { setError(''); setStep(3); } }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2"
              >
                Devam Et <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ADIM 2: E-posta Doğrulama */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">E-posta Adresi <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    placeholder="ornek@email.com"
                    disabled={codeSent}
                    aria-label="E-posta"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {!codeSent ? (
                <button
                  onClick={sendCode}
                  disabled={sendingCode}
                  className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {sendingCode ? 'Gönderiliyor...' : <>Doğrulama Kodu Gönder <Mail className="w-4 h-4" /></>}
                </button>
              ) : !codeVerified ? (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <p className="text-sm text-emerald-700 font-semibold">Kod gönderildi!</p>
                    <p className="text-xs text-emerald-600 mt-1">E-posta adresinize 6 haneli doğrulama kodu gönderdik. 10 dakika içinde girin.</p>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Doğrulama Kodu <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.verificationCode}
                        onChange={e => update('verificationCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6 haneli kod"
                        maxLength={6}
                        aria-label="Doğrulama kodu"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm text-center text-lg font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setCodeSent(false); setError(''); }} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> Tekrar Gönder
                    </button>
                    <button
                      onClick={verifyCode}
                      disabled={loading || form.verificationCode.length !== 6}
                      className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {loading ? 'Doğrulanıyor...' : <>Doğrula <CheckCircle2 className="w-4 h-4" /></>}
                    </button>
                  </div>
                </>
              ) : null}

              <button onClick={() => { setStep(1); setError(''); }} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Geri Dön
              </button>
            </div>
          )}

          {/* ADIM 3: Şifre Belirleme */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-[13px] font-bold text-blue-800 mb-2">Şifre Kuralları:</p>
                <ul className="space-y-1 text-[12px] text-blue-700">
                  <li className="flex items-start gap-1.5">
                    <span className={form.password.length >= 8 ? 'text-emerald-500' : 'text-gray-400'}>●</span>
                    En az <strong>8 karakter</strong>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className={/[A-Za-z]/.test(form.password) ? 'text-emerald-500' : 'text-gray-400'}>●</span>
                    En az <strong>bir harf</strong>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className={/[0-9]/.test(form.password) ? 'text-emerald-500' : 'text-gray-400'}>●</span>
                    En az <strong>bir rakam</strong>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className={form.password.length > 0 && !/^(\d+|[a-zA-Z]+)$/.test(form.password) ? 'text-emerald-500' : 'text-gray-400'}>●</span>
                    Sadece harf veya sadece rakam <strong>olmamalı</strong>
                  </li>
                </ul>
                <div className="mt-3 p-2 bg-blue-100 rounded-lg text-center">
                  <p className="text-[11px] text-blue-600">İpucu: Güçlü şifre için büyük/küçük harf, rakam ve sembol karıştırın.</p>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Şifre <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => {
                      const val = e.target.value.slice(0, 72);
                      update('password', val);
                    }}
                    placeholder="En az 8 karakter"
                    maxLength={72}
                    aria-label="Şifre"
                    className={`w-full pl-11 pr-11 py-3 rounded-xl border bg-white/60 text-sm focus:outline-none focus:ring-2 transition-all ${
                      form.password.length >= 8
                        ? pwResult.valid
                          ? 'border-emerald-300 focus:ring-emerald-500/30'
                          : 'border-red-300 focus:ring-red-500/30'
                        : 'border-gray-200 focus:ring-emerald-500/30'
                    }`}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1} aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <p className={`text-[12px] mt-1.5 font-semibold ${pwResult.valid ? 'text-emerald-600' : 'text-red-500'}`}>
                    {pwResult.valid ? '✓ Şifre kurallara uygun!' : pwResult.errors[0]}
                  </p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">{form.password.length} karakter</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setStep(1); setError(''); }} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Geri
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !pwResult.valid}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? 'Kayıt yapılıyor...' : <>Kayıt Ol <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}
    </AuthLayout>
  );
}
