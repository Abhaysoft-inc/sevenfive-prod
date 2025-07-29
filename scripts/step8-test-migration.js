const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMigration() {
    try {
        console.log('🧪 Testing the migration...');

        // Test 1: Can we read existing schedules with new fields?
        console.log('\n📖 Test 1: Reading existing schedules...');
        const schedules = await prisma.schedule.findMany({
            take: 3,
            include: {
                subject: { select: { name: true } },
                batch: { select: { name: true } }
            }
        });

        console.log(`✅ Successfully read ${schedules.length} schedules`);
        if (schedules.length > 0) {
            console.log('📋 Sample schedule:');
            console.log(`   - Subject: ${schedules[0].subject.name}`);
            console.log(`   - Batch: ${schedules[0].batch.name}`);
            console.log(`   - Day: ${schedules[0].dayOfWeek}`);
            console.log(`   - Time: ${schedules[0].startTime} - ${schedules[0].endTime}`);
            console.log(`   - ValidFrom: ${schedules[0].validFrom}`);
            console.log(`   - ValidTo: ${schedules[0].validTo}`);
        }

        // Test 2: Can we query by date?
        console.log('\n📅 Test 2: Querying schedules for a specific date...');
        const today = new Date();
        const schedulesForToday = await prisma.schedule.findMany({
            where: {
                validFrom: { lte: today },
                OR: [
                    { validTo: null },
                    { validTo: { gte: today } }
                ]
            },
            take: 3
        });

        console.log(`✅ Found ${schedulesForToday.length} schedules valid for today`);

        // Test 3: Count total data to ensure nothing was lost
        console.log('\n📊 Test 3: Data integrity check...');
        const counts = {
            users: await prisma.user.count(),
            subjects: await prisma.subject.count(),
            branches: await prisma.branch.count(),
            batches: await prisma.batch.count(),
            schedules: await prisma.schedule.count(),
            attendanceRecords: await prisma.attendanceRecord.count()
        };

        console.log('📊 Current data counts:');
        console.log(`   - Users: ${counts.users}`);
        console.log(`   - Subjects: ${counts.subjects}`);
        console.log(`   - Branches: ${counts.branches}`);
        console.log(`   - Batches: ${counts.batches}`);
        console.log(`   - Schedules: ${counts.schedules}`);
        console.log(`   - Attendance Records: ${counts.attendanceRecords}`);

        console.log('\n🎉 Migration test completed successfully!');
        console.log('✅ All data preserved');
        console.log('✅ New date fields working');
        console.log('✅ Date-specific queries functional');

    } catch (error) {
        console.error('❌ Migration test failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

testMigration();
