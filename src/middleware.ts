import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback_secret'
);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Define Public Routes
    const isPublicRoute = (
        pathname === '/' ||
        pathname.startsWith('/(auth)') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/public')
    );

    if (isPublicRoute) {
        return NextResponse.next();
    }

    // 2. Get Token from Cookies (or Header for API)
    const token = request.cookies.get('token')?.value ||
        request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
        if (pathname.startsWith('/dashboard')) {
            return NextResponse.redirect(new URL('/mobile-only', request.url));
        }
        if (pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const role = (payload.role as string)?.toLowerCase();

        // 3. RBAC Redirection Logic

        // If the logged-in user is a standard user, block them from all web pages except /mobile-only
        const isApiRoute = pathname.startsWith('/api/');
        if (role === 'user') {
            if (pathname !== '/mobile-only' && !isApiRoute) {
                return NextResponse.redirect(new URL('/mobile-only', request.url));
            }
            return NextResponse.next();
        }

        // Admin Routes Protection (Only reached by admins)
        if (pathname.startsWith('/admin')) {
            return NextResponse.next();
        }

        // Dashboard Protection
        if (pathname.startsWith('/dashboard')) {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }

        // Gating for mobile-only page (if admin tries to visit, send to admin dashboard)
        if (pathname === '/mobile-only') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }

        return NextResponse.next();
    } catch (error) {
        // Token invalid or expired
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
