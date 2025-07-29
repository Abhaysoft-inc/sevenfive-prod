const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function safeProductionMigration() {
    try {
        console.log('🚀 Starting safe production migration...');

        // First, let's check the current schedule structure
        const scheduleCount = await prisma.schedule.count();
        console.log(`📊 Found ${scheduleCount} schedules in database`);

        if (scheduleCount === 0) {
            console.log('✅ No existing schedules - safe to proceed with standard migration');
            return;
        }

        // Since we have existing schedules, we need to handle them carefully
        console.log('⚠️  Existing schedules found. Manual migration required.');
        console.log('');
        console.log('📋 Migration Steps Required:');
        console.log('1. Add validFrom and validTo columns to Schedule table');
        console.log('2. Set default validFrom date for existing schedules');
        console.log('3. Update unique constraint');
        console.log('');
        console.log('🔧 SQL Commands to run manually:');
        console.log('');
        console.log('-- Step 1: Add the new columns');
        console.log('ALTER TABLE "Schedule" ADD COLUMN "validFrom" TIMESTAMP(3) NOT NULL DEFAULT NOW();');
        console.log('ALTER TABLE "Schedule" ADD COLUMN "validTo" TIMESTAMP(3);');
        console.log('');
        console.log('-- Step 2: Update default validFrom to a reasonable past date for existing schedules');
        console.log('UPDATE "Schedule" SET "validFrom" = \'2025-01-01 00:00:00\'::timestamp WHERE "validFrom" = NOW()::date;');
        console.log('');
        console.log('-- Step 3: Drop old unique constraint and add new one');
        console.log('ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_batchId_dayOfWeek_startTime_key";');
        console.log('ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_batchId_dayOfWeek_startTime_validFrom_key" UNIQUE ("batchId", "dayOfWeek", "startTime", "validFrom");');
        console.log('');
        console.log('⚠️  IMPORTANT: Run these SQL commands manually in your database console');
        console.log('⚠️  Then run: npx prisma generate');

    } catch (error) {
        console.error('❌ Error during migration analysis:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

safeProductionMigration();
