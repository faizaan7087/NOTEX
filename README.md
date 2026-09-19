# NOTEX — Student Notes Management System

> **A full-stack academic notes management platform built with React, Node.js, Express.js, MongoDB / Persistent Store, and XML Export.** Designed with a modern **black-and-white glassy user interface** inspired by shadcn/ui, Aceternity UI, Magic UI, and Uiverse.

[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-black?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_%2B_Express-black?style=flat-square&logo=node.js)](https://nodejs.org)
[![Database](https://img.shields.io/badge/Database-MongoDB_%2F_Persistent_Store-black?style=flat-square&logo=mongodb)](https://mongodb.com)
[![XML](https://img.shields.io/badge/XML-W3C_Compliant_Export-black?style=flat-square&logo=xml)](https://w3.org)
[![Postman](https://img.shields.io/badge/Testing-Postman_v2.1_Collection-orange?style=flat-square&logo=postman)](https://postman.com)
[![UI Theme](https://img.shields.io/badge/UI_Theme-Monochrome_Glassmorphism-white?style=flat-square)](https://tailwindcss.com)

---

## 📌 Project Overview

**NOTEX** is an online notes-management platform designed for college students to create, organize, search, edit, and export their lecture notes, formulas, algorithms, and assignment summaries. The platform is accessible across devices (laptops, mobile phones, college computers) and fulfills all **11 college web-development practical syllabus requirements**.

### 🎓 College Syllabus Module Checklist

| # | Practical Module | Status | Where Implemented in NOTEX |
|---|---|---|---|
| **1** | Develop web application using CSS, XML, JavaScript | ✅ **Done** | `client/src/styles/index.css`, `server/utils/xmlBuilder.js`, `client/src/pages/XMLDemoPage.jsx` |
| **2** | Set up Node.js environment & create server | ✅ **Done** | `server/package.json`, `server/server.js` |
| **3** | Implement REST APIs using Express.js | ✅ **Done** | `server/routes/authRoutes.js`, `server/routes/noteRoutes.js`, `server/routes/xmlRoutes.js` |
| **4** | Perform CRUD operations | ✅ **Done** | Full Create, Read, Update, Delete in `server/controllers/noteController.js` |
| **5** | Test REST APIs using Postman | ✅ **Done** | `postman/NOTEX_API_Collection.json` ready for 1-click import |
| **6** | Create React components | ✅ **Done** | Reusable components in `client/src/components/` |
| **7** | Implement form handling in React | ✅ **Done** | `NoteForm.jsx`, `LoginForm.jsx`, `RegisterForm.jsx` with full validation |
| **8** | Fetch API data in React | ✅ **Done** | Centralized API client in `client/src/services/api.js` |
| **9** | Integrate frontend with backend | ✅ **Done** | Full-stack proxy integration with JWT Bearer authentication |
| **10** | Build a complete CRUD application | ✅ **Done** | Complete end-to-end user workflow with database persistence |
| **11** | Demonstration samples for Angular / Django | ✅ **Done** | `demo_samples/django_demo/` & `demo_samples/angular_demo/` |

---

## 🏗️ System Architecture

```
                                  [ STUDENT USER ]
                       (Laptop / Phone / College Workstation)
                                        │
                                        ▼
             ┌────────────────────────────────────────────────────────┐
             │            React Frontend (Vite + Tailwind)            │
             │   - Glassmorphic UI (shadcn / Aceternity / Magic UI)   │
             │   - Bento Grid Stats & Live Subject Filters            │
             │   - Spotlight Search (Cmd + K) & XML Hub               │
             └──────────────────────────┬─────────────────────────────┘
                                        │ (Fetch API / JSON / XML)
                                        ▼
             ┌────────────────────────────────────────────────────────┐
             │             Node.js + Express REST API                 │
             │   - JWT Bearer Authentication & Password Hashing       │
             │   - Notes CRUD & Query Aggregations                    │
             │   - W3C XML Builder (`application/xml`)                │
             └──────────────────────────┬─────────────────────────────┘
                                        │
                                        ▼
             ┌────────────────────────────────────────────────────────┐
             │                   Database Layer                       │
             │   - MongoDB (Cloud Atlas / Mongoose)                   │
             │   - Persistent JSON Store (Zero-Dependency Fallback)    │
             └────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

1. **User Authentication & Isolation**
   - Secure registration and login with `bcryptjs` password hashing (salt rounds: 10).
   - Stateless JWT tokens passed in `Authorization: Bearer <token>` headers.
   - Strict data isolation: Users can only query, edit, and delete their own notes.

2. **Full CRUD Notes Management**
   - **Create**: Add notes with title, subject, content, tags, and starred toggle.
   - **Read**: View all notes with excerpt previews, timestamps, and formatted reader modal.
   - **Update**: Edit title, subject, content, and tags with real-time UI synchronization.
   - **Delete**: Safely delete notes with confirmation dialog.

3. **Real-time Search & Dynamic Subject Organization**
   - Instant search across note title, subject, content keywords, and tag pills.
   - Dynamic subject filter pills (DBMS, OS, Computer Networks, DSA, ML, etc.) with live count badges.
   - Spotlight Command search dialog accessible via `⌘K` / `Ctrl+K`.

4. **Meaningful XML Export & Data Interchange**
   - Backend endpoint `GET /api/notes/export/xml` serializing database notes into standard W3C XML.
   - Interactive XML Hub with syntax highlighting, one-click `.xml` file download, and copy to clipboard.
   - Single-note XML export (`GET /api/notes/:id/xml`).

5. **Black & White Glassy Aesthetic**
   - Ultra-clean dark theme with frosted glass reflections (`backdrop-blur-2xl`).
   - Specular highlights, glowing white badges, and minimal typography (`Outfit` and `Plus Jakarta Sans`).
   - Bento-Grid dashboard metrics showing Total Notes, Subjects, Tags, and Starred notes.

---

## 📂 Project Structure

```
NOTEX/
├── client/                               # React Frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                       # Glass UI primitives (Button, Badge, Card, Input, Modal, BentoGrid)
│   │   │   ├── layout/                   # Navbar, Sidebar, Footer
│   │   │   ├── notes/                    # NoteCard, NoteList, NoteForm, NoteViewer, SearchBar, SubjectFilter, XMLModal, SearchModal, DeleteModal
│   │   │   └── auth/                     # LoginForm, RegisterForm
│   │   ├── context/                      # AuthContext, ToastContext
│   │   ├── pages/                        # DashboardPage, NotesPage, NoteFormPage, XMLDemoPage, AuthPage
│   │   ├── services/                     # api.js (Fetch API wrapper), xmlService.js
│   │   ├── styles/                       # index.css (Tailwind & glass tokens)
│   │   ├── utils/                        # cn.js (Tailwind merge)
│   │   ├── App.jsx                       # Main application shell
│   │   └── main.jsx                      # React DOM entry
│   ├── tailwind.config.js                # Custom monochrome dark theme config
│   ├── vite.config.js                    # Vite setup with proxy to backend
│   └── package.json
│
├── server/                               # Node.js + Express Backend
│   ├── config/
│   │   └── db.js                         # Database connector with MongoDB Atlas & persistent fallback
│   ├── controllers/
│   │   ├── authController.js             # Register, Login, Me profile
│   │   ├── noteController.js             # Notes CRUD, Stats, Subjects
│   │   └── xmlController.js              # XML Builder & download stream
│   ├── middleware/
│   │   ├── authMiddleware.js             # JWT Bearer token authentication guard
│   │   └── errorMiddleware.js            # 404 and global error handlers
│   ├── models/
│   │   ├── User.js                       # User schema with bcrypt password hashing
│   │   └── Note.js                       # Note schema (userId, title, subject, content, tags, dates)
│   ├── routes/
│   │   ├── authRoutes.js                 # /api/auth/*
│   │   ├── noteRoutes.js                 # /api/notes/*
│   │   └── xmlRoutes.js                  # /api/xml/*
│   ├── utils/
│   │   ├── xmlBuilder.js                 # W3C XML serialization
│   │   └── tokenGenerator.js             # JWT signing utility
│   ├── server.js                         # Express entry point
│   ├── seed.js                           # Demo database seed script
│   └── package.json
│
├── postman/
│   └── NOTEX_API_Collection.json         # Postman collection for API demonstration
│
├── demo_samples/                         # Syllabus Module 11 Demonstration Files
│   ├── django_demo/views.py              # Sample Django REST & XML view
│   ├── angular_demo/notes.component.ts   # Sample Angular notes component
│   └── SYLLABUS_MAPPING.md               # 11-module syllabus verification checklist
│
├── README.md                             # Documentation
└── .gitignore
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- Node.js (v18 or newer)
- npm (v9 or newer)

### 1. Clone the repository
```bash
git clone https://github.com/faizaankhan/notex.git
cd NOTEX
```

### 2. Start the Backend Server
```bash
cd server
npm install
node seed.js    # Seeds demo student account and initial notes
npm start       # Runs backend on http://localhost:5001
```

### 3. Start the Frontend Client
In a new terminal window:
```bash
cd client
npm install
npm run dev     # Runs React client on http://localhost:5173
```

Open your browser at `http://localhost:5173`.

---

## 🔑 Demo Login Credentials

For quick evaluation and faculty viva testing, click **"Fill Demo Credentials (Auto-Fill)"** on the login screen or use:

- **Email**: `student@notex.edu`
- **Password**: `password123`

---

## 📡 REST API Documentation

All protected endpoints require the header: `Authorization: Bearer <jwt_token>`

| Method | Endpoint | Access | Description | Request Body Example | Expected Response Code |
|:---|:---|:---|:---|:---|:---|
| `GET` | `/api/health` | Public | Check server & DB status | None | `200 OK` |
| `POST` | `/api/auth/register` | Public | Register a new student | `{"name":"Faizaan", "email":"...", "password":"..."}` | `201 Created` |
| `POST` | `/api/auth/login` | Public | Authenticate student | `{"email":"student@notex.edu", "password":"..."}` | `200 OK` |
| `GET` | `/api/auth/me` | Protected | Get authenticated profile | None | `200 OK` |
| `GET` | `/api/notes` | Protected | Get all user notes (supports `?search=`, `?subject=`, `?sort=`) | None | `200 OK` |
| `GET` | `/api/notes/:id` | Protected | Get single note by ID | None | `200 OK` |
| `POST` | `/api/notes` | Protected | Create a new academic note | `{"title":"...", "subject":"...", "content":"...", "tags":[]}` | `201 Created` |
| `PUT` | `/api/notes/:id` | Protected | Update existing note | `{"title":"...", "content":"..."}` | `200 OK` |
| `DELETE`| `/api/notes/:id` | Protected | Delete note permanently | None | `200 OK` |
| `GET` | `/api/notes/stats/summary`| Protected | Get dashboard summary metrics | None | `200 OK` |
| `GET` | `/api/subjects` | Protected | Get distinct user subjects list | None | `200 OK` |
| `GET` | `/api/notes/export/xml`| Protected | Export all notes as W3C XML | None (`?download=true` for file) | `200 OK` |
| `GET` | `/api/notes/:id/xml` | Protected | Export single note as XML | None | `200 OK` |

---

## 📄 XML Specification

Exported notes adhere to the following XML structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<notes user="Faizaan Khan" exportedAt="2026-09-19T04:36:29.139Z" total="2">
    <note>
        <id>note_1789792589133_r5prs8f</id>
        <title>Database Normalization (1NF to BCNF)</title>
        <subject>DBMS</subject>
        <content>Normalization decomposes relations to eliminate anomalies...</content>
        <tags>
            <tag>DBMS</tag>
            <tag>Exam</tag>
            <tag>Unit-2</tag>
        </tags>
        <createdAt>2026-09-19T04:36:29.133Z</createdAt>
        <updatedAt>2026-09-19T04:36:29.137Z</updatedAt>
    </note>
</notes>
```

---

## 📮 Postman Testing Guide

1. Open **Postman**.
2. Click **Import** (top left).
3. Select the file [`postman/NOTEX_API_Collection.json`](file:///Users/mohammedfaizaankhan/Documents/NOTEX/postman/NOTEX_API_Collection.json).
4. Run the **"Login Student"** request. The test script automatically saves the `{{token}}` collection variable!
5. Execute any of the CRUD and XML requests with 1-click authorization.

---

## 🌐 Online Deployment Guide

NOTEX is built to be deployed seamlessly across cloud providers:

### Frontend Deployment (Vercel / Netlify)
1. Push repository to GitHub.
2. Link repository in **Vercel**.
3. Set **Root Directory** to `client`.
4. Add Environment Variable: `VITE_API_URL=https://your-backend-service.onrender.com/api`.
5. Deploy.

### Backend Deployment (Render / Railway)
1. Link repository in **Render** as a Web Service.
2. Set **Root Directory** to `server`.
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add Environment Variables:
   - `PORT=5001`
   - `NODE_ENV=production`
   - `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/notex_db`
   - `JWT_SECRET=your_production_secret_key`
   - `CLIENT_URL=https://your-frontend-app.vercel.app`

---

## 👨‍🎓 Project Credits & Academic Context

- **Project**: NOTEX – Student Notes Management System
- **Technologies**: React 18, Vite, Tailwind CSS, Node.js, Express.js, MongoDB / Mongoose, XML, Postman
- **Aesthetic**: Black and White Glassmorphic UI (shadcn/ui & Aceternity UI style)
