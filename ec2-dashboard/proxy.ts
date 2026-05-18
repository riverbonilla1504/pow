import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  const isStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/backend') ||
    pathname.includes('.');
  if (isStatic) return NextResponse.next();

  const isLocal =
    host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.includes(':');
  const isAdmin = host.startsWith('admin.');

  if (!isLocal && !isAdmin && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('https://admin.freck.lat/'));
  }

  if (isAdmin && !pathname.startsWith('/admin')) {
    const target = pathname === '/' ? '/admin' : `/admin${pathname}`;
    return NextResponse.rewrite(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
