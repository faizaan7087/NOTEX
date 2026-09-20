# NOTEX — Student Notes Management System

> **A full-stack academic notes management platform built with React, Node.js, Express.js, MongoDB / Persistent Store, and W3C XML Export.** Designed with a modern **black-and-white glassmorphic user interface** inspired by shadcn/ui and Aceternity UI.

[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-black?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_%2B_Express-black?style=flat-square&logo=node.js)](https://nodejs.org)
[![Database](https://img.shields.io/badge/Database-MongoDB_%2F_Persistent_Store-black?style=flat-square&logo=mongodb)](https://mongodb.com)
[![XML](https://img.shields.io/badge/XML-W3C_Compliant_Export-black?style=flat-square&logo=xml)](https://w3.org)
[![Postman](https://img.shields.io/badge/Testing-Postman_v2.1_Collection-orange?style=flat-square&logo=postman)](https://postman.com)
[![UI Theme](https://img.shields.io/badge/UI_Theme-Monochrome_Glassmorphism-white?style=flat-square)](https://tailwindcss.com)

---

## Project Overview

**NOTEX** is an online notes-management platform designed for students and developers to create, organize, search, edit, and export lecture notes, formulas, algorithms, and study summaries. The platform features an ultra-clean monochrome design, folder hierarchy, inline attachments at cursor position, live Markdown preview, and instant sharing.

### College Syllabus & Academic Feature Checklist

| # | Practical Module | Status | Where Implemented in NOTEX |
|---|---|---|---|
| **1** | Develop web application using CSS, XML, JavaScript | **Done** | `client/src/styles/index.css`, `server/utils/xmlBuilder.js`, `client/src/pages/XMLDemoPage.jsx` |
| **2** | Set up Node.js environment & create server | **Done** | `server/package.json`, `server/server.js` |
| **3** | Implement REST APIs using Express.js | **Done** | `server/routes/authRoutes.js`, `server/routes/noteRoutes.js`, `server/routes/xmlRoutes.js` |
| **4** | Perform CRUD operations | **Done** | Full Create, Read, Update, Delete in `server/controllers/noteController.js` |
| **5** | Test REST APIs using Postman | **Done** | `postman/NOTEX_API_Collection.json` ready for 1-click import |
| **6** | Create React components | **Done** | Reusable components in `client/src/components/` |
| **7** | Implement form handling in React | **Done** | `NoteForm.jsx`, `LoginForm.jsx`, `RegisterForm.jsx` with full validation |
| **8** | Fetch API data in React | **Done** | Centralized API client in `client/src/services/api.js` |
| **9** | Integrate frontend with backend | **Done** | Full-stack proxy integration with JWT Bearer authentication |
| **10** | Build a complete CRUD application | **Done** | Complete end-to-end user workflow with database persistence |
| **11** | Demonstration samples for Angular / Django | **Done** | `demo_samples/django_demo/` & `demo_samples/angular_demo/` |

---

## System Architecture

```
                                  [ STUDENT USER ]
                       (Laptop / Phone / College Workstation)
                                        │
                                        ▼
             ┌────────────────────────────────────────────────────────┐
             │            React Frontend (Vite + Tailwind)            │
             │   - Aceternity Floating Navbar & Glass Sidebar         │
             │   - Spotlight Hero & Bento Grid Analytics              │
             │   - Inline Cursor Attachments & Live Markdown Preview  │
             │   - Instant ⌘K Command Search & W3C XML Exporter       │
             └──────────────────────────┬─────────────────────────────┘
                                        │ (Fetch API / JSON / XML)
                                        ▼
             ┌────────────────────────────────────────────────────────┐
             │             Node.js + Express REST API                 │
             │   - JWT Bearer Authentication & Password Hashing       │
             │   - Notes & Hierarchical Folder CRUD                   │
             │   - W3C XML Builder (`application/xml`)                │
             └──────────────────────────┬─────────────────────────────┘
                                        │
                                        ▼
             ┌────────────────────────────────────────────────────────┐
             │                   Database Layer                       │
             │   - MongoDB (Cloud Atlas / Mongoose)                   │
             │   - Persistent JSON Store (Zero-Dependency Fallback)   │
             └────────────────────────────────────────────────────────┘
```

---

## Key Features

1. **Floating Navigation & Glassmorphic UI Suite**
   - **Floating Navbar**: Smart scroll physics, smooth tabs (`Dashboard`, `Notes`), and quick search.
   - **Collapsible Glass Sidebar**: Sleek card layout with quick shortcuts, folder navigation, and user status.
   - **Spotlight Hero**: Dual lighting beams showcasing study statistics and quick actions.

2. **Full CRUD Notes & Folder Organization**
   - **Create**: Add notes with title, subject, folder nesting, tags, and favorite toggle.
   - **Read**: View notes with excerpt previews, timestamps, and formatted reader modal.
   - **Update**: Edit notes with real-time UI synchronization.
   - **Delete**: Safely delete notes with confirmation dialog.

3. **Inline Cursor-Based Attachments & Clean Token References**
   - **Attach Dropdown**: Quick access to **Upload File** (images, PDFs, documents) or **Add Link Block** (ChatGPT threads, web docs, video lectures).
   - **Caret Position Insertion**: Attachments and link blocks are inserted directly at your cursor position.
   - **No Base64 Bloat**: Media is referenced using clean `attachment:id` tokens (`![Image](attachment:att_123)`) while the binary payload is stored in attachment metadata.
   - **Write & Preview Tabs**: Live split engine to preview interactive link cards, inline images, code blocks, and tables.

4. **Study Sharing & AI Link Management**
   - **Interactive Link Cards**: Open ChatGPT threads or external docs in 1-click.
   - **Share to WhatsApp**: 1-click bundling of notes and links into formatted WhatsApp study messages.
   - **Folder Repository Sharing**: Generate secure share links or export complete folder archives.

5. **W3C Compliant XML Export**
   - Backend endpoint `GET /api/notes/export/xml` serializing notes into standard XML.
   - Interactive XML Hub with syntax highlighting, single-note XML export, and `.xml` download.

---

## Project Structure

```
NOTEX/
├── client/                               # React Frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                       # Glass UI primitives (Button, Badge, Modal, Spotlight, BentoGrid)
│   │   │   ├── layout/                   # Floating Navbar, Floating Sidebar, Footer
│   │   │   ├── notes/                    # NoteCard, NoteList, NoteForm, NoteViewer, MarkdownRenderer, SearchBar
│   │   │   ├── folders/                  # FolderExplorer, FolderTree, ShareFolderModal
│   │   │   └── auth/                     # LoginForm, RegisterForm
│   │   ├── context/                      # AuthContext, ToastContext
│   │   ├── pages/                        # DashboardPage, NotesPage, NoteFormPage, XMLDemoPage, SettingsPage
│   │   ├── services/                     # api.js (Fetch API wrapper), xmlService.js
│   │   ├── styles/                       # index.css (Tailwind & glass tokens)
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
│   │   ├── folderController.js           # Folder hierarchy management
│   │   ├── shareController.js            # Shared folder repositories
│   │   └── xmlController.js              # XML Builder & download stream
│   ├── middleware/
│   │   ├── authMiddleware.js             # JWT Bearer token authentication guard
│   │   └── errorMiddleware.js            # 404 and global error handlers
│   ├── models/
│   │   ├── User.js                       # User schema with bcrypt password hashing
│   │   ├── Note.js                       # Note schema (title, subject, content, attachments, tags)
│   │   └── Folder.js                     # Hierarchical folder schema
│   ├── routes/                           # API Routes (/api/auth, /api/notes, /api/folders, /api/share, /api/xml)
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
├── demo_samples/                         # Syllabus Demonstration Files
│   ├── django_demo/views.py              # Sample Django REST & XML view
│   ├── angular_demo/notes.component.ts   # Sample Angular notes component
│   └── SYLLABUS_MAPPING.md               # Syllabus verification checklist
│
├── README.md                             # Documentation
└── .gitignore
```

---

## Quick Start & Installation

### Prerequisites
- **Node.js**: v18 or newer
- **npm**: v9 or newer

### 1. Clone the repository
```bash
git clone https://github.com/username/notex.git
cd NOTEX
```

### 2. Start the Backend Server
```bash
cd server
npm install
node seed.js    # Seeds demo student account and initial study notes
npm start       # Runs backend on http://localhost:5001
```

### 3. Start the Frontend Client
In a second terminal window:
```bash
cd client
npm install
npm run dev     # Runs React client on http://localhost:5173
```

Open your browser at **`http://localhost:5173`**.

---

## Demo Login Credentials

For quick evaluation, click **"Fill Demo Credentials"** on the login screen or use:

- **Email**: `student@notex.edu`
- **Password**: `password123`

---

## REST API Documentation

All protected endpoints require the header: `Authorization: Bearer <jwt_token>`

| Method | Endpoint | Access | Description | Request Body Example | Expected Status |
|:---|:---|:---|:---|:---|:---|
| `GET` | `/api/health` | Public | Check server & DB status | None | `200 OK` |
| `POST` | `/api/auth/register` | Public | Register a new user | `{"name":"Demo Student", "email":"...", "password":"..."}` | `201 Created` |
| `POST` | `/api/auth/login` | Public | Authenticate user | `{"email":"student@notex.edu", "password":"..."}` | `200 OK` |
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

## XML Specification

Exported notes adhere to standard W3C XML serialization:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<notes user="Demo Student" exportedAt="2026-09-20T12:00:00.000Z" total="2">
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
        <createdAt>2026-09-20T12:00:00.000Z</createdAt>
        <updatedAt>2026-09-20T12:00:00.000Z</updatedAt>
    </note>
</notes>
```

---

## Postman API Testing

1. Open **Postman**.
2. Click **Import** (top left).
3. Select `postman/NOTEX_API_Collection.json`.
4. Run the **"Login Student"** request. The test script automatically saves the `{{token}}` variable.
5. Execute any of the CRUD and XML requests with 1-click authorization.

---

## Online Deployment Guide

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

## License

This project is licensed under the MIT License.
