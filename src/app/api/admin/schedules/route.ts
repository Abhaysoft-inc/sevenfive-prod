import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const schedules = await prisma.schedule.findMany({
            include: {
                batch: {
                    include: {
                        branch: true
                    }
                },
                subject: true
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });
        return NextResponse.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { batchId, subjectId, dayOfWeek, startTime, endTime } = await request.json();

        // Validate required fields
        if (!batchId || !subjectId || !dayOfWeek || !startTime || !endTime) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return NextResponse.json({ error: 'Invalid time format. Use HH:MM' }, { status: 400 });
        }

        // Check if start time is before end time
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (startMinutes >= endMinutes) {
            return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 });
        }

        // Check for time conflicts
        const existingSchedules = await prisma.schedule.findMany({
            where: {
                batchId,
                dayOfWeek,
                OR: [
                    {
                        AND: [
                            { startTime: { lte: startTime } },
                            { endTime: { gt: startTime } }
                        ]
                    },
                    {
                        AND: [
                            { startTime: { lt: endTime } },
                            { endTime: { gte: endTime } }
                        ]
                    },
                    {
                        AND: [
                            { startTime: { gte: startTime } },
                            { endTime: { lte: endTime } }
                        ]
                    }
                ]
            }
        });

        if (existingSchedules.length > 0) {
            return NextResponse.json({ error: 'Time slot conflicts with existing schedule' }, { status: 400 });
        }

        const schedule = await prisma.schedule.create({
            data: {
                batchId,
                subjectId,
                dayOfWeek,
                startTime,
                endTime
            },
            include: {
                batch: {
                    include: {
                        branch: true
                    }
                },
                subject: true
            }
        });

        return NextResponse.json(schedule, { status: 201 });
    } catch (error) {
        console.error('Error creating schedule:', error);
        return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, batchId, subjectId, dayOfWeek, startTime, endTime } = await request.json();

        // Validate required fields
        if (!id || !batchId || !subjectId || !dayOfWeek || !startTime || !endTime) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return NextResponse.json({ error: 'Invalid time format. Use HH:MM' }, { status: 400 });
        }

        // Check if start time is before end time
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (startMinutes >= endMinutes) {
            return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 });
        }

        // Check for time conflicts (excluding the current schedule being updated)
        const existingSchedules = await prisma.schedule.findMany({
            where: {
                batchId,
                dayOfWeek,
                id: { not: id }, // Exclude the current schedule
                OR: [
                    {
                        AND: [
                            { startTime: { lte: startTime } },
                            { endTime: { gt: startTime } }
                        ]
                    },
                    {
                        AND: [
                            { startTime: { lt: endTime } },
                            { endTime: { gte: endTime } }
                        ]
                    },
                    {
                        AND: [
                            { startTime: { gte: startTime } },
                            { endTime: { lte: endTime } }
                        ]
                    }
                ]
            }
        });

        if (existingSchedules.length > 0) {
            return NextResponse.json({ error: 'Time slot conflicts with existing schedule' }, { status: 400 });
        }

        const schedule = await prisma.schedule.update({
            where: { id },
            data: {
                batchId,
                subjectId,
                dayOfWeek,
                startTime,
                endTime
            },
            include: {
                batch: {
                    include: {
                        branch: true
                    }
                },
                subject: true
            }
        });

        return NextResponse.json(schedule);
    } catch (error) {
        console.error('Error updating schedule:', error);
        return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
        }

        await prisma.schedule.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
    }
}
