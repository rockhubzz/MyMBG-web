import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route yang butuh login
const PROTECTED = ['/dashboard', '/bahan-baku', '/resep', '/produksi', '/distribusi'];
// Route yang hanya boleh diakses saat belum login
const AUTH_ONLY = ['/login', '/register'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Baca token dari cookie (di-set saat login — lihat catatan di bawah)
  const token = req.cookies.get('mbg-token')?.value;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage  = AUTH_ONLY.includes(pathname);

  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname); // simpan tujuan asal
    return NextResponse.redirect(url);
  }

  if (isAuthPage && token) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Jalankan middleware hanya pada path yang relevan
  matcher: [
    '/dashboard/:path*',
    '/bahan-baku/:path*',
    '/resep/:path*',
    '/produksi/:path*',
    '/distribusi/:path*',
    '/login',
    '/register',
  ],
};