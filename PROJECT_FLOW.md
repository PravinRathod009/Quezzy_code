# Quizzy — Project Flow & Usage Guide

## Overview
Quizzy is a LeetCode-inspired quiz platform built with the MERN stack (MongoDB, Express, React, Node.js).
It supports two roles: **Admin** and **User**, with JWT authentication, analytics, rankings, PDF reports, and CSV question upload.

---

## Folder Structure

```
quizzy/
├── server/                     ← Node.js / Express backend
│   ├── config/
│   │   └── db.js               ← MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   ← register, login, getMe
│   │   ├── quizController.js   ← CRUD quizzes & questions (incl. CSV bulk)
│   │   ├── attemptController.js← submit, history, rankings
│   │   └── adminController.js  ← dashboard stats, users, PDF reports
│   ├── middleware/
│   │   ├── verifyToken.js      ← JWT auth middleware
│   │   └── isAdmin.js          ← role guard middleware
│   ├── models/
│   │   ├── User.js             ← User schema (name, email, password, role)
│   │   ├── Quiz.js             ← Quiz schema (title, subject, level, timer)
│   │   ├── Question.js         ← MCQ schema (text, options A-D, correctAnswer)
│   │   └── Attempt.js          ← Attempt schema (answers, score, timeTaken)
│   ├── routes/
│   │   ├── auth.js             ← POST /api/auth/register|login  GET /api/auth/me
│   │   ├── quiz.js             ← GET|POST|PUT|DELETE /api/quizzes
│   │   ├── attempt.js          ← POST /api/attempts/submit  GET /api/attempts/my
│   │   └── admin.js            ← GET /api/admin/dashboard|users|reports
│   ├── .env.example
│   ├── server.js               ← Entry point
│   └── package.json
│
└── client/                     ← React + Vite frontend
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx         ← Collapsible nav sidebar
    │   │   └── ProtectedRoute.jsx  ← Auth guard + ThemeToggle
    │   ├── context/
    │   │   └── AuthContext.jsx     ← Global auth state, login/logout
    │   ├── hooks/                  ← (add custom hooks here)
    │   ├── pages/
    │   │   ├── Auth.jsx            ← Login + Register pages
    │   │   ├── user/
    │   │   │   ├── Dashboard.jsx   ← User stats, radar/line charts
    │   │   │   ├── QuizList.jsx    ← Browse & filter quizzes
    │   │   │   ├── QuizAttempt.jsx ← Timed MCQ attempt page
    │   │   │   ├── ResultHistory.jsx ← Result breakdown + history table
    │   │   │   └── Rankings.jsx    ← Global leaderboard
    │   │   └── admin/
    │   │       ├── AdminDashboard.jsx ← Platform stats + bar charts
    │   │       ├── AdminQuizzes.jsx   ← Create/Edit/Delete quizzes + CSV upload
    │   │       ├── AdminUsers.jsx     ← View/Enable/Disable users
    │   │       ├── AdminScores.jsx    ← All scores + rankings table
    │   │       └── AdminReports.jsx   ← Generate & download 5 PDF reports
    │   ├── utils/
    │   │   └── axiosInstance.js    ← Axios with JWT interceptor
    │   ├── App.jsx                 ← All routes
    │   ├── main.jsx
    │   └── index.css               ← Global design system (dark/light)
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Getting Started

### 1. Clone & install

```bash
# Backend
cd server
cp .env.example .env        # fill in your values
npm install
npm run dev                 # runs on http://localhost:5000

