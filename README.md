# Felicity Event Management System

A comprehensive event management system built with the MERN stack for managing clubs, events, and participants at Felicity fest.

## 🚀 Features Implemented

### Part 1: Core System Implementation (70 Marks)

#### 1. Authentication & Security (8 Marks) ✅
- JWT-based authentication with bcrypt password hashing
- Role-based access control (Participant, Organizer, Admin)
- IIIT email domain validation for IIIT participants
- Secure session management with token persistence
- Protected routes for all authenticated pages

#### 2. User Onboarding & Preferences (3 Marks) ✅
- Participant preference selection (interests, clubs to follow)
- Skip option during onboarding
- Editable preferences from profile page

#### 3. User Data Models (2 Marks) ✅
- Comprehensive participant and organizer models
- Additional attributes: timestamps, isActive status, preferences

#### 4. Event Types (2 Marks) ✅
- Normal Event (Individual registration)
- Merchandise Event (Individual purchase with stock management)
- Hackathon Event (Team-based registration)

#### 5. Event Attributes (2 Marks) ✅
- All required fields implemented
- Custom form builder for Normal events
- Merchandise item details and stock management
- Team size configuration for Hackathons

#### 6. Participant Features (22 Marks) ✅
- **Dashboard**: Upcoming, completed, and cancelled events with tabs
- **Browse Events**: Search, trending (top 5/24h), filters by type/eligibility/date/followed clubs
- **Event Details**: Complete information with registration validation
- **Registration Workflows**: 
  - Normal events with custom forms
  - Merchandise with QR ticket generation
  - Email confirmation with tickets
- **Profile Management**: Editable fields, password change
- **Clubs/Organizers**: Listing, details, follow/unfollow functionality

#### 7. Organizer Features (18 Marks) ✅
- **Dashboard**: Events carousel with analytics (registrations, revenue, attendance)
- **Event Management**: Create, edit, publish, status transitions
- **Event Detail View**: Overview, analytics, participant list with search/filter
- **Form Builder**: Dynamic custom registration forms with field types
- **Profile Management**: Editable details, Discord webhook integration
- **QR Scanner**: Attendance tracking with validation

#### 8. Admin Features (6 Marks) ✅
- **Dashboard**: System statistics overview
- **Club/Organizer Management**: Create, activate/deactivate, delete accounts
- **Auto-generated Credentials**: Secure password generation and email delivery
- **Password Reset Workflow**: Request management and approval

#### 9. Deployment (5 Marks) ✅
- **Frontend**: https://felicity-event-management-nine.vercel.app (Vercel)
- **Backend API**: https://felicity-event-management-kwt3.onrender.com/api (Render)
- MongoDB Atlas cloud database
- Environment variable configuration via Render + Vercel dashboards

### Part 2: Advanced Features (30 Marks)

#### Tier A Features (Choose 2 - 8 marks each)
✅ **1. Hackathon Team Registration (8 Marks)**
- Team creation with unique invite codes
- Member invitation and acceptance workflow
- Team management dashboard
- Automatic ticket generation for complete teams

✅ **2. QR Scanner & Attendance Tracking (8 Marks)**
- Built-in QR code scanner for organizers
- Real-time attendance marking with timestamps
- Duplicate scan prevention
- Live attendance dashboard
- Export attendance reports as CSV
- Manual override with audit logging

#### Tier B Features (Choose 2 - 6 marks each)
✅ **1. Organizer Password Reset Workflow (6 Marks)**
- Complete password reset request system
- Admin approval/rejection workflow
- Auto-generated secure passwords
- Request status tracking and history
- Email notifications

✅ **2. Real-Time Discussion Forum (6 Marks)**
- Per-event threaded discussion board for registered participants and organizers
- Threaded replies with parent-child message structure
- Organizer moderation: pin/unpin messages, delete any message, post announcements
- Real-time polling (8-second auto-refresh)
- Emoji reactions on messages
- Announcement and pinned message highlighting

#### Tier C Features (Choose 1 - 2 marks each)
✅ **1. Anonymous Feedback System (2 Marks)**
- Post-event anonymous feedback for participants who attended
- Star rating (1-5) with comments
- Organizer view with aggregated ratings and feedback list
- Export feedback data as CSV

## 🛠️ Technology Stack

- **Frontend**: React.js (Create React App)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM (MongoDB Atlas)
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Email**: Nodemailer (Gmail SMTP)
- **QR Codes**: qrcode (generation) + qr-scanner (frontend scanning)
- **File Upload**: Multer
- **Bot Protection**: Cloudflare Turnstile CAPTCHA
- **HTTP Client**: Axios
- **Notifications**: react-toastify
- **Routing**: react-router-dom v6

