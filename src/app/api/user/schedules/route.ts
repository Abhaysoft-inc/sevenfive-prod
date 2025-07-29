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
            where: { id: decoded.userId },
            select: { batch: true, branch: true, year: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const dayOfWeek = searchParams.get('dayOfWeek');

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

        let whereClause: any = {
            batchId: userBatch.id
        };

        // If date is provided, filter by date ranges and calculate day of week
        if (date) {
            const queryDate = new Date(date);
            whereClause.validFrom = { lte: queryDate };
            whereClause.OR = [
                { validTo: null },
                { validTo: { gte: queryDate } }
            ];

            // If dayOfWeek is not provided, calculate it from date
            if (!dayOfWeek) {
                const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
                whereClause.dayOfWeek = days[queryDate.getDay()];
            }
        }

        // If dayOfWeek is explicitly provided, use it
        if (dayOfWeek) {
            whereClause.dayOfWeek = dayOfWeek.toUpperCase();
        }

        // Get schedules for this batch with date filtering
        const schedules = await prisma.schedule.findMany({
            where: whereClause,
            include: {
                subject: true,
                batch: {
                    include: {
                        branch: true
                    }
                }
            },
            orderBy: date ? [
                { startTime: 'asc' }
            ] : [
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
