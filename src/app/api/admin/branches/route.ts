import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const branches = await prisma.branch.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(branches);
    } catch (error) {
        console.error("Error fetching branches:", error);
        return NextResponse.json(
            { error: "Failed to fetch branches" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, code } = body;

        if (!name || !code) {
            return NextResponse.json(
                { error: "Name and code are required" },
                { status: 400 }
            );
        }

        const branch = await prisma.branch.create({
            data: {
                name,
                code: code.toUpperCase(),
            },
        });

        return NextResponse.json(branch, { status: 201 });
    } catch (error) {
        console.error("Error creating branch:", error);

        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "Branch name or code already exists" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create branch" },
            { status: 500 }
        );
    }
}