## 📦 Installation

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
ADMIN_EMAIL=admin@felicity.com
ADMIN_PASSWORD=admin123
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000
```

5. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register participant
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Update password

### Participant
- `GET /api/participant/dashboard` - Get dashboard
- `POST /api/participant/register/:eventId` - Register for event
- `GET /api/participant/profile` - Get profile
- `PUT /api/participant/profile` - Update profile
- `GET /api/participant/organizers` - Get all organizers
- `POST /api/participant/organizers/:id/follow` - Follow/unfollow organizer
- `POST /api/participant/feedback/:eventId` - Submit feedback

### Organizer
- `GET /api/organizer/dashboard` - Get dashboard
- `GET /api/organizer/events/:eventId/participants` - Get event participants
- `PUT /api/organizer/registrations/:registrationId/status` - Update registration status
- `POST /api/organizer/attendance/scan` - Scan QR and mark attendance
- `GET /api/organizer/events/:eventId/attendance` - Get attendance report
- `GET /api/organizer/profile` - Get profile
- `PUT /api/organizer/profile` - Update profile
- `POST /api/organizer/password-reset-request` - Request password reset
- `GET /api/organizer/events/:eventId/feedback` - Get event feedback
- `PUT /api/organizer/attendance/override` - Manual attendance override
- `GET /api/organizer/events/:eventId/audit-logs` - Get audit logs

### Forum (Discussion)
- `GET /api/forum/events/:eventId/messages` - Get event messages (threaded)
- `POST /api/forum/events/:eventId/messages` - Post message or announcement
- `DELETE /api/forum/messages/:messageId` - Delete message
- `PUT /api/forum/messages/:messageId/pin` - Toggle pin on message
- `POST /api/forum/messages/:messageId/react` - React to message

### Teams
- `POST /api/teams/create` - Create hackathon team
- `POST /api/teams/join` - Join team by invite code
- `GET /api/teams/my-teams` - Get user's teams
- `GET /api/teams/:teamId` - Get team details
- `DELETE /api/teams/:teamId/leave` - Leave team

### Admin
- `GET /api/admin/dashboard` - Get dashboard
- `POST /api/admin/organizers` - Create organizer
- `GET /api/admin/organizers` - Get all organizers
- `PUT /api/admin/organizers/:id/status` - Update organizer status
- `DELETE /api/admin/organizers/:id` - Delete organizer
- `GET /api/admin/password-reset-requests` - Get password reset requests
- `PUT /api/admin/password-reset-requests/:id` - Process password reset request

### Events
- `GET /api/events` - Get all events (with filters)
- `GET /api/events/trending` - Get trending events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event (Organizer)
- `PUT /api/events/:id` - Update event (Organizer)
- `PUT /api/events/:id/publish` - Publish event (Organizer)
- `DELETE /api/events/:id` - Delete event (Organizer)
- `GET /api/events/:id/analytics` - Get event analytics (Organizer)

## 🔐 Default Admin Credentials

After first run, an admin account is automatically created:

**Email**: admin@felicity.com  
**Password**: admin123

⚠️ **Please change the default password immediately after first login!**

## 🎯 Advanced Features Justification

### Tier A - Selected Features:

1. **Hackathon Team Registration (8 marks)**: Essential for coding competitions and team events at Felicity. Provides complete team formation workflow with invite system.

2. **QR Scanner & Attendance Tracking (8 marks)**: Critical for event management, allows organizers to efficiently track attendance, prevent duplicate entries, and maintain accurate records.

### Tier B - Selected Features:

1. **Organizer Password Reset Workflow (6 marks)**: Important security feature allowing organizers to reset passwords through admin approval, maintaining system security while providing recovery options.

2. **Real-Time Discussion Forum (6 marks)**: Per-event discussion boards with threading enable participants to communicate, ask questions, and share updates. Organizer moderation tools (pin, delete, announcements) maintain quality.

### Tier C - Selected Feature:

1. **Anonymous Feedback System (2 marks)**: Allows participants who attended events to submit anonymous star-rating and comment feedback, with organizer-side aggregation and CSV export.

**Total Advanced Features: 30 marks** ✅

## 📊 Database Models

- **User**: Participants, Organizers, and Admin
- **Event**: All event types with custom fields
- **Registration**: Event registrations with tickets
- **Team**: Hackathon teams with invite system
- **PasswordResetRequest**: Password reset workflow
- **Feedback**: Anonymous event feedback
- **Message**: Discussion forum messages with threading
- **AuditLog**: Attendance override audit trail

## 🚢 Deployment Instructions

### Backend Deployment (Render/Railway/Fly)

1. Create a new web service
2. Connect your Git repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables from `.env.example`
6. Deploy

### Frontend Deployment (Vercel/Netlify)

1. Connect your Git repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables
5. Deploy

### MongoDB Atlas

1. Create a cluster on MongoDB Atlas
2. Create a database user
3. Get connection string
4. Update `MONGODB_URI` in backend environment variables

## 📄 License

This project is created for the DASS (Design & Analysis of Software Systems) course assignment.

## 👥 Author

[Your Name]  
[Your Roll Number]  
IIIT Hyderabad

## 📞 Support

For issues or questions, please contact the course instructors.
