# Felicity Event Management System

A comprehensive event management system built with the MERN stack for managing clubs, events, and participants at Felicity fest.

## 🚀 Features

### Authentication & Security
- JWT-based authentication with bcrypt password hashing
- Role-based access control (Participant, Organizer, Admin)
- IIIT email domain validation for IIIT participants
- Secure session management with token persistence
- Protected routes for all authenticated pages
- Rate limiting on authentication endpoints
- Cloudflare Turnstile CAPTCHA integration

### User Onboarding & Preferences
- Participant preference selection (interests, clubs to follow)
- Skip option during onboarding
- Editable preferences from profile page

### Event Types
- **Normal Event** — Individual registration with custom form fields
- **Merchandise Event** — Individual purchase with stock management
- **Hackathon Event** — Team-based registration with invite codes

### Participant Features
- **Dashboard** — Upcoming, completed, and cancelled events with tabs
- **Browse Events** — Search, trending (top 5 in 24h), filters by type/eligibility/date/followed clubs
- **Event Details** — Full information with registration validation
- **Registration Workflows** — Normal events with custom forms, merchandise with QR ticket generation, email confirmation
- **Profile Management** — Editable fields, password change
- **Clubs/Organizers** — Listing, details, follow/unfollow functionality
- **Ticket View** — View and display event tickets with QR codes
- **Discussion Forum** — Per-event threaded discussion, replies, emoji reactions
- **Anonymous Feedback** — Post-event star rating and comments for attended events

### Organizer Features
- **Dashboard** — Events carousel with analytics (registrations, revenue, attendance)
- **Event Management** — Create, edit, publish, delete, status transitions
- **Event Detail View** — Overview, analytics, participant list with search/filter
- **Form Builder** — Dynamic custom registration forms with multiple field types
- **QR Scanner** — Camera-based and file-upload QR scanning for attendance tracking
- **Manual Attendance Override** — Mark/unmark attendance with mandatory reason and audit logging
- **Attendance Export** — Download participant and attendance data as CSV
- **Profile Management** — Editable details, Discord webhook integration
- **Discussion Forum Moderation** — Pin/unpin messages, delete any message, post announcements
- **Feedback View** — Aggregated ratings and feedback list per event with CSV export
- **Password Reset** — Request password reset through admin approval workflow

### Admin Features
- **Dashboard** — System statistics overview
- **Club/Organizer Management** — Create, activate/deactivate, delete organizer accounts
- **Participant Management** — View all participants
- **Auto-generated Credentials** — Secure password generation and email delivery for new organizers
- **Password Reset Workflow** — Review, approve, or reject organizer password reset requests

### Hackathon Team Registration
- Team creation with unique invite codes
- Member invitation and acceptance workflow
- Team management within event details
- Automatic ticket generation for complete teams

### QR Scanner & Attendance Tracking
- Built-in camera QR code scanner for organizers
- QR image file upload scanning
- Real-time attendance marking with timestamps
- Duplicate scan prevention
- Live attendance dashboard with polling
- Export attendance reports as CSV
- Manual override with audit logging

### Real-Time Discussion Forum
- Per-event threaded discussion board for registered participants and organizers
- Threaded replies with parent-child message structure
- Organizer moderation: pin/unpin messages, delete any message, post announcements
- Real-time polling (8-second auto-refresh)
- Emoji reactions on messages
- Announcement and pinned message highlighting

### Bot Protection
- Cloudflare Turnstile CAPTCHA on login and registration pages
- Backend server-side token verification with Cloudflare API
- Graceful bypass when keys are not configured (development mode)

### Organizer Password Reset Workflow
- Complete password reset request system
- Admin approval/rejection workflow
- Auto-generated secure passwords
- Request status tracking and history
- Email notifications

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Create React App) |
| Backend | Node.js + Express.js |
| Database | MongoDB with Mongoose ODM |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| QR Codes | qrcode (generation) + qr-scanner (frontend scanning) |
| File Upload | Multer |
| Bot Protection | Cloudflare Turnstile CAPTCHA |
| HTTP Client | Axios |
| Notifications | react-toastify |
| Routing | react-router-dom v6 |

## 📁 Project Structure

```
felicity-event-management/
├── backend/
│   ├── api/                  # Vercel serverless entry point
│   ├── controllers/          # Route handlers
│   ├── middleware/            # Auth, rate-limit, file upload
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Express route definitions
│   ├── scripts/              # Utility scripts (reset password, test email, etc.)
│   ├── utils/                # Email service, token generation, admin init
│   ├── app.js                # Express app configuration
│   └── server.js             # Server entry point
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # Navbar, TurnstileWidget
│   │   ├── context/          # AuthContext
│   │   ├── pages/
│   │   │   ├── admin/        # Dashboard, ManageOrganizers, PasswordResetRequests
│   │   │   ├── organizer/    # Dashboard, CreateEvent, EventManagement, OngoingEvents, Profile
│   │   │   └── participant/  # Dashboard, BrowseEvents, EventDetails, Organizers, OrganizerDetails, Profile, Ticket
│   │   ├── App.js
│   │   └── index.js
│   └── vercel.json           # SPA routing config
└── deployment.txt
```

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
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@felicity.com
ADMIN_PASSWORD=admin123
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_SECURE=false
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
TURNSTILE_SECRET_KEY=your_turnstile_key
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
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## 📝 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register participant |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/auth/me` | Get current user |
| `PUT` | `/api/auth/password` | Update password |

