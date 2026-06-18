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
        // Redirect standard users and unauthenticated users to login
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const role = (payload.role as string)?.toLowerCase();

        // 3. RBAC Redirection Logic

        // Admin Routes Protection
        if (pathname.startsWith('/admin')) {
            if (role === 'user') {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
            // Authorized admin roles
            return NextResponse.next();
        }

        // Dashboard Protection
        if (pathname.startsWith('/dashboard')) {
            // Authorized users can access the dashboard
            return NextResponse.next();
        }

        // User Mobile Redirect Gating
        if (pathname === '/mobile-only' && role === 'user') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        if (pathname === '/mobile-only' && role !== 'user') {
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
