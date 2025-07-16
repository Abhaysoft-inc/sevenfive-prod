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

        // Get all attendance records for the user
        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                userId: decoded.userId
            },
            include: {
                subject: {
                    select: {
                        name: true,
                        code: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        // Transform data for heat map
        const heatMapData = attendanceRecords.map(record => ({
            date: record.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            status: record.status,
            subject: record.subject.name,
            subjectCode: record.subject.code
        }));

        return NextResponse.json({
            records: heatMapData
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching all attendance records:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
