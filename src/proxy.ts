import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  // Saat ini middleware di-bypass (kosong) karena arsitektur 
  // Mobile-First PWA tidak lagi memisahkan rute /desktop dan /mobile.
  // Nantinya bisa ditambahkan logika autentikasi (seperti proteksi /profile) di sini.
  
  return NextResponse.next();
}