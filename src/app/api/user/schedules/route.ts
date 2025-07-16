import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        // Get token from cookie or authorization header
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
            request.headers.get('cookie')?.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        // Find schedules for user's batch
        // First find the batch that matches user's branch, batch name, and year
        const userBatch = await prisma.batch.findFirst({
            where: {
                name: user.batch,
                year: user.year,
                branch: {
                    name: user.branch
                }
            }
        });

        if (!userBatch) {
            return NextResponse.json({ schedules: [] }, { status: 200 });
        }

        // Get schedules for this batch
        const schedules = await prisma.schedule.findMany({
            where: {
                batchId: userBatch.id
            },
            include: {
                subject: true,
                batch: {
                    include: {
                        branch: true
                    }
                }
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });

        return NextResponse.json({ schedules }, { status: 200 });
    } catch (error) {
        console.error('Error fetching user schedules:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
