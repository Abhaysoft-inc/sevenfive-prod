const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportCurrentData() {
    try {
        console.log('🔄 Starting data export with current database structure...');

        // Use raw queries to get data without schema validation
        const users = await prisma.$queryRaw`SELECT * FROM "User"`;
        const subjects = await prisma.$queryRaw`SELECT * FROM "Subject"`;
        const branches = await prisma.$queryRaw`SELECT * FROM "Branch"`;
        const batches = await prisma.$queryRaw`SELECT * FROM "Batch"`;
        const schedules = await prisma.$queryRaw`SELECT * FROM "Schedule"`;
        const attendanceRecords = await prisma.$queryRaw`SELECT * FROM "AttendanceRecord"`;

        const exportData = {
            timestamp: new Date().toISOString(),
            users: users,
            subjects: subjects,
            branches: branches,
            batches: batches,
            schedules: schedules,
            attendanceRecords: attendanceRecords
        };

        const filename = `backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));

        console.log(`✅ Data backed up to ${filename}`);
        console.log(`📊 Backup Summary:`);
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Subjects: ${subjects.length}`);
        console.log(`   - Branches: ${branches.length}`);
        console.log(`   - Batches: ${batches.length}`);
        console.log(`   - Schedules: ${schedules.length}`);
        console.log(`   - Attendance Records: ${attendanceRecords.length}`);

        return filename;

    } catch (error) {
        console.error('❌ Error during backup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

exportCurrentData();
