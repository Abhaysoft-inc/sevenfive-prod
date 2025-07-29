const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUniqueConstraint() {
    try {
        console.log('🔄 Step 6: Updating unique constraint...');

        // First, check if the old constraint exists
        const oldConstraint = await prisma.$queryRaw`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'Schedule' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name LIKE '%batchId_dayOfWeek_startTime%'
        `;

        console.log('🔍 Existing unique constraints:', oldConstraint);

        if (oldConstraint.length > 0) {
            const constraintName = oldConstraint[0].constraint_name;
            console.log(`🗑️ Dropping old constraint: ${constraintName}`);

            await prisma.$executeRaw`
                ALTER TABLE "Schedule" 
                DROP CONSTRAINT "${constraintName}"
            `;

            console.log('✅ Old constraint dropped');
        }

        // Add the new unique constraint
        console.log('🔄 Adding new unique constraint with validFrom...');

        await prisma.$executeRaw`
            ALTER TABLE "Schedule" 
            ADD CONSTRAINT "Schedule_batchId_dayOfWeek_startTime_validFrom_key" 
            UNIQUE ("batchId", "dayOfWeek", "startTime", "validFrom")
        `;

        console.log('✅ New unique constraint added successfully');

        // Verify the new constraint
        const newConstraint = await prisma.$queryRaw`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'Schedule' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name = 'Schedule_batchId_dayOfWeek_startTime_validFrom_key'
        `;

        if (newConstraint.length > 0) {
            console.log('✅ New constraint verified in database');
        } else {
            throw new Error('New constraint not found after addition');
        }

    } catch (error) {
        console.error('❌ Error updating unique constraint:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updateUniqueConstraint();
