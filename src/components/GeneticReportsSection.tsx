'use client';
/**
 * Faz 5: Genetik Rapor görüntüleme + yönetim komponenti
 *
 * Reusable: hem öğretmen detay sayfasında hem admin/school panellerinde kullanılır.
 *
 * KVKK m.6 — komponent içinde role'a göre davranır:
 *   • admin / school_admin → yükle + indir + sil
 *   • teacher → indir
 *   • student / parent → komponent hiçbir şey render etmez (defansif olarak)
 *
 * Asıl yetki kontrolü API endpoint'lerinde — UI seviyesi koruma defansif.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { secureFetch } from '@/lib/csrf-client';
import { createClient } from '@/lib/supabase/client';
import {
  FileText, Upload, Download, Trash2, AlertCircle, CheckCircle2, X,
  Lock, Loader2, Calendar, User as UserIcon, Plus, Shield
} from 'lucide-react';

interface Report {
  id: string;
  original_filename: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by_name: string;
  notes: string | null;
}

interface Props {
  studentId: string;
  studentName?: string;
}

const ROLES_CAN_MANAGE = ['admin', 'school_admin'];
const ROLES_CAN_VIEW = ['admin', 'school_admin', 'teacher'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function GeneticReportsSection({ studentId, studentName }: Props) {
  const [role, setRole] = useState<string | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Yükleme modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // İndirme/silme state
  const [actionId, setActionId] = useState<string | null>(null);

  // ── Role çek ──
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const r =
            (user.user_metadata?.role as string) ||
            (await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()).data?.role;
          setRole(r || null);
        }
      } finally {
        setRoleChecked(true);
      }
    })();
  }, []);

  const canManage = role !== null && ROLES_CAN_MANAGE.includes(role);
  const canView = role !== null && ROLES_CAN_VIEW.includes(role);

  // ── Liste çek ──
  const loadList = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setListError(null);
    try {
      const res = await fetch(`/api/genetic-reports/list?student_id=${encodeURIComponent(studentId)}`);
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error || 'Liste alınamadı.');
        setLoading(false);
        return;
      }
      setReports(data.reports || []);
    } catch {
      setListError('Bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  }, [studentId, canView]);

  useEffect(() => {
    if (roleChecked && canView) loadList();
    else if (roleChecked) setLoading(false);
  }, [roleChecked, canView, loadList]);

  // ── KVKK savunma: yetkisiz roller hiçbir şey görmez ──
  if (!roleChecked) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!canView) {
    // Defansif: parent/student bu noktaya gelmemeli ama gelirse bile hiçbir şey gösterme.
    return null;
  }

  // ── İndirme ──
  const handleDownload = async (reportId: string, filename: string) => {
    setActionId(reportId);
    try {
      const res = await fetch(`/api/genetic-reports/${reportId}/download`);
      const data = await res.json();
      if (!res.ok || !data.signed_url) {
        alert(data.error || 'İndirme bağlantısı oluşturulamadı.');
        return;
      }
      // Yeni sekme/indirme
      const link = document.createElement('a');
      link.href = data.signed_url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert('Bağlantı hatası.');
    } finally {
      setActionId(null);
    }
  };

  // ── Silme ──
  const handleDelete = async (reportId: string, filename: string) => {
    if (!confirm(`"${filename}" raporunu silmek istediğinize emin misiniz?\n\nKVKK m.7 silme hakkı kapsamındadır. Geri alınamaz.`)) return;
    setActionId(reportId);
    try {
      const res = await secureFetch(`/api/genetic-reports/${reportId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Silinemedi.');
        return;
      }
      // Listeyi yenile
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch {
      alert('Bağlantı hatası.');
    } finally {
      setActionId(null);
    }
  };

  // ── Yükleme ──
  const resetUploadForm = () => {
    setFile(null);
    setNotes('');
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f && f.type !== 'application/pdf') {
      setUploadError('Sadece PDF dosyası yüklenebilir.');
      setFile(null);
      return;
    }
    if (f && f.size > 10 * 1024 * 1024) {
      setUploadError('Dosya boyutu 10 MB sınırını aşıyor.');
      setFile(null);
      return;
    }
    setFile(f);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError('Lütfen bir PDF seçin.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('student_id', studentId);
      if (notes.trim()) formData.append('notes', notes.trim());

      const res = await secureFetch('/api/genetic-reports/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Yüklenemedi.');
        return;
      }
      // Başarılı → modal'ı kapat ve listeyi yenile
      setUploadOpen(false);
      resetUploadForm();
      loadList();
    } catch {
      setUploadError('Bağlantı hatası.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-violet-200 dark:border-violet-900/40 shadow-sm p-6 mb-6">
      {/* Başlık */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-[#0f2847] dark:text-slate-100 text-base flex items-center gap-2 flex-wrap">
              Genetik Raporlar
              <span className="text-[10px] font-bold text-violet-700 bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 px-2 py-0.5 rounded-full uppercase tracking-wider">KVKK m.6</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Özel nitelikli kişisel veri — yalnızca yetkili roller erişebilir
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-[13px] font-bold shadow-md shadow-violet-500/25 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Yükle
          </button>
        )}
      </div>

      {/* KVKK uyarı banner'ı */}
      <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-start gap-2">
        <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
          Genetik veriler 6698 sayılı KVKK madde 6 kapsamında özel nitelikli kişisel veridir.
          Veliler ve öğrenciler bu raporlara erişemez. Eğitim amaçlı kullanılır, üçüncü kişilerle paylaşılamaz.
        </p>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
        </div>
      ) : listError ? (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-800 dark:text-rose-300">{listError}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-10 text-center">
          <FileText className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {canManage
              ? 'Henüz genetik rapor yüklenmemiş. Rus ekipten gelen PDF\'i "Yükle" ile ekleyebilirsiniz.'
              : 'Bu öğrenci için henüz genetik rapor yüklenmemiş.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 hover:border-violet-300 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[#0f2847] dark:text-slate-100 truncate">
                  {r.original_filename}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(r.uploaded_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3" /> {r.uploaded_by_name}
                  </span>
                  <span>{formatBytes(r.file_size)}</span>
                </div>
                {r.notes && (
                  <p className="text-[12px] text-gray-600 dark:text-slate-300 mt-1 italic">
                    {r.notes}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleDownload(r.id, r.original_filename)}
                  disabled={actionId === r.id}
                  className="px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                  aria-label="İndir"
                >
                  <Download className="w-3.5 h-3.5" /> İndir
                </button>
                {canManage && (
                  <button
                    onClick={() => handleDelete(r.id, r.original_filename)}
                    disabled={actionId === r.id}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-600 transition-colors disabled:opacity-50"
                    aria-label="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ═══ Yükleme Modal'ı ═══ */}
      {uploadOpen && canManage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => !uploading && setUploadOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#0f2847] dark:text-slate-100">
                    Genetik Rapor Yükle
                  </h2>
                  {studentName && (
                    <p className="text-xs text-gray-500 dark:text-slate-400">{studentName}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => !uploading && setUploadOpen(false)}
                disabled={uploading}
                className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center disabled:opacity-50"
                aria-label="Kapat"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 flex items-start gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-rose-800 dark:text-rose-300">{uploadError}</p>
                </div>
              )}

              {/* KVKK uyarı */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Yüklediğiniz PDF KVKK m.6 kapsamında özel nitelikli veridir.
                  Yalnızca eğitim amaçlı kullanım için yetkili kişilere erişim verilir.
                </p>
              </div>

              {/* Dosya seçim */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  PDF Dosyası <span className="text-rose-500">*</span> <span className="text-gray-400 font-normal">(max 10 MB)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-700 dark:text-slate-300
                    file:mr-3 file:py-2 file:px-4 file:rounded-lg
                    file:border-0 file:text-sm file:font-semibold
                    file:bg-violet-50 file:text-violet-700
                    hover:file:bg-violet-100 cursor-pointer"
                />
                {file && (
                  <div className="mt-2 flex items-center gap-2 text-[12px] text-gray-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-mono truncate">{file.name}</span>
                    <span>({formatBytes(file.size)})</span>
                  </div>
                )}
              </div>

              {/* Notlar */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Notlar <span className="text-gray-400 font-normal">(opsiyonel)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  placeholder="Bu rapor hakkında kısa bir not..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">{notes.length}/500</p>
              </div>

              {/* Butonlar */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => !uploading && setUploadOpen(false)}
                  disabled={uploading}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm font-bold disabled:opacity-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !file}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-sm font-extrabold shadow-md shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Yükle</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
