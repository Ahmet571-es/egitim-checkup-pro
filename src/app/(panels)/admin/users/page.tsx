'use client';

/**
 * ADMIN USERS PANEL — FAZ 2A
 *
 * Özellikler:
 *  - 4 stat kartı (toplam, öğrenci, öğretmen, onay bekleyen)
 *  - Rol filtresi (tümü / öğrenci / öğretmen / okul yöneticisi)
 *  - Onay durumu filtresi (sadece öğretmen filtresi aktifken görünür)
 *  - Arama kutusu (ad-soyad + email)
 *  - Kullanıcı tablosu: her satırda aksiyonlar
 *    - Öğretmen için: Onayla / Onayı Kaldır
 *    - Herkes için: Sil (onay modallı)
 *
 * API: /api/admin/users (actions: list, toggle_approval, delete_user)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, UserCheck, GraduationCap, Clock, Search, CheckCircle2, XCircle, Trash2, Mail, Filter, AlertCircle, ShieldCheck, BookOpen, Award } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { secureFetch } from '@/lib/csrf-client';

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

interface Stats {
  total: number;
  students: number;
  teachers: number;
  school_admins: number;
  pending_teachers: number;
}

const ROLE_FILTERS: { value: Role | 'all'; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'student', label: 'Öğrenciler' },
  { value: 'teacher', label: 'Öğretmenler' },
  { value: 'school_admin', label: 'Okul Yöneticileri' },
];

const APPROVAL_FILTERS: { value: 'all' | 'approved' | 'pending'; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'approved', label: 'Onaylı' },
  { value: 'pending', label: 'Onay Bekliyor' },
];

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Yönetici',
  school_admin: 'Okul Yöneticisi',
  teacher: 'Öğretmen',
  student: 'Öğrenci',
  parent: 'Veli',
};

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-red-50 text-red-700 border-red-200',
  school_admin: 'bg-amber-50 text-amber-700 border-amber-200',
  teacher: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  student: 'bg-violet-50 text-violet-700 border-violet-200',
  parent: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtreler
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Aksiyon durumları
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { confirm } = useConfirm();

  // Arama debounce (300ms)
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Veri yükleme
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await secureFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list',
          role: roleFilter,
          search: searchDebounced,
          approval_status: approvalFilter,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kullanıcılar yüklenemedi.');
        setLoading(false);
        return;
      }
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch {
      setError('Bağlantı hatası.');
    }
    setLoading(false);
  }, [roleFilter, searchDebounced, approvalFilter]);

  useEffect(() => { load(); }, [load]);

  // Öğretmen onay/ret
  const toggleApproval = async (u: UserRow) => {
    const newStatus = !u.is_approved;
    const actionText = newStatus ? 'onaylamak' : 'onayını kaldırmak';

    const ok = await confirm({
      variant: newStatus ? 'success' : 'warning',
      title: `Öğretmeni ${actionText} istiyor musunuz?`,
      description: `${u.full_name} öğretmeninin hesabını ${actionText} üzeresiniz. ${
        !newStatus
          ? 'Onay kaldırılırsa öğretmen sisteme giriş yapamaz.'
          : 'Onay verilirse öğretmen sisteme giriş yapabilir.'
      }`,
      confirmLabel: newStatus ? 'Evet, Onayla' : 'Evet, Onayı Kaldır',
      cancelLabel: 'Vazgeç',
    });
    if (!ok) return;

    setActionLoadingId(u.id);
    try {
      const res = await secureFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_approval',
          user_id: u.id,
          approved: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'İşlem başarısız.');
        return;
      }
      await load();
    } catch {
      setError('Bağlantı hatası.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Kullanıcı silme
  const remove = async (u: UserRow) => {
    const ok = await confirm({
      variant: 'danger',
      title: `${u.full_name} kullanıcısını silmek istiyor musunuz?`,
      description: `Bu işlem GERİ ALINAMAZ. ${u.full_name} (${u.email}) ve bu kullanıcıya ait tüm test sonuçları, raporlar ve veriler kalıcı olarak silinecek.`,
      confirmLabel: 'Evet, Kalıcı Olarak Sil',
      cancelLabel: 'Vazgeç',
    });
    if (!ok) return;

    setActionLoadingId(u.id);
    try {
      const res = await secureFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_user', user_id: u.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Silme başarısız.');
        return;
      }
      await load();
    } catch {
      setError('Bağlantı hatası.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // UI helper
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return iso; }
  };

  const statCards = useMemo(() => [
    { label: 'Toplam Kullanıcı', value: stats?.total ?? 0, icon: Users, gradient: 'from-sky-500 to-blue-600' },
    { label: 'Öğrenci', value: stats?.students ?? 0, icon: BookOpen, gradient: 'from-violet-500 to-purple-600' },
    { label: 'Öğretmen', value: stats?.teachers ?? 0, icon: GraduationCap, gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Onay Bekleyen', value: stats?.pending_teachers ?? 0, icon: Clock, gradient: 'from-amber-500 to-orange-600' },
  ], [stats]);

  return (
    <div>
      <PageHeader
        role="admin"
        icon={Users}
        title="Kullanıcılar"
        subtitle="Platformdaki tüm kullanıcıları görüntüleyin, onaylayın ve yönetin."
      />

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-4 bg-white/70 backdrop-blur border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md shrink-0`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider truncate">{card.label}</p>
                <p className="text-xl font-extrabold text-gray-800">{card.value.toLocaleString('tr-TR')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtreler + arama */}
      <div className="bg-white/70 backdrop-blur rounded-2xl border border-gray-100 p-4 mb-6 space-y-3 shadow-sm">
        {/* Arama */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kullanıcı ara (ad-soyad veya e-posta)..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
          />
        </div>

        {/* Rol filtresi */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          <span className="text-[12px] text-gray-600 font-semibold shrink-0 mr-1">Rol:</span>
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setRoleFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                roleFilter === f.value
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Onay filtresi (sadece öğretmen filtresi aktifken göster) */}
        {(roleFilter === 'teacher' || roleFilter === 'all') && (
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="text-[12px] text-gray-600 font-semibold shrink-0 mr-1">Onay:</span>
            {APPROVAL_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setApprovalFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  approvalFilter === f.value
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hata */}
      {error && (
        <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <CardGridSkeleton count={6} />
      ) : users.length === 0 ? (
        <EmptyState
          role="admin"
          icon={Users}
          title="Kullanıcı bulunamadı"
          subtitle={
            search || roleFilter !== 'all' || approvalFilter !== 'all'
              ? 'Filtreleri değiştirerek daha fazla sonuç görebilirsiniz.'
              : 'Sistemde henüz kayıtlı kullanıcı yok.'
          }
        />
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              loading={actionLoadingId === u.id}
              onToggleApproval={() => toggleApproval(u)}
              onDelete={() => remove(u)}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// USER CARD — Tek satır kullanıcı kartı
// ═══════════════════════════════════════════════════════════════
interface UserCardProps {
  user: UserRow;
  loading: boolean;
  onToggleApproval: () => void;
  onDelete: () => void;
  formatDate: (iso: string) => string;
}

function UserCard({ user: u, loading, onToggleApproval, onDelete, formatDate }: UserCardProps) {
  const roleColor = ROLE_COLORS[u.role] || ROLE_COLORS.parent;
  const roleLabel = ROLE_LABELS[u.role] || u.role;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-start gap-3 flex-wrap">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md shrink-0 text-white font-extrabold">
          {(u.full_name || '?').trim().charAt(0).toUpperCase()}
        </div>

        {/* Bilgiler */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-[14px] font-bold text-gray-800 truncate">
              {u.full_name || '(isim yok)'}
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${roleColor}`}>
              {roleLabel}
            </span>
            {u.role === 'teacher' && (
              u.is_approved ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Onaylı
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3" /> Onay Bekliyor
                </span>
              )
            )}
            {u.role === 'student' && u.is_graduated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Award className="w-3 h-3" /> Mezun
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[12px] text-gray-500 min-w-0">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{u.email || '(email yok)'}</span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 flex-wrap">
            {u.role === 'teacher' && u.branch && (
              <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {u.branch}</span>
            )}
            {u.role === 'student' && !u.is_graduated && u.grade && (
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {u.grade}. sınıf</span>
            )}
            <span>Kayıt: {formatDate(u.created_at)}</span>
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center gap-2 shrink-0">
          {u.role === 'teacher' && (
            <button
              onClick={onToggleApproval}
              disabled={loading}
              className={`px-3 py-2 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                u.is_approved
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
              title={u.is_approved ? 'Onayı Kaldır' : 'Onayla'}
            >
              {u.is_approved ? (
                <><XCircle className="w-3.5 h-3.5" /> Onayı Kaldır</>
              ) : (
                <><UserCheck className="w-3.5 h-3.5" /> Onayla</>
              )}
            </button>
          )}
          {u.role !== 'admin' && (
            <button
              onClick={onDelete}
              disabled={loading}
              className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50"
              title="Kullanıcıyı Sil"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
