import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
    try {
        // Delete all data in the correct order to avoid foreign key constraints

        // First delete attendance records
        await prisma.attendanceRecord.deleteMany({});

        // Then delete schedules
        await prisma.schedule.deleteMany({});

        // Delete subjects
        await prisma.subject.deleteMany({});

        // Delete users (this will cascade to their attendance records if any remain)
        await prisma.user.deleteMany({
            where: {
                role: {
                    not: 'ADMIN' // Don't delete admin users
                }
            }
        });

        // Delete batches
        await prisma.batch.deleteMany({});

        // Finally delete branches
        await prisma.branch.deleteMany({});

        return NextResponse.json({
            message: 'Database has been reset successfully. All student data, attendance records, and academic data have been deleted.'
        });

    } catch (error) {
        console.error('Error resetting database:', error);
        return NextResponse.json(
            { error: 'Failed to reset database. Please try again.' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
