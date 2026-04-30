'use client';
/**
 * Faz 6: Harmanlanmış (Holistic) Rapor — Genetik PDF Ek Yöneticisi
 *
 * Sürükle-bırak ile öğretmen, yüklü genetik PDF'leri bu harmanlanmış rapora
 * ek olarak bağlar. Bağlantılar PDF export sırasında ek sayfa olarak gömülür.
 *
 * UX:
 *   • Sol panel: bu öğrenciye yüklü ama henüz bu rapora eklenmemiş genetik PDF'ler.
 *   • Sağ panel (drop zone): bu rapora şu anda eklenenler.
 *   • Sürükle: kart sol → sağ → bağlantı oluşur (POST /attachments).
 *   • Sağdaki "X" butonu: bağlantıyı kaldırır (DELETE /attachments/[id]).
 *
 * @dnd-kit/core kullanılır. Klavye sensörü ile a11y desteği var.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, KeyboardSensor, useSensor, useSensors,
  useDraggable, useDroppable,
} from '@dnd-kit/core';
import { secureFetch } from '@/lib/csrf-client';
import { useToast } from '@/components/ui/Toast';
import {
  FileText, GripVertical, X, Inbox, Loader2, AlertCircle, Lock,
} from 'lucide-react';

interface GeneticReport {
  id: string;
  original_filename: string;
  file_size: number;
  uploaded_at: string;
  notes: string | null;
}

interface Attachment {
  id: string;                  // attachment id
  position: number;
  attached_at: string;
  genetic_report_id: string;
  original_filename: string;
  file_size: number;
  uploaded_at: string;
  notes: string | null;
}

interface Props {
  holisticReportId: string;
  studentId: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// ════════ Draggable: sol paneldeki PDF kartı ════════
function DraggablePdfCard({ pdf, disabled }: { pdf: GeneticReport; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: pdf.id,
    data: { pdf },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group flex items-center gap-2.5 p-3 rounded-xl border bg-white dark:bg-slate-800 shadow-sm transition-all ${
        disabled
          ? 'opacity-50 cursor-not-allowed border-gray-200'
          : isDragging
          ? 'border-violet-400 ring-2 ring-violet-200 cursor-grabbing'
          : 'border-violet-200 hover:border-violet-400 hover:shadow-md cursor-grab'
      }`}
      role="button"
      aria-label={`Sürükle: ${pdf.original_filename}`}
    >
      <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-violet-500 shrink-0" aria-hidden />
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
        <FileText className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[12px] text-[#0f2847] dark:text-slate-100 truncate">
          {pdf.original_filename}
        </div>
        <div className="text-[10px] text-gray-500 dark:text-slate-400">
          {formatBytes(pdf.file_size)} · {new Date(pdf.uploaded_at).toLocaleDateString('tr-TR')}
        </div>
      </div>
    </div>
  );
}

// ════════ Droppable: sağ paneldeki "ekli" alanı ════════
function DroppableAttachedArea({
  attachments,
  onRemove,
  isOver,
  disabled,
}: {
  attachments: Attachment[];
  onRemove: (attachmentId: string) => void;
  isOver: boolean;
  disabled: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: 'attached-zone', disabled });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[160px] rounded-xl border-2 border-dashed p-3 transition-all ${
        disabled
          ? 'bg-gray-50 dark:bg-slate-900/40 border-gray-200'
          : isOver
          ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-400 ring-2 ring-violet-200'
          : 'bg-violet-50/30 dark:bg-violet-950/10 border-violet-300'
      }`}
    >
      {attachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Inbox className="w-8 h-8 text-violet-300 mb-2" aria-hidden />
          <p className="text-[12px] font-bold text-gray-500 dark:text-slate-400 mb-0.5">
            Henüz ek yok
          </p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 max-w-[200px]">
            Soldaki PDF kartlarını sürükleyip buraya bırakın
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-violet-200"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[12px] text-[#0f2847] dark:text-slate-100 truncate">
                  {a.original_filename}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-slate-400">
                  {formatBytes(a.file_size)}
                </div>
              </div>
              <button
                onClick={() => onRemove(a.id)}
                disabled={disabled}
                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition-colors disabled:opacity-40"
                aria-label={`Bağlantıyı kaldır: ${a.original_filename}`}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ════════ Ana komponent ════════
export default function HolisticAttachmentsPanel({ holisticReportId, studentId }: Props) {
  const toast = useToast();
  const [allPdfs, setAllPdfs] = useState<GeneticReport[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isOver, setIsOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // ── Veriyi yükle ──
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pdfRes, attachRes] = await Promise.all([
        fetch(`/api/genetic-reports/list?student_id=${encodeURIComponent(studentId)}`),
        fetch(`/api/reports/holistic/${encodeURIComponent(holisticReportId)}/attachments`),
      ]);

      const pdfData = await pdfRes.json();
      const attachData = await attachRes.json();

      if (!pdfRes.ok) {
        // 403 olabilir — öğretmen kapsamı dışı; o durumda komponent görünmesin
        setError(pdfData.error || 'Genetik raporlar alınamadı.');
        setLoading(false);
        return;
      }
      if (!attachRes.ok) {
        setError(attachData.error || 'Bağlantılar alınamadı.');
        setLoading(false);
        return;
      }

      setAllPdfs(pdfData.reports || []);
      setAttachments(attachData.attachments || []);
    } catch {
      setError('Bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  }, [holisticReportId, studentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // ── Sol panel: ekli olmayan PDF'ler ──
  const attachedGenIds = new Set(attachments.map((a) => a.genetic_report_id));
  const availablePdfs = allPdfs.filter((p) => !attachedGenIds.has(p.id));

  // ── Drag handlers ──
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setIsOver(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    setIsOver(false);
    const { active, over } = event;
    if (!over || over.id !== 'attached-zone') return;

    const geneticReportId = String(active.id);
    setBusy(true);
    try {
      const res = await secureFetch(
        `/api/reports/holistic/${encodeURIComponent(holisticReportId)}/attachments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ genetic_report_id: geneticReportId }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error('Eklenemedi', data.error || 'Bilinmeyen hata.');
        return;
      }
      toast.success('PDF rapora eklendi');
      reload();
    } catch {
      toast.error('Bağlantı hatası', 'Lütfen tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };

  const handleDragOver = (event: { over: { id: string | number } | null }) => {
    setIsOver(event.over?.id === 'attached-zone');
  };

  const handleRemove = async (attachmentId: string) => {
    setBusy(true);
    try {
      const res = await secureFetch(
        `/api/reports/holistic/${encodeURIComponent(holisticReportId)}/attachments/${encodeURIComponent(attachmentId)}`,
        { method: 'DELETE' },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error('Kaldırılamadı', data.error || 'Bilinmeyen hata.');
        return;
      }
      toast.success('Bağlantı kaldırıldı');
      reload();
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error) {
    // 403 dahil tüm hatalar — komponenti gizle (yetkisiz öğretmen vb.)
    return (
      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <p className="text-[12px] text-rose-800 dark:text-rose-300">{error}</p>
      </div>
    );
  }

  const activePdf = activeDragId ? allPdfs.find((p) => p.id === activeDragId) : null;

  return (
    <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10 border border-violet-200 dark:border-violet-900/40">
      {/* Başlık */}
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-3.5 h-3.5 text-violet-600" aria-hidden />
        <h4 className="text-[12px] font-extrabold text-[#0f2847] dark:text-slate-100">
          Genetik Rapor Ek&apos;leri
        </h4>
        <span className="text-[10px] text-violet-600 bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
          KVKK m.6
        </span>
      </div>

      {allPdfs.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-[12px] text-gray-500 dark:text-slate-400">
            Bu öğrenciye henüz genetik rapor yüklenmemiş.
          </p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
            Yöneticiye PDF yükletin, ardından buraya sürükleyebilirsiniz.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Sol: kullanılabilir */}
            <div>
              <div className="text-[11px] font-bold text-gray-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                Yüklü PDF&apos;ler
                <span className="text-[10px] font-normal text-gray-400">({availablePdfs.length})</span>
              </div>
              {availablePdfs.length === 0 ? (
                <div className="py-4 px-3 rounded-lg bg-white/50 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-700">
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 text-center">
                    Tüm yüklü PDF&apos;ler bu rapora eklenmiş.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availablePdfs.map((p) => (
                    <DraggablePdfCard key={p.id} pdf={p} disabled={busy} />
                  ))}
                </div>
              )}
            </div>

            {/* Sağ: ekli olanlar (drop zone) */}
            <div>
              <div className="text-[11px] font-bold text-gray-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                Bu Rapora Eklenenler
                <span className="text-[10px] font-normal text-gray-400">({attachments.length})</span>
              </div>
              <DroppableAttachedArea
                attachments={attachments}
                onRemove={handleRemove}
                isOver={isOver}
                disabled={busy}
              />
            </div>
          </div>

          {/* Drag overlay — sürüklerken görünen ghost kart */}
          <DragOverlay>
            {activePdf ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl border-2 border-violet-500 bg-white dark:bg-slate-800 shadow-2xl rotate-1">
                <GripVertical className="w-4 h-4 text-violet-500 shrink-0" />
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[12px] text-[#0f2847] truncate">
                    {activePdf.original_filename}
                  </div>
                  <div className="text-[10px] text-gray-500">{formatBytes(activePdf.file_size)}</div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-2 italic">
        💡 Eklenen genetik PDF&apos;ler, raporu PDF olarak indirdiğinizde sona ek sayfa olarak gömülür.
      </p>
    </div>
  );
}
