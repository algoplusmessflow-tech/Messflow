# Mess Manager Pro - Self-Hosting Guide

## Prerequisites

1. **Supabase Account** - Create at [supabase.com](https://supabase.com)
2. **Cloudinary Account** - Create at [cloudinary.com](https://cloudinary.com)
3. **Hosting Platform** - Vercel, Netlify, or similar
4. **GitHub Account** - For version control

---

## Step 1: Connect to GitHub

1. In Lovable editor, click **GitHub** button (top menu)
2. Click **Connect to GitHub**
3. Authorize Lovable GitHub App
4. Click **Create Repository**
5. Your code will be pushed automatically

---

## Step 2: Set Up Supabase

### 2.1 Create New Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in project details
4. Wait for project to be ready (~2 minutes)

### 2.2 Run Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the entire contents of `setup_schema.sql`
3. Paste and click **Run**
4. Verify all tables are created in **Table Editor**

### 2.3 Configure Authentication

1. Go to **Authentication** > **Providers**
2. Ensure **Email** is enabled
3. (Optional) Disable **Confirm email** for easier testing
4. Go to **Authentication** > **URL Configuration**
5. Add your production URL to **Redirect URLs**

### 2.4 Get Your Credentials

1. Go to **Settings** > **API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Project Reference ID** (from URL) → `VITE_SUPABASE_PROJECT_ID`

---

## Step 3: Set Up Cloudinary

1. Go to [cloudinary.com/console](https://cloudinary.com/console)
2. Get your **Cloud Name** from dashboard
3. Go to **Settings** > **Upload**
4. Create an **Upload Preset** (set to "Unsigned")
5. Copy:
   - **Cloud Name** → `VITE_CLOUDINARY_CLOUD_NAME`
   - **Upload Preset** → `VITE_CLOUDINARY_UPLOAD_PRESET`

---

## Step 4: Deploy to Vercel

### 4.1 Import from GitHub

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** > **Project**
3. Import your GitHub repository
4. Select **Vite** as framework

### 4.2 Set Environment Variables

Add these environment variables in Vercel:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

### 4.3 Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Your app is live!

---

## Step 5: Post-Deployment

### Update Supabase Redirect URLs

1. Go to Supabase **Authentication** > **URL Configuration**
2. Add your Vercel URL to **Redirect URLs**:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/*`

### (Optional) Add Custom Domain

1. In Vercel, go to **Settings** > **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Add custom domain to Supabase redirect URLs

---

## Environment Variables Reference

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `VITE_SUPABASE_URL` | Supabase API URL | Supabase > Settings > API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Supabase > Settings > API |
| `VITE_SUPABASE_PROJECT_ID` | Project reference ID | Supabase URL |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Cloudinary Dashboard |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Upload preset name | Cloudinary > Settings > Upload |

---

## Troubleshooting

### "Invalid API key" Error
- Verify your Supabase anon key is correct
- Check environment variables are set properly

### Auth Redirect Issues
- Ensure your production URL is in Supabase redirect URLs
- Check for trailing slashes in URLs

### Image Upload Fails
- Verify Cloudinary credentials
- Check upload preset is set to "Unsigned"

### Database Errors
- Ensure all tables were created successfully
- Check RLS policies are in place

---

## Local Development

```bash
# Clone your repo
git clone https://github.com/yourusername/mess-manager-pro.git
cd mess-manager-pro

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your credentials to .env

# Start development server
npm run dev
```

---

## Support

For issues:
1. Check browser console for errors
2. Verify Supabase logs in dashboard
3. Ensure all environment variables are set
