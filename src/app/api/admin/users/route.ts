import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        console.log('🔄 Fetching users with optimized queries...');

        // Single query to get all users with their attendance data
        const users = await prisma.user.findMany({
            include: {
                attendanceRecords: {
                    include: {
                        subject: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                branch: true,
                                year: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { role: 'asc' }, // Show admins first, then students
                { name: 'asc' }
            ]
        });

        console.log(`✅ Found ${users.length} users with attendance data`);

        // Process attendance statistics efficiently
        const userStats = users.map(user => {
            if (user.role === 'ADMIN') {
                return {
                    userId: user.id,
                    userName: user.name,
                    totalClasses: 0,
                    totalPresent: 0,
                    overallPercentage: 0,
                    subjectStats: []
                };
            }

            // Group attendance by subject
            const subjectMap = new Map();
            
            user.attendanceRecords.forEach(record => {
                const subject = record.subject;
                
                // Only include subjects for user's branch and year
                if (subject.branch === user.branch && subject.year === user.year) {
                    if (!subjectMap.has(subject.id)) {
                        subjectMap.set(subject.id, {
                            subjectName: subject.name,
                            subjectCode: subject.code,
                            totalClasses: 0,
                            presentClasses: 0
                        });
                    }
                    
                    const stats = subjectMap.get(subject.id);
                    stats.totalClasses++;
                    if (record.status === 'PRESENT') {
                        stats.presentClasses++;
                    }
                }
            });

            // Calculate percentages and totals
            let totalClasses = 0;
            let totalPresent = 0;
            const subjectStats = Array.from(subjectMap.values()).map(stats => {
                const percentage = stats.totalClasses > 0 
                    ? Math.round((stats.presentClasses / stats.totalClasses) * 100) 
                    : 0;
                
                totalClasses += stats.totalClasses;
                totalPresent += stats.presentClasses;
                
                return {
                    ...stats,
                    percentage
                };
            });

            const overallPercentage = totalClasses > 0 
                ? Math.round((totalPresent / totalClasses) * 100) 
                : 0;

            return {
                userId: user.id,
                userName: user.name,
                totalClasses,
                totalPresent,
                overallPercentage,
                subjectStats
            };
        });

        console.log(`✅ Processed ${userStats.length} user statistics`);

        // Remove attendance records from user data to reduce response size
        const cleanUsers = users.map(({ attendanceRecords, ...user }) => user);

        return NextResponse.json({
            users: cleanUsers,
            stats: userStats
        });

    } catch (error) {
        console.error('❌ Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
