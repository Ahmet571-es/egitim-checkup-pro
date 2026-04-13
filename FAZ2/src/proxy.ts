import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@/types';

const PUBLIC_PATHS = ['/', '/login', '/register', '/kvkk', '/pricing'];

const ROLE_PREFIX_MAP: Record<string, UserRole> = {
  '/admin': 'admin',
  '/school': 'school_admin',
  '/teacher': 'teacher',
  '/student': 'student',
  '/parent': 'parent',
};

const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  school_admin: '/school/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
  parent: '/parent/dashboard',
};

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return supabaseResponse;
  }

  // Static / API
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return supabaseResponse;
  }

  // Not logged in → login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Get role from user metadata
  const role = (user.user_metadata?.role as UserRole) || 'student';

  // Check role-based access
  for (const [prefix, requiredRole] of Object.entries(ROLE_PREFIX_MAP)) {
    if (pathname.startsWith(prefix) && role !== requiredRole) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role];
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
