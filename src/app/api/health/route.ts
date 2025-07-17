import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Simple query to wake up the database
        await prisma.$queryRaw`SELECT 1`;
        
        return NextResponse.json({ 
            status: 'connected',
            message: 'Database connection successful',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        
        return NextResponse.json({ 
            status: 'disconnected',
            message: 'Database connection failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
