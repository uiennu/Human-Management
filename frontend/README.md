# LeaveFlow - Employee Leave Management System

A professional, full-stack leave management system built with Next.js, React, Tailwind CSS, and ASP.NET Core. Features a complete employee portal with dashboard, leave management, timesheet updates, check-in/out requests, and work-from-home capabilities.

## Project Structure

\`\`\`
leave-management-system/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with sidebar navigation
│   ├── page.tsx                 # Dashboard page
│   ├── leave/page.tsx           # Leave management
│   ├── timesheet/page.tsx       # Timesheet updates
│   ├── checkin/page.tsx         # Check-in/out requests
│   ├── wfh/page.tsx            # Work from home requests
│   └── profile/page.tsx         # Employee profile
│
├── components/
│   ├── app-sidebar.tsx          # Main navigation sidebar
│   ├── dashboard-overview.tsx   # Dashboard widgets and stats
│   ├── leave-history-page.tsx   # Leave history table with filters
│   └── ui/                      # shadcn/ui components
│
├── lib/
│   ├── api/                     # API integration layer
│   │   ├── leave-api.ts        # Leave endpoints
│   │   ├── timesheet-api.ts    # Timesheet endpoints
│   │   ├── checkin-api.ts      # Check-in endpoints
│   │   ├── wfh-api.ts          # WFH endpoints
│   │   └── profile-api.ts      # Profile endpoints
│   ├── types/                   # TypeScript definitions
│   ├── mock-data/               # Development mock data
│   └── utils.ts                 # Utility functions
│
├── public/                      # Static assets
├── .env.example                 # Environment variables template
├── BACKEND_API_SPEC.md          # Complete API documentation
├── BACKEND_SETUP.md             # ASP.NET setup guide
└── PROJECT_STRUCTURE.md         # Detailed structure documentation
\`\`\`

## Frontend Setup (This Project)

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Configure environment variables:

The `NEXT_PUBLIC_API_URL` environment variable is already configured in your project settings. You can view and manage it in the **Vars** section of the in-chat sidebar.

If you need to add it manually, create a `.env.local` file:
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:5000/api
\`\`\`

3. Run development server:
\`\`\`bash
npm run dev
\`\`\`

The application will be available at `http://localhost:3000`

### Build for Production
\`\`\`bash
npm run build
npm start
\`\`\`

## Backend Setup (ASP.NET)

### Prerequisites
- .NET 8.0 SDK
- MySQL Server 8.0+
- Visual Studio 2022 or VS Code with C# extension

### Project Structure

Create a new ASP.NET Core Web API project:

\`\`\`bash
cd backend
dotnet new webapi -n LeaveManagement
cd LeaveManagement
\`\`\`

### Required NuGet Packages

\`\`\`bash
dotnet add package MySql.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
\`\`\`

### Database Configuration

1. Update `appsettings.json`:
\`\`\`json
{
  "ConnectionStrings": {
    "DefaultConnection": "server=localhost;database=LeaveManagement;user=root;password=yourpassword"
  },
  "Jwt": {
    "Key": "your-secret-key-min-32-characters",
    "Issuer": "LeaveManagementAPI",
    "Audience": "LeaveManagementClient"
  }
}
\`\`\`

2. Create and run migrations:
\`\`\`bash
dotnet ef migrations add InitialCreate
dotnet ef database update
\`\`\`

### Run Backend

\`\`\`bash
dotnet run
\`\`\`

API will be available at `https://localhost:5001` or `http://localhost:5000`

## API Endpoints

### Leave Management
- `GET /api/leave/balance` - Get employee leave balance
- `GET /api/leave/history` - Get leave request history (with filters)
- `GET /api/leave/{id}` - Get specific leave request details
- `POST /api/leave` - Create new leave request
- `POST /api/leave/{id}/cancel` - Cancel pending leave request
- `PUT /api/leave/{id}/approve` - Approve leave request (manager only)
- `PUT /api/leave/{id}/reject` - Reject leave request (manager only)

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new employee
- `POST /api/auth/refresh` - Refresh JWT token

