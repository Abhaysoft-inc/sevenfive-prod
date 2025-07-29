const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentStructure() {
    try {
        console.log('🔍 Checking current database structure...');

        // Check current schedule structure
        const sampleSchedule = await prisma.$queryRaw`SELECT * FROM "Schedule" LIMIT 1`;

        console.log('📋 Current Schedule structure:');
        if (sampleSchedule.length > 0) {
            console.log('Columns:', Object.keys(sampleSchedule[0]));
        }

        // Check if validFrom and validTo columns exist
        const columnCheck = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Schedule' 
            AND column_name IN ('validFrom', 'validTo')
        `;

        console.log('\n🔍 Date columns check:');
        console.log('validFrom exists:', columnCheck.some(c => c.column_name === 'validFrom'));
        console.log('validTo exists:', columnCheck.some(c => c.column_name === 'validTo'));

        // Check current unique constraints
        const constraints = await prisma.$queryRaw`
            SELECT constraint_name, column_name
            FROM information_schema.key_column_usage
            WHERE table_name = 'Schedule'
            AND constraint_name LIKE '%unique%' OR constraint_name LIKE '%key%'
        `;

        console.log('\n🔑 Current constraints:', constraints);

    } catch (error) {
        console.error('❌ Error checking structure:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCurrentStructure();
