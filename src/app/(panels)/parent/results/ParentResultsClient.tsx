'use client';

/**
 * Veli Sonuçlar — Client Component
 * Çocuk seçici + test listesi + rapor modal
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, ChevronDown, Eye, FileText, CheckCircle,
  AlertCircle, Clock, X, Heart, BookOpen, Download,
} from 'lucide-react';
import IntegratedReportRenderer from '@/components/IntegratedReportRenderer';

const TEST_LABELS: Record<string, string> = {
  enneagram: 'Enneagram Kişilik',
  vark: 'VARK Öğrenme Stilleri',
  holland: 'Holland RIASEC',
  'coklu-zeka': 'Çoklu Zekâ',
  'sinav-kaygisi': 'Sınav Kaygısı',
  'calisma-davranisi': 'Çalışma Davranışı',
  'akademik-analiz': 'Akademik Analiz',
  'hizli-okuma': 'Hızlı Okuma',
  'd2-dikkat': 'D2 Dikkat',
  'sag-sol-beyin': 'Sağ-Sol Beyin',
};
function testLabel(t: string) { return TEST_LABELS[t] ?? t; }

interface Child {
  id: string;
  full_name: string;
}

interface TestResult {
  id: string;
  test_type: string;
  scores: Record<string, unknown>;
  completed_at: string;
  ai_report: string | null;
}

interface IntegratedReport {
  teacher_report: string | null;
  student_report: string | null;
  parent_report: string | null;
  generated_at: string | null;
}

interface Props {
  children: Child[];
  activeChildId: string | null;
  testResults: TestResult[];
  integratedReport: IntegratedReport | null;
}

interface ModalData {
  title: string;
  text: string;
  type: 'tekil' | 'veli';
}

export default function ParentResultsClient({ children, activeChildId, testResults, integratedReport }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalData | null>(null);

  function handleChildChange(childId: string) {
    router.push(`/parent/results?child=${childId}`);
  }

  // Skor özetini oluştur
  function scoreSummary(scores: Record<string, unknown>): string {
    const entries = Object.entries(scores).slice(0, 3);
    if (entries.length === 0) return '—';
    return entries.map(([k, v]) => `${k}: ${v}`).join(' • ');
  }

  const parentReport = integratedReport?.parent_report ?? null;
  const activeChild = children.find(c => c.id === activeChildId);

  return (
    <div>
      {/* Başlık */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0f2847]">Test Sonuçları</h1>
        </div>
        <p className="text-gray-500 text-sm ml-10">Çocuğunuzun tamamladığı testler ve raporlar</p>
      </div>

      {/* Çocuk yok */}
      {children.length === 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-12 text-center shadow-sm">
          <p className="text-4xl mb-4">👨‍👩‍👦</p>
          <h3 className="font-extrabold text-[#0f2847] text-lg mb-2">Henüz çocuk eşleştirmesi yapılmamış</h3>
          <p className="text-gray-500 text-sm">Okul yöneticinizle iletişime geçin.</p>
        </div>
      )}

      {children.length > 0 && (
        <>
          {/* Çocuk Seçici */}
          {children.length > 1 && (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm mb-6">
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Çocuk Seçin
              </label>
              <div className="relative">
                <select
                  value={activeChildId ?? ''}
                  onChange={e => handleChildChange(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-[#0f2847] focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer"
                >
                  {children.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Seçilen Çocuk Bilgisi */}
          {activeChild && (
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-5 mb-6 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-extrabold text-xl">
                  {activeChild.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Seçili Çocuk</p>
                  <h2 className="text-xl font-extrabold">{activeChild.full_name}</h2>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-white/80 text-sm flex items-center gap-1.5">
                      <BookOpen size={13} />
                      {testResults.length} test tamamlandı
                    </span>
                    <span className="text-white/80 text-sm flex items-center gap-1.5">
                      <FileText size={13} />
                      {testResults.filter(r => r.ai_report).length} rapor mevcut
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Veli Raporu Kartı (Entegre Rapor varsa) */}
          {parentReport ? (
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-2xl p-5 mb-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500 flex items-center justify-center flex-shrink-0">
                  <Heart size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold text-pink-900">Öğretmen Tarafından Hazırlanan Veli Raporu</h3>
                  <p className="text-pink-700 text-sm mt-1">
                    Çocuğunuzun gelişimine yönelik özel öneriler ve destek rehberi
                  </p>
                  {integratedReport?.generated_at && (
                    <p className="text-pink-500 text-xs mt-1 flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(integratedReport.generated_at).toLocaleDateString('tr-TR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setModal({ title: 'Veli Destek Raporu', text: parentReport, type: 'veli' })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition-colors"
                >
                  <Eye size={15} />
                  Görüntüle
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-amber-700 text-sm font-medium">
                Öğretmeniniz henüz veli raporu üretmemiş. Rapor üretildiğinde burada görünecek.
              </p>
            </div>
          )}

          {/* Test Sonuçları Listesi */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-extrabold text-[#0f2847] text-base">Tamamlanan Testler</h2>
            </div>

            {testResults.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-gray-500 font-semibold">Henüz tamamlanan test bulunmuyor.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {testResults.map(tr => (
                  <div key={tr.id} className="px-5 py-4 flex items-center gap-4 hover:bg-pink-50/20 transition-colors">
                    {/* Durum göstergesi */}
                    <div className={`w-2 h-10 rounded-full ${tr.ai_report ? 'bg-emerald-400' : 'bg-gray-200'}`} />

                    {/* Test bilgisi */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0f2847] text-sm">{testLabel(tr.test_type)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(tr.completed_at).toLocaleDateString('tr-TR', {
                          day: '2-digit', month: 'long', year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{scoreSummary(tr.scores)}</p>
                    </div>

                    {/* Butonlar */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {tr.ai_report ? (
                        <>
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold hidden sm:flex">
                            <CheckCircle size={13} />
                            Rapor Var
                          </span>
                          <button
                            onClick={() => setModal({
                              title: testLabel(tr.test_type) + ' — Detay Raporu',
                              text: tr.ai_report!,
                              type: 'tekil',
                            })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 text-pink-700 text-xs font-semibold hover:bg-pink-100 transition-all"
                          >
                            <Eye size={13} />
                            Detaylar
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Rapor bekleniyor</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Rapor Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal başlık */}
            <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl ${
              modal.type === 'veli' ? 'bg-gradient-to-r from-pink-500 to-rose-500' : 'bg-[#0f2847]'
            }`}>
              <h3 className="font-extrabold text-white text-base">{modal.title}</h3>
              <button
                onClick={() => setModal(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal içeriği */}
            <div className="flex-1 overflow-y-auto p-6">
              {modal.type === 'veli' && (
                <div className="mb-4 bg-pink-50 border border-pink-100 rounded-xl p-4">
                  <p className="text-pink-700 text-sm font-semibold flex items-center gap-2">
                    <Heart size={15} />
                    Bu rapor öğretmeniniz tarafından sizin için özel olarak hazırlanmıştır.
                  </p>
                </div>
              )}
              {modal.type === 'veli' ? (
                <IntegratedReportRenderer text={modal.text} reportType="ebeveyn" />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                  {modal.text}
                </pre>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(modal.text);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all"
              >
                📋 Kopyala
              </button>
              {modal.type === 'veli' && activeChildId && (
                <>
                  <a
                    href={`/api/export/integrated?student_id=${activeChildId}&format=pdf`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-all border border-red-200"
                  >
                    <Download size={14} />
                    PDF İndir
                  </a>
                  <a
                    href={`/api/export/integrated?student_id=${activeChildId}&format=docx`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-all border border-blue-200"
                  >
                    <Download size={14} />
                    Word İndir
                  </a>
                </>
              )}
              <button
                onClick={() => setModal(null)}
                className="ml-auto px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold hover:opacity-90 transition-all"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
