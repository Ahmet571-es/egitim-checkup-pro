'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BarChart3, FileText, Download, Baby, Calendar, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

interface Child {
  id: string;
  full_name: string;
  student_code: string | null;
}

interface Result {
  id: string;
  test_type: string;
  created_at: string;
  scores: Record<string, unknown> | null;
  ai_report: string | null;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();

  const childIdParam = searchParams.get('child');
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(childIdParam);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChildren = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: links } = await supabase
      .from('parent_students')
      .select('student_id')
      .eq('parent_id', user.id);

    const childIds = (links || []).map((l: { student_id: string }) => l.student_id);
    if (childIds.length === 0) {
      setChildren([]);
      return;
    }
    const { data: kids } = await supabase
      .from('profiles')
      .select('id, full_name, student_code')
      .in('id', childIds);

    setChildren((kids || []) as Child[]);
    if (!selectedChildId && kids && kids.length > 0) {
      setSelectedChildId(kids[0].id);
      router.replace(`/parent/results?child=${kids[0].id}`);
    }
  }, [supabase, selectedChildId, router]);

  const loadResults = useCallback(async (studentId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('test_results')
      .select('id, test_type, created_at, scores, ai_report')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    setResults((data || []) as Result[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadChildren(); }, [loadChildren]);
  useEffect(() => {
    if (selectedChildId) loadResults(selectedChildId);
    else setLoading(false);
  }, [selectedChildId, loadResults]);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  const downloadReport = async (resultId: string, format: 'pdf' | 'docx') => {
    try {
      // Generic export endpoint: test_result_id per single test result.
      // audience=ebeveyn → PDF/Word'da ebeveyn-friendly infografik teması.
      const res = await fetch(`/api/export/${format}?test_result_id=${resultId}&audience=ebeveyn`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Rapor indirilemedi.' }));
        toast.error('İndirme başarısız', data.error || 'Bilinmeyen hata.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapor-${resultId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Hata', 'Rapor indirme sırasında bağlantı hatası.');
    }
  };

  // Hiç çocuk yoksa
  if (!loading && children.length === 0) {
    return (
      <div>
        <PageHeader
          role="parent"
          icon={BarChart3}
          title="Sonuçlar"
          subtitle="Çocuğunuzun test sonuçlarını buradan görebilirsiniz"
        />
        <EmptyState
          role="parent"
          icon={Baby}
          title="Henüz çocuk eklenmemiş"
          subtitle="Sonuçları görebilmek için önce çocuğunuzu eklemeniz gerekiyor."
          action={
            <button
              onClick={() => router.push('/parent/my-children')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              Çocuk Ekle
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        role="parent"
        icon={BarChart3}
        title="Sonuçlar"
        subtitle={selectedChild ? `${selectedChild.full_name} için tamamlanan testler` : 'Çocuk seçin'}
      />

      {/* Çocuk seçici */}
      {children.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedChildId(c.id);
                router.replace(`/parent/results?child=${c.id}`);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedChildId === c.id
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-pink-200/60 dark:border-slate-700 hover:border-pink-400'
              }`}
            >
              <Baby className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              {c.full_name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <CardGridSkeleton count={3} cols={1} />
      ) : results.length === 0 ? (
        <EmptyState
          role="parent"
          icon={FileText}
          title="Henüz test tamamlanmadı"
          subtitle="Çocuğunuz henüz hiç test tamamlamamış. Testler tamamlandıkça sonuçlar burada görünecek."
        />
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-2xl bg-gradient-to-br from-white to-pink-50/40 dark:from-slate-800 dark:to-slate-800/60 border border-pink-200/60 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-md">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base capitalize">
                      {r.test_type.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {r.ai_report && (
                    <>
                      <button
                        onClick={() => downloadReport(r.id, 'pdf')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 text-xs font-semibold hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                      <button
                        onClick={() => downloadReport(r.id, 'docx')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 text-xs font-semibold hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Word
                      </button>
                    </>
                  )}
                </div>
              </div>

              {r.ai_report ? (
                <div className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed bg-pink-50/50 dark:bg-slate-900/40 rounded-xl p-4 mt-2 border border-pink-100/60 dark:border-slate-700/60">
                  {r.ai_report.slice(0, 400)}
                  {r.ai_report.length > 400 && (
                    <span className="text-pink-600 dark:text-pink-400 font-semibold"> … tam rapor için indirin.</span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic mt-2">AI yorumu henüz oluşturulmadı.</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={() => router.push('/parent/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard'a Dön
        </button>
      </div>
    </div>
  );
}

export default function ParentResultsPage() {
  return (
    <Suspense fallback={<CardGridSkeleton count={3} cols={1} />}>
      <ResultsContent />
    </Suspense>
  );
}
