import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@sevenfive.com' }
        });

        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash('YourPasswordHere', 10);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                name: 'Administrator',
                email: 'admin@sevenfive.com',
                phone: '1234567890',
                password: hashedPassword,
                college: 'SevenFive Admin',
                branch: 'Administration',
                batch: 'Admin',
                year: 'FIRST',
                role: 'ADMIN'
            }
        });

        console.log('Admin user created successfully:', admin.email);
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
