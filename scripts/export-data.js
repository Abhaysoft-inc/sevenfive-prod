const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
    try {
        console.log('🔄 Starting data export...');

        // Export all data
        const users = await prisma.user.findMany();
        const subjects = await prisma.subject.findMany();
        const branches = await prisma.branch.findMany();
        const batches = await prisma.batch.findMany();
        const schedules = await prisma.schedule.findMany();
        const attendanceRecords = await prisma.attendanceRecord.findMany();

        const exportData = {
            timestamp: new Date().toISOString(),
            users,
            subjects,
            branches,
            batches,
            schedules,
            attendanceRecords
        };

        const filename = `data_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));

        console.log(`✅ Data exported to ${filename}`);
        console.log(`📊 Export Summary:`);
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Subjects: ${subjects.length}`);
        console.log(`   - Branches: ${branches.length}`);
        console.log(`   - Batches: ${batches.length}`);
        console.log(`   - Schedules: ${schedules.length}`);
        console.log(`   - Attendance Records: ${attendanceRecords.length}`);

    } catch (error) {
        console.error('❌ Error during export:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

exportData();
