import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Abaikan request ke API, asset statis, Next.js internal, dan file ber-ekstensi (seperti favicon.ico)
  // Ini sangat penting agar performa tetap ringan
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Cegah infinite loop jika URL sudah mengandung /desktop atau /mobile
  if (pathname.startsWith('/desktop') || pathname.startsWith('/mobile')) {
     return NextResponse.next();
  }

  // 3. Deteksi User-Agent (Perangkat)
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent.toLowerCase());

  // 4. Lakukan REWRITE (URL browser tidak berubah, tapi Next.js membaca dari folder spesifik)
  if (isMobile) {
    return NextResponse.rewrite(new URL(`/mobile${pathname}`, request.url));
  } else {
    return NextResponse.rewrite(new URL(`/desktop${pathname}`, request.url));
  }
}