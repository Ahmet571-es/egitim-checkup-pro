import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@/types';

// Oturum gerektirmeyen public yollar
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
  const pathname = request.nextUrl.pathname;

  // Public yollar: auth kontrolu yapmadan gecis
  if (PUBLIC_PATHS.includes(pathname)) {
    return supabaseResponse;
  }

  // Static asset, Next internal, API: atla
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return supabaseResponse;
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supaUrl || !supaAnon) {
    return supabaseResponse;
  }

  // Sadece bilinen panel yollarını kontrol et, bilinmeyen yollar Next.js 404'e düşsün
  const isProtectedRoute = Object.keys(ROLE_PREFIX_MAP).some(prefix => pathname.startsWith(prefix));
  if (!isProtectedRoute) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supaUrl, supaAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Giris yapilmamis -> /login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Role kontrolu -- profiles tablosundan sunucu otoriteli olarak oku.
  // user_metadata client tarafından yazılabildigi icin guvenilmez.
  // Fail-safe: sorgu hatasında veya rol yoksa /login'e at.
  let role: UserRole | null = null;
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.role) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    role = profile.role as UserRole;
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  for (const [prefix, requiredRole] of Object.entries(ROLE_PREFIX_MAP)) {
    if (pathname.startsWith(prefix) && role !== requiredRole) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role] ?? '/login';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
