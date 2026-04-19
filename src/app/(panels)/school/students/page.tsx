'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, Trash2, UserCheck, Upload, Download, AlertCircle, CheckCircle2, Users,
  Mail, Calendar, School as SchoolIcon
} from 'lucide-react';
import type { Profile, LicenseStatus } from '@/types';
import LicenseBanner from '@/components/LicenseBanner';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import PremiumModal from '@/components/ui/PremiumModal';
import ActionButton from '@/components/ui/ActionButton';
import { useToast } from '@/components/ui/Toast';
import { TableSkeleton } from '@/components/ui/Skeleton';

interface LicenseLite {
  status: LicenseStatus;
  endDate: string | null;
  daysLeft: number;
  maxStudents: number;
}

export default function SchoolStudentsPage() {
  const toast = useToast();
  const [students, setStudents] = useState<(Profile & { classes?: string[] })[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'import' | null>(null);
  const [newStudent, setNewStudent] = useState({ full_name: '', email: '', class_id: '' });
  const [saving, setSaving] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [license, setLicense] = useState<LicenseLite | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single();
    if (!profile?.school_id) return;
    setSchoolId(profile.school_id);

    const { data: studs } = await supabase.from('profiles').select('*').eq('school_id', profile.school_id).eq('role', 'student').order('full_name');
    const { data: cls } = await supabase.from('classes').select('id,name').eq('school_id', profile.school_id).order('name');

    setStudents(studs || []);
    setClasses(cls || []);

    const { data: school } = await supabase.from('schools').select('license_status,license_end_date,max_students').eq('id', profile.school_id).single();
    if (school) {
      const end = school.license_end_date as string | null;
      const daysLeft = end ? Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000)) : 0;
      let status = (school.license_status as LicenseStatus) || 'trial';
      if (end && daysLeft <= 0) status = 'expired';
      setLicense({ status, endDate: end, daysLeft, maxStudents: school.max_students || 0 });
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const addStudent = async () => {
    if (!schoolId || !newStudent.full_name || !newStudent.email) return;
    if (license?.status === 'expired') {
      toast.error('Lisansınız sona ermiş', 'Lütfen Faturalandırma sayfasından planınızı yenileyin.');
      return;
    }
    if (license && students.length >= license.maxStudents) {
      toast.warning('Kapasite doldu', `Öğrenci kapasiteniz ${students.length}/${license.maxStudents}. Planınızı yükseltin.`);
      return;
    }
    setSaving(true);

    const tempPass = 'Ogrenci123!';
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: newStudent.email,
      password: tempPass,
      options: { data: { full_name: newStudent.full_name, role: 'student', school_id: schoolId } },
    });

    if (authErr) {
      toast.error('Hata', authErr.message);
      setSaving(false);
      return;
    }

    if (newStudent.class_id && authData.user) {
      await supabase.from('class_students').insert({ class_id: newStudent.class_id, student_id: authData.user.id });
    }

    toast.success('Öğrenci eklendi', `${newStudent.full_name} başarıyla sisteme eklendi.`);
    setSaving(false);
    setModal(null);
    setNewStudent({ full_name: '', email: '', class_id: '' });
    load();
  };

  const removeStudent = async (id: string) => {
    if (!confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) return;
    await supabase.from('profiles').update({ is_active: false }).eq('id', id);
    toast.success('Öğrenci silindi');
    load();
  };

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !schoolId) return;
    if (license?.status === 'expired') {
      toast.error('Lisansınız sona ermiş', 'CSV içe aktarma devre dışı.');
      return;
    }
    setSaving(true);
    setImportResult(null);

    const text = await file.text();
    const lines = text.split('\n').filter((l) => l.trim());
    const header = lines[0].toLowerCase();

    const hasHeader = header.includes('ad') || header.includes('email') || header.includes('name');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    let success = 0;
    const errors: string[] = [];

    let currentCount = students.length;
    const cap = license?.maxStudents ?? Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < dataLines.length; i++) {
      if (currentCount >= cap) {
        errors.push(`Satır ${i + 1}: Kapasite doldu (${currentCount}/${cap}) — kalan satırlar atlandı`);
        break;
      }
      const cols = dataLines[i].split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 2) { errors.push(`Satır ${i + 1}: Yetersiz sütun`); continue; }

      const [fullName, email, className] = cols;
      if (!fullName || !email) { errors.push(`Satır ${i + 1}: Ad veya email eksik`); continue; }

      const tempPass = 'Ogrenci123!';
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password: tempPass,
        options: { data: { full_name: fullName, role: 'student', school_id: schoolId } },
      });

      if (authErr) { errors.push(`${email}: ${authErr.message}`); continue; }

      if (className && authData.user) {
        const cls = classes.find((c) => c.name.toLowerCase() === className.toLowerCase());
        if (cls) {
          await supabase.from('class_students').insert({ class_id: cls.id, student_id: authData.user.id });
        }
      }
      success++;
      currentCount++;
    }

    setImportResult({ success, errors });
    setSaving(false);
    load();
  };

  const downloadTemplate = () => {
    const csv = 'Ad Soyad,Email,Sınıf\nAhmet Yılmaz,ahmet@example.com,9-A\nAyşe Kaya,ayse@example.com,9-B';
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ogrenci_sablonu.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = students.filter((s) =>
    s.full_name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')) ||
    s.email.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))
  );

  const overCap = !!license && students.length >= license.maxStudents;
  const expired = license?.status === 'expired';
  const disabledAdd = expired || overCap;

  return (
    <div>
      {license && (
        <LicenseBanner
          status={license.status}
          daysLeft={license.daysLeft}
          studentCount={students.length}
          maxStudents={license.maxStudents}
        />
      )}

      <PageHeader
        role="school_admin"
        icon={UserCheck}
        title="Öğrenciler"
        subtitle={license ? `${students.length}/${license.maxStudents} kapasite kullanımı` : 'Okulunuzun öğrencilerini yönetin'}
        count={students.length}
        countLabel="öğrenci"
        action={
          <div className="flex gap-2">
            <ActionButton
              variant="secondary"
              icon={Upload}
              onClick={() => { if (disabledAdd) return; setImportResult(null); setModal('import'); }}
              disabled={disabledAdd}
            >
              CSV İçe Aktar
            </ActionButton>
            <ActionButton
              variant="primary"
              icon={Plus}
              onClick={() => { if (disabledAdd) return; setModal('add'); }}
              disabled={disabledAdd}
            >
              Yeni Öğrenci
            </ActionButton>
          </div>
        }
      />

      <div className="mb-5 max-w-md">
        <SearchBar role="school_admin" value={search} onChange={setSearch} placeholder="Öğrenci ara (ad, e-posta)..." />
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          role="school_admin"
          icon={UserCheck}
          title={search ? 'Eşleşen öğrenci bulunamadı' : 'Henüz öğrenci bulunmuyor'}
          subtitle={search ? 'Arama terimlerini değiştirmeyi deneyin.' : 'İlk öğrencinizi eklemek için "Yeni Öğrenci" veya "CSV İçe Aktar" butonlarını kullanın.'}
        />
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border-b border-sky-100">
                <tr>
                  <th className="text-left px-5 py-3.5 text-[12px] font-extrabold text-[#0f2847] uppercase tracking-wider">Ad Soyad</th>
                  <th className="text-left px-5 py-3.5 text-[12px] font-extrabold text-[#0f2847] uppercase tracking-wider">E-posta</th>
                  <th className="text-left px-5 py-3.5 text-[12px] font-extrabold text-[#0f2847] uppercase tracking-wider">Durum</th>
                  <th className="text-left px-5 py-3.5 text-[12px] font-extrabold text-[#0f2847] uppercase tracking-wider">Kayıt</th>
                  <th className="text-right px-5 py-3.5 text-[12px] font-extrabold text-[#0f2847] uppercase tracking-wider">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 hover:bg-sky-50/30 transition-colors row-enter"
                    style={{ animationDelay: `${idx * 20}ms` }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md text-[12px] font-extrabold shrink-0">
                          {s.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-[#0f2847]">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {s.email}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold ${
                        s.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}>
                        {s.is_active ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {s.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-[12.5px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {new Date(s.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => removeStudent(s.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition active:scale-95"
                        title="Pasife Al"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <style jsx>{`
            .row-enter {
              animation: row-enter 300ms ease-out backwards;
            }
            @keyframes row-enter {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {/* Add Modal */}
      <PremiumModal
        open={modal === 'add'}
        onClose={() => setModal(null)}
        title="Yeni Öğrenci"
        subtitle="Yeni öğrenci hesabı oluşturun"
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton variant="ghost" onClick={() => setModal(null)}>İptal</ActionButton>
            <button
              onClick={addStudent}
              disabled={saving || !newStudent.full_name || !newStudent.email}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[13.5px] font-bold shadow-lg shadow-sky-500/30 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-[0.97]"
            >
              {saving ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Ad Soyad *</label>
            <input
              type="text"
              value={newStudent.full_name}
              onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">E-posta *</label>
            <input
              type="email"
              value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Sınıf</label>
            <select
              value={newStudent.class_id}
              onChange={(e) => setNewStudent({ ...newStudent, class_id: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
            >
              <option value="">Seçiniz</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-[12px] text-sky-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Varsayılan şifre: <strong>Ogrenci123!</strong> — Öğrenciyle paylaşmayı unutmayın.</p>
          </div>
        </div>
      </PremiumModal>

      {/* CSV Import Modal */}
      <PremiumModal
        open={modal === 'import'}
        onClose={() => setModal(null)}
        title="CSV ile Toplu Öğrenci Ekle"
        subtitle="Birden fazla öğrenciyi tek seferde ekleyin"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 text-sm text-sky-900">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <SchoolIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold mb-1">CSV Formatı</p>
                <p className="text-[12.5px] text-sky-800">Ad Soyad, Email, Sınıf (opsiyonel)</p>
                <p className="text-[11.5px] text-sky-600 mt-1">Ayraç: virgül, noktalı virgül veya tab</p>
              </div>
            </div>
          </div>

          <ActionButton variant="ghost" icon={Download} onClick={downloadTemplate}>
            Şablon İndir
          </ActionButton>

          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleCSV} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={saving}
            className="w-full py-8 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/30 text-sm font-bold text-sky-700 hover:border-sky-500 hover:bg-sky-50 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                İçe aktarılıyor...
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md">
                  <Upload className="w-5 h-5" />
                </div>
                CSV Dosyası Seç
              </>
            )}
          </button>

          {importResult && (
            <div className="space-y-2">
              {importResult.success > 0 && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span><strong>{importResult.success}</strong> öğrenci başarıyla eklendi.</span>
                </div>
              )}
              {importResult.errors.length > 0 && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  <div className="flex items-center gap-2 mb-1 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>{importResult.errors.length} hata:</span>
                  </div>
                  <ul className="ml-6 list-disc space-y-0.5 text-xs max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </PremiumModal>
    </div>
  );
}
