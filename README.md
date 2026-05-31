<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=LabGuard&fontSize=72&fontColor=fff&animation=twinkling&fontAlignY=32&desc=Laboratory%20Equipment%20Management%20System&descAlignY=55&descSize=20" width="100%" />

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

[![Tests](https://img.shields.io/badge/Tests-30%2F30%20Passed-22c55e?style=for-the-badge&logo=jest&logoColor=white)]()
[![Pass Rate](https://img.shields.io/badge/Pass%20Rate-100%25-22c55e?style=for-the-badge)]()
[![University](https://img.shields.io/badge/HTU-Capstone%20Project%20II-1B5E20?style=for-the-badge)]()

<br/>

> **A full-stack web application that replaces the paper-based lab equipment borrowing process at Al Hussein Technical University with a real-time, role-scoped digital platform.**

<br/>

[🚀 Live Demo](#-demo) · [📖 Documentation](#-documentation) · [⚙️ Installation](#️-installation) · [📬 Contact](#-team)

</div>

---

## 📋 Table of Contents

- [✨ Overview](#-overview)
- [🎯 Features](#-features)
- [👥 User Roles](#-user-roles)
- [🏗️ Architecture](#️-architecture)
- [🗄️ Database Design](#️-database-design)
- [🔐 Security](#-security)
- [⚙️ Installation](#️-installation)
- [🔧 Environment Variables](#-environment-variables)
- [▶️ Running the Project](#️-running-the-project)
- [🧪 Testing](#-testing)
- [📁 Project Structure](#-project-structure)
- [📊 API Endpoints](#-api-endpoints)
- [👨‍💻 Team](#-team)

---

## ✨ Overview

**LabGuard** is a complete laboratory equipment management system built for **Al Hussein Technical University (HTU)**. It digitizes the full borrow lifecycle — from request submission to equipment return — replacing inefficient paper forms with a centralized, real-time, and fully auditable platform.

```
Paper forms  →  Lost records  →  No accountability
          ▼
     LabGuard
          ▼
Digital requests  →  Real-time approvals  →  Full audit trail
```

### 🔑 Why LabGuard?

| Before LabGuard | After LabGuard |
|---|---|
| 📄 Paper forms with no searchable history | 💻 Digital requests with full filter & search |
| ❓ No real-time equipment availability | ✅ Live status: Available / In Use / Maintenance |
| 🔇 No overdue tracking or reminders | 🔔 Automated cron reminders at 2-day, 1-day, overdue |
| 🔓 Zero accountability or audit trail | 🔒 45+ logged action types, streamed live to admins |
| ⚠️ Race conditions on simultaneous approvals | 🔐 PostgreSQL `FOR UPDATE` atomic locking |

---

## 🎯 Features

<table>
<tr>
<td width="50%">

### Core Features
- 📦 **Equipment Catalogue** — browse, search, and filter by category, availability, and location
- 📝 **Borrow Request System** — full lifecycle from pending to approved/denied to returned
- 🔔 **Real-Time Notifications** — Socket.IO room-based push (no page refresh)
- ⏰ **Cron Reminders** — automated alerts at 2-day, 1-day, and overdue milestones
- 📊 **Analytics Dashboards** — live Recharts visualizations per role

</td>
<td width="50%">

### Advanced Features
- 📄 **PDF & Excel Export** — client-side via jsPDF and SheetJS, no server call needed
- 🔑 **JWT Authentication** — stateless auth with 24h token expiry
- 🛡️ **Role-Based Access Control** — four strictly scoped roles, 403 on mismatch
- 🔒 **Forced Password Change** — new users blocked until temporary password is replaced
- 📧 **EmailJS Integration** — auto-send registration credentials to new users

</td>
</tr>
</table>

---

## 👥 User Roles

LabGuard has four roles, each with strictly scoped access enforced at **both the frontend route level and every backend API endpoint**.

<table>
<thead>
<tr>
<th>🎓 Student</th>
<th>🏫 Instructor</th>
<th>🔧 Lab Assistant</th>
<th>🛠️ Administrator</th>
</tr>
</thead>
<tbody>
<tr>
<td>

- Browse equipment catalogue
- Submit borrow requests
- Max 14-day borrow period
- View personal history
- Export PDF / Excel
- Receive real-time notifications
- View denial reasons in modal
- Blocked when overdue

</td>
<td>

- Review pending requests
- Student name + uni ID visible
- Approve with atomic lock
- Deny with written reason
- Analytics dashboard (3 charts)
- View all transactions
- Export transaction reports
- Add equipment to inventory

</td>
<td>

- Add and delete equipment
- Delete blocked if borrowed
- Update status per item
- Quantity stepper modal
- Low-stock alerts at qty ≤ 2
- View equipment by location
- Equipment history tracking

</td>
<td>

- Register users (all roles)
- Forced password on first login
- 6 live analytics charts
- 45+ system log action types
- Live log stream via Socket.IO
- Full system oversight
- All capabilities of all roles

</td>
</tr>
</tbody>
</table>

---

## 🏗️ Architecture

LabGuard is built on a **clean three-tier architecture** with a separate real-time WebSocket channel:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                                   │
│   React 18 + Vite  │  Tailwind CSS + shadcn/ui  │  Recharts  │  React Router │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │  REST API (HTTP/HTTPS)
                         ┌─────────▼─────────┐
                         │  Socket.IO Client  │  ←── real-time push
                         └─────────┬─────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────┐
│                          APPLICATION LAYER                                   │
│     Node.js + Express.js  │  JWT Middleware  │  Role Middleware  │  node-cron │
│                           │  Socket.IO Server │                              │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │  SQL via pg Pool
┌──────────────────────────────────▼──────────────────────────────────────────┐
│                             DATA LAYER                                       │
│  PostgreSQL  │  10 normalized tables  │  FOR UPDATE locking  │  Indexes      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Implementation | Why |
|---|---|---|
| **Stateless JWT auth** | Token carries `id` + `role`, verified on every request | No DB hit per request, scalable |
| **Atomic approvals** | `BEGIN` + `FOR UPDATE` + `COMMIT` on both transaction and equipment rows | Prevents quantity race conditions |
| **Socket.IO rooms** | Each user joins `user:{id}`, admins join `admins` | Targeted delivery, no broadcast spam |
| **Cron + stage column** | `node-cron` hourly, `stage` in notifications table | Prevents duplicate reminders per milestone |
| **Forced password change** | `must_change_password` flag blocks all navigation | Security requirement for new registrations |

---

## 🗄️ Database Design

**10 normalized PostgreSQL tables** with foreign key constraints, indexes, and `ON DELETE CASCADE` for referential integrity.

```
users ──────────────────────────────────────────────┐
  ├── id, email, role, student_id                    │
  └── must_change_password (boolean)                 │
                                                     │
equipment ──────────────────────────────────────────┤
  ├── id, serial_number, total_qty, available_qty    │
  ├── status (Available/InUse/Maintenance/Reserved)  │
  ├── category_id → categories                       │
  └── location_id → locations                        │
                                                     │
transactions ────────────────────────────────────────┤
  ├── student_id → users                             │
  ├── equipment_id → equipment                       │
  ├── status (Pending/Approved/Denied/Returned)      │
  ├── denial_reason (TEXT)                           │
  └── expected_return_date                           │
                                                     │
return_details → transactions                        │
notifications  → users           (stage: 1/2/3)     │
system_logs    → users           (45+ action types) │
equipment_status_history → equipment                 │
categories, locations, reports                       │
```

> **Indexed columns:** `transactions.status`, `transactions.expected_return_date`, `notifications.user_id`, `system_logs.timestamp`

---

## 🔐 Security

```
Login Request
     │
     ▼
bcrypt.compare(password, hash)  ──── FAIL ──→  401 Unauthorized + log
     │
   PASS
     │
     ▼
mustChangePassword?  ──── YES ──→  Redirect to /change-password (all routes blocked)
     │
    NO
     │
     ▼
JWT signed { id, role, exp: 24h }
     │
     ▼  (every subsequent request)
authMiddleware  ──── missing/expired ──→  401
     │
   valid
     │
     ▼
authorizeRoles(requiredRole)  ──── mismatch ──→  403 Forbidden
     │
   authorized
     │
     ▼
Controller executes request
```

**Security stack:**
- 🔑 **JWT (RFC 7519)** — stateless authentication, 24-hour token expiry
- 🔒 **bcrypt** — password hashing with 10 salt rounds
- 🛡️ **RBAC** — `authorizeRoles()` middleware on every protected endpoint
- 🔐 **Atomic transactions** — PostgreSQL `FOR UPDATE` prevents quantity race conditions
- 📧 **EmailJS** — credential delivery without exposing a mail server
- ✅ **CORS** — restricted to known origins in production

---

## ⚙️ Installation

### Prerequisites

Make sure you have the following installed before proceeding:

```bash
node --version    # v18.0.0 or higher
npm --version     # v9.0.0 or higher
psql --version    # PostgreSQL 14 or higher
```

> ⚠️ Make sure PostgreSQL is installed and `psql` is added to your system PATH.

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/ZaidHawari/Lab-Guard3.git
cd Lab-Guard3
```

---

### Step 2 — Set up the database

Run the following command from the project root to restore the full database:

```bash
psql -U postgres -d postgres -f database/database.sql
```

This will automatically **create and populate** the `labguard` database from the SQL dump.

After creating the database, copy and run the SQL queries from [`database/data.txt`](https://github.com/ZaidHawari/Lab-Guard3/blob/main/database/data.txt) to populate the database with sample data.

---

### Step 3 — Install dependencies

From the project root, run:

```bash
npm run install-all
```

This installs all dependencies for both the `client` and `server` in a single command.

---

## 🔧 Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=labguard
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# CORS
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

> ⚠️ **Never commit `.env` files.** They are already listed in `.gitignore`.

---

## ▶️ Running the Project

From the project root, run:

```bash
npm run dev
```

This starts both the frontend and backend concurrently in a single terminal.

| Service | URL |
|---|---|
| 🌐 React Frontend | `http://localhost:5173` |
| ⚙️ Express API | `http://localhost:5000` |
| 🔌 Socket.IO | `http://localhost:5000` (WebSocket) |

### Production build

```bash
# Build the frontend
cd client
npm run build

# Start the backend in production mode
cd ..
NODE_ENV=production npm start
```

### Sample data credentials

After running `data.txt`, the following accounts are available:

| Role | Email | Password |
|---|---|---|
| 🛠️ Administrator | `admin@htu.edu.jo` | `Admin@123` |
| 🏫 Instructor | `instructor@htu.edu.jo` | `Instructor@123` |
| 🔧 Lab Assistant | `labassistant@htu.edu.jo` | `LabAss@123` |
| 🎓 Student | `student@htu.edu.jo` | `Student@123` |

> 🔐 All sample accounts have `must_change_password = true`. You will be prompted to set a new password on first login before accessing the system.

---

## 🧪 Testing

LabGuard uses **Jest + Supertest** for automated backend integration testing.

```bash
cd server

# Run all tests sequentially (required — tests share the same database)
npm test -- --runInBand

# Run a specific test suite
npm test -- --runInBand equipment.test.js
npm test -- --runInBand transactions.test.js
```

### Test coverage

| Suite | Endpoint(s) Tested | Result |
|---|---|---|
| `auth.test.js` | `POST /api/auth/login` | ✅ Pass |
| `equipment.test.js` | `POST /api/equipment`, `PATCH /api/equipment/:id` | ✅ Pass |
| `transactions.approve.test.js` | `PATCH /api/transactions/:id/approve` | ✅ Pass |
| `transactions.deny.test.js` | `PATCH /api/transactions/:id/deny` | ✅ Pass |

**30 manual test cases** were also executed across all 4 user roles — **100% passed**.

> ⚠️ **Always use `--runInBand`** when running tests. Parallel execution causes database race conditions because all suites share the same test database.

---

## 📁 Project Structure

```
Lab-Guard3/
│
├── client/                          # React 18 frontend (Vite)
│   ├── src/
│   │   ├── components/              # Reusable UI components (shadcn/ui based)
│   │   │   ├── ui/                  # Base components: Button, Modal, Badge, etc.
│   │   │   └── shared/              # Shared: NotificationBell, ProtectedRoute
│   │   ├── pages/
│   │   │   ├── student/             # Student dashboard, catalogue, history
│   │   │   ├── instructor/          # Instructor approvals, analytics
│   │   │   ├── labassistant/        # Inventory management, qty modal
│   │   │   └── admin/               # Admin dashboard, logs, user management
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── context/                 # Auth context, Socket context
│   │   ├── utils/                   # Export helpers (PDF, Excel), date utils
│   │   └── App.jsx                  # Root router with role-based protected routes
│   ├── public/
│   └── package.json
│
├── server/                          # Node.js + Express backend
│   ├── controllers/
│   │   ├── auth.js                  # Login, JWT sign, mustChangePassword check
│   │   ├── users.js                 # Register, user management, change-password
│   │   ├── equipment.js             # CRUD + safe-delete guard
│   │   ├── transactions.js          # Full borrow lifecycle + atomic approvals
│   │   ├── notifications.js         # Read, mark-read endpoints
│   │   ├── logs.js                  # System activity log queries
│   │   └── dashboard.js             # Analytics aggregate queries
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification → 401 on failure
│   │   └── roleMiddleware.js        # authorizeRoles() → 403 on mismatch
│   ├── routes/                      # Express routers (one per controller)
│   ├── utils/
│   │   ├── logger.js                # Logs action to DB + emits to Socket.IO
│   │   └── notifications.js         # sendNotification() + sendNotificationToUsers()
│   ├── constants/
│   │   └── logActions.js            # 45+ LOG_ACTION_* constants
│   ├── db/
│   │   ├── schema.sql               # Full schema with indexes and constraints
│   │   ├── seed.sql                 # Sample data for all 4 roles
│   │   └── pool.js                  # pg connection pool
│   ├── scheduler/
│   │   └── reminderJob.js           # node-cron hourly due-date check
│   ├── socket/
│   │   └── socketConfig.js          # Socket.IO setup, JWT auth, room management
│   ├── tests/
│   │   ├── equipment.test.js
│   │   ├── transactions.approve.test.js
│   │   ├── transactions.deny.test.js
│   │   └── helpers/                 # Test user/equipment factory functions
│   └── index.js                     # Entry point — Express + Socket.IO server
│
└── README.md
```

---

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/login               Public — returns JWT + mustChangePassword flag
POST   /api/users/change-password    Auth — clears must_change_password flag
```

### Equipment
```
GET    /api/equipment                Auth — all roles, returns available equipment
POST   /api/equipment                Lab Assistant / Instructor / Admin
PATCH  /api/equipment/:id            Lab Assistant / Admin
DELETE /api/equipment/:id            Lab Assistant / Admin (blocked if active borrows)
```

### Transactions
```
GET    /api/transactions             Auth — students see own, others see all
POST   /api/transactions             Student — submit borrow request
PATCH  /api/transactions/:id/approve Instructor / Admin — atomic FOR UPDATE approval
PATCH  /api/transactions/:id/deny    Instructor / Admin — stores denial reason
PATCH  /api/transactions/:id/return  Student / Lab Assistant / Admin
```

### Notifications
```
GET    /api/notifications            Auth — returns user's notifications
PATCH  /api/notifications/:id/read  Auth — marks notification as read
```

### Dashboard & Logs
```
GET    /api/dashboard/stats          Role-filtered analytics data
GET    /api/logs                     Admin only — paginated system activity logs
```

### Users
```
GET    /api/users                    Admin only
POST   /api/users                    Admin only — register new user
```

---

## 📬 Team

<table>
<tr>
<td align="center">
<b>Abdallah Hamdan</b><br/>
<sub>22110259</sub><br/>

</td>
<td align="center">
<b>Yazan Abu Tabaq</b><br/>
<sub>21110037</sub><br/>
</td>
<td align="center">
<b>Zaid Hawari</b><br/>
<sub>22110381</sub><br/>
</td>
</tr>
</table>

**Supervisor:** Dr. Fadia Alaeddin  
**University:** Al Hussein Technical University (HTU)  
**Semester:** Spring 2025 — Capstone Project II

---

## 📜 License

```
MIT License — Copyright (c) 2025 Abdallah Hamdan, Yazan Abu Tabaq, Zaid Hawari

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software.
```

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer" width="100%"/>

**LabGuard** — Built with ❤️ at Al Hussein Technical University · Spring 2025

[![React](https://img.shields.io/badge/-React_18-61DAFB?logo=react&logoColor=black&style=flat-square)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white&style=flat-square)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-336791?logo=postgresql&logoColor=white&style=flat-square)](https://postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/-Socket.IO-010101?logo=socket.io&logoColor=white&style=flat-square)](https://socket.io/)
[![JWT](https://img.shields.io/badge/-JWT-000000?logo=jsonwebtokens&logoColor=white&style=flat-square)](https://jwt.io/)
[![Tailwind](https://img.shields.io/badge/-Tailwind-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com/)

</div>
