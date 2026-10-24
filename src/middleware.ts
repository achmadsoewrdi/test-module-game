import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Gunakan env NEXT_PUBLIC_SANDBOX_HOST di production, fallback ke 'kabiru-sandbox.test' di local.
  // Jika diset ke 'same-origin' (untuk demo 1 URL di Render tanpa custom domain), bypass blokir host.
  const sandboxHost = process.env.NEXT_PUBLIC_SANDBOX_HOST || 'kabiru-sandbox.test';

  // 1. Pemisahan Domain (Site Isolation) sesuai Keputusan D2 & D3 di PRD
  if (sandboxHost !== 'same-origin') {
    if (hostname.includes(sandboxHost)) {
      // Jika diakses dari domain sandbox, HANYA boleh rute /sandbox
      if (!url.pathname.startsWith('/sandbox')) {
        return new NextResponse("Not Found - Sandbox domain only serves /sandbox routes", { status: 404 });
      }
    } else {
      // Jika diakses dari domain utama, TIDAK BOLEH melayani rute /sandbox
      if (url.pathname.startsWith('/sandbox')) {
        return new NextResponse("Not Found - Application domain cannot serve /sandbox routes", { status: 404 });
      }
    }
  }

  return NextResponse.next();
}

// Konfigurasi ini memastikan middleware tidak dijalankan untuk file statis dan aset
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