### Timesheet Updates
- `GET /api/timesheet` - Get timesheet entries
- `POST /api/timesheet` - Submit timesheet update request
- `PUT /api/timesheet/{id}` - Update existing timesheet entry
- `DELETE /api/timesheet/{id}` - Delete timesheet entry

### Check-In/Out Requests
- `GET /api/checkin` - Get check-in/out history
- `POST /api/checkin` - Submit check-in/out request

### Work From Home Requests
- `GET /api/wfh` - Get work from home history
- `POST /api/wfh` - Submit work from home request

### Employee Profile
- `GET /api/profile` - Get employee profile information
- `PUT /api/profile` - Update employee profile information

## Database Schema

### Tables

**Users**
- Id (Primary Key)
- Email
- PasswordHash
- FirstName
- LastName
- Role (Employee/Manager/Admin)
- DepartmentId
- ManagerId (Foreign Key to Users)

**LeaveRequests**
- Id (Primary Key)
- EmployeeId (Foreign Key to Users)
- LeaveType (Vacation/Sick Leave/Personal Day)
- StartDate
- EndDate
- TotalDays
- Status (Pending/Approved/Rejected/Cancelled)
- Reason
- ApproverId (Foreign Key to Users)
- SubmittedDate
- ApprovedDate

**LeaveBalances**
- Id (Primary Key)
- EmployeeId (Foreign Key to Users)
- Year
- TotalDays
- UsedDays
- RemainingDays

**TimesheetEntries**
- Id (Primary Key)
- EmployeeId (Foreign Key to Users)
- Date
- HoursWorked
- Status (Submitted/Approved/Rejected/Cancelled)
- Notes

**CheckInOutRequests**
- Id (Primary Key)
- EmployeeId (Foreign Key to Users)
- Date
- Time
- Type (Check-In/Check-Out)
- Status (Pending/Approved/Rejected/Cancelled)
- Notes

**WFHRequests**
- Id (Primary Key)
- EmployeeId (Foreign Key to Users)
- Date
- Status (Pending/Approved/Rejected/Cancelled)
- Reason

## Features

### Employee Portal (Implemented)
- **Dashboard** - Overview of leave balance, pending requests, recent activity, and quick stats
- **Leave Management** - Submit, view, filter, and cancel leave requests
- **Timesheet Updates** - Request corrections to timesheet entries
- **Check-In/Out Requests** - Submit manual check-in/out entries when system fails
- **Work From Home** - Submit and track remote work requests
- **Employee Profile** - View personal information, leave balance, and yearly statistics

### Design Highlights
- Clean, professional UI optimized for office environments
- Sidebar navigation with role-based menu items
- Color-coded status badges for quick visual feedback
- Comprehensive filtering and pagination
- Responsive design for mobile and desktop
- Mock employee profile with realistic data

## API Integration

The frontend includes a complete API integration layer in `lib/api/`:

- **leave-api.ts** - Leave management endpoints (balance, history, create, cancel)
- **timesheet-api.ts** - Timesheet update endpoints
- **checkin-api.ts** - Check-in/out request endpoints
- **wfh-api.ts** - Work from home request endpoints
- **profile-api.ts** - Employee profile endpoints

All API functions include:
- TypeScript type definitions
- JWT Bearer token authentication
- Proper error handling
- Request/response type safety

See **BACKEND_API_SPEC.md** for complete API endpoint documentation with request/response examples.

## Type Definitions

Complete TypeScript interfaces available in `lib/types/index.ts`:
- Employee, LeaveRequest, LeaveBalance
- TimesheetUpdateRequest, CheckInRequest, WFHRequest
- DashboardStats, ApiResponse, PaginatedResponse

## Mock Data

