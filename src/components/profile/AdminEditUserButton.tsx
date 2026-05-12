'use client';

/**
 * AdminEditUserButton — admin tarafında kullanıcı listesi içinde "Düzenle"
 * butonu. Tıklandığında /api/profile/get ile o kullanıcının full profile'ını
 * çeker, sonra EditProfileModal'ı admin modunda açar.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Loader2 } from 'lucide-react';
import EditProfileModal, { type EditableProfileFields } from './EditProfileModal';

type Role = 'student' | 'teacher';

interface Props {
  userId: string;
  role: Role;
  onUpdated?: () => void;
}

export default function AdminEditUserButton({ userId, role, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<EditableProfileFields | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleOpen = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/get?user_id=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Profil bilgileri alınamadı.');
        setError(data.error || 'Profil bilgileri alınamadı.');
        return;
      }
      const p = data.profile || {};
      setValues({
        full_name: p.full_name ?? '',
        phone: p.phone ?? '',
        gender: p.gender ?? '',
        birth_date: p.birth_date ?? '',
        city: p.city ?? '',
        district: p.district ?? '',
        school_name: p.school_name ?? '',
        grade: p.grade ?? '',
        is_graduated: !!p.is_graduated,
        branch: p.branch ?? '',
      });
      setOpen(true);
    } catch {
      alert('Bağlantı hatası.');
      setError('Bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className="px-3 py-2 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        title="Bilgileri düzenle"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Pencil className="w-3.5 h-3.5" />
        )}
        Düzenle
      </button>

      {values && (
        <EditProfileModal
          open={open}
          onClose={() => setOpen(false)}
          role={role}
          targetUserId={userId}
          initialValues={values}
          onSuccess={() => {
            onUpdated?.();
            router.refresh();
          }}
        />
      )}
      {error && null /* sadece state için, görsel feedback alert ile */}
    </>
  );
}
