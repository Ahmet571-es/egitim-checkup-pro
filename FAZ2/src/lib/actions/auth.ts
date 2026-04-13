'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ROLE_PATHS } from '@/types';
import type { UserRole } from '@/types';

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = `${formData.get('firstName')} ${formData.get('lastName')}`.trim();
  const role = (formData.get('role') as UserRole) || 'student';
  const schoolCode = formData.get('schoolCode') as string;

  // Find school by code if provided
  let schoolId: string | null = null;
  if (schoolCode) {
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('code', schoolCode.toUpperCase())
      .single();
    if (school) schoolId = school.id;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role, school_id: schoolId },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(ROLE_PATHS[role]);
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    return { error: error.message };
  }

  // Get user role for redirect
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata?.role as UserRole) || 'student';
  redirect(ROLE_PATHS[role]);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}
