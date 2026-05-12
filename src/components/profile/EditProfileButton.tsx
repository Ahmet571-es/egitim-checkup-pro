'use client';

/**
 * EditProfileButton — Profil sayfasında "Düzenle" butonu + EditProfileModal.
 *
 * Server component'ten initial values alıp client modal'ı yönetir.
 * Başarılı update sonrası router.refresh() çağırır → server props yenilenir.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import EditProfileModal, { type EditableProfileFields } from './EditProfileModal';

type Role = 'student' | 'teacher';

interface Props {
  role: Role;
  initialValues: EditableProfileFields;
  /** Eğer ayarlanırsa, butonun varyantı admin teması olur ve modal admin moduna gider. */
  targetUserId?: string;
  /** Buton görseli — 'pill' (profil sayfası, beyaz cam efekti) veya 'inline' (admin liste, sade). */
  variant?: 'pill' | 'inline';
  className?: string;
  label?: string;
}

export default function EditProfileButton({
  role, initialValues, targetUserId, variant = 'pill', className = '', label,
}: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const pillClasses = variant === 'pill'
    ? 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/25 hover:bg-white/35 backdrop-blur-md border border-white/40 text-white text-[13px] font-bold shadow-md transition'
    : 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 text-[12.5px] font-bold transition';

  const buttonLabel = label ?? (variant === 'pill' ? 'Düzenle' : 'Düzenle');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${pillClasses} ${className}`}
      >
        <Pencil className={variant === 'pill' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        {buttonLabel}
      </button>

      <EditProfileModal
        open={open}
        onClose={() => setOpen(false)}
        role={role}
        targetUserId={targetUserId}
        initialValues={initialValues}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
