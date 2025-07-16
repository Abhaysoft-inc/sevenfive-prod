import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const subjects = await prisma.subject.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(subjects);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return NextResponse.json(
            { error: "Failed to fetch subjects" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, code, branch, year } = body;

        if (!name || !code || !branch || !year) {
            return NextResponse.json(
                { error: "Name, code, branch, and year are required" },
                { status: 400 }
            );
        }

        const subject = await prisma.subject.create({
            data: {
                name,
                code: code.toUpperCase(),
                branch,
                year,
            },
        });

        return NextResponse.json(subject, { status: 201 });
    } catch (error) {
        console.error("Error creating subject:", error);

        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "Subject with this code already exists for this branch and year" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create subject" },
            { status: 500 }
        );
    }
}
