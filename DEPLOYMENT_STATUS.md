# Deployment Status and Issues

## Current Issue
Projects are not syncing between devices because the frontend is still configured to use localhost API.

## Deployment Architecture

### Frontend (Currently Deployed)
- **Platform**: Vercel (automatic deployment from GitHub)
- **Repository**: https://github.com/shelbyklein/emuskin-editor.git
- **Status**: ✅ Deployed
- **Issue**: API URL points to localhost, preventing cloud sync

### Backend API (Ready to Deploy)
- **Platform**: Vercel (serverless functions)
- **Database**: DigitalOcean MongoDB (configuration ready)
- **Status**: ❌ Not deployed
- **Location**: `/api` directory

### Cloudflare R2 Storage
- **Status**: ✅ Deployed and working
- **URL**: https://emuskin-images-worker.emuskins.workers.dev

## To Fix Project Sync

1. **Deploy the Backend API**:
   ```bash
   cd api
   vercel
   # Follow prompts to create new project
   vercel --prod
   ```

2. **Get the API URL** (e.g., `https://emuskin-api.vercel.app`)

3. **Update Frontend Environment**:
   - Go to Vercel dashboard for your frontend project
   - Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-api-url.vercel.app/api`
   - Redeploy frontend

4. **Configure MongoDB** (if not already done):
   - Create DigitalOcean MongoDB cluster
   - Add connection string to API environment variables

## Why Projects Don't Sync Currently

1. Frontend checks if API is available: `!apiUrl.includes('localhost')`
2. Since production still has `localhost`, cloud sync is disabled
3. Projects only save to localStorage, not to cloud
4. Each device has its own local storage

## Removing Vercel Deployment on Git Push

The frontend automatically deploys to Vercel on git push because:
- Your GitHub repository is connected to Vercel
- Vercel watches for changes and auto-deploys

To disable automatic deployment:
1. Go to Vercel dashboard
2. Select your frontend project
3. Settings → Git
4. Toggle off "Auto-deploy" or disconnect the Git integration
5. You can still deploy manually using `vercel --prod`

## Alternative: Keep Auto-Deploy but Use Branches

1. Create a `development` branch for work in progress
2. Only merge to `main` when ready to deploy
3. Vercel will only auto-deploy from `main` branch