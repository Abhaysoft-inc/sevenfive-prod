# SevenFive - Class Schedule & Attendance Management System

A comprehensive Next.js application for managing class schedules, attendance tracking, and student management with historical data integrity.

## 🚀 Features

### 📅 **Date-Specific Schedule Management**
- **Historical Accuracy**: Schedule changes create new versions instead of modifying existing ones
- **Date Range Support**: Each schedule has `validFrom` and optional `validTo` dates
- **Past Attendance**: Mark attendance for any past date with the correct historical schedule
- **Smart Versioning**: Automatic schedule versioning preserves data integrity

### 👥 **User Management**
- **Role-based Access**: Admin and Student roles with appropriate permissions
- **Batch & Branch Support**: Organize students by batch, branch, and academic year
- **User Authentication**: Secure JWT-based authentication system

### 📊 **Attendance Tracking**
- **Daily Attendance**: Mark PRESENT, ABSENT, or CANCELLED status
- **Historical Records**: View attendance for any past date
- **Statistics**: Comprehensive attendance statistics and analytics
- **Data Integrity**: Attendance preserved even when changing student batches

### 🔧 **Admin Features**
- **Schedule Management**: Create, edit, and delete class schedules with date ranges
- **Bulk Operations**: Create schedules for multiple batches simultaneously
- **Timetable View**: Visual timetable organized by time slots and days
- **User Management**: Manage students, batches, branches, and subjects

## 🛠️ Technology Stack

- **Frontend**: Next.js 15.3.0 with React and Tailwind CSS
- **Backend**: Next.js API Routes with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with secure cookie handling
- **Hosting**: Optimized for Vercel deployment
- **Build Tool**: Turbopack for fast development builds

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Neon, Supabase, or local)

## 🚀 Getting Started

### 1. Clone and Install
```bash
git clone <repository-url>
cd sevenfive-prod
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-jwt-secret-key"
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Run schedule migration for existing data
node scripts/migrate-schedules.js
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📚 API Documentation

### Admin Endpoints
- `GET /api/admin/schedules` - Get schedules (supports `?date=YYYY-MM-DD` and `?batchId=xxx`)
- `POST /api/admin/schedules` - Create new schedule with date range
- `PUT /api/admin/schedules` - Update schedule (creates new version)
- `DELETE /api/admin/schedules` - Delete schedule

### User Endpoints  
- `GET /api/user/schedules` - Get user's schedules (supports `?date=YYYY-MM-DD`)
- `POST /api/user/attendance` - Mark attendance for specific date
- `GET /api/user/attendance` - Get attendance record

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify JWT token

## 🗄️ Database Schema

### Key Models
- **User**: Student and admin information with batch/branch/year
- **Schedule**: Class schedules with date ranges (`validFrom`, `validTo`)
- **AttendanceRecord**: Daily attendance records
- **Batch**: Student batch organization
- **Subject**: Course/subject management

### Date-Specific Schedule Example
```prisma
model Schedule {
  id        String    @id @default(uuid())
  batchId   String
  subjectId String  
  dayOfWeek DayOfWeek
  startTime String    // "09:30"
  endTime   String    // "10:20"
  validFrom DateTime  // When schedule becomes effective
  validTo   DateTime? // When schedule ends (null = ongoing)
  // ... relations
}
```

## 🔄 Schedule Versioning

When editing a schedule:
1. **Old schedule** is closed one day before the new start date
2. **New schedule** is created with the specified `validFrom` date
3. **Historical data** remains intact for accurate past attendance marking

### Example
```javascript
// Original schedule valid from 2025-01-01 to ongoing
// Edit request with validFrom: "2025-08-01"
// Result:
// - Original: validFrom: 2025-01-01, validTo: 2025-07-31
// - New: validFrom: 2025-08-01, validTo: null
```

## 📱 Usage

### For Administrators
1. **Login** at `/admin/login`
2. **Manage Schedules** at `/admin/schedules` 
3. **View Timetable** at `/admin/timetable`
4. **Manage Users** at `/admin` dashboard

### For Students  
1. **Login** at `/login`
2. **View Dashboard** at `/dashboard`
3. **Mark Attendance** for today or past dates
4. **View Schedule** for any specific date

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Manual Deployment
```bash
npm run build
npm start
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `node scripts/migrate-schedules.js` - Migrate existing schedules

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

## 🆘 Support

For support or questions:
- Check the Issues tab
- Review API documentation above
- Ensure database connection is properly configured

**Built with ❤️ using Next.js and modern web technologies**
