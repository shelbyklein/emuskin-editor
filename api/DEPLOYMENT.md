# API Deployment Guide - Vercel + DigitalOcean MongoDB

This guide walks through deploying the Emulator Skin Generator API to Vercel with DigitalOcean Managed MongoDB.

## Prerequisites

- Vercel account (free tier works)
- DigitalOcean account with Managed MongoDB cluster
- MongoDB connection string from DigitalOcean

## Step 1: Prepare for Deployment

1. **Install Vercel CLI** (if not already installed):
```bash
npm i -g vercel
```

2. **Navigate to API directory**:
```bash
cd api
```

3. **Install dependencies locally**:
```bash
npm install
```

## Step 2: Configure Environment Variables

Create a `.env.production` file (DO NOT commit this):
```env
MONGODB_URI=mongodb+srv://doadmin:Lt9gJi5403MT687y@mongodb+srv://emuskin-maker-1fa7f399.mongo.ondigitalocean.com
ALLOWED_ORIGINS=https://emuskin-editor.vercel.app/,http://localhost:8008
NODE_ENV=production
```

## Step 3: Deploy to Vercel

1. **Login to Vercel**:
```bash
vercel login
```

2. **Deploy the API**:
```bash
vercel

# Answer the prompts:
# ? Set up and deploy "~/emuskin-generator/api"? [Y/n] Y
# ? Which scope do you want to deploy to? Your-Account
# ? Link to existing project? [y/N] n
# ? What's your project's name? emuskin-api
# ? In which directory is your code located? ./
```

3. **Add Environment Variables**:
```bash
# Add MongoDB URI (paste your connection string when prompted)
vercel env add MONGODB_URI production

# Add allowed origins
vercel env add ALLOWED_ORIGINS production
# Enter: https://your-frontend.vercel.app,http://localhost:8008
```

4. **Deploy to Production**:
```bash
vercel --prod
```

## Step 4: Get Your API URL

After deployment, Vercel will show your API URL:
```
🔗 Production: https://emuskin-api.vercel.app
```

## Step 5: Update Frontend Environment

1. Go to your frontend project in Vercel dashboard
2. Settings → Environment Variables
3. Add:
   - Name: `VITE_API_URL`
   - Value: `https://emuskin-api.vercel.app` (your API URL)
   - Environment: Production
4. Redeploy frontend

## Step 6: Configure DigitalOcean MongoDB

1. **Add Trusted Sources**:
   - Go to DigitalOcean → Databases → Your MongoDB Cluster
   - Settings → Trusted Sources
   - Add `0.0.0.0/0` (required for Vercel's dynamic IPs)
   - Note: Connection is still secure with password + SSL

2. **Verify Database**:
   - Connection Details → Databases
   - Ensure `emuskin-generator` database exists
   - If not, create it

## Step 7: Test the Deployment

1. **Check Health Endpoint**:
```bash
curl https://your-api.vercel.app/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-10T...",
  "environment": "production"
}
```

2. **Test with Frontend**:
   - Log into your app
   - Create a project
   - Refresh the page
   - Project should persist

3. **Check Cross-Device Sync**:
   - Log in on another device/browser
   - Should see the same projects

## Monitoring

### Vercel Dashboard
- View function logs
- Monitor API usage
- Check for errors

### DigitalOcean Dashboard
- Monitor database connections
- Check performance metrics
- View slow queries

## Troubleshooting

### "Not allowed by CORS" Error
- Verify `ALLOWED_ORIGINS` includes your frontend URL
- Redeploy after updating environment variables

### "MongoDB connection failed"
- Check MongoDB URI is correct
- Verify trusted sources includes `0.0.0.0/0`
- Ensure database name is correct

### "Authentication failed"
- Verify JWT token is being sent from frontend
- Check token hasn't expired
- Ensure same JWT format as WordPress

## Updating the API

To deploy updates:
```bash
cd api
vercel --prod
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| MONGODB_URI | DigitalOcean MongoDB connection string | mongodb+srv://... |
| ALLOWED_ORIGINS | Comma-separated frontend URLs | https://app.vercel.app |
| NODE_ENV | Environment | production |

## Security Notes

1. Never commit `.env` files
2. Rotate database passwords periodically
3. Monitor for unusual activity
4. Keep dependencies updated

## Cost

- Vercel: Free tier includes 100GB bandwidth
- MongoDB: $15/month for Basic cluster
- Total: ~$15/month for production-ready setup