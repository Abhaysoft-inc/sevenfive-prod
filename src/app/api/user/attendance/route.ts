import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        // Get token from cookie or authorization header
        const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
            request.headers.get('cookie')?.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

        const { subjectId, status, date } = await request.json();

        // Validate required fields
        if (!subjectId || !status) {
            return NextResponse.json({ error: 'Subject ID and status are required' }, { status: 400 });
        }

        // Validate status
        if (!['PRESENT', 'ABSENT', 'CANCELLED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Use provided date or current date
        const attendanceDate = date ? new Date(date) : new Date();

        // Set time to start of day to avoid duplicate entries for same day
        attendanceDate.setHours(0, 0, 0, 0);

        // Check if attendance already exists for this user, subject, and date
        const existingAttendance = await prisma.attendanceRecord.findUnique({
            where: {
                userId_subjectId_date: {
                    userId: decoded.userId,
                    subjectId,
                    date: attendanceDate
                }
            }
        });

        let attendanceRecord;

        if (existingAttendance) {
            // Update existing record
            attendanceRecord = await prisma.attendanceRecord.update({
                where: {
                    id: existingAttendance.id
                },
                data: {
                    status
                },
                include: {
                    subject: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });
        } else {
            // Create new record
            attendanceRecord = await prisma.attendanceRecord.create({
                data: {
                    userId: decoded.userId,
                    subjectId,
                    status,
                    date: attendanceDate
                },
                include: {
                    subject: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });
        }

        return NextResponse.json({
            message: 'Attendance marked successfully',
            attendance: attendanceRecord
        }, { status: 200 });

    } catch (error) {
        console.error('Error marking attendance:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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

        const { searchParams } = new URL(request.url);
        const subjectId = searchParams.get('subjectId');
        const date = searchParams.get('date');

        if (!subjectId) {
            return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
        }

        const attendanceDate = date ? new Date(date) : new Date();
        attendanceDate.setHours(0, 0, 0, 0);

        // Get attendance record for the user, subject, and date
        const attendanceRecord = await prisma.attendanceRecord.findUnique({
            where: {
                userId_subjectId_date: {
                    userId: decoded.userId,
                    subjectId,
                    date: attendanceDate
                }
            },
            include: {
                subject: true
            }
        });

        return NextResponse.json({
            attendance: attendanceRecord
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching attendance:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
