# ☁️ Cloudflare D1 Setup Guide for NOTEX
> **5 GB Free Serverless SQL Database on Cloudflare Edge**

This guide walks you through setting up a **Cloudflare D1** database to permanently store your NOTEX user accounts, folder hierarchies, note metadata, and share links with **5 GB of free cloud storage**.

---

## 📋 Table of Contents
1. [Create a Cloudflare Account & D1 Database](#1-create-a-cloudflare-d1-database)
2. [Get Your Account ID & Database ID](#2-get-your-account-id--database-id)
3. [Create a Cloudflare API Token](#3-create-a-cloudflare-api-token)
4. [Configure NOTEX Environment Variables](#4-configure-notex-environment-variables)
5. [Verify Connection](#5-verify-connection)

---

## 1. Create a Cloudflare D1 Database

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) and sign up or log in.
2. In the left sidebar navigation, click **Storage & Databases** > **D1 SQL Database** (or **Workers & Pages** > **D1**).
3. Click the **"Create database"** button.
4. Name your database: `notex-db` (or any name you prefer).
5. Click **Create**.

---

## 2. Get Your Account ID & Database ID

1. In your Cloudflare dashboard under your newly created D1 database:
   - You will see **Database ID** (UUID format, e.g. `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
2. Copy the **Database ID**.
3. In the left sidebar or the URL / right side overview, copy your **Account ID** (a 32-character hex string).

---

## 3. Create a Cloudflare API Token

1. In the top right corner of the Cloudflare dashboard, click your **User Profile Icon** > **My Profile**.
2. Click **API Tokens** in the left menu.
3. Click **Create Token**.
4. Scroll down to **Custom Token** and click **Get started**.
5. Configure the token permissions:
   - **Token name**: `NOTEX D1 Database Access`
   - **Permissions**:
     - Select: **Account** | **D1** | **Edit**
   - **Account Resources**:
     - Select: **Include** | **All accounts** (or choose your specific account)
6. Click **Continue to summary** > **Create Token**.
7. Copy the generated **API Token** (Save it somewhere safe, Cloudflare only shows it once!).

---

## 4. Configure NOTEX Environment Variables

### A. For Local Development (`server/.env`):
Add the three keys to your `server/.env` file:

```env
# Cloudflare D1 Database (5 GB Free Serverless SQL)
CLOUDFLARE_ACCOUNT_ID=your_32_character_account_id
CLOUDFLARE_D1_DATABASE_ID=your_d1_database_uuid
CLOUDFLARE_API_TOKEN=your_generated_api_token
```

### B. For Production on Render.com:
1. Open your **Render Dashboard** and select your `notex-api` service.
2. Navigate to **Environment** > **Add Environment Variable**.
3. Add:
   - `CLOUDFLARE_ACCOUNT_ID`: *your_account_id*
   - `CLOUDFLARE_D1_DATABASE_ID`: *your_database_id*
   - `CLOUDFLARE_API_TOKEN`: *your_api_token*
4. Click **Save Changes**. Render will automatically redeploy and connect!

---

## 5. Verify Connection

1. Start your backend server:
   ```bash
   cd server
   npm start
   ```
2. When the server boots, you will see in the console:
   ```
   [NOTEX DB] Cloudflare D1 credentials detected. Connecting to Cloudflare D1...
   [NOTEX DB] Verifying and initializing database tables...
   [NOTEX DB] ✅ Database tables & indexes verified successfully.
   [NOTEX DB] 🚀 Connected to Cloudflare D1 (5 GB Free Serverless Database)
   ```
3. Visit `http://localhost:5001/api/health` in your browser. You should see:
   ```json
   {
     "status": "healthy",
     "application": "NOTEX - Student Notes Management System",
     "database": {
       "type": "cloudflare_d1",
       "provider": "Cloudflare D1 (Serverless SQLite)",
       "storageLimit": "5 GB Free Tier",
       "connected": true,
       "d1Connected": true
     }
   }
   ```

---

## 💡 How NOTEX Uses Storage
- **Cloudflare D1 (5 GB Free)**: Permanently stores student user accounts, subject/unit folders, note markdown/rich text, tags, and Google Drive link metadata.
- **Google Drive (15 GB Free / user)**: Permanently stores all heavy attachments (PDFs, images, slides, docs) directly inside each student's personal `NOTEX_Vault` folder.
- **Result**: Zero maintenance, zero monthly costs, and no data wipes after container restarts!
