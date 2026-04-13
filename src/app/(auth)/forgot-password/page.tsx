'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (resetError) {
        setError('Bir hata oluştu. Lütfen tekrar deneyin.');
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError('Beklenmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
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
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-extrabold text-[#0f2847] mb-2">E-posta Gönderildi</h2>
              <p className="text-sm text-gray-500 mb-6">
                <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderdik. Lütfen gelen kutunuzu kontrol edin.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:underline">
                <ArrowLeft className="w-4 h-4" /> Giriş sayfasına dön
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold text-[#0f2847] text-center mb-1">Şifremi Unuttum</h2>
              <p className="text-sm text-gray-500 text-center mb-8">E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.</p>

              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@okul.edu.tr"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                <Link href="/login" className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:underline">
                  <ArrowLeft className="w-3.5 h-3.5" /> Giriş sayfasına dön
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
