import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NAMA FUNGSI DIUBAH MENJADI "proxy" SESUAI KONVENSI BARU
export function proxy(request: NextRequest) {
  // 1. Ambil token dari Cookies

  //hapus kalau mau production
  return NextResponse.next();
  //atas
  
  const token = request.cookies.get('access_token')?.value;
  
  // 2. Cek apakah user sedang mencoba mengakses halaman login atau register
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register') ||
                     request.nextUrl.pathname.startsWith('/edit-profile');

  // 3. Jika TIDAK ADA TOKEN dan mencoba akses halaman terproteksi
  if (!token && !isAuthPage) {
    // Tendang kembali ke halaman login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Jika SUDAH LOGIN tapi mencoba akses halaman login/register
  if (token && isAuthPage) {
    // Tendang ke halaman utama (Home)
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Lanjutkan perjalanan jika semua aman
  return NextResponse.next();
}

// Konfigurasi matcher tetap sama
export const config = {
  matcher: [
    /*
     * Lindungi semua route kecuali:
     * - api (routes API)
     * - _next/static (file statis)
     * - _next/image (file gambar)
     * - favicon.ico (icon website)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|gerai.png).*)',
  ],
};