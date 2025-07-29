const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateExistingSchedules() {
    try {
        console.log('🔄 Starting schedule migration...');

        // Check if there are any schedules without validFrom
        const schedulesWithoutValidFrom = await prisma.schedule.findMany({
            where: {
                validFrom: null
            }
        });

        if (schedulesWithoutValidFrom.length === 0) {
            console.log('✅ No schedules need migration. All schedules already have validFrom dates.');
            return;
        }

        console.log(`📊 Found ${schedulesWithoutValidFrom.length} schedules that need migration.`);

        // Set a default validFrom date for existing schedules
        // Using current date minus 30 days as a reasonable default
        const defaultValidFrom = new Date();
        defaultValidFrom.setDate(defaultValidFrom.getDate() - 30);
        defaultValidFrom.setHours(0, 0, 0, 0); // Set to start of day

        const updateResult = await prisma.schedule.updateMany({
            where: {
                validFrom: null
            },
            data: {
                validFrom: defaultValidFrom
            }
        });

        console.log(`✅ Successfully migrated ${updateResult.count} schedules.`);
        console.log(`📅 Set validFrom date to: ${defaultValidFrom.toISOString().split('T')[0]}`);
        console.log('🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration
migrateExistingSchedules()
    .then(() => {
        console.log('🚀 Migration script finished.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });
