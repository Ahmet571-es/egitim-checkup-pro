'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ParentNotes from '@/components/teacher/ParentNotes';

export default function TeacherParentNotesSection() {
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setTeacherId(user.id);
      }
    }
    load();
  }, []);

  if (!teacherId) return null;

  return <ParentNotes teacherId={teacherId} />;
}
