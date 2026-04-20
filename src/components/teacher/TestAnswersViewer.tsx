'use client';

/**
 * TestAnswersViewer — Öğretmen için test soruları + cevapları görüntüleyici
 *
 * Öğretmen bir öğrencinin tamamladığı testin içeriğini görür:
 *  - Her soruyu
 *  - Öğrencinin işaretlediği şıkkı (yeşil highlight)
 *  - Diğer şıkları
 *
 * Test tiplerine göre farklı yapıdaki soruları handle eder.
 * Dikkat testleri (D2, Burdon) sadece özet istatistik gösterir.
 */

import { useEffect, useMemo, useState } from 'react';
import { Loader2, X, CheckCircle2, AlertCircle, Trash2, Calendar, FileText, Hash } from 'lucide-react';
import { secureFetch } from '@/lib/csrf-client';

// Test veri importları — öğretmen tarafında da kullanılacak
import { SAG_SOL_BEYIN_QUESTIONS } from '@/lib/tests/sag-sol-beyin/data';
import { VARK_QUESTIONS } from '@/lib/tests/vark/data';
import { HOLLAND_QUESTIONS } from '@/lib/tests/holland/data';
import { getAllEnneagramQuestions } from '@/lib/tests/enneagram/engine';
import { COKLU_ZEKA_QUESTIONS_LISE } from '@/lib/tests/coklu-zeka/data';
import { SINAV_KAYGISI_QUESTIONS } from '@/lib/tests/sinav-kaygisi/data';
import { CALISMA_DAVRANISI_QUESTIONS } from '@/lib/tests/calisma-davranisi/data';
import { getAkademikSections } from '@/lib/tests/akademik-analiz/engine';

interface Props {
  studentId: string;
  resultId: string;
  onClose: () => void;
  onDeleted?: () => void;
}

interface TestResultData {
  id: string;
  student_id: string;
  test_type: string;
  scores: Record<string, unknown>;
  raw_answers: Record<string, unknown> | null;
  completed_at: string;
}

interface QuestionRow {
  id: string | number;
  text: string;
  options?: Record<string, string>;
  type: 'likert5' | 'likert4' | 'binary' | 'mc';
  passage?: string;
}

// ── Likert etiket haritaları ──────────────────────────
const LIKERT5_LABELS: Record<string, string> = {
  '1': 'Hiç Katılmıyorum',
  '2': 'Katılmıyorum',
  '3': 'Kararsızım',
  '4': 'Katılıyorum',
  '5': 'Kesinlikle Katılıyorum',
};
const LIKERT4_LABELS: Record<string, string> = {
  '1': 'Kesinlikle Bana Uymuyor',
  '2': 'Bana Uymuyor',
  '3': 'Bana Uyuyor',
  '4': 'Kesinlikle Bana Uyuyor',
};

// ── Test tipi bazında soru listesi üretici ──────────
function buildQuestionList(testType: string): QuestionRow[] {
  switch (testType) {
    case 'sag-sol-beyin':
      return SAG_SOL_BEYIN_QUESTIONS.map(q => ({
        id: q.id, text: q.text, type: 'mc',
        options: { a: q.a, b: q.b },
      }));

    case 'vark':
      return VARK_QUESTIONS.map(q => ({
        id: q.id, text: q.text, type: 'mc', options: q.options,
      }));

    case 'holland':
      return HOLLAND_QUESTIONS.map(q => ({
        id: q.id, text: q.text, type: 'likert5', options: LIKERT5_LABELS,
      }));

    case 'enneagram':
      return getAllEnneagramQuestions().map(q => ({
        id: q.id, text: q.text, type: 'likert5', options: LIKERT5_LABELS,
      }));

    case 'coklu-zeka': {
      const all: QuestionRow[] = [];
      for (const key of ['sozel','mantiksal','gorsel','muziksel','dogaci','sosyal','bedensel','icsel']) {
        const qs = COKLU_ZEKA_QUESTIONS_LISE[key as keyof typeof COKLU_ZEKA_QUESTIONS_LISE] ?? [];
        for (const q of qs) {
          all.push({ id: q.id, text: q.text, type: 'likert4', options: LIKERT4_LABELS });
        }
      }
      return all;
    }

    case 'sinav-kaygisi':
      return SINAV_KAYGISI_QUESTIONS.map(q => ({
        id: q.id, text: q.text, type: 'binary',
        options: { D: 'Doğru', Y: 'Yanlış' },
      }));

    case 'calisma-davranisi':
      return CALISMA_DAVRANISI_QUESTIONS.map(q => ({
        id: q.id, text: q.text, type: 'binary',
        options: { D: 'Doğru / Her zaman böyleyimdir', Y: 'Yanlış / Böyle değilimdir' },
      }));

    case 'akademik-analiz': {
      const sections = getAkademikSections();
      const all: QuestionRow[] = [];
      for (const sec of sections) {
        if (sec.type === 'passage_mc') {
          for (const p of sec.data as { passage: string; questions: { id: string; text: string; options: Record<string, string> }[] }[]) {
            for (const q of p.questions) {
              all.push({ id: q.id, text: q.text, type: 'mc', options: q.options, passage: p.passage });
            }
          }
        } else if (sec.type === 'mc') {
          for (const q of sec.data as { id: string; text: string; options: Record<string, string> }[]) {
            all.push({ id: q.id, text: q.text, type: 'mc', options: q.options });
          }
        } else if (sec.type === 'likert') {
          for (const q of sec.data as { id: string; text: string }[]) {
            all.push({ id: q.id, text: q.text, type: 'likert5', options: LIKERT5_LABELS });
          }
        }
      }
      return all;
    }

    default:
      return [];
  }
}

