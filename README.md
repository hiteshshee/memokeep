# 🗂️ MemoKeep — Never Lose. Never Forget.

A production-style **MERN** app to manage everything you own: products, invoices, warranty
cards, receipts, manuals, and warranty reminders — all in one dashboard.

## Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React (Vite), Tailwind CSS v4, Redux Toolkit, React Router, Axios, Recharts |
| Backend  | Node.js, Express, MongoDB (Mongoose), JWT (access + refresh), bcrypt, Multer, Cloudinary |
| Storage  | Cloudinary (files/images), with local-disk fallback for dev |

## Features (Phase 1 MVP)

- 🔐 Auth: register / login / logout with JWT access tokens + rotating refresh tokens (httpOnly cookie)
- 📊 Dashboard: product count, document count, expiring-warranty count, total asset value, category chart
- 📦 Product CRUD with search, category filter, and sorting
- 📄 Document uploads per product (invoice / warranty / manual / receipt / image)
- ⏰ Automatic warranty-expiry calculation + "expiring soon" surfacing

## Project Structure

```
.
├── backend/        Express API
│   └── src/
│       ├── config/      env, db, cloudinary
│       ├── models/      User, Product, Document
│       ├── middleware/  auth, upload, error
│       ├── controllers/ auth, product, document, dashboard
│       └── routes/
└── frontend/       Vite + React client
    └── src/
        ├── api/        axios client (auto token refresh)
        ├── store/      Redux Toolkit (auth)
        ├── components/ Layout, ProtectedRoute, Spinner
        └── pages/      Login, Register, Dashboard, Products, ProductForm, ProductDetail
```

## Local Development

### 1. Backend

```bash
cd backend
cp .env.example .env        # then fill in MONGO_URI (and optionally Cloudinary)
npm install
npm run dev                 # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to backend)
```

## Environment Variables (backend/.env)

| Var | Required | Notes |
|-----|----------|-------|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ✅ | Long random strings (pre-generated) |
| `CLIENT_URL` | ✅ | Frontend origin for CORS (default `http://localhost:5173`) |
| `CLOUDINARY_*` | optional | If unset, uploads save to `backend/uploads` on local disk |

## Roadmap

- **Phase 1 (done):** Auth, Dashboard, Product CRUD, Uploads
- **Phase 2:** Reminder engine (cron + email), advanced search, analytics
- **Phase 3:** Family sharing, QR codes, notifications, admin panel
- **Phase 4:** OCR, AI search, smart insights
