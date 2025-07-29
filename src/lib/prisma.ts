import { PrismaClient } from '@prisma/client';

// Global singleton instance with optimized connection pooling
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Optimized query helpers
export class OptimizedQueries {
  // Get user attendance stats with a single query
  static async getUserAttendanceStats(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        attendanceRecords: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                branch: true,
                year: true
              }
            }
          }
        }
      }
    });
  }

  // Get schedules for a date range with minimal data
  static async getSchedulesForDateRange(startDate: Date, endDate?: Date) {
    return await prisma.schedule.findMany({
      where: {
        validFrom: { lte: endDate || startDate },
        OR: [
          { validTo: null },
          { validTo: { gte: startDate } }
        ]
      },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        validFrom: true,
        validTo: true,
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        batch: {
          select: {
            id: true,
            name: true,
            year: true,
            branch: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
  }

  // Get attendance summary for dashboard (single query)
  static async getAttendanceSummary() {
    const result = await prisma.$queryRaw`
      SELECT 
        s.name as subject_name,
        s.code as subject_code,
        COUNT(ar.id) as total_records,
        COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END) as present_count,
        COUNT(CASE WHEN ar.status = 'ABSENT' THEN 1 END) as absent_count,
        ROUND(
          (COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END)::decimal / 
           NULLIF(COUNT(ar.id), 0)) * 100, 2
        ) as attendance_percentage
      FROM "Subject" s
      LEFT JOIN "AttendanceRecord" ar ON s.id = ar."subjectId"
      GROUP BY s.id, s.name, s.code
      ORDER BY s.name
    `;
    return result;
  }

  // Get user dashboard data in single query
  static async getUserDashboardData(userId: string, date?: Date) {
    const targetDate = date || new Date();
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][targetDate.getDay()];

    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        attendanceRecords: {
          where: {
            date: {
              gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
              lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
            }
          },
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    });
  }

  // Batch create attendance records
  static async batchCreateAttendance(attendanceData: any[]) {
    return await prisma.attendanceRecord.createMany({
      data: attendanceData,
      skipDuplicates: true
    });
  }

  // Get optimized schedule conflicts check
  static async checkScheduleConflicts(
    batchId: string, 
    dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY', 
    startTime: string, 
    endTime: string, 
    validFrom: Date, 
    validTo?: Date,
    excludeId?: string
  ) {
    return await prisma.schedule.findFirst({
      where: {
        batchId,
        dayOfWeek,
        ...(excludeId && { id: { not: excludeId } }),
        AND: [
          // Date range overlap check
          {
            validFrom: { lte: validTo || new Date('2099-12-31') }
          },
          {
            OR: [
              { validTo: null },
              { validTo: { gte: validFrom } }
            ]
          },
          // Time overlap check
          {
            OR: [
              {
                AND: [
                  { startTime: { lte: startTime } },
                  { endTime: { gt: startTime } }
                ]
              },
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gte: endTime } }
                ]
              },
              {
                AND: [
                  { startTime: { gte: startTime } },
                  { endTime: { lte: endTime } }
                ]
              }
            ]
          }
        ]
      },
      select: { id: true } // Only select ID to minimize data transfer
    });
  }
}

export default prisma;
