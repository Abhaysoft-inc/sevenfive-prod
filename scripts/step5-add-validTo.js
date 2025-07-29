const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addValidToColumn() {
    try {
        console.log('🔄 Step 5: Adding validTo column...');

        // Add validTo column (nullable, so no default needed)
        await prisma.$executeRaw`
            ALTER TABLE "Schedule" 
            ADD COLUMN "validTo" TIMESTAMP(3)
        `;

        console.log('✅ validTo column added successfully');

        // Verify the column was added
        const check = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Schedule' 
            AND column_name = 'validTo'
        `;

        if (check.length > 0) {
            console.log('✅ validTo column verified in database');

            // Show current schedule structure
            const sampleSchedule = await prisma.$queryRaw`SELECT * FROM "Schedule" LIMIT 1`;
            if (sampleSchedule.length > 0) {
                console.log('📋 Updated Schedule columns:', Object.keys(sampleSchedule[0]));
            }
        } else {
            throw new Error('validTo column not found after addition');
        }

    } catch (error) {
        console.error('❌ Error adding validTo column:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

addValidToColumn();
