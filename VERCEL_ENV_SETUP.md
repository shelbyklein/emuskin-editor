# Setting Up Environment Variables on Vercel

## For the Full-Stack Application

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `emuskin` or `emuskin-editor`
3. **Go to Settings → Environment Variables**
4. **Add these variables**:

### MONGODB_URI (Required for API Functions)
- **Value**: Your DigitalOcean MongoDB connection string
- **Example**: `mongodb+srv://doadmin:YOUR_PASSWORD@db-mongodb-nyc1-xxxxx.mongo.ondigitalocean.com/emuskin-generator?authSource=admin&replicaSet=db-mongodb-nyc1-xxxxx&tls=true`
- **Environment**: Production

### ALLOWED_ORIGINS (Required for API Functions)
- **Value**: `https://emuskin.vercel.app,http://localhost:5173,http://localhost:8008`
- **Environment**: Production
- **Note**: No spaces between URLs, just commas

### VITE_WORDPRESS_URL (Frontend)
- **Value**: `https://playcase.gg`
- **Environment**: Production

### VITE_R2_WORKER_URL (Frontend)
- **Value**: `https://emuskin-images-worker.emuskins.workers.dev`
- **Environment**: Production

### VITE_R2_PUBLIC_URL (Frontend)
- **Value**: `https://pub-6baf90b9295c4dee9bcdc160b0d5e1ca.r2.dev`
- **Environment**: Production

### VITE_USE_R2_STORAGE (Frontend)
- **Value**: `true`
- **Environment**: Production

### VITE_ENABLE_AUTH (Frontend)
- **Value**: `true`
- **Environment**: Production

### VITE_ENABLE_CLOUD_SYNC (Frontend)
- **Value**: `true`
- **Environment**: Production

5. **Click "Save" for each variable**
6. **Redeploy the Application**:
   - Go to Deployments tab
   - Click the three dots on the latest deployment
   - Select "Redeploy"
   - Or use CLI: `vercel --prod`

## Testing After Setup

1. **Check API Functions**:
   ```bash
   curl https://emuskin.vercel.app/api/health
   ```
   Should return: `{"status":"ok","timestamp":"...","environment":"production"}`

2. **Check Frontend**:
   - Open https://emuskin.vercel.app
   - Open browser DevTools (F12)
   - Try to login
   - Check Network tab for API calls to `/api/*` endpoints

3. **Verify Project Sync**:
   - Create a project on one device
   - Login on another device/browser
   - Projects should appear on both devices

## Troubleshooting

### "CORS error" in browser console
- Double-check ALLOWED_ORIGINS includes your frontend URL
- Make sure there are no trailing slashes in URLs
- Redeploy application after changing environment variables

### "MongoDB connection failed" in Vercel logs
- Verify MongoDB URI is correct
- Check DigitalOcean trusted sources includes 0.0.0.0/0
- Ensure database name in URI is correct

### Projects not syncing
- Check browser console for errors
- Verify JWT token is being sent (Network tab → Request headers)
- Check Vercel function logs in dashboard for API errors
- Ensure `VITE_ENABLE_CLOUD_SYNC=true` is set