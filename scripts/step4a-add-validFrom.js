const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addValidFromColumn() {
    try {
        console.log('🔄 Step 4a: Adding validFrom column...');

        // Add validFrom column with a default value for existing records
        await prisma.$executeRaw`
            ALTER TABLE "Schedule" 
            ADD COLUMN "validFrom" TIMESTAMP(3) NOT NULL DEFAULT '2025-01-01 00:00:00'::timestamp
        `;

        console.log('✅ validFrom column added successfully');

        // Verify the column was added
        const check = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Schedule' 
            AND column_name = 'validFrom'
        `;

        if (check.length > 0) {
            console.log('✅ validFrom column verified in database');
        } else {
            throw new Error('validFrom column not found after addition');
        }

    } catch (error) {
        console.error('❌ Error adding validFrom column:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

addValidFromColumn();
