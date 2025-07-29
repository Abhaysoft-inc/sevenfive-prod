import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const batchId = searchParams.get('batchId');

        let whereClause: any = {};

        // If date is provided, filter by date ranges
        if (date) {
            const queryDate = new Date(date);
            whereClause.validFrom = { lte: queryDate };
            whereClause.OR = [
                { validTo: null },
                { validTo: { gte: queryDate } }
            ];
        }

        // If batchId is provided, filter by batch
        if (batchId) {
            whereClause.batchId = batchId;
        }

        const schedules = await prisma.schedule.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
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
        const { batchId, subjectId, dayOfWeek, startTime, endTime, validFrom, validTo } = await request.json();

        // Validate required fields
        if (!batchId || !subjectId || !dayOfWeek || !startTime || !endTime || !validFrom) {
            return NextResponse.json({ error: 'batchId, subjectId, dayOfWeek, startTime, endTime, and validFrom are required' }, { status: 400 });
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

        // Check for time conflicts with overlapping date ranges
        const existingSchedules = await prisma.schedule.findMany({
            where: {
                batchId,
                dayOfWeek,
                AND: [
                    {
                        OR: [
                            // New schedule starts before existing schedule ends
                            {
                                AND: [
                                    { validFrom: { lte: validTo || new Date('2099-12-31') } },
                                    {
                                        OR: [
                                            { validTo: null },
                                            { validTo: { gte: validFrom } }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
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
                endTime,
                validFrom: new Date(validFrom),
                validTo: validTo ? new Date(validTo) : null
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
        const { id, batchId, subjectId, dayOfWeek, startTime, endTime, validFrom, validTo } = await request.json();

        // Validate required fields
        if (!id || !batchId || !subjectId || !dayOfWeek || !startTime || !endTime || !validFrom) {
            return NextResponse.json({ error: 'All fields including validFrom are required' }, { status: 400 });
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

        // Get the existing schedule to check its current validTo date
        const existingSchedule = await prisma.schedule.findUnique({
            where: { id }
        });

        if (!existingSchedule) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        const newValidFrom = new Date(validFrom);
        const newValidTo = validTo ? new Date(validTo) : null;

        // Strategy: Close the old schedule and create a new one to preserve historical data
        // Close the existing schedule if the new validFrom is after the existing validFrom
        if (newValidFrom > existingSchedule.validFrom) {
            const closeDate = new Date(newValidFrom);
            closeDate.setDate(closeDate.getDate() - 1); // Close one day before the new schedule starts

            await prisma.schedule.update({
                where: { id },
                data: {
                    validTo: closeDate
                }
            });
        }

        // Check for time conflicts with overlapping date ranges (excluding the current schedule)
        const existingSchedules = await prisma.schedule.findMany({
            where: {
                batchId,
                dayOfWeek,
                id: { not: id },
                AND: [
                    {
                        OR: [
                            // New schedule starts before existing schedule ends
                            {
                                AND: [
                                    { validFrom: { lte: newValidTo || new Date('2099-12-31') } },
                                    {
                                        OR: [
                                            { validTo: null },
                                            { validTo: { gte: newValidFrom } }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
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
                ]
            }
        });

        if (existingSchedules.length > 0) {
            return NextResponse.json({ error: 'Time slot conflicts with existing schedule' }, { status: 400 });
        }

        // Create a new schedule with the updated data
        const schedule = await prisma.schedule.create({
            data: {
                batchId,
                subjectId,
                dayOfWeek,
                startTime,
                endTime,
                validFrom: newValidFrom,
                validTo: newValidTo
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
