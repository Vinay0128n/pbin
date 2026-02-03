# Vercel Backend Deployment Guide

## Prerequisites
- Vercel account
- GitHub repository with your code
- PostgreSQL database connection string

## Step 1: Push to GitHub
1. Make sure all your changes are committed to Git
2. Push to your GitHub repository

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project root:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? → Yes
   - Which scope? → Your account
   - Link to existing project? → No (first time)
   - Project name? → pastebin-lite-api (or your choice)
   - In which directory is your code located? → ./
   - Want to override the settings? → No

### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect the settings from `vercel.json`

## Step 3: Add Environment Variables
After deployment, you need to add your database URL:

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add the following variable:
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://neondb_owner:npg_xh9cyP0oWuYV@ep-little-feather-a1rj84r6-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

4. Redeploy:
   ```bash
   vercel --prod
   ```

## Step 4: Test Your API
Once deployed, test these endpoints:
- Health check: `https://your-app.vercel.app/api/healthz`
- Create paste: `https://your-app.vercel.app/api/pastes`
- View paste: `https://your-app.vercel.app/p/:id`

## Step 5: Update Netlify Frontend
1. Go to your Netlify dashboard
2. Site settings → Build & deploy → Environment
3. Add environment variable:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend-url.vercel.app`
4. Trigger a new deploy

## Troubleshooting

### Common Issues:
1. **Database connection errors**: Make sure `DATABASE_URL` is correctly set
2. **CORS errors**: The backend should handle this with the cors middleware
3. **Build errors**: Check that all dependencies are in `api/package.json`

### Logs:
- Check Vercel Function Logs in your dashboard
- Use `vercel logs` for real-time logs

## Next Steps
Once both frontend and backend are deployed:
1. Test the complete flow
2. Update your README with deployment URLs
3. Submit your assignment!
