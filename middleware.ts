import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request: NextRequest) {
    // Check if the user is accessing protected routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            return NextResponse.next();
        } catch (error) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Check if the user is accessing admin routes (except login)
    if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
        const adminToken = request.cookies.get('token')?.value;

        if (!adminToken) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        try {
            const decoded = jwt.verify(adminToken, process.env.JWT_SECRET || 'your-secret-key') as any;
            // Check if user has admin role
            if (decoded.role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/admin/login', request.url));
            }
            return NextResponse.next();
        } catch (error) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*']
};
