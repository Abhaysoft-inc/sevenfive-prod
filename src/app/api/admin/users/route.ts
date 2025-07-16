import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Fetch all student users (exclude admins)
        const users = await prisma.user.findMany({
            where: {
                role: 'STUDENT' // Only fetch students, not admins
            },
            orderBy: {
                name: 'asc'
            }
        });

        console.log(`Found ${users.length} users`);

        // Calculate attendance statistics for each user
        const userStats = await Promise.all(
            users.map(async (user) => {
                console.log(`Processing user: ${user.name}`);

                // Get all subjects for the user's branch and year
                const subjects = await prisma.subject.findMany({
                    where: {
                        branch: user.branch,
                        year: user.year
                    }
                });

                console.log(`Found ${subjects.length} subjects for user ${user.name}`);

                let totalClasses = 0;
                let totalPresent = 0;
                const subjectStats = [];

                for (const subject of subjects) {
                    // Get all attendance records for this user and subject
                    const attendanceRecords = await prisma.attendanceRecord.findMany({
                        where: {
                            userId: user.id,
                            subjectId: subject.id
                        }
                    });

                    const totalSubjectClasses = attendanceRecords.length;
                    const presentClasses = attendanceRecords.filter(
                        record => record.status === 'PRESENT'
                    ).length;

                    if (totalSubjectClasses > 0) {
                        const percentage = Math.round((presentClasses / totalSubjectClasses) * 100);
                        subjectStats.push({
                            subjectName: subject.name,
                            subjectCode: subject.code,
                            totalClasses: totalSubjectClasses,
                            presentClasses,
                            percentage
                        });

                        totalClasses += totalSubjectClasses;
                        totalPresent += presentClasses;
                    }
                }

                const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

                return {
                    userId: user.id,
                    userName: user.name,
                    totalClasses,
                    totalPresent,
                    overallPercentage,
                    subjectStats
                };
            })
        );

        console.log(`Returning ${users.length} users and ${userStats.length} stats`);

        return NextResponse.json({
            users,
            stats: userStats
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