### Events (Public + Organizer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/events` | Get all events (with filters) |
| `GET` | `/api/events/trending` | Get trending events |
| `GET` | `/api/events/:id` | Get event by ID |
| `POST` | `/api/events` | Create event (Organizer) |
| `PUT` | `/api/events/:id` | Update event (Organizer) |
| `PUT` | `/api/events/:id/publish` | Publish event (Organizer) |
| `DELETE` | `/api/events/:id` | Delete event (Organizer) |
| `GET` | `/api/events/:id/analytics` | Get event analytics (Organizer) |

### Participant
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/participant/dashboard` | Get dashboard |
| `GET` | `/api/participant/events` | Get participant's events |
| `GET` | `/api/participant/events/:id` | Get participant event details |
| `POST` | `/api/participant/events/:eventId/register` | Register for event |
| `POST` | `/api/participant/events/:eventId/feedback` | Submit feedback |
| `GET` | `/api/participant/profile` | Get profile |
| `PUT` | `/api/participant/profile` | Update profile |
| `GET` | `/api/participant/organizers` | Get all organizers |
| `GET` | `/api/participant/organizers/:id` | Get organizer details |
| `POST` | `/api/participant/organizers/:id/follow` | Follow organizer |
| `POST` | `/api/participant/organizers/:id/unfollow` | Unfollow organizer |
| `GET` | `/api/participant/registration/:ticketId` | Get registration/ticket details |

### Organizer
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/organizer/dashboard` | Get dashboard |
| `GET` | `/api/organizer/events/:eventId/participants` | Get event participants |
| `PUT` | `/api/organizer/registrations/:registrationId/status` | Update registration status |
| `POST` | `/api/organizer/attendance/scan` | Scan QR and mark attendance |
| `GET` | `/api/organizer/events/:eventId/attendance` | Get attendance report |
| `PUT` | `/api/organizer/attendance/override` | Manual attendance override |
| `GET` | `/api/organizer/events/:eventId/audit-logs` | Get audit logs |
| `GET` | `/api/organizer/profile` | Get profile |
| `PUT` | `/api/organizer/profile` | Update profile |
| `POST` | `/api/organizer/password-reset-request` | Request password reset |
| `GET` | `/api/organizer/events/:eventId/feedback` | Get event feedback |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/dashboard` | Get dashboard |
| `POST` | `/api/admin/organizers` | Create organizer |
| `GET` | `/api/admin/organizers` | Get all organizers |
| `PUT` | `/api/admin/organizers/:id/status` | Update organizer status |
| `DELETE` | `/api/admin/organizers/:id` | Delete organizer |
| `GET` | `/api/admin/password-reset-requests` | Get password reset requests |
| `PUT` | `/api/admin/password-reset-requests/:id` | Process password reset request |
| `GET` | `/api/admin/participants` | Get all participants |

### Teams (Hackathon)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/teams` | Create hackathon team |
| `POST` | `/api/teams/join` | Join team by invite code |
| `POST` | `/api/teams/:teamId/accept/:memberId` | Accept team member |
| `GET` | `/api/teams/event/:eventId/my-team` | Get current user's team for event |
| `GET` | `/api/teams/:id` | Get team details |

### Forum (Discussion)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/forum/events/:eventId/messages` | Get event messages (threaded) |
| `POST` | `/api/forum/events/:eventId/messages` | Post message or announcement |
| `DELETE` | `/api/forum/messages/:messageId` | Delete message |
| `PUT` | `/api/forum/messages/:messageId/pin` | Toggle pin on message |
| `POST` | `/api/forum/messages/:messageId/react` | React to message |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |

## 📊 Database Models

| Model | Description |
|-------|-------------|
| **User** | Participants, Organizers, and Admin with role-based fields |
| **Event** | All event types with custom form fields, dates, eligibility |
| **Registration** | Event registrations with ticket IDs and attendance status |
| **Team** | Hackathon teams with invite codes and member management |
| **Message** | Discussion forum messages with threading and reactions |
| **Feedback** | Anonymous event feedback with ratings and comments |
| **AuditLog** | Attendance override audit trail |
| **PasswordResetRequest** | Organizer password reset workflow |

## 🔐 Default Admin Credentials

After first run, an admin account is automatically created:

- **Email**: `admin@felicity.com`
- **Password**: `admin123`

> ⚠️ **Change the default password immediately after first login!**

## 🚢 Deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your Git repository
3. Set root directory to `backend`
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add all environment variables from `.env.example`
7. Deploy

### Frontend (Vercel)

1. Connect your Git repository on Vercel
2. Set **Root Directory** to `frontend`
3. Build command: `npm run build` (auto-detected)
4. Output directory: `build` (auto-detected)
5. Add environment variables:
   - `REACT_APP_API_URL` → your Render backend URL + `/api`
6. Deploy

### MongoDB Atlas

1. Create a cluster on MongoDB Atlas
2. Create a database user
3. Whitelist IP addresses (or allow all with `0.0.0.0/0`)
4. Get connection string and set it as `MONGODB_URI` in backend environment

## 🔧 Utility Scripts

```bash
npm run reset-admin     # Reset admin password
npm run reset-user      # Reset a user's password
npm run delete-user     # Delete a user account
npm run test-email      # Test email configuration
```

## 📄 License

This project is created for the DASS (Design & Analysis of Software Systems) course at IIIT Hyderabad.
