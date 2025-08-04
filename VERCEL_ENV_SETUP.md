# Setting Up Environment Variables on Vercel

## For the API (Backend)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your API project**: `emuskin-api`
3. **Go to Settings → Environment Variables**
4. **Add these variables**:

### MONGODB_URI (Required)
- **Value**: Your DigitalOcean MongoDB connection string
- **Example**: `mongodb+srv://doadmin:YOUR_PASSWORD@db-mongodb-nyc1-xxxxx.mongo.ondigitalocean.com/emuskin-generator?authSource=admin&replicaSet=db-mongodb-nyc1-xxxxx&tls=true`
- **Environment**: Production

### ALLOWED_ORIGINS (Required)
- **Value**: `https://emuskin.vercel.app,http://localhost:5173,http://localhost:8008`
- **Environment**: Production
- **Note**: No spaces between URLs, just commas

### NODE_ENV
- **Value**: `production`
- **Environment**: Production

5. **Click "Save" for each variable**
6. **Redeploy the API**:
   ```bash
   cd api
   vercel --prod
   ```

## For the Frontend

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your frontend project**: `emuskin` or `emuskin-editor`
3. **Go to Settings → Environment Variables**
4. **Verify/Add these variables**:

### VITE_API_URL
- **Value**: `https://emuskin-api.vercel.app/api`
- **Environment**: Production

### VITE_WORDPRESS_URL
- **Value**: `https://playcase.gg`
- **Environment**: Production

### VITE_R2_WORKER_URL
- **Value**: `https://emuskin-images-worker.emuskins.workers.dev`
- **Environment**: Production

### VITE_R2_PUBLIC_URL
- **Value**: `https://pub-6baf90b9295c4dee9bcdc160b0d5e1ca.r2.dev`
- **Environment**: Production

### VITE_USE_R2_STORAGE
- **Value**: `true`
- **Environment**: Production

### VITE_ENABLE_AUTH
- **Value**: `true`
- **Environment**: Production

### VITE_ENABLE_CLOUD_SYNC
- **Value**: `true`
- **Environment**: Production

5. **Redeploy the Frontend**:
   - Go to Deployments tab
   - Click the three dots on the latest deployment
   - Select "Redeploy"
   - Or use CLI: `vercel --prod`

## Testing After Setup

1. **Check API Connection**:
   ```bash
   curl https://emuskin-api.vercel.app/health
   ```
   Should return: `{"status":"ok","timestamp":"...","environment":"production"}`

2. **Check Frontend**:
   - Open https://emuskin.vercel.app
   - Open browser DevTools (F12)
   - Try to login
   - Check Network tab for API calls to `emuskin-api.vercel.app`

3. **Verify Project Sync**:
   - Create a project on one device
   - Login on another device/browser
   - Projects should appear on both devices

## Troubleshooting

### "CORS error" in browser console
- Double-check ALLOWED_ORIGINS includes your frontend URL
- Make sure there are no trailing slashes in URLs
- Redeploy API after changing environment variables

### "MongoDB connection failed" in Vercel logs
- Verify MongoDB URI is correct
- Check DigitalOcean trusted sources includes 0.0.0.0/0
- Ensure database name in URI is correct

### Projects not syncing
- Check browser console for errors
- Verify JWT token is being sent (Network tab → Request headers)
- Check Vercel function logs for API errors