import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isOnAuth = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');
  const isOnAdmin = nextUrl.pathname.startsWith('/admin');
  const isOnFarmer = nextUrl.pathname.startsWith('/farmer');
  const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

  // Redirect authenticated users away from auth pages
  if (isOnAuth && isLoggedIn) {
    if (userRole === 'admin' || userRole === 'sub_admin') {
      return NextResponse.redirect(new URL('/admin', nextUrl));
    }
    return NextResponse.redirect(new URL('/farmer', nextUrl));
  }

  // Protect dashboard routes
  if ((isOnDashboard || isOnAdmin || isOnFarmer) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Role-based access control
  if (isLoggedIn) {
    // Farmers cannot access admin routes
    if (isOnAdmin && userRole === 'farmer') {
      return NextResponse.redirect(new URL('/farmer', nextUrl));
    }

    // Admins cannot access farmer routes
    if (isOnFarmer && (userRole === 'admin' || userRole === 'sub_admin')) {
      return NextResponse.redirect(new URL('/admin', nextUrl));
    }

    // Redirect root to appropriate dashboard
    if (nextUrl.pathname === '/' || nextUrl.pathname === '/dashboard') {
      if (userRole === 'admin' || userRole === 'sub_admin') {
        return NextResponse.redirect(new URL('/admin', nextUrl));
      }
      return NextResponse.redirect(new URL('/farmer', nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
