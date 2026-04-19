'use client';

/**
 * Global Keyboard Shortcut System
 * Command palette benzeri hızlı navigasyon (Cmd/Ctrl+K)
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, LayoutDashboard, School, Users, GraduationCap, BookOpen,
  ClipboardList, BarChart3, FileText, User, Radar, CreditCard,
  Sparkles, Trophy, Palette, Heart, Key, Settings, Command, X, ArrowRight
} from 'lucide-react';

interface ShortcutItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  keywords?: string[];
  shortcut?: string;
}

const ALL_ITEMS: ShortcutItem[] = [
  // Admin
  { id: 'admin-dashboard', label: 'Yönetici Panosu', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['admin'], keywords: ['home', 'ana sayfa'] },
  { id: 'admin-schools', label: 'Okullar', href: '/admin/schools', icon: School, roles: ['admin'] },
  { id: 'admin-licenses', label: 'Lisanslar', href: '/admin/licenses', icon: Key, roles: ['admin'] },
  { id: 'admin-users', label: 'Kullanıcılar', href: '/admin/users', icon: Users, roles: ['admin'] },
  { id: 'admin-settings', label: 'Ayarlar', href: '/admin/settings', icon: Settings, roles: ['admin'] },
  // School Admin
  { id: 'school-dashboard', label: 'Okul Panosu', href: '/school/dashboard', icon: LayoutDashboard, roles: ['school_admin'] },
  { id: 'school-classes', label: 'Sınıflar', href: '/school/classes', icon: BookOpen, roles: ['school_admin'] },
  { id: 'school-teachers', label: 'Öğretmenler', href: '/school/teachers', icon: GraduationCap, roles: ['school_admin'] },
  { id: 'school-students', label: 'Öğrenciler', href: '/school/students', icon: Users, roles: ['school_admin'] },
  { id: 'school-parents', label: 'Veliler', href: '/school/parents', icon: Heart, roles: ['school_admin'] },
  { id: 'school-billing', label: 'Faturalandırma', href: '/school/billing', icon: CreditCard, roles: ['school_admin'], keywords: ['ödeme', 'plan'] },
  { id: 'school-branding', label: 'Markalama', href: '/school/branding', icon: Palette, roles: ['school_admin'], keywords: ['logo', 'renk'] },
  // Teacher
  { id: 'teacher-dashboard', label: 'Öğretmen Panosu', href: '/teacher/dashboard', icon: LayoutDashboard, roles: ['teacher'] },
  { id: 'teacher-students', label: 'Öğrencilerim', href: '/teacher/students', icon: Users, roles: ['teacher'] },
  { id: 'teacher-assign', label: 'Test Ata', href: '/teacher/assign-test', icon: ClipboardList, roles: ['teacher'], keywords: ['atama'] },
  { id: 'teacher-results', label: 'Sonuçlar', href: '/teacher/results', icon: BarChart3, roles: ['teacher'] },
  { id: 'teacher-reports', label: 'AI Raporları', href: '/teacher/reports', icon: FileText, roles: ['teacher'], keywords: ['rapor', 'analiz'] },
  { id: 'teacher-coaching', label: 'AI Koçluk', href: '/teacher/coaching', icon: Sparkles, roles: ['teacher'] },
  { id: 'teacher-guidance', label: 'Rehberlik Planı', href: '/teacher/guidance-plan', icon: FileText, roles: ['teacher'] },
  // Student
  { id: 'student-dashboard', label: 'Panom', href: '/student/dashboard', icon: LayoutDashboard, roles: ['student'] },
  { id: 'student-tests', label: 'Testlerim', href: '/student/my-tests', icon: ClipboardList, roles: ['student'] },
  { id: 'student-profile', label: 'Profilim', href: '/student/profile', icon: User, roles: ['student'] },
  { id: 'student-360', label: '360° Profil', href: '/student/profile-360', icon: Radar, roles: ['student'], keywords: ['analiz'] },
  { id: 'student-coaching', label: 'AI Koçluk', href: '/student/coaching', icon: Sparkles, roles: ['student'] },
  { id: 'student-achievements', label: 'Başarılarım', href: '/student/achievements', icon: Trophy, roles: ['student'], keywords: ['rozet', 'xp'] },
];

function detectRole(pathname: string): string {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/school')) return 'school_admin';
  if (pathname.startsWith('/teacher')) return 'teacher';
  if (pathname.startsWith('/student')) return 'student';
  if (pathname.startsWith('/parent')) return 'parent';
  return '';
}

const ROLE_GRADIENTS: Record<string, string> = {
  admin: 'from-amber-500 via-orange-500 to-rose-500',
  school_admin: 'from-sky-500 via-blue-500 to-indigo-600',
  teacher: 'from-emerald-500 via-teal-500 to-cyan-600',
  student: 'from-violet-500 via-purple-500 to-fuchsia-600',
  parent: 'from-pink-500 via-rose-500 to-red-500',
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  const role = detectRole(pathname);
  const gradient = ROLE_GRADIENTS[role] || 'from-slate-500 to-slate-700';

  // Cmd/Ctrl+K opens
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Filter items for current role
  const items = useMemo(() => {
    const scoped = ALL_ITEMS.filter(item => !role || item.roles.includes(role));
    if (!query.trim()) return scoped;
    const q = query.trim().toLocaleLowerCase('tr-TR');
    return scoped.filter(item => {
      const label = item.label.toLocaleLowerCase('tr-TR');
      const keywords = (item.keywords || []).map(k => k.toLocaleLowerCase('tr-TR'));
      return label.includes(q) || keywords.some(k => k.includes(q));
    });
  }, [role, query]);

  // Reset active index when items change
  useEffect(() => { setActiveIdx(0); }, [query]);

  // Arrow key navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(idx => Math.min(idx + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(idx => Math.max(idx - 1, 0));
      } else if (e.key === 'Enter' && items[activeIdx]) {
        e.preventDefault();
        router.push(items[activeIdx].href);
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, items, activeIdx, router]);

  // Scroll active item into view
  useEffect(() => {
    if (!open) return;
    const active = document.querySelector(`[data-cmd-idx="${activeIdx}"]`);
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  const handleSelect = useCallback((href: string) => {
    router.push(href);
    setOpen(false);
    setQuery('');
  }, [router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cmd-palette-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cmd-backdrop"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden cmd-enter">
        {/* Top accent */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

        {/* Search input */}
        <div className="relative flex items-center gap-3 border-b border-gray-100 dark:border-slate-700/60 px-4 py-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0`}>
            <Search className="w-4 h-4 text-white" />
          </div>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sayfa ara veya komut yaz..."
            className="flex-1 outline-none text-[14.5px] font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-500 text-[#0f2847] dark:text-slate-100 bg-transparent"
            aria-label="Sayfa ara"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 text-[10.5px] font-bold font-mono shrink-0">
            ESC
          </kbd>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/60 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gray-100 dark:bg-slate-700/60 flex items-center justify-center">
                <Search className="w-6 h-6 text-gray-400 dark:text-slate-500" />
              </div>
              <p className="text-[13px] text-gray-500 dark:text-slate-400 font-medium">&ldquo;{query}&rdquo; için sonuç bulunamadı</p>
              <p className="text-[11.5px] text-gray-400 dark:text-slate-500 mt-1">Başka bir terim deneyin</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Sayfalar
              </div>
              {items.map((item, idx) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isHighlighted = idx === activeIdx;
                return (
                  <button
                    key={item.id}
                    data-cmd-idx={idx}
                    onClick={() => handleSelect(item.href)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all ${
                      isHighlighted ? 'bg-gray-50 dark:bg-slate-700/40' : ''
                    } ${isActive ? 'bg-opacity-50' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      isHighlighted
                        ? `bg-gradient-to-br ${gradient} text-white shadow-md`
                        : 'bg-gray-100 dark:bg-slate-700/60 text-gray-600 dark:text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`flex-1 text-left text-[13.5px] font-bold truncate ${
                      isActive ? 'text-[#0f2847] dark:text-slate-100' : 'text-gray-700 dark:text-slate-300'
                    }`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        Şu an
                      </span>
                    )}
                    {isHighlighted && !isActive && (
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 dark:border-slate-700/60 px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 text-[10.5px] text-gray-500 dark:text-slate-400 font-bold">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-mono">↑↓</kbd>
            <span>gez</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-mono">↵</kbd>
            <span>seç</span>
          </div>
          <div className="flex items-center gap-1 text-[10.5px] text-gray-500 dark:text-slate-400 font-bold">
            <Command className="w-3 h-3" />
            <span>K</span>
            <span>aç/kapat</span>
          </div>
        </div>

        <style jsx>{`
          @keyframes cmd-enter {
            from { opacity: 0; transform: translateY(-8px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .cmd-enter {
            animation: cmd-enter 180ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
          }
          @keyframes cmd-backdrop {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .cmd-backdrop {
            animation: cmd-backdrop 150ms ease-out backwards;
          }
        `}</style>
      </div>
    </div>
  );
}
