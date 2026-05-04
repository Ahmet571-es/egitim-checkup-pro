import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  bundlePagesRouterDependencies: true,
  outputFileTracingIncludes: {
    '/api/export/[format]': [
      './node_modules/pdfmake/build/fonts/Roboto/*.ttf',
    ],
    'app/api/export/[format]/route': [
      './node_modules/pdfmake/build/fonts/Roboto/*.ttf',
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '0; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'  https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co https://*.supabase.com wss://*.supabase.co",
              "frame-ancestors 'none'",
            ].join('; ') + ';',
          },
        ],
      },
    ];
  },
  // /login/yonetici artık gerçek bir sayfa olarak var (yönetici giriş formu).
  // Eskiden /login/yonetici → /yonetici redirect'i vardı, bu döngüye sebep oldu.
  // Şu an redirect yok — /login/yonetici doğrudan açılır.
};

export default nextConfig;
