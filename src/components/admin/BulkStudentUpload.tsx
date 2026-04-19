'use client';

import { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle2, Loader2, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ParsedStudent {
  full_name: string;
  email: string;
  grade: string;
  valid: boolean;
  error?: string;
}

export default function BulkStudentUpload() {
  const toast = useToast();
  const [students, setStudents] = useState<ParsedStudent[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const csv = 'Ad Soyad,E-posta,Sınıf\nAhmet Yılmaz,ahmet@example.com,9\nAyşe Demir,ayse@example.com,10\n';
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ogrenci_sablonu.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function parseCSV(text: string): ParsedStudent[] {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    return lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const [full_name, email, grade] = cols;

      if (!full_name || !email) {
        return { full_name: full_name || '?', email: email || '?', grade: grade || '?', valid: false, error: 'Ad veya e-posta eksik' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { full_name, email, grade: grade || '?', valid: false, error: 'Geçersiz e-posta' };
      }

      return { full_name, email, grade: grade || '9', valid: true };
    });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setStudents(parseCSV(text));
      setResult(null);
    };
    reader.readAsText(file, 'UTF-8');
  }

  async function handleUpload() {
    const validStudents = students.filter(s => s.valid);
    if (validStudents.length === 0) return;

    setUploading(true);

    try {
      const res = await fetch('/api/students/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students: validStudents.map(s => ({
            full_name: s.full_name,
            email: s.email,
            grade: s.grade,
          })),
        }),
      });

      const data = await res.json();
      if (data.success !== undefined) {
        setResult({ success: data.success, failed: data.failed });
        if (data.success > 0) {
          toast.success(`${data.success} öğrenci eklendi`, data.failed > 0 ? `${data.failed} kayıt başarısız oldu.` : undefined);
        }
      } else {
        setResult({ success: 0, failed: validStudents.length });
        toast.error('Yükleme başarısız', data.error || 'Sunucu hata döndürdü.');
      }
    } catch {
      setResult({ success: 0, failed: validStudents.length });
      toast.error('Bağlantı hatası', 'İnternet bağlantınızı kontrol edin.');
    }

    setUploading(false);
  }

  const validCount = students.filter(s => s.valid).length;
  const invalidCount = students.filter(s => !s.valid).length;

  return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 shadow-sm p-6">
      <h2 className="text-lg font-extrabold text-[#0f2847] dark:text-slate-100 mb-4">Toplu Öğrenci Yükleme</h2>

      {/* Şablon İndir */}
      <button
        onClick={downloadTemplate}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-100 transition-colors mb-4"
      >
        <Download className="w-4 h-4" /> CSV Şablonu İndir
      </button>

      {/* Dosya Yükle */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-all"
      >
        <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-slate-400">CSV dosyasını sürükle veya tıkla</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Sütunlar: Ad Soyad, E-posta, Sınıf</p>
        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
      </div>

      {/* Önizleme */}
      {students.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-300">
              {validCount} geçerli, {invalidCount} hatalı
            </span>
            <button
              onClick={handleUpload}
              disabled={uploading || validCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors ml-auto"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {validCount} Öğrenci Yükle
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-100 dark:border-slate-700/60 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/60">
                <tr className="text-xs text-gray-400 dark:text-slate-500 uppercase">
                  <th className="text-left py-2 px-3">Ad Soyad</th>
                  <th className="text-left py-2 px-3">E-posta</th>
                  <th className="text-left py-2 px-3">Sınıf</th>
                  <th className="text-center py-2 px-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="py-2 px-3 text-gray-700 dark:text-slate-300">{s.full_name}</td>
                    <td className="py-2 px-3 text-gray-500 dark:text-slate-400">{s.email}</td>
                    <td className="py-2 px-3 text-gray-500 dark:text-slate-400">{s.grade}</td>
                    <td className="py-2 px-3 text-center">
                      {s.valid
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        : <span className="flex items-center gap-1 text-xs text-red-500 justify-center">
                            <AlertCircle className="w-3 h-3" /> {s.error}
                          </span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sonuç */}
      {result && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          ✅ {result.success} öğrenci başarıyla yüklendi{result.failed > 0 ? `, ${result.failed} hatalı` : ''}.
        </div>
      )}
    </div>
  );
}
