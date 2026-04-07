# DigiCoin Tracker (Full Stack)

DigiCoin Tracker is a complete mini-project based on your synopsis, now implemented as a full-stack web app with:

- Secure authentication (signup/login/JWT)
- Password reset flow (email token)
- Real-time crypto market dashboard (Binance)
- Personalized price alerts (above/below targets)
- Scheduled alert monitoring (cron)
- Email notifications (Nodemailer)
- Alert history logging
- Responsive interactive UI (React + Tailwind)

## Project Structure

- `frontend/` React + Vite + Tailwind UI
- `backend/` Node.js + Express + MongoDB API and alert engine

## 1) Backend Setup

1. Open terminal in `backend/`
2. Install dependencies:

```bash
npm install
```

3. Create `.env` from `.env.example` and fill values:

- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- SMTP settings (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) for live email delivery

### Gmail Alert Setup

To send real alert emails to the Gmail address used in the app, configure the backend sender account in `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SERVICE=gmail
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_google_app_password
SMTP_SECURE=false
EMAIL_FROM=DigiCoin Tracker <yourgmail@gmail.com>
EMAIL_REPLY_TO=yourgmail@gmail.com
```

Notes:

- `SMTP_USER` is the Gmail account that will send the alert emails.
- `SMTP_PASS` must be a Google App Password, not your normal Gmail password.
- The app already sends alerts to the signed-in user's `email`, so if you log in with Gmail the alert will be delivered there automatically.
- When a real email is sent successfully, the triggered alert is automatically deleted and only its history record is kept.

4. Start backend:

```bash
npm run dev
```

Backend runs at `http://localhost:5000`.

## 2) Frontend Setup

1. Open terminal in `frontend/`
2. Install dependencies (if needed):

```bash
npm install
```

3. Create `.env` from `.env.example`.
4. Start frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`.

## 3) Vercel Deployment

This repository includes a root `vercel.json` configured to deploy the `frontend/` Vite app on Vercel.

Recommended steps:

1. Import the GitHub repository into Vercel.
2. Keep the repository root as the project root.
3. Vercel will use:
   - Install command: `cd frontend && npm install`
   - Build command: `cd frontend && npm run build`
   - Output directory: `frontend/dist`
4. Set `VITE_API_BASE_URL` in Vercel to your deployed backend API URL.

Important:

- The backend is not deployed by this Vercel config.
- Do not commit live `.env` files. Use `.env.example` files as templates.

## Key API Endpoints

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`

### Market Data
- `GET /api/market/coins`
- `GET /api/market/coins/:coinId`
- `GET /api/market/top-movers`

### Alerts
- `GET /api/alerts`
- `POST /api/alerts`
- `PATCH /api/alerts/:id`
- `DELETE /api/alerts/:id`
- `GET /api/alerts/history/list`

### Profile
- `GET /api/profile/summary`

## Synopsis Alignment

Implemented directly from the synopsis objectives and methodology:

- React + Tailwind responsive frontend
- Node/Express REST backend
- MongoDB collections (`User`, `Alert`, `AlertHistory`)
- JWT auth + bcrypt password hashing
- Binance real-time integration
- Scheduled jobs for periodic price checks
- Nodemailer Gmail-compatible alert emails

## Notes

- If SMTP credentials are not configured, email sending is simulated in backend logs.
- In non-production mode, forgot-password response also returns a `devResetToken` for testing.
- Backend now starts in limited mode if MongoDB is offline:
  - Market endpoints continue to work.
  - DB-dependent endpoints (auth/alerts/profile) return `503` until MongoDB is available.
