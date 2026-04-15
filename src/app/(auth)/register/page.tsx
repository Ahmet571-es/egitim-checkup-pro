'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, User, Lock, Building, ArrowRight, AlertCircle, CheckCircle2, Phone, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ROLE_PATHS, STUDENT_GRADES } from '@/types';
import type { UserRole } from '@/types';

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', address: '',
    password: '', role: 'student' as UserRole,
    schoolName: '', grade: '', kvkk: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const submittingRef = useRef(false);
  const router = useRouter();

  const update = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  // Telefon numarasını temizle (sadece rakam)
  const sanitizePhone = (val: string) => val.replace(/\D/g, '');

  // Telefon numarasından otomatik e-posta üret
  const phoneToEmail = (phone: string) => {
    const digits = sanitizePhone(phone);
    return `${digits}@ogrenci.egitimcheckup.com`;
  };

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

    // Ad/Soyad boş olmasın
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

    // Adres kontrolü
    if (!form.address.trim()) {
      setError('Ev adresi zorunludur.');
      submittingRef.current = false;
      return;
    }

    // Öğrenci ise sınıf zorunlu
    if (form.role === 'student' && !form.grade) {
      setError('Öğrenci için sınıf seçimi zorunludur.');
      submittingRef.current = false;
      return;
    }

    // Okul adı zorunlu
    if (!form.schoolName.trim()) {
      setError('Okul adı zorunludur.');
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Okulu adıyla bul
    let schoolId: string | null = null;
    if (form.schoolName.trim()) {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .ilike('name', form.schoolName.trim())
        .maybeSingle();
      if (school) {
        schoolId = school.id;
      } else {
        setError('Bu isimde bir okul bulunamadı. Lütfen okulunuzun kayıtlı adını doğru girin.');
        setLoading(false);
        submittingRef.current = false;
        return;
      }
    }

    const fullName = `${form.firstName} ${form.lastName}`.trim();
    const isGraduated = form.role === 'student' && form.grade === 'mezun';
    const autoEmail = phoneToEmail(form.phone);

    const { error: authError } = await supabase.auth.signUp({
      email: autoEmail,
      password: form.password,
      options: {
        data: {
          full_name: fullName,
          role: form.role,
          school_id: schoolId,
          grade: form.role === 'student' ? form.grade : '',
          is_graduated: isGraduated,
          phone: phoneDigits,
          address: form.address.trim(),
        },
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('Bu telefon numarası zaten kayıtlı.');
      } else {
        setError(authError.message);
      }
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    if (form.kvkk && schoolId && form.role === 'school_admin') {
      await supabase
        .from('schools')
        .update({ kvkk_accepted_at: new Date().toISOString() })
        .eq('id', schoolId)
        .is('kvkk_accepted_at', null);
    }

    setSuccess(true);
    setTimeout(() => router.push(ROLE_PATHS[form.role]), 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-[#f0fdf8] px-4">
        <div className="bg-white/72 backdrop-blur-[20px] rounded-3xl border border-white/40 shadow-xl p-8 text-center max-w-md">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#0f2847] mb-2">Kayıt Başarılı!</h2>
          <p className="text-sm text-gray-500">Yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-[#f0fdf8] px-4 py-12">
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/20 blur-3xl" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-200/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-[#0f2847]">Eğitim Check-Up</h1>
        </Link>

        <div className="bg-white/72 backdrop-blur-[20px] rounded-3xl border border-white/40 shadow-xl p-8">
          <h2 className="text-2xl font-extrabold text-[#0f2847] text-center mb-1">Kayıt Ol</h2>
          <p className="text-sm text-gray-500 text-center mb-8">Yeni hesap oluşturun</p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Ev Adresi */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Ev Adresi <span className="text-red-500">*</span></label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <textarea value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Mahalle, sokak, no, ilçe / il" rows={2} maxLength={300} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all resize-none" required />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Şifre <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Min. 6 karakter" maxLength={72} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" required minLength={6} />
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Rol</label>
              <select value={form.role} onChange={(e) => update('role', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all">
                <option value="student">Öğrenci</option>
                <option value="teacher">Öğretmen</option>
                <option value="school_admin">Okul Yöneticisi</option>
                <option value="parent">Veli</option>
              </select>
            </div>

            {/* Sınıf (öğrenci ise) */}
            {form.role === 'student' && (
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Sınıf <span className="text-red-500">*</span></label>
                <select
                  value={form.grade}
                  onChange={(e) => update('grade', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  required
                >
                  <option value="">Sınıfınızı seçin</option>
                  {STUDENT_GRADES.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                {form.grade === 'mezun' && (
                  <p className="text-[12px] text-emerald-600 mt-1.5 font-semibold">Mezun olarak kayıt yapıyorsunuz.</p>
                )}
              </div>
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

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? 'Kayıt yapılıyor...' : <>Kayıt Ol <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="text-emerald-600 font-semibold hover:underline">Giriş Yapın</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
