import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@/types';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const TOKEN_LENGTH = 32;

function generateCSRFToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// Oturum gerektirmeyen public yollar
const PUBLIC_PATHS = ['/', '/login', '/register', '/register/ogretmen', '/kvkk', '/pricing', '/forgot-password', '/yonetici'];

const ROLE_PREFIX_MAP: Record<string, UserRole> = {
  '/admin': 'admin',
  '/school': 'school_admin',
  '/teacher': 'teacher',
  '/student': 'student',
};

const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  school_admin: '/school/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
  parent: '/login',
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
    pathname.includes('.')
  ) {
    return supabaseResponse;
  }

  // CSRF koruması: API POST/PUT/DELETE isteklerinde token doğrula
  if (pathname.startsWith('/api') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    // Muaf route'lar: public API (kendi auth'u var), payment callback (dış servis)
    const csrfExempt = pathname.startsWith('/api/v1/') || pathname.startsWith('/api/payment/callback') || pathname.startsWith('/api/yonetici') || pathname.startsWith('/api/auth/');
    if (!csrfExempt) {
      const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
      const headerToken = request.headers.get(CSRF_HEADER);
      if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return NextResponse.json({ error: 'CSRF token geçersiz' }, { status: 403 });
      }
    }
    return supabaseResponse;
  }

  // API GET istekleri: atla
  if (pathname.startsWith('/api')) {
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

  // Onaysız öğretmen kontrolü
  if (role === 'teacher') {
    const isApproved = user.user_metadata?.is_approved;
    if (isApproved === false) {
      // Oturumu kapat ve login'e yönlendir
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('pending', '1');
      return NextResponse.redirect(url);
    }
  }

  // CSRF cookie yoksa oluştur
  if (!request.cookies.get(CSRF_COOKIE)?.value) {
    supabaseResponse.cookies.set(CSRF_COOKIE, generateCSRFToken(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400,
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
