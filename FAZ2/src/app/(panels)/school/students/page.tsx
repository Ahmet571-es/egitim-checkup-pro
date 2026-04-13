'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, X, Search, UserCheck, Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Profile } from '@/types';

export default function SchoolStudentsPage() {
  const [students, setStudents] = useState<(Profile & { classes?: string[] })[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'import' | null>(null);
  const [newStudent, setNewStudent] = useState({ full_name: '', email: '', class_id: '' });
  const [saving, setSaving] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
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
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const addStudent = async () => {
    if (!schoolId || !newStudent.full_name || !newStudent.email) return;
    setSaving(true);

    // Create auth user via admin (in production use service_role, here we use signUp)
    const tempPass = 'Ogrenci123!';
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: newStudent.email,
      password: tempPass,
      options: { data: { full_name: newStudent.full_name, role: 'student', school_id: schoolId } },
    });

    if (authErr) {
      alert('Hata: ' + authErr.message);
      setSaving(false);
      return;
    }

    // Add to class if selected
    if (newStudent.class_id && authData.user) {
      await supabase.from('class_students').insert({ class_id: newStudent.class_id, student_id: authData.user.id });
    }

    setSaving(false);
    setModal(null);
    setNewStudent({ full_name: '', email: '', class_id: '' });
    load();
  };

  const removeStudent = async (id: string) => {
    if (!confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) return;
    await supabase.from('profiles').update({ is_active: false }).eq('id', id);
    load();
  };

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !schoolId) return;
    setSaving(true);
    setImportResult(null);

    const text = await file.text();
    const lines = text.split('\n').filter((l) => l.trim());
    const header = lines[0].toLowerCase();

    // Expect: ad soyad, email, sınıf (optional)
    const hasHeader = header.includes('ad') || header.includes('email') || header.includes('name');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
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

      // Assign to class if provided
      if (className && authData.user) {
        const cls = classes.find((c) => c.name.toLowerCase() === className.toLowerCase());
        if (cls) {
          await supabase.from('class_students').insert({ class_id: cls.id, student_id: authData.user.id });
        }
      }
      success++;
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

  const filtered = students.filter((s) => s.full_name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f2847]">Öğrenciler</h1>
          <p className="text-sm text-gray-500 mt-1">{students.length} öğrenci</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setImportResult(null); setModal('import'); }} className="px-4 py-2.5 rounded-xl bg-white/70 border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Upload className="w-4 h-4" /> CSV İçe Aktar
          </button>
          <button onClick={() => setModal('add')} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white text-sm font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Yeni Öğrenci
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Öğrenci ara..." className="w-full sm:w-80 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40">
          <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Henüz öğrenci bulunmuyor.</p>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">Ad Soyad</th>
                  <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">E-posta</th>
                  <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">Durum</th>
                  <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">Kayıt</th>
                  <th className="text-right px-5 py-3 text-[13px] font-semibold text-gray-500">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-semibold text-[#0f2847]">{s.full_name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{s.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(s.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => removeStudent(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {modal === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#0f2847]">Yeni Öğrenci</h3>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">Ad Soyad *</label>
                <input type="text" value={newStudent.full_name} onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">E-posta *</label>
                <input type="email" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">Sınıf</label>
                <select value={newStudent.class_id} onChange={(e) => setNewStudent({ ...newStudent, class_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30">
                  <option value="">Seçiniz</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <p className="text-[12px] text-gray-400">Varsayılan şifre: Ogrenci123!</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">İptal</button>
              <button onClick={addStudent} disabled={saving || !newStudent.full_name || !newStudent.email} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white text-sm font-bold shadow-lg disabled:opacity-50">
                {saving ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {modal === 'import' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#0f2847]">CSV ile Toplu Öğrenci Ekle</h3>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="mb-4 p-4 rounded-xl bg-sky-50 border border-sky-200 text-sm text-sky-800">
              <p className="font-semibold mb-1">CSV Formatı:</p>
              <p>Ad Soyad, Email, Sınıf (opsiyonel)</p>
              <p className="text-sky-600 mt-1">Ayraç: virgül, noktalı virgül veya tab</p>
            </div>

            <button onClick={downloadTemplate} className="mb-4 px-4 py-2 rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200 flex items-center gap-2">
              <Download className="w-4 h-4" /> Şablon İndir
            </button>

            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleCSV} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={saving} className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-500 hover:border-sky-400 hover:text-sky-600 transition-colors flex items-center justify-center gap-2">
              {saving ? 'İçe aktarılıyor...' : <><Upload className="w-4 h-4" /> CSV Dosyası Seç</>}
            </button>

            {importResult && (
              <div className="mt-4 space-y-2">
                {importResult.success > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />{importResult.success} öğrenci başarıyla eklendi.
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                    <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4" />{importResult.errors.length} hata:</div>
                    <ul className="ml-6 list-disc space-y-0.5 text-xs max-h-32 overflow-y-auto">
                      {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
