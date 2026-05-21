'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, ShieldAlert } from 'lucide-react';
import AuthLayout from '@/components/ui/AuthLayout';

/**
 * Öğrenci Şifremi Unuttum — Manuel akış
 *
 * Kullanıcı butona basar → /api/auth/password-reset-request →
 * password_reset_requests tablosuna talep düşer → yönetici görür → şifre değiştirir.
 * Mail GİTMEZ. Yönetici telefon/sınıf/whatsapp ile yeni şifreyi söyler.
 */
export default function StudentForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleEmailChange = (val: string) => {
    // Görünmez/tehlikeli karakter temizliği (login sayfası ile aynı pattern).
    const cleaned = val
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[\u201C\u201D\u2018\u2019"']/g, '')
      .replace(/\s+/g, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F]/g, '');
    setEmail(cleaned.toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Talep oluşturulamadı.');
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError('Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        role="student"
        title="Talebiniz Alındı"
        subtitle="Yönetici en kısa sürede sizinle iletişime geçecek"
      >
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm font-extrabold text-emerald-700 mb-2">
              ✓ Şifre sıfırlama talebiniz alındı
            </p>
            <p className="text-[12.5px] text-gray-700 break-all mb-1">
              <strong>{email.trim().toLowerCase()}</strong>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-[12.5px] text-blue-800">
            <p className="font-semibold mb-1.5">📌 Sonraki adımlar:</p>
            <ol className="space-y-1 ml-4 list-decimal">
              <li>Yönetici talebinizi inceleyecek ve <strong>geçici bir şifre</strong> üretecek.</li>
              <li>Bu geçici şifreyi <strong>WhatsApp/SMS/telefon</strong> ile size iletecek.</li>
              <li>
                <strong>Giriş sayfasına</strong> gidin{' '}
                (<Link href="/login" className="underline font-bold">/login</Link>),
                e-postanız ve geçici şifre ile giriş yapın.
              </li>
              <li>
                Sistem sizi otomatik olarak <strong>"Yeni Şifre Belirle"</strong> sayfasına
                yönlendirecek. Kalıcı şifrenizi belirleyip kaydedin.
              </li>
            </ol>
            <p className="text-[11.5px] text-blue-700 mt-2 italic">
              Geçici şifre tek kullanımlıktır — kalıcı şifrenizi belirledikten sonra çalışmaz.
            </p>
          </div>

          <Link
            href="/login"
            className="block text-center py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Giriş Sayfasına Dön
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      role="student"
      title="Şifremi Unuttum"
      subtitle="Yöneticiye şifre sıfırlama talebi gönderin"
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-violet-600 font-semibold transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Giriş sayfasına dön
        </Link>
      }
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[13px] text-amber-800">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold mb-1">Manuel sıfırlama</p>
              <p className="text-[12.5px]">
                Talebiniz yönetici paneline iletilecek. Yöneticiniz yeni şifrenizi
                belirleyip size <strong>şahsen iletecek</strong>.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
            Kayıtlı E-posta Adresi
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="ornek@email.com"
              autoFocus
              autoComplete="email"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-extrabold shadow-lg shadow-violet-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>Talep Oluştur <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
