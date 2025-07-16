import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const batches = await prisma.batch.findMany({
            include: {
                branch: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(batches);
    } catch (error) {
        console.error("Error fetching batches:", error);
        return NextResponse.json(
            { error: "Failed to fetch batches" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, branchId, year } = body;

        if (!name || !branchId || !year) {
            return NextResponse.json(
                { error: "Name, branch, and year are required" },
                { status: 400 }
            );
        }

        const batch = await prisma.batch.create({
            data: {
                name,
                branchId,
                year,
            },
            include: {
                branch: true,
            },
        });

        return NextResponse.json(batch, { status: 201 });
    } catch (error) {
        console.error("Error creating batch:", error);

        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return NextResponse.json(
                { error: "Batch with this name already exists for this branch and year" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create batch" },
            { status: 500 }
        );
    }
}
