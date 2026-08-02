# MedConnect Karavali - Coastal Karnataka AI Healthcare Highway

A production-grade AI-powered healthcare portal for coastal Karnataka (Mangaluru, Udupi, Manipal) featuring AI Symptom Triage, Live Queue Forecasting, ABDM Health Locker Integration, and Multi-Role Access.

---

## 📁 Repository Structure

```
MEDconnect/
├── frontend/                 # Client React 19 + Vite + Tailwind CSS App
│   ├── src/
│   │   ├── components/       # UI Components & Header/Footer
│   │   ├── context/          # AppContext (Auth state & Session Hydration)
│   │   ├── pages/            # AuthPages, Patient, Hospital, Admin Dashboards
│   │   ├── services/         # API HTTP Client
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Express TypeScript + PostgreSQL Database Server
│   ├── src/
│   │   ├── db/               # PostgreSQL Connection Pool & DDL Schema
│   │   ├── middleware/       # JWT Auth Middleware
│   │   ├── routes/           # Auth, Doctors, Hospitals, Appointments, Health
│   │   └── index.ts          # Express Main Server Entry Point
│   ├── .env
│   ├── .env.example
│   └── package.json
│
└── package.json              # Monorepo Workspace Orchestrator
```

---

## 🚀 Quick Start Guide

### 1. Launch Frontend App
```bash
npm run dev:frontend
```
*Opens Vite Dev Server on [http://localhost:5173](http://localhost:5173)*

### 2. Launch Backend PostgreSQL API Server
```bash
npm run dev:backend
```
*Starts Express Server on [http://localhost:5000](http://localhost:5000)*

---

## 🗄️ PostgreSQL Database Setup

1. Create a database `medconnect_db` in PostgreSQL.
2. Run `backend/src/db/schema.sql` to initialize tables and sample data.
3. Configure `backend/.env`:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medconnect_db
   JWT_SECRET=medconnect_karavali_super_secret_jwt_key_2026
   ```

---

## 🛠️ Build Commands

- **Build Frontend**: `npm run build:frontend`
- **Build Backend**: `npm run build:backend`