// ── Test tipleri — cevap görüntüleme desteği ────────
const QA_SUPPORTED = new Set([
  'enneagram', 'vark', 'holland', 'coklu-zeka', 'sinav-kaygisi',
  'calisma-davranisi', 'akademik-analiz', 'sag-sol-beyin',
]);

const SUMMARY_ONLY = new Set(['d2-dikkat', 'burdon-dikkat', 'hizli-okuma']);

const TEST_NAME_MAP: Record<string, string> = {
  'enneagram': 'Enneagram Kişilik Testi',
  'vark': 'VARK Öğrenme Stilleri',
  'holland': 'Holland RIASEC',
  'coklu-zeka': 'Çoklu Zekâ Testi',
  'sinav-kaygisi': 'Sınav Kaygısı Ölçeği',
  'calisma-davranisi': 'Çalışma Davranışı',
  'akademik-analiz': 'Akademik Analiz',
  'sag-sol-beyin': 'Sağ-Sol Beyin',
  'hizli-okuma': 'Hızlı Okuma',
  'd2-dikkat': 'P2 Dikkat Testi',
  'burdon-dikkat': 'Burdon Dikkat Testi',
};

export default function TestAnswersViewer({ studentId, resultId, onClose, onDeleted }: Props) {
  const [data, setData] = useState<TestResultData | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Verileri çek
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/teacher/students/${studentId}/test-results/${resultId}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Veri yüklenemedi');
        if (!cancelled) {
          setData(body.result);
          setStudentName(body.student?.full_name || '');
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Bilinmeyen hata');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId, resultId]);

  const questions = useMemo(() => {
    if (!data) return [];
    return buildQuestionList(data.test_type);
  }, [data]);

  // ESC ile kapatma
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await secureFetch(`/api/teacher/students/${studentId}/test-results/${resultId}`, {
        method: 'DELETE',
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Silme başarısız');
      onDeleted?.();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Silme başarısız');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const testName = data ? (TEST_NAME_MAP[data.test_type] || data.test_type) : '';
  const answers = data?.raw_answers || {};
  const completedDate = data ? new Date(data.completed_at).toLocaleString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '';

  // Cevap sayısı hesabı
  const answerCount = Object.keys(answers).length;
  const answerRate = questions.length > 0 ? Math.round((answerCount / questions.length) * 100) : 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* ═══ HEADER ═══ */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700/60 bg-gradient-to-r from-violet-500 to-indigo-600 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] font-extrabold truncate">{testName}</h3>
              <p className="text-violet-100 text-[12px] mt-0.5">
                <strong>{studentName}</strong> • {completedDate}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition shrink-0"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {data && !loading && (
            <div className="flex items-center gap-4 mt-3 text-[12px]">
              <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full">
                <Hash className="w-3.5 h-3.5" />
                <span className="font-bold">{answerCount}</span>
                <span className="opacity-80">/ {questions.length || '—'} cevap</span>
              </div>
              {questions.length > 0 && (
                <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-bold">%{answerRate}</span>
                  <span className="opacity-80">tamamlanma</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full">
                <Calendar className="w-3.5 h-3.5" />
                <span className="opacity-80">{new Date(data.completed_at).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
          )}
        </div>

        {/* ═══ BODY (SCROLLABLE) ═══ */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
              <p className="text-gray-500 dark:text-slate-400 text-[13px]">Test detayları yükleniyor...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-700 dark:text-rose-300 text-[13px]">Hata oluştu</p>
                <p className="text-rose-600 dark:text-rose-400 text-[12px] mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Destekleniyor → soru liste */}
          {!loading && !error && data && QA_SUPPORTED.has(data.test_type) && (
            <>
              {questions.length === 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-amber-800 dark:text-amber-300 text-[13px]">
                    Bu test için soru içeriği yüklenemedi. Eski bir kayıt olabilir.
                  </p>
                </div>
              )}

              {answerCount === 0 && questions.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-amber-800 dark:text-amber-300 text-[13px]">
                    Bu test kaydında şık bilgisi saklanmamış (eski kayıt). Yalnızca sonuç görüntülenebilir.
                  </p>
                </div>
              )}

              {questions.map((q, idx) => {
                const studentAnswer = answers[String(q.id)];
                const passage = q.passage;
                const showPassage = passage && (idx === 0 || questions[idx - 1]?.passage !== passage);
                return (
                  <div key={String(q.id)} className="mb-3">
                    {showPassage && (
                      <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1.5">
                          📖 Okuma Parçası
                        </p>
                        <p className="text-[12.5px] text-gray-700 dark:text-slate-300 leading-relaxed italic">
                          {passage}
                        </p>
                      </div>
                    )}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-[11px] font-extrabold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <p className="text-[13.5px] font-semibold text-[#0f2847] dark:text-slate-100 leading-relaxed flex-1">
                          {q.text}
                        </p>
                      </div>

                      {q.options && (
                        <div className="space-y-1.5" style={{ paddingLeft: '40px' }}>
                          {Object.entries(q.options).map(([key, val]) => {
                            const isSelected = String(studentAnswer) === key;
                            return (
                              <div
                                key={key}
                                className={`
                                  flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] transition
                                  ${isSelected
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-400 dark:border-emerald-600'
                                    : 'bg-gray-50 dark:bg-slate-700/40 border-2 border-transparent'
                                  }
                                `}
                              >
                                <span className={`
                                  shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center font-bold text-[10px]
                                  ${isSelected
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : 'border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-800'
                                  }
                                `}>
                                  {isSelected ? '✓' : key.toUpperCase()}
                                </span>
                                <span className={`
                                  flex-1
                                  ${isSelected
                                    ? 'text-emerald-900 dark:text-emerald-200 font-semibold'
                                    : 'text-gray-600 dark:text-slate-400'
                                  }
                                `}>
                                  {val}
                                </span>
                                {isSelected && (
                                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                                    Öğrencinin Cevabı
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {studentAnswer == null && (
                        <div className="mt-2 text-[11px] text-gray-400 dark:text-slate-500 italic" style={{ paddingLeft: '40px' }}>
                          ⚠️ Bu soruya cevap verilmemiş
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Sadece özet gösterilen testler */}
          {!loading && !error && data && SUMMARY_ONLY.has(data.test_type) && (
            <div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-blue-800 dark:text-blue-300 text-[13px] leading-relaxed">
                  <strong>Dikkat/Performans Testi:</strong> Bu testte çoktan seçmeli soru yerine
                  hız/doğruluk/dikkat ölçümleri alınır. Aşağıda skor özeti bulabilirsiniz.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <h4 className="text-[13px] font-extrabold text-[#0f2847] dark:text-slate-100 uppercase tracking-wider">
                    Skor Özeti
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(data.scores ?? {})
                    .filter(([k]) => !k.startsWith('_'))
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/40 rounded-lg px-3 py-2">
                        <span className="text-[12px] text-gray-600 dark:text-slate-400 truncate pr-2">{k}</span>
                        <span className="text-[12.5px] font-extrabold text-[#0f2847] dark:text-slate-100 shrink-0">
                          {typeof v === 'number' ? v.toString() : typeof v === 'object' ? '—' : String(v)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Bilinmeyen test tipi */}
          {!loading && !error && data && !QA_SUPPORTED.has(data.test_type) && !SUMMARY_ONLY.has(data.test_type) && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 dark:text-amber-300 text-[13px]">
                Bu test tipi için henüz görüntüleyici desteği yok: <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">{data.test_type}</code>
              </p>
            </div>
          )}
        </div>

        {/* ═══ FOOTER (Sil butonu) ═══ */}
        {!loading && !error && data && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700/60 bg-gray-50 dark:bg-slate-800/60 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Test kaydını silmek, bu raporun geçmişini etkilemez.
            </p>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-extrabold shadow-sm transition"
              >
                <Trash2 className="w-4 h-4" />
                Test Kaydını Sil
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-300 dark:border-rose-700 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-[12px] text-rose-700 dark:text-rose-300 font-semibold">Emin misin?</span>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="px-3 py-1 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-[11px] font-bold border border-gray-200 hover:bg-gray-50 transition"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold transition inline-flex items-center gap-1.5"
                >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Evet, Sil
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
