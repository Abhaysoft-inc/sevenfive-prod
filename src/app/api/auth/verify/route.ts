import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
            request.headers.get('cookie')?.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                college: true,
                branch: true,
                batch: true,
                year: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error('Auth verification error:', error);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
}
