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

        // Find all subjects for user's batch
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
            return NextResponse.json({ statistics: [] }, { status: 200 });
        }

        // Get all subjects for this batch
        const schedules = await prisma.schedule.findMany({
            where: {
                batchId: userBatch.id
            },
            include: {
                subject: true
            }
        });

        const subjectIds = [...new Set(schedules.map(s => s.subjectId))];

        // Calculate attendance statistics for each subject
        const statistics = await Promise.all(
            subjectIds.map(async (subjectId) => {
                const subject = schedules.find(s => s.subjectId === subjectId)?.subject;

                // Get all attendance records for this user and subject
                const attendanceRecords = await prisma.attendanceRecord.findMany({
                    where: {
                        userId: decoded.userId,
                        subjectId: subjectId
                    }
                });

                // Calculate statistics
                const totalClasses = attendanceRecords.length;
                const presentClasses = attendanceRecords.filter(record => record.status === 'PRESENT').length;
                const absentClasses = attendanceRecords.filter(record => record.status === 'ABSENT').length;
                const cancelledClasses = attendanceRecords.filter(record => record.status === 'CANCELLED').length;

                const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / (totalClasses - cancelledClasses)) * 100) : 0;

                return {
                    subject,
                    totalClasses,
                    presentClasses,
                    absentClasses,
                    cancelledClasses,
                    attendancePercentage: isNaN(attendancePercentage) ? 0 : attendancePercentage
                };
            })
        );

        return NextResponse.json({ statistics }, { status: 200 });
    } catch (error) {
        console.error('Error fetching attendance statistics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
