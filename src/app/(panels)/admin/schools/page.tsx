'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { School, Plus, Pencil, Trash2, Building, MapPin, Phone, Mail, Users, Hash, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { School as SchoolType } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import PremiumModal from '@/components/ui/PremiumModal';
import ActionButton from '@/components/ui/ActionButton';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import { useConfirm } from '@/components/ui/ConfirmDialog';

const EMPTY: Partial<SchoolType> = { name: '', code: '', city: '', phone: '', email: '', max_students: 50 };

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Partial<SchoolType>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
    setSchools(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing({ ...EMPTY, code: generateCode() }); setModal(true); };
  const openEdit = (s: SchoolType) => { setEditing(s); setModal(true); };

  const save = async () => {
    setSaving(true);
    const payload = {
      name: editing.name,
      code: editing.code,
      city: editing.city,
      phone: editing.phone,
      email: editing.email,
      max_students: editing.max_students,
    };
    if (editing.id) {
      await supabase.from('schools').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('schools').insert(payload);
    }
    setSaving(false);
    setModal(false);
    load();
  };

  const { confirm } = useConfirm();

  const remove = async (id: string, name: string) => {
    const ok = await confirm({
      variant: 'danger',
      title: 'Okulu silmek istiyor musun?',
      description: `"${name}" okulunu silmek üzeresin. Bu işlem geri alınamaz ve okula bağlı tüm veriler kaybolabilir.`,
      confirmLabel: 'Evet, Sil',
      cancelLabel: 'Vazgeç',
    });
    if (!ok) return;
    await supabase.from('schools').delete().eq('id', id);
    load();
  };

  const filtered = schools.filter((s) =>
    s.name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')) ||
    (s.city || '').toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')) ||
    (s.code || '').toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))
  );

  const statusConfig = {
    trial: { label: 'Deneme', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    active: { label: 'Aktif', icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    expired: { label: 'Süresi Doldu', icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };

  return (
    <div>
      <PageHeader
        role="admin"
        icon={School}
        title="Okullar"
        subtitle="Platformdaki tüm okulları yönetin, lisans durumlarını takip edin"
        count={schools.length}
        countLabel="okul"
        action={
          <ActionButton variant="primary" icon={Plus} onClick={openNew}>
            Yeni Okul
          </ActionButton>
        }
      />

      <div className="mb-5 max-w-md">
        <SearchBar role="admin" value={search} onChange={setSearch} placeholder="Okul ara (ad, şehir, kod)..." />
      </div>

      {loading ? (
        <CardGridSkeleton count={6} cols={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          role="admin"
          icon={Building}
          title={search ? 'Eşleşen okul bulunamadı' : 'Henüz okul bulunmuyor'}
          subtitle={search ? 'Arama terimlerini değiştirmeyi deneyin.' : '"Yeni Okul" butonuyla ilk okulunuzu ekleyin.'}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-stagger">
          {filtered.map((s) => {
            const cfg = statusConfig[s.license_status];
            const StatusIcon = cfg.icon;
            return (
              <div
                key={s.id}
                className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-10 blur-2xl group-hover:opacity-25 transition-opacity" />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all">
                      <School className="w-5 h-5" />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14.5px] font-extrabold text-[#0f2847] dark:text-slate-100 truncate">{s.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Hash className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                        <p className="text-[11px] font-mono text-gray-500 dark:text-slate-400">{s.code}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 dark:text-slate-500 hover:text-amber-600 transition active:scale-95"
                        title="Düzenle"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => remove(s.id, s.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 dark:text-slate-500 hover:text-red-500 transition active:scale-95"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Info rows */}
                  <div className="space-y-1.5 pt-3 border-t border-gray-100 dark:border-slate-700/60">
                    {s.city && (
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{s.city}</span>
                      </div>
                    )}
                    {s.phone && (
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-600 dark:text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{s.phone}</span>
                      </div>
                    )}
                    {s.email && (
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-600 dark:text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Status + Capacity */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/60 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                      <Users className="w-3 h-3" />
                      {s.max_students} limit
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <PremiumModal
        open={modal}
        onClose={() => setModal(false)}
        title={editing.id ? 'Okul Düzenle' : 'Yeni Okul'}
        subtitle={editing.id ? 'Okul bilgilerini güncelleyin' : 'Yeni okul ekleyin ve lisans ayarlarını yapın'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton variant="ghost" onClick={() => setModal(false)}>İptal</ActionButton>
            <button
              onClick={save}
              disabled={saving || !editing.name || !editing.code}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[13.5px] font-bold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-[0.97]"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-bold text-gray-700 dark:text-slate-300 mb-1.5">Okul Adı *</label>
            <input
              type="text"
              value={editing.name || ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-bold text-gray-700 dark:text-slate-300 mb-1.5">Okul Kodu *</label>
              <input
                type="text"
                value={editing.code || ''}
                onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-gray-700 dark:text-slate-300 mb-1.5">Şehir</label>
              <input
                type="text"
                value={editing.city || ''}
                onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-bold text-gray-700 dark:text-slate-300 mb-1.5">Telefon</label>
              <input
                type="text"
                value={editing.phone || ''}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-gray-700 dark:text-slate-300 mb-1.5">E-posta</label>
              <input
                type="email"
                value={editing.email || ''}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 dark:text-slate-300 mb-1.5">Maks. Öğrenci</label>
            <input
              type="number"
              value={editing.max_students || 50}
              onChange={(e) => setEditing({ ...editing, max_students: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
            />
          </div>
        </div>
      </PremiumModal>
    </div>
  );
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