Currently using mock data for development in:
- `components/dashboard-overview.tsx` - Dashboard stats and activities
- `components/leave-history-page.tsx` - Leave request history
- `app/timesheet/page.tsx` - Timesheet update requests
- `app/checkin/page.tsx` - Check-in/out requests
- `app/wfh/page.tsx` - WFH requests
- `lib/mock-data/employee.ts` - Current employee profile

To connect to real API:
1. Ensure backend is running
2. Set `NEXT_PUBLIC_API_URL` in Vars section
3. Replace mock data with API calls from `lib/api/*`
4. Add loading states and error handling

## Features Roadmap

### Phase 1 (Current)
- ✅ Complete UI for all employee features
- ✅ Navigation sidebar with routing
- ✅ Dashboard with statistics
- ✅ Leave history with filters and pagination
- ✅ Timesheet, check-in, WFH request pages
- ✅ Employee profile page
- ✅ API integration layer
- ✅ TypeScript type definitions

### Phase 2 (Next)
- [ ] Connect all pages to backend API
- [ ] Add authentication (login/logout)
- [ ] Implement form validation with Zod
- [ ] Add loading states and error handling
- [ ] Create new leave request form
- [ ] Real-time data updates with SWR

### Phase 3 (Future)
- [ ] Manager/admin dashboard
- [ ] Leave approval workflow
- [ ] Email notifications
- [ ] Calendar view for leaves
- [ ] Export reports to PDF/Excel
- [ ] Role-based access control
- [ ] Mobile responsive improvements

## Design System

### Colors
- **Primary**: Blue (#2563eb) - Primary actions, active navigation
- **Success**: Emerald (#059669) - Approved status
- **Warning**: Amber (#d97706) - Pending status
- **Error**: Rose (#dc2626) - Rejected status, cancel actions
- **Neutral**: Slate - Text, backgrounds, borders
- **Sidebar**: Dark slate (#0f172a) - Navigation background

### Typography
- **Font Family**: Geist (sans-serif), Geist Mono (monospace)
- **Headings**: Bold, 24-32px, slate-900
- **Body**: Regular, 14-16px, slate-600
- **Labels**: Medium, 12-14px, slate-700

### Layout
- **Sidebar**: Fixed 256px width with dark theme
- **Main Content**: Max-width 1280px, centered with padding
- **Cards**: White background, subtle borders, rounded corners
- **Spacing**: Consistent 16px/24px grid

## Additional Documentation

- **BACKEND_API_SPEC.md** - Complete API endpoint specifications
- **BACKEND_SETUP.md** - Step-by-step ASP.NET Core setup guide
- **PROJECT_STRUCTURE.md** - Detailed project organization
- **.env.example** - Environment variables template

## Development Guidelines

### Frontend
- Use TypeScript for type safety
- Follow React hooks best practices
- Keep components small and focused
- Use server components where possible
- Implement proper error handling

### Backend
- Follow RESTful API conventions
- Implement proper validation
- Use async/await patterns
- Apply authorization policies
- Log important operations

## Git Workflow

1. Initialize repository:
\`\`\`bash
git init
git add .
git commit -m "Initial commit: Leave Management System"
\`\`\`

2. Create feature branches:
\`\`\`bash
git checkout -b feature/leave-approval-workflow
\`\`\`

3. Commit conventions:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

## Environment Setup

### Development
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Database: `localhost:3306`

### Production
- Configure CORS properly
- Use environment variables
- Enable HTTPS
- Implement rate limiting
- Set up monitoring

## Testing

### Frontend
\`\`\`bash
npm run test
\`\`\`

### Backend
\`\`\`bash
dotnet test
\`\`\`

## Deployment

### Frontend (Vercel)
\`\`\`bash
npm run build
# Deploy to Vercel
\`\`\`

### Backend (Docker)
\`\`\`bash
docker build -t leave-management-api .
docker run -p 5000:80 leave-management-api
\`\`\`

## Support

For issues or questions, please contact the development team.

## License

Copyright © 2025 - LeaveFlow - Employee Leave Management System
