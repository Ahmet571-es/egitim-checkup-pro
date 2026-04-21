'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Baby, Plus, Key, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PageHeader from '@/components/ui/PageHeader';
import ActionButton from '@/components/ui/ActionButton';
import EmptyState from '@/components/ui/EmptyState';
import PremiumModal from '@/components/ui/PremiumModal';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { CardGridSkeleton } from '@/components/ui/Skeleton';

interface Child {
  id: string;
  full_name: string;
  email: string;
  student_code: string | null;
}

function MyChildrenContent() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoLinkTried, setAutoLinkTried] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: links } = await supabase
      .from('parent_students')
      .select('student_id')
      .eq('parent_id', user.id);

    const childIds = (links || []).map((l: { student_id: string }) => l.student_id);
    if (childIds.length === 0) {
      setChildren([]);
      setLoading(false);
      return;
    }

    const { data: kids } = await supabase
      .from('profiles')
      .select('id, full_name, email, student_code')
      .in('id', childIds);

    setChildren((kids || []) as Child[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // auto_code query param: register flow'undan gelen kodu otomatik gönder
  const addChildWithCode = useCallback(async (rawCode: string): Promise<boolean> => {
    const trimmed = rawCode.trim().toUpperCase();
    if (trimmed.length !== 6) {
      toast.error('Geçersiz kod', 'Öğrenci kodu 6 karakter olmalı.');
      return false;
    }
    setSubmitting(true);
    try {
      const csrf = typeof document !== 'undefined'
        ? document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1]
        : undefined;
      const res = await fetch('/api/parent/link-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'x-csrf-token': csrf } : {}),
        },
        body: JSON.stringify({ student_code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error('Ekleme başarısız', data.error || 'Bilinmeyen hata.');
        return false;
      }
      toast.success('Çocuk eklendi', `${data.full_name} çocuklarım listesine eklendi.`);
      setCode('');
      setModal(false);
      load();
      return true;
    } catch {
      toast.error('Bağlantı hatası', 'Lütfen tekrar deneyin.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [toast, load]);

  const addChild = () => addChildWithCode(code);

  // Register'dan auto_code param ile geldi → otomatik dene + URL'yi temizle
  useEffect(() => {
    if (autoLinkTried) return;
    const autoCode = searchParams.get('auto_code');
    if (!autoCode) return;
    setAutoLinkTried(true);
    // Çok küçük bir gecikme — CSRF cookie'nin middleware'den set edilmesini garanti et
    const t = setTimeout(async () => {
      await addChildWithCode(autoCode);
      router.replace('/parent/my-children');
    }, 500);
    return () => clearTimeout(t);
  }, [searchParams, autoLinkTried, addChildWithCode, router]);

  const unlink = async (childId: string, name: string) => {
    const ok = await confirm({
      variant: 'warning',
      title: 'Çocuğu listeden çıkar',
      description: `"${name}" çocuğunuzu veli listenizden çıkarmak istediğinize emin misiniz? Öğrencinin kaydı silinmez, sadece sizin bağınız kaldırılır.`,
      confirmLabel: 'Çıkar',
    });
    if (!ok) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: deleted, error } = await supabase
      .from('parent_students')
      .delete()
      .eq('parent_id', user.id)
      .eq('student_id', childId)
      .select(); // etkilenen satırları geri al ki RLS silent-block'u yakalayabilelim

    if (error) {
      toast.error('Hata', error.message);
      return;
    }
    if (!deleted || deleted.length === 0) {
      // RLS silent-block olmuş olabilir (DELETE policy eksik) veya
      // zaten başka bir tab'da silinmiş. Kullanıcıya dürüst mesaj:
      toast.error('Bağ kaldırılamadı', 'Yetkilendirme hatası olabilir. Sayfayı yenileyip tekrar dene.');
      load();
      return;
    }
    toast.success('Bağ kaldırıldı');
    load();
  };

  return (
    <div>
      <PageHeader
        role="parent"
        icon={Baby}
        title="Çocuklarım"
        subtitle="Çocuğunuzun 6 haneli öğrenci kodu ile sisteme bağlanın"
        count={children.length}
        countLabel="çocuk"
        action={
          <ActionButton variant="primary" icon={Plus} onClick={() => setModal(true)}>
            Çocuk Ekle
          </ActionButton>
        }
      />

      {loading ? (
        <CardGridSkeleton count={3} cols={3} />
      ) : children.length === 0 ? (
        <EmptyState
          role="parent"
          icon={Baby}
          title="Henüz çocuk eklenmedi"
          subtitle="Çocuğunuzu eklemek için 'Çocuk Ekle' butonuna tıklayın ve öğretmeninden aldığınız 6 haneli öğrenci kodunu girin."
          action={
            <ActionButton variant="primary" icon={Plus} onClick={() => setModal(true)}>
              Çocuk Ekle
            </ActionButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((c) => (
            <div
              key={c.id}
              className="relative p-5 rounded-2xl bg-gradient-to-br from-white to-pink-50/40 dark:from-slate-800 dark:to-slate-800/60 border border-pink-200/60 dark:border-slate-700 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-md">
                  <Baby className="w-6 h-6" />
                </div>
                <button
                  onClick={() => unlink(c.id, c.full_name)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  aria-label="Çocuğu listeden çıkar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base mb-1">
                {c.full_name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 truncate">{c.email}</p>
              {c.student_code && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-100/70 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 text-[11px] font-bold font-mono tracking-wider">
                  <Key className="w-3 h-3" />
                  {c.student_code}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <PremiumModal
        open={modal}
        onClose={() => { setModal(false); setCode(''); }}
        title="Çocuk Ekle"
        subtitle="Öğretmenden aldığınız 6 haneli öğrenci kodunu girin"
      >
        <div className="space-y-4 p-1">
          <div className="bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200/50 dark:border-pink-900/40 rounded-xl p-3 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0 mt-0.5" />
            <p className="text-xs text-pink-900 dark:text-pink-200 leading-relaxed">
              Öğrenci kodunu çocuğunuzun öğretmeninden veya okul rehberlik servisinden talep edebilirsiniz.
              Kodun sadece kendi çocuğunuza ait olduğundan emin olun.
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Öğrenci Kodu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-sm text-center text-lg font-bold tracking-[0.4em] font-mono text-pink-700 dark:text-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 transition-all"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">6 karakter: büyük harf ve sayı karışımı</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => { setModal(false); setCode(''); }}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={addChild}
              disabled={submitting || code.length !== 6}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
            >
              {submitting ? 'Ekleniyor...' : (<><CheckCircle2 className="w-4 h-4" /> Çocuğu Ekle</>)}
            </button>
          </div>
        </div>
      </PremiumModal>
    </div>
  );
}

export default function ParentMyChildrenPage() {
  return (
    <Suspense fallback={<CardGridSkeleton count={3} cols={3} />}>
      <MyChildrenContent />
    </Suspense>
  );
}
