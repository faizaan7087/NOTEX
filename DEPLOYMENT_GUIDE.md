# 🚀 NOTEX Production Deployment & Custom Domain Guide
> *"store it like a variable"*

This guide walks you through deploying **NOTEX** (Frontend on Vercel + Backend on Render/Railway) with **Google OAuth 2.0 & Google Drive Integration** and mapping your own **custom domain**.

---

## 📋 Table of Contents
1. [Google Cloud Console Setup (OAuth 2.0 & Google Drive API)](#1-google-cloud-console-setup)
2. [Deploy Backend API (Render / Railway)](#2-deploy-backend-api)
3. [Deploy Frontend (Vercel)](#3-deploy-frontend-vercel)
4. [Custom Domain & DNS Setup](#4-custom-domain--dns-setup)
5. [Environment Variables Summary](#5-environment-variables-summary)

---

## 1. Google Cloud Console Setup

To enable Google Sign-In and Google Drive storage:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named **`NOTEX-Platform`**.
3. **Enable Google Drive API**:
   - Navigate to **APIs & Services** > **Library**.
   - Search for **Google Drive API** and click **Enable**.
4. **Configure OAuth Consent Screen**:
   - Go to **APIs & Services** > **OAuth consent screen**.
   - Select **External** and click **Create**.
   - App Name: `NOTEX`
   - User Support Email: Your email
   - Developer Contact: Your email
   - **Scopes**: Add `.../auth/userinfo.email`, `.../auth/userinfo.profile`, and `https://www.googleapis.com/auth/drive.file`.
5. **Create OAuth Client ID Credentials**:
   - Go to **APIs & Services** > **Credentials** > **Create Credentials** > **OAuth client ID**.
   - Application Type: **Web application**.
   - Name: `NOTEX Web Client`.
   - **Authorized JavaScript Origins**:
     - `http://localhost:5173`
     - `https://yourdomain.com` (your custom domain)
     - `https://your-notex-app.vercel.app`
   - **Authorized Redirect URIs**:
     - `http://localhost:5173`
     - `https://yourdomain.com`
   - Click **Create** and copy your **Client ID** and **Client Secret**.

---

## 2. Deploy Backend API

### Option A: Deploy on Render (Recommended - Free Tier)
1. Push your repository to GitHub.
2. Sign in to [Render.com](https://render.com/).
3. Click **New +** > **Web Service**.
4. Connect your GitHub repository.
5. Set the following fields:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**:
     ```env
     NODE_ENV=production
     PORT=5001
     JWT_SECRET=your_super_secret_random_jwt_key_here
     APP_NAME=NOTEX
     GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your_google_client_secret
     CLIENT_URL=https://yourdomain.com
     ```
6. Click **Deploy Web Service**.
7. Copy your backend live URL: `https://notex-api.onrender.com`.

---

## 3. Deploy Frontend (Vercel)

1. Sign in to [Vercel.com](https://vercel.com/).
2. Click **Add New...** > **Project** and import your GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:
   ```env
   VITE_API_URL=https://notex-api.onrender.com/api
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```
5. Click **Deploy**.

---

## 4. Custom Domain & DNS Setup

Once your frontend is on Vercel:

1. In your Vercel project dashboard, navigate to **Settings** > **Domains**.
2. Enter your custom domain name:
   - Example: `notex.yourdomain.com` (subdomain) OR `yournotexdomain.com` (root domain).
3. Vercel will provide the exact DNS records to configure in your Domain Registrar (Namecheap, GoDaddy, Cloudflare, Google Domains):

| Type | Name / Host | Value / Target |
| :--- | :--- | :--- |
| **CNAME** | `notex` (or `@`) | `cname.vercel-dns.com` |
| **A Record** (if apex domain) | `@` | `76.76.21.21` |

4. Vercel will automatically provision a **free SSL certificate (HTTPS)** in 2-5 minutes.
5. In **Google Cloud Console**, make sure to add `https://notex.yourdomain.com` to **Authorized JavaScript Origins**!

---

## 5. 1-Hour Cloud Relay & Google Drive Workflow

- **Student A (Author)** logs in with Google. NOTEX creates `NOTEX_Vault/` in Student A's Google Drive.
- **Student A** clicks **"Share Repo"** on `BDA`. NOTEX creates a 1-Hour snapshot in the cloud relay (`expiresAt = Date.now() + 3600000`).
- **Student B (Recipient)** opens `https://notex.yourdomain.com/?share=notex_bda_xxxx`.
- **Student B** clicks **"Import Repo"**. Within 1 hour, NOTEX reads the cloud snapshot and automatically creates the full folder tree and notes into Student B's Google Drive `NOTEX_Vault/`.
