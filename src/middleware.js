// middleware.js - FIXED VERSION
import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 🔥 CRITICAL: Skip ALL API calls (both local and external)
  if (pathname.startsWith('/api') || pathname.includes('alharamtour-backend.vercel.app')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const publicPaths = ['/login', '/register', '/'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicPath && token && pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// 🔥 Limit to only page routes, exclude API routes entirely
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/inquiries/:path*',
    '/profile/:path*',
    '/notifications/:path*',
    '/login',
    '/register',
    '/'
  ],
};