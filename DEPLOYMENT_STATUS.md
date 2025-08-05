# Deployment Status

## Current Architecture

### Full-Stack Application (Deployed)
- **Platform**: Vercel (automatic deployment from GitHub)
- **Repository**: https://github.com/shelbyklein/emuskin-editor.git
- **Status**: ✅ Deployed
- **API**: Integrated Vercel Functions in `/api` directory
- **Database**: DigitalOcean MongoDB

### Cloudflare R2 Storage
- **Status**: ✅ Deployed and working
- **URL**: https://emuskin-images-worker.emuskins.workers.dev

## Project Sync Configuration

1. **Configure Environment Variables**:
   - Go to Vercel dashboard for your project
   - Settings → Environment Variables
   - Ensure these are set:
     - `MONGODB_URI`: Your MongoDB connection string
     - `ALLOWED_ORIGINS`: Your frontend URL for CORS
     - `VITE_ENABLE_CLOUD_SYNC`: `true`
   - Redeploy if variables were changed

2. **MongoDB Configuration**:
   - Ensure DigitalOcean MongoDB cluster is accessible
   - Verify connection string includes proper authentication
   - Check trusted sources includes Vercel IPs (0.0.0.0/0)

## How Project Sync Works

1. Frontend uses integrated `/api/*` endpoints (Vercel Functions)
2. Cloud sync is enabled when `VITE_ENABLE_CLOUD_SYNC=true`
3. Projects save to both localStorage and MongoDB
4. Sync occurs automatically on login and project changes

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