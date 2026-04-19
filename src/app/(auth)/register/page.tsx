'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, User, Lock, Building, ArrowRight, AlertCircle, CheckCircle2, Phone, MapPin, AtSign, Calendar, Eye, EyeOff, BookOpen, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ROLE_PATHS, STUDENT_GRADES } from '@/types';
import type { UserRole } from '@/types';
import AuthLayout from '@/components/ui/AuthLayout';

// Türkçe karakterleri ASCII'ye çevir
function turkishToAscii(str: string): string {
  const map: Record<string, string> = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u',
  };
  return str.replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => map[ch] || ch);
}

// Ad, soyad ve telefon son 4 hanesinden kullanıcı adı üret
function generateUsername(firstName: string, lastName: string, phone: string): string {
  const ad = turkishToAscii(firstName.trim().toLowerCase()).replace(/[^a-z]/g, '');
  const soyad = turkishToAscii(lastName.trim().toLowerCase()).replace(/[^a-z]/g, '');
  const digits = phone.replace(/\D/g, '');
  const last4 = digits.length >= 4 ? digits.slice(-4) : '';
  if (!ad || !soyad || !last4) return '';
  return `${ad}_${soyad}_${last4}`;
}

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
    firstName: '', lastName: '', phone: '', city: '', district: '',
    gender: '', birthDate: '', username: '', password: '', role: 'student' as UserRole,
    schoolName: '', grade: '', section: '', teacherId: '', isGraduated: false, kvkk: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameWarning, setUsernameWarning] = useState('');
  const [teachers, setTeachers] = useState<Array<{ id: string; full_name: string; branch: string; school_name: string }>>([]);
  const submittingRef = useRef(false);
  const router = useRouter();

  // Öğretmen listesini yükle
  useEffect(() => {
    fetch('/api/public/teachers')
      .then((r) => r.json())
      .then((d) => setTeachers(d.teachers || []))
      .catch(() => setTeachers([]));
  }, []);

  // Beklenen kullanıcı adı (ad + soyad + telefon son 4 hane)
  const expectedUsername = useMemo(
    () => generateUsername(form.firstName, form.lastName, form.phone),
    [form.firstName, form.lastName, form.phone]
  );

  // Yaş otomatik hesaplama
  const calculatedAge = useMemo(() => calculateAge(form.birthDate), [form.birthDate]);

  const update = (key: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === 'username' || key === 'firstName' || key === 'lastName' || key === 'phone') {
      setUsernameWarning('');
    }
  };

  // Kullanıcı adı doğrulama
  const validateUsername = (value: string) => {
    if (!expectedUsername) return;
    if (value && value !== expectedUsername) {
      setUsernameWarning(`Kullanıcı adınız şu formatta olmalıdır: ${expectedUsername}`);
    } else {
      setUsernameWarning('');
    }
  };

  const sanitizePhone = (val: string) => val.replace(/\D/g, '');

  const usernameToEmail = (uname: string) => `${uname}@ogrenci.egitimcheckup.com`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');

    // Şifre kontrolü
    if (form.password.trim().length < 6) {
      setError('Şifre en az 6 karakter olmalı (boşluklar sayılmaz).');
      submittingRef.current = false;
      return;
    }

    // Ad/Soyad
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Ad ve soyad alanları boş olamaz.');
      submittingRef.current = false;
      return;
    }

    // Telefon kontrolü
    const phoneDigits = sanitizePhone(form.phone);
    if (phoneDigits.length < 10) {
      setError('Geçerli bir cep telefonu numarası girin (en az 10 haneli).');
      submittingRef.current = false;
      return;
    }

    // Cinsiyet kontrolü
    if (!form.gender) {
      setError('Cinsiyet seçimi zorunludur.');
      submittingRef.current = false;
      return;
    }

    // Doğum tarihi kontrolü
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

    // Kullanıcı adı kontrolü
    if (!form.username.trim()) {
      setError('Kullanıcı adı zorunludur.');
      submittingRef.current = false;
      return;
    }
    if (form.username !== expectedUsername) {
      setError(`Kullanıcı adınız şu formatta olmalıdır: ${expectedUsername}`);
      submittingRef.current = false;
      return;
    }

    // Adres kontrolü
    if (!form.city.trim() || !form.district.trim()) {
      setError('İl ve ilçe alanları zorunludur.');
      submittingRef.current = false;
      return;
    }

    // Öğrenci ise sınıf + öğretmen zorunlu (mezun değilse şube de)
    if (form.role === 'student') {
      if (!form.isGraduated && !form.grade) {
        setError('Sınıf seçimi zorunludur. (Mezun iseniz "Mezunum" kutucuğunu işaretleyin.)');
        submittingRef.current = false;
        return;
      }
      if (!form.isGraduated && !form.section.trim()) {
        setError('Şube alanı zorunludur. (Örn: A, B, C)');
        submittingRef.current = false;
        return;
      }
      if (!form.teacherId) {
        setError('Öğretmeninizi seçin.');
        submittingRef.current = false;
        return;
      }
    }

    // Okul adı zorunlu
    if (!form.schoolName.trim()) {
      setError('Okul adı zorunludur.');
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const fullName = `${form.firstName} ${form.lastName}`.trim();
    const autoEmail = usernameToEmail(form.username);
    // Şube her zaman büyük harf + temiz
    const cleanSection = form.section.trim().toUpperCase();

    const { error: authError } = await supabase.auth.signUp({
      email: autoEmail,
      password: form.password,
      options: {
        data: {
          full_name: fullName,
          username: form.username,
          role: form.role,
          school_name: form.schoolName.trim(),
          grade: form.role === 'student' && !form.isGraduated ? form.grade : '',
          section: form.role === 'student' && !form.isGraduated ? cleanSection : '',
          is_graduated: form.role === 'student' && form.isGraduated,
          assigned_teacher_id: form.role === 'student' ? form.teacherId : '',
          phone: phoneDigits,
          gender: form.gender,
          birth_date: form.birthDate,
          age: calculatedAge,
          city: form.city.trim(),
          district: form.district.trim(),
        },
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('Bu kullanıcı adı zaten kayıtlı. Lütfen bilgilerinizi kontrol edin.');
      } else {
        setError(authError.message);
      }
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    // Kayıt sonrası oturumu kapat (giriş sayfasından tekrar giriş yapması için)
    await supabase.auth.signOut();

    // Kullanıcı adını tek seferlik kaydet (giriş sayfasına yönlenince bir kez doldurulsun, sonra silinsin)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ecup_username'); // eski kalıcı kaydı temizle
      localStorage.setItem('ecup_just_registered', form.username);
    }

    setSuccess(true);
    // Giriş Yap sayfasına sert yönlendirme (window.location ile — middleware müdahale edemez)
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
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
            <p className="text-[12px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">Kullanıcı adınız</p>
            <p className="text-xl font-extrabold text-violet-600 font-mono">{form.username}</p>
          </div>
          <p className="text-[12.5px] text-gray-600 flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Bu kullanıcı adını unutmayın, giriş yaparken kullanacaksınız.</span>
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
      wide
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

            {/* Cep Numarası */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Cep Numarası <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(öğrenci veya veli)</span></label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="05XX XXX XX XX" maxLength={15} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" required />
              </div>
            </div>

            {/* Cinsiyet + Doğum Tarihi */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Cinsiyet <span className="text-red-500">*</span></label>
                <select
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  required
                >
                  <option value="">Seçiniz</option>
                  <option value="erkek">Erkek</option>
                  <option value="kadin">Kadın</option>
                </select>
              </div>
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
            </div>

            {/* Ev Adresi: İl, İlçe */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">İl <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Ankara" maxLength={50} className="w-full pl-11 pr-3 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" required />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">İlçe <span className="text-red-500">*</span></label>
                <input type="text" value={form.district} onChange={(e) => update('district', e.target.value)} placeholder="Çankaya" maxLength={50} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" required />
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

            {/* Kullanıcı Adı */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Kullanıcı Adı <span className="text-red-500">*</span>
                {expectedUsername && (
                  <span className="text-gray-400 font-normal ml-1">({expectedUsername})</span>
                )}
              </label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/\s/g, '');
                    update('username', val);
                  }}
                  onBlur={() => validateUsername(form.username)}
                  placeholder={expectedUsername || 'ad_soyad_XXXX'}
                  maxLength={100}
                  className={`w-full pl-11 pr-10 py-3 rounded-xl border bg-white/60 text-sm focus:outline-none focus:ring-2 transition-all ${
                    usernameWarning
                      ? 'border-red-300 focus:ring-red-500/30 focus:border-red-400'
                      : form.username && form.username === expectedUsername
                        ? 'border-emerald-300 focus:ring-emerald-500/30 focus:border-emerald-400'
                        : 'border-gray-200 focus:ring-emerald-500/30 focus:border-emerald-400'
                  }`}
                  required
                />
                {form.username && form.username === expectedUsername && (
                  <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
              {usernameWarning && (
                <p className="text-[12px] text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {usernameWarning}
                </p>
              )}
              {!usernameWarning && !form.username && (
                <p className="text-[12px] text-gray-400 mt-1.5">
                  {expectedUsername
                    ? 'Yukarıdaki bilgilerden oluşan kullanıcı adınızı girin. Giriş yaparken bunu kullanacaksınız.'
                    : 'Önce ad, soyad ve telefon numaranızı girin.'}
                </p>
              )}
            </div>

            {/* Rol */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Rol</label>
              <select value={form.role} onChange={(e) => update('role', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all">
                <option value="student">Öğrenci</option>
                <option value="school_admin">Okul Yöneticisi</option>
              </select>
            </div>

            {/* Sınıf + Şube + Öğretmen (öğrenci ise) */}
            {form.role === 'student' && (
              <>
                {/* Mezun mu? */}
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

                {/* Aktif öğrenci ise sınıf + şube */}
                {!form.isGraduated && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Sınıf <span className="text-red-500">*</span></label>
                      <select
                        value={form.grade}
                        onChange={(e) => update('grade', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                        required
                      >
                        <option value="">Seçin</option>
                        {STUDENT_GRADES.filter(g => g.value !== 'mezun').map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Şube <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={form.section}
                        onChange={(e) => update('section', e.target.value.toUpperCase().replace(/[^A-ZÇĞİÖŞÜ]/g, ''))}
                        placeholder="A"
                        maxLength={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Sınıf + Şube önizleme */}
                {!form.isGraduated && form.grade && form.section && (
                  <p className="text-[12px] text-emerald-600 -mt-2 font-semibold flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Sınıfınız: {form.grade}/{form.section}
                  </p>
                )}

                {/* Öğretmen seçimi */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Öğretmeniniz <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.teacherId}
                    onChange={(e) => update('teacherId', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                    required
                  >
                    <option value="">
                      {teachers.length === 0 ? 'Öğretmen yükleniyor...' : 'Öğretmeninizi seçin'}
                    </option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}{t.branch ? ` — ${t.branch}` : ''}{t.school_name ? ` (${t.school_name})` : ''}
                      </option>
                    ))}
                  </select>
                  {teachers.length === 0 && (
                    <p className="text-[11px] text-gray-400 mt-1">Sistemde henüz onaylı öğretmen yok. Lütfen daha sonra deneyin.</p>
                  )}
                </div>
              </>
            )}

            {/* Okul Adı */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Okul Adı <span className="text-red-500">*</span></label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={form.schoolName} onChange={(e) => update('schoolName', e.target.value)} placeholder="Okulunuzun tam adı" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" required />
              </div>
            </div>

            {/* KVKK */}
            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input type="checkbox" checked={form.kvkk} onChange={(e) => update('kvkk', e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" required />
              <span className="text-[13px] text-gray-600">
                <Link href="/kvkk" className="text-emerald-600 font-semibold hover:underline">KVKK Aydınlatma Metni</Link>&apos;ni okudum ve onaylıyorum.
              </span>
            </label>

        <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 text-white text-[14px] font-extrabold shadow-lg shadow-violet-500/40 hover:shadow-xl hover:shadow-violet-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]">
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