# Frontend
cd ../client
npm install
npm run dev                 # runs on http://localhost:5173
```

### 2. Environment variables (server/.env)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | Any long random string |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `ADMIN_CODE` | Secret code to register as admin (e.g. `quizzy_admin_2024`) |
| `PORT` | Default `5000` |

---

## User Flow

### Registration & Login
1. Visit `/register` → enter name, email, password
2. To register as **Admin**, tick "I have an admin code" and enter the `ADMIN_CODE` from `.env`
3. On login, users are redirected to their role's dashboard automatically

### User Journey
1. **Dashboard** — see stats (attempts, avg score, rank, high scores), radar chart by subject, score trend line chart
2. **Quizzes** — browse all quizzes filtered by subject/level; attempted quizzes are marked ✓
3. **Attempt** — countdown timer, MCQ cards, question navigator dots, auto-submit on time expiry
4. **Result** — score %, correct/wrong/skipped breakdown, pie chart, per-question review with correct answers
5. **History** — full table of all past attempts; click any row to revisit the result
6. **Rankings** — global leaderboard; your rank is highlighted

---

## Admin Flow

### Dashboard
- Total users, active users (last 30d), total quizzes, total attempts
- Bar charts: attempts by subject, avg score by subject
- Recent attempts table

### Manage Quizzes
1. Click **+ Create Quiz** → fill title, subject, level, timer, number of questions
2. Click **Questions** on any quiz row to open the Questions Panel
3. In the Questions Panel you can:
   - **Add manually** — one question at a time with 4 options and correct answer selector
   - **Upload CSV** — bulk upload via CSV file (replaces all existing questions for that quiz)
4. Edit or delete individual questions; edit or delete the entire quiz

### CSV Upload Format
The CSV file must have these columns (header row required):

```
question,option_a,option_b,option_c,option_d,correct_answer
What is 2+2?,3,4,5,6,B
Capital of France?,Berlin,Madrid,Paris,Rome,C
```

- `correct_answer` must be exactly `A`, `B`, `C`, or `D` (case insensitive)
- Download the template from the CSV upload modal
- Uploading a CSV **replaces** all existing questions for that quiz

### Users
- View all registered users with last login, quiz count, avg score
- Enable or disable user accounts

### Scores
- Filter all attempts by quiz
- View bar chart of attempts per quiz
- View global rankings with medals for top 3

### Reports (PDF)
Five downloadable reports:
1. **Registered Users** — all users list
2. **Active Users (30d)** — users active in last 30 days
3. **All Quiz Results** — attempt log (last 200)
4. **Leaderboard** — top 50 users by avg score
5. **Platform Summary** — totals overview

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register user/admin |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | JWT | Get current user |

### Quizzes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/quizzes` | Optional | List quizzes (with attempt status if logged in) |
| GET | `/api/quizzes/:id` | — | Get quiz by ID |
| GET | `/api/quizzes/:id/questions` | JWT | Get questions (no correct answers) |
| POST | `/api/quizzes` | Admin | Create quiz |
| PUT | `/api/quizzes/:id` | Admin | Update quiz |
| DELETE | `/api/quizzes/:id` | Admin | Delete quiz + questions + attempts |
| POST | `/api/quizzes/:id/questions` | Admin | Add single question |
| POST | `/api/quizzes/:id/questions/bulk` | Admin | Bulk add (CSV parsed on frontend) |

### Attempts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/attempts/submit` | JWT | Submit quiz attempt |
| GET | `/api/attempts/my` | JWT | My attempts |
| GET | `/api/attempts/:id` | JWT | Single attempt (with answers) |
| GET | `/api/attempts/rankings` | JWT | Global rankings |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Admin | Stats + recent activity |
| GET | `/api/admin/users` | Admin | All users with stats |
| PUT | `/api/admin/users/:id/toggle` | Admin | Enable/disable user |
| GET | `/api/admin/attempts` | Admin | All attempts |
| GET | `/api/admin/reports/:type` | Admin | PDF download (users/active-users/quiz-results/leaderboard/summary) |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, React Router v6, Recharts, PapaParse, Vite |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| PDF | pdfkit |
| CSV | PapaParse (client-side parsing) |
| Styling | Custom CSS design system with dark/light mode |

---

## Deployment

### Backend (Render / Railway)
1. Push `server/` to a Git repo
2. Set env vars in the platform dashboard
3. Build command: `npm install`, Start command: `npm start`

### Frontend (Vercel / Netlify)
1. Push `client/` to a Git repo
2. Build command: `npm run build`, Output dir: `dist`
3. Set env: update `vite.config.js` proxy or use `VITE_API_URL` for production API URL

### Database
Use MongoDB Atlas (free tier). Set `MONGO_URI` to the Atlas connection string.
