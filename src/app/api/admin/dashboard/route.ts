import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cache for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
let cache: {
    data: any;
    timestamp: number;
} = {
    data: null,
    timestamp: 0
};

export async function GET() {
    try {
        // Check cache first
        const now = Date.now();
        if (cache.data && (now - cache.timestamp < CACHE_TTL)) {
            return NextResponse.json(cache.data);
        }

        // Single optimized query to get all admin dashboard data
        const [subjects, branches, batches, schedules, users] = await Promise.all([
            // Get subjects with counts
            prisma.subject.findMany({
                include: {
                    _count: {
                        select: {
                            attendanceRecords: true,
                            schedules: true
                        }
                    }
                },
                orderBy: { name: 'asc' }
            }),

            // Get branches with batches count
            prisma.branch.findMany({
                include: {
                    _count: {
                        select: { 
                            batches: true
                        }
                    }
                },
                orderBy: { name: 'asc' }
            }),

            // Get batches with related data
            prisma.batch.findMany({
                include: {
                    branch: true,
                    _count: {
                        select: { 
                            schedules: true
                        }
                    }
                },
                orderBy: [
                    { year: 'asc' },
                    { name: 'asc' }
                ]
            }),

            // Get all schedules with validity check
            prisma.schedule.findMany({
                include: {
                    subject: { select: { name: true, code: true } },
                    batch: { 
                        select: { 
                            name: true, 
                            year: true,
                            branch: { select: { name: true } }
                        } 
                    }
                },
                orderBy: [
                    { dayOfWeek: 'asc' },
                    { startTime: 'asc' }
                ]
            }),

            // Get users with basic info and attendance count
            prisma.user.findMany({
                include: {
                    _count: {
                        select: {
                            attendanceRecords: true
                        }
                    }
                },
                orderBy: { name: 'asc' }
            })
        ]);

        const data = {
            subjects,
            branches,
            batches,
            schedules,
            users,
            timestamp: now
        };

        // Update cache
        cache.data = data;
        cache.timestamp = now;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
