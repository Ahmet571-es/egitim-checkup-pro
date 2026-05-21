'use client';

/**
 * Yönetici → Şifre Sıfırlama Talepleri
 *
 * Kullanıcılar (öğrenci/öğretmen/veli) "Şifremi unuttum" butonuna basınca
 * password_reset_requests tablosuna talep düşer. Yönetici buradan görür,
 * yeni şifre belirler ve kullanıcıya iletir.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  KeyRound, Clock, CheckCircle2, XCircle, AlertCircle, User,
  Mail, ShieldCheck, Eye, EyeOff, Copy, Check,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import { secureFetch } from '@/lib/csrf-client';

interface ResetRequest {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  role: string | null;
  status: 'pending' | 'resolved' | 'cancelled';
  resolved_by: string | null;
  resolved_at: string | null;
  notes: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  student: 'Öğrenci',
  teacher: 'Öğretmen',
  parent: 'Veli',
  school_admin: 'Okul Yöneticisi',
  admin: 'Sistem Yöneticisi',
};

const ROLE_COLORS: Record<string, string> = {
  student: 'from-violet-500 to-purple-600',
  teacher: 'from-emerald-500 to-teal-600',
  parent: 'from-pink-500 to-rose-600',
  school_admin: 'from-amber-500 to-orange-600',
  admin: 'from-slate-600 to-slate-800',
};

function generateStrongPassword(length = 10): string {
  const letters = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = letters + digits;
  // En az 1 harf + 1 rakam garantili olsun
  let p = letters[Math.floor(Math.random() * letters.length)] +
          digits[Math.floor(Math.random() * digits.length)];
  for (let i = 2; i < length; i++) {
    p += all[Math.floor(Math.random() * all.length)];
  }
  // Karıştır
  return p.split('').sort(() => Math.random() - 0.5).join('');
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'az önce';
  if (min < 60) return `${min} dk önce`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} saat önce`;
  const d = Math.floor(h / 24);
  return `${d} gün önce`;
}

export default function AdminPasswordResetsPage() {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'resolved' | 'cancelled'>('pending');
  const [activeRequest, setActiveRequest] = useState<ResetRequest | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [resolved, setResolved] = useState<{ password: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/admin/password-resets?action=list&status=${statusFilter}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          res.status === 401
            ? 'Oturumunuz sona ermiş. Lütfen yeniden giriş yapın.'
            : res.status === 403
              ? 'Bu sayfayı görüntülemek için yönetici yetkisi gerekiyor.'
              : (data?.error || `Sunucu hatası (${res.status})`);
        setLoadError(msg);
        setRequests([]);
        return;
      }
      setRequests(data.requests || []);
    } catch (e) {
      console.error('[admin/password-resets] load error:', e);
      setLoadError('Bağlantı hatası — internet bağlantınızı kontrol edip tekrar deneyin.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleResolve = async () => {
    if (!activeRequest) return;
    setError('');
    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await secureFetch('/api/admin/password-resets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          request_id: activeRequest.id,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'İşlem başarısız.');
        setSubmitLoading(false);
        return;
      }
      setResolved({ password: newPassword, email: activeRequest.email });
    } catch {
      setError('Bağlantı hatası.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!confirm('Bu talebi iptal etmek istediğinize emin misiniz? Şifre değiştirilmeyecek.')) return;
    try {
      const res = await secureFetch('/api/admin/password-resets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', request_id: requestId }),
      });
      if (res.ok) {
        await load();
      } else {
        const data = await res.json();
        alert(data.error || 'İptal edilemedi.');
      }
    } catch {
      alert('Bağlantı hatası.');
    }
  };

  const closeModal = () => {
    setActiveRequest(null);
    setNewPassword('');
    setResolved(null);
    setError('');
    if (resolved) {
      load();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const counts = {
    pending: requests.filter((r) => r.status === 'pending').length,
  };

  return (
    <div>
      <PageHeader
        role="admin"
        icon={KeyRound}
        title="Şifre Sıfırlama Talepleri"
        subtitle="Kullanıcıların şifre sıfırlama isteklerini buradan yönetebilirsiniz"
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: 'pending', label: 'Bekleyen', icon: Clock, color: 'amber' },
          { key: 'resolved', label: 'Çözüldü', icon: CheckCircle2, color: 'emerald' },
          { key: 'cancelled', label: 'İptal', icon: XCircle, color: 'gray' },
        ] as const).map((tab) => {
          const isActive = statusFilter === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {loadError ? (
        <div className="rounded-2xl bg-rose-50 border-2 border-rose-200 p-5 flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-900 mb-1">Talepler yüklenemedi</p>
            <p className="text-[14px] text-rose-700">{loadError}</p>
            <button
              type="button"
              onClick={() => load()}
              className="mt-3 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold transition"
            >
              Tekrar dene
            </button>
          </div>
        </div>
      ) : loading ? (
        <CardGridSkeleton count={3} />
      ) : requests.length === 0 ? (
        <EmptyState
          role="admin"
          icon={KeyRound}
          title={
            statusFilter === 'pending'
              ? 'Bekleyen talep yok'
              : statusFilter === 'resolved'
                ? 'Çözülmüş talep yok'
                : 'İptal edilmiş talep yok'
          }
          subtitle="Kullanıcılar 'Şifremi unuttum' butonuna basınca talepler buraya düşer."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const roleColor = ROLE_COLORS[req.role ?? ''] ?? 'from-slate-500 to-slate-700';
            const roleLabel = ROLE_LABELS[req.role ?? ''] ?? 'Bilinmeyen';
            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${roleColor} flex items-center justify-center shrink-0 shadow-md`}>
                    <User className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <p className="text-base font-extrabold text-gray-900">
                          {req.full_name ?? 'İsimsiz Kullanıcı'}
                        </p>
                        <p className="text-[12.5px] text-gray-500 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="break-all">{req.email}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r ${roleColor} text-white`}>
                          {roleLabel}
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeAgo(req.created_at)}
                        </span>
                      </div>
                    </div>

                    {req.status === 'resolved' && (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="font-semibold">Çözüldü</span>
                        {req.resolved_at && <span>· {timeAgo(req.resolved_at)}</span>}
                      </div>
                    )}

                    {req.status === 'cancelled' && (
                      <div className="mt-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-[12px] text-gray-600 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="font-semibold">İptal edildi</span>
                      </div>
                    )}

                    {req.status === 'pending' && !req.user_id && (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-[12px] text-amber-800 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Eşleşen kullanıcı bulunamadı</p>
                          <p className="text-[11.5px] mt-0.5">
                            Bu e-posta sistemde kayıtlı değil. Kullanıcı tipo yapmış,
                            kopyala-yapıştır görünmez karakter gelmiş veya farklı bir
                            e-postayla kayıtlı olabilir. Kayıtlı öğretmenler/öğrencilerden
                            ismi/telefonu ile arayıp doğru hesabına şifre atadıktan sonra
                            bu talebi iptal edin.
                          </p>
                        </div>
                      </div>
                    )}

                    {req.status === 'pending' && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        <button
                          type="button"
                          disabled={!req.user_id}
                          title={!req.user_id ? 'Bu talebe bağlı kullanıcı yok — manuel kontrol gerekli' : ''}
                          onClick={() => {
                            setActiveRequest(req);
                            setNewPassword(generateStrongPassword());
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[12.5px] font-bold shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-emerald-500 disabled:hover:to-teal-600"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Şifre Belirle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(req.id)}
                          className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" /> İptal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal — Şifre belirle */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            {!resolved ? (
              <>
                <div className="text-center mb-5">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                    <KeyRound className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-lg font-extrabold text-gray-900">Yeni Şifre Belirle</h2>
                  <p className="text-[13px] text-gray-600 mt-1 break-all">
                    {activeRequest.full_name ?? 'Kullanıcı'} · <strong>{activeRequest.email}</strong>
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-[12.5px] text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
                      Yeni Şifre
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateStrongPassword())}
                      className="mt-1.5 text-[12px] text-emerald-600 hover:text-emerald-700 font-semibold transition"
                    >
                      🎲 Yeni rastgele şifre üret
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[12px] text-amber-800">
                    <p className="font-bold mb-1">⚠ Önemli:</p>
                    <p>Bu şifreyi kullanıcıya <strong>WhatsApp / SMS / yüz yüze</strong> iletmeniz gerekir. Sistem otomatik mail göndermez.</p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-all"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      onClick={handleResolve}
                      disabled={submitLoading || newPassword.length < 6}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-extrabold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {submitLoading ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Kaydediliyor...
                        </>
                      ) : (
                        <>Şifreyi Kaydet <ShieldCheck className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Resolved — şifreyi göster
              <>
                <div className="text-center mb-5">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-lg font-extrabold text-gray-900">Şifre Güncellendi!</h2>
                  <p className="text-[13px] text-gray-600 mt-1">
                    Yeni şifreyi kullanıcıya iletmeniz gerekiyor
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 mb-4">
                  <p className="text-[12px] text-gray-500 font-semibold uppercase tracking-wider mb-1">E-posta</p>
                  <p className="text-sm font-bold text-gray-900 break-all mb-3">{resolved.email}</p>

                  <p className="text-[12px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Yeni Şifre</p>
                  <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-emerald-300">
                    <code className="flex-1 text-base font-mono font-bold text-gray-900 break-all">
                      {resolved.password}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(resolved.password)}
                      className="shrink-0 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-bold transition-all flex items-center gap-1.5"
                    >
                      {copied ? <><Check className="w-3.5 h-3.5" /> Kopyalandı</> : <><Copy className="w-3.5 h-3.5" /> Kopyala</>}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[12.5px] text-amber-800 mb-4">
                  📱 <strong>Bu şifreyi WhatsApp/SMS ile kullanıcıya iletin.</strong> Bu pencereyi kapattıktan sonra şifre tekrar gösterilemeyecek.
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-extrabold shadow-lg hover:shadow-xl transition-all"
                >
                  Tamam, Kapat
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
