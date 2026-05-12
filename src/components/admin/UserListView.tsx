'use client';

/**
 * UserListView — Yönetici panelindeki 6 kullanıcı sayfası için ortak bileşen.
 *
 * Kullanım:
 *   <UserListView role="student" status="pending" title="Onay Bekleyen Öğrenciler" />
 *   <UserListView role="teacher" status="approved" title="Kayıtlı Öğretmenler" />
 *
 * Özellikler:
 *   - Arama çubuğu (isim/email)
 *   - is_approved durumuna göre filtre
 *   - Onayla / Onayı Kaldır / Sil butonları (status'a göre)
 *   - Onay sonrası "Öğretmen Ata" modal (sadece öğrenci için, opsiyonel)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Search, CheckCircle2, XCircle, Trash2, Mail, Phone, Calendar,
  GraduationCap, BookOpen, AlertCircle, UserPlus, ShieldCheck, Loader2,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { secureFetch } from '@/lib/csrf-client';
import AdminEditUserButton from '@/components/profile/AdminEditUserButton';

type Role = 'admin' | 'school_admin' | 'teacher' | 'student' | 'parent';

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  branch: string | null;
  phone: string;
  grade: string | null;
  is_graduated: boolean;
  is_approved: boolean;
  is_active: boolean;
  assigned_teacher_id: string | null;
  created_at: string;
}

interface ApprovedTeacher {
  id: string;
  full_name: string;
  email: string;
}

interface Props {
  role: 'student' | 'teacher' | 'parent';
  status: 'pending' | 'approved';
  title: string;
  subtitle?: string;
}

const ROLE_THEMES = {
  student: {
    pageRole: 'student' as const,
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    gradient: 'from-violet-500 to-purple-600',
    label: 'Öğrenci',
  },
  teacher: {
    pageRole: 'teacher' as const,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    gradient: 'from-emerald-500 to-teal-600',
    label: 'Öğretmen',
  },
  parent: {
    pageRole: 'parent' as const,
    badge: 'bg-pink-50 text-pink-700 border-pink-200',
    gradient: 'from-pink-500 to-rose-600',
    label: 'Veli',
  },
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function UserListView({ role, status, title, subtitle }: Props) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [teachers, setTeachers] = useState<ApprovedTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Onay sonrası öğretmen atama modal'ı (sadece öğrenci için)
  const [assignModal, setAssignModal] = useState<{ student: UserRow; teacherId: string } | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  const { confirm } = useConfirm();
  const theme = ROLE_THEMES[role];

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list',
          role: role,
          approval_status: status,
        }),
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch (e) {
      console.error('[UserListView] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [role, status]);

  // Öğrenci için onaylı öğretmen listesi gerek (atama dropdown'u)
  const loadTeachers = useCallback(async () => {
    if (role !== 'student') return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approved_teachers' }),
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok) setTeachers(data.teachers || []);
    } catch {}
  }, [role]);

  useEffect(() => {
    loadUsers();
    loadTeachers();
  }, [loadUsers, loadTeachers]);

  // Filtre + arama
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q),
    );
  }, [users, search]);

  // ─── ONAYLA ───
  const handleApprove = async (user: UserRow) => {
    // Öğrenci ise: önce öğretmen ataması iste
    if (role === 'student') {
      if (teachers.length === 0) {
        alert('Sistemde onaylı öğretmen yok. Önce bir öğretmen onaylamanız gerekiyor.');
        return;
      }
      setAssignModal({ student: user, teacherId: teachers[0].id });
      return;
    }

    // Öğretmen / veli için direkt onayla
    if (!await confirm({
      title: `${user.full_name} onaylansın mı?`,
      description: 'Onay sonrası kullanıcı sisteme giriş yapabilecek.',
      confirmLabel: 'Onayla',
      variant: 'success',
    })) return;

    setActioningId(user.id);
    try {
      const res = await secureFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_approval', user_id: user.id, approve: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Onaylanamadı.');
      } else {
        await loadUsers();
      }
    } finally {
      setActioningId(null);
    }
  };

  // ─── ONAY KALDIR ───
  const handleRevoke = async (user: UserRow) => {
    if (!await confirm({
      title: `${user.full_name} onayı kaldırılsın mı?`,
      description: 'Bu kullanıcı sisteme giriş yapamayacak.',
      confirmLabel: 'Onayı Kaldır',
      variant: 'warning',
    })) return;

    setActioningId(user.id);
    try {
      const res = await secureFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_approval', user_id: user.id, approve: false }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'İşlem başarısız.');
      } else {
        await loadUsers();
      }
    } finally {
      setActioningId(null);
    }
  };

  // ─── SİL ───
  const handleDelete = async (user: UserRow) => {
    if (!await confirm({
      title: `${user.full_name} silinsin mi?`,
      description: 'Bu işlem geri alınamaz. Kullanıcının tüm verileri silinecek.',
      confirmLabel: 'Sil',
      variant: 'danger',
    })) return;

    setActioningId(user.id);
    try {
      const res = await secureFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_user', user_id: user.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Silinemedi.');
      } else {
        await loadUsers();
      }
    } finally {
      setActioningId(null);
    }
  };

  // ─── ÖĞRENCİ ONAYLA + ÖĞRETMEN ATA ───
  const handleApproveAndAssign = async () => {
    if (!assignModal) return;
    setAssignLoading(true);
    try {
      // Adım 1: Onayla
      const r1 = await secureFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_approval',
          user_id: assignModal.student.id,
          approve: true,
        }),
      });
      if (!r1.ok) {
        const d = await r1.json();
        alert(d.error || 'Onaylanamadı.');
        setAssignLoading(false);
        return;
      }

      // Adım 2: Öğretmen ata (bulk_assign tek kişi için de çalışır)
      const r2 = await secureFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_assign',
          user_ids: [assignModal.student.id],
          teacher_id: assignModal.teacherId,
        }),
      });
      if (!r2.ok) {
        const d = await r2.json();
        alert(`Öğrenci onaylandı ama atama başarısız: ${d.error}`);
      }

      setAssignModal(null);
      await loadUsers();
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        role="admin"
        icon={Users}
        title={title}
        subtitle={subtitle}
        count={filtered.length}
        countLabel={status === 'pending' ? 'bekleyen' : 'kayıtlı'}
      />

      {/* Arama */}
      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`İsim, e-posta veya telefonla ${theme.label.toLowerCase()} ara...`}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
          />
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <CardGridSkeleton count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          role="admin"
          icon={Users}
          title={
            search
              ? 'Aramayla eşleşen sonuç yok'
              : status === 'pending'
                ? `Onay bekleyen ${theme.label.toLowerCase()} yok`
                : `Kayıtlı ${theme.label.toLowerCase()} yok`
          }
          subtitle={
            search
              ? 'Farklı bir arama terimi deneyin.'
              : status === 'pending'
                ? `Yeni kayıtlar burada görünecek.`
                : `Onaylanmış kullanıcılar burada listelenir.`
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => {
            const isProcessing = actioningId === user.id;
            return (
              <div
                key={user.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shrink-0 shadow-md text-white font-extrabold`}>
                    {user.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>

                  {/* Bilgiler */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="min-w-0">
                        <p className="text-base font-extrabold text-gray-900 break-words">
                          {user.full_name || 'İsimsiz'}
                        </p>
                        <p className="text-[12.5px] text-gray-500 flex items-center gap-1.5 break-all">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span>{user.email}</span>
                        </p>
                        {user.phone && (
                          <p className="text-[12.5px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span>{user.phone}</span>
                          </p>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${theme.badge} shrink-0`}>
                        {theme.label}
                      </span>
                    </div>

                    {/* Detaylar */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-600 mt-2">
                      {user.grade && (
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {user.grade}. Sınıf
                        </span>
                      )}
                      {user.is_graduated && (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <GraduationCap className="w-3 h-3" /> Mezun
                        </span>
                      )}
                      {user.branch && (
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {user.branch}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {fmtDate(user.created_at)}
                      </span>
                    </div>

                    {/* Aksiyonlar */}
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(user)}
                          disabled={isProcessing}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[12.5px] font-bold shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          {role === 'student' ? 'Onayla & Öğretmen Ata' : 'Onayla'}
                        </button>
                      )}

                      {status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(user)}
                          disabled={isProcessing}
                          className="px-4 py-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Onayı Kaldır
                        </button>
                      )}

                      {status === 'approved' && (role === 'student' || role === 'teacher') && (
                        <AdminEditUserButton
                          userId={user.id}
                          role={role}
                          onUpdated={() => loadUsers()}
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        disabled={isProcessing}
                        className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Sil
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ÖĞRETMEN ATAMA MODAL ─── */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-5">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-extrabold text-gray-900">Öğretmen Ata</h2>
              <p className="text-[13px] text-gray-600 mt-1">
                <strong>{assignModal.student.full_name}</strong> hangi öğretmene atansın?
              </p>
            </div>

            <div className="space-y-3 mb-5">
              <label className="block text-[13px] font-bold text-gray-700">
                Öğretmen Seçin
              </label>
              <select
                value={assignModal.teacherId}
                onChange={(e) =>
                  setAssignModal({ ...assignModal, teacherId: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.email})
                  </option>
                ))}
              </select>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[12.5px] text-blue-800">
                <p>📌 Öğrenci onaylandıktan sonra seçtiğiniz öğretmenin <strong>"Öğrencilerim"</strong> listesine eklenecektir.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAssignModal(null)}
                disabled={assignLoading}
                className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-all disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleApproveAndAssign}
                disabled={assignLoading || !assignModal.teacherId}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-extrabold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {assignLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Atanıyor...
                  </>
                ) : (
                  <>Onayla & Ata <CheckCircle2 className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
