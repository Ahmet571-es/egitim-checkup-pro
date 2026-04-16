'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { GraduationCap, User, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ROLE_PATHS } from '@/types';
import type { UserRole } from '@/types';

// Türkçe karakter dönüşümü
function toAscii(s: string): string {
  const map: Record<string, string> = { 'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','İ':'i','ö':'o','Ö':'o','ş':'s','Ş':'s','ü':'u','Ü':'u' };
  return s.replace(/[çÇğĞıİöÖşŞüÜ]/g, c => map[c] || c);
}

export default function TeacherLoginPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingMsg, setPendingMsg] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;

    if (!firstName.trim() || !lastName.trim()) {
      setError('Ad ve soyad alanlarını doldurun.');
      submittingRef.current = false;
      return;
    }
    if (password.length !== 7) {
      setError('Şifre 7 karakter olmalıdır.');
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    setError('');
    setPendingMsg(false);

    try {
      const supabase = createClient();

      // Ad soyad → e-posta dönüşümü
      const ad = toAscii(firstName.trim().toLowerCase()).replace(/[^a-z]/g, '');
      const soyad = toAscii(lastName.trim().toLowerCase()).replace(/[^a-z]/g, '');
      const authEmail = `${ad}_${soyad}@ogretmen.egitimcheckup.com`;

      const { error: authError, data } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'Ad-soyad veya şifre hatalı.'
            : authError.message
        );
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      // Onay kontrolü
      const isApproved = data.user?.user_metadata?.is_approved;
      if (isApproved === false) {
        await supabase.auth.signOut();
        setPendingMsg(true);
        setError('');
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      let role: UserRole | undefined = data.user?.user_metadata?.role as UserRole | undefined;
      if (!role && data.user?.id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();
          if (profile?.role) role = profile.role as UserRole;
        } catch { /* ignore */ }
      }
      const target = ROLE_PATHS[role ?? 'teacher'] ?? '/teacher/dashboard';
      window.location.href = target;
    } catch {
      setError('Beklenmeyen bir hata oluştu.');
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-[#f0fdf8] px-4">
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
          <h2 className="text-2xl font-extrabold text-[#0f2847] text-center mb-1">Öğretmen Girişi</h2>
          <p className="text-sm text-gray-500 text-center mb-8">Ad-Soyad ve şifreniz ile giriş yapın</p>

          {pendingMsg && (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-sm text-amber-700">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Hesabınız henüz onaylanmadı. Yönetici onayı bekleniyor.</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <input type="text" name="prevent_autofill" style={{ display: 'none' }} tabIndex={-1} />
            <input type="password" name="prevent_autofill_pw" style={{ display: 'none' }} tabIndex={-1} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Ad</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Adınız"
                    className="w-full pl-11 pr-3 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                    required
                    autoComplete="nope"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Soyad</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Soyadınız"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  required
                  autoComplete="nope"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Şifre <span className="text-gray-400 font-normal">(7 haneli)</span></label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.slice(0, 7))}
                  placeholder="Örn: Ab12345"
                  maxLength={7}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  required
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Kayıt olurken belirlediğiniz 7 haneli şifre</p>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? 'Giriş yapılıyor...' : <>Giriş Yap <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Hesabınız yok mu?{' '}
            <Link href="/register/ogretmen" className="text-emerald-600 font-semibold hover:underline">Öğretmen Kayıt</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
