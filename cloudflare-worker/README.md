# Emuskin Images Cloudflare Worker

This Cloudflare Worker handles image uploads for the Emuskin Generator application using Cloudflare R2 storage.

## Setup

1. **Install Dependencies**:
   ```bash
   cd cloudflare-worker
   npm install
   ```

2. **Login to Cloudflare**:
   ```bash
   npx wrangler login
   ```

3. **Create R2 Bucket**:
   ```bash
   npx wrangler r2 bucket create emuskin-images
   ```

4. **Configure the Worker**:
   - Edit `wrangler.toml` and update:
     - Your account ID
     - R2 bucket name
     - Allowed origins
     - KV namespace IDs (optional)

5. **Deploy the Worker**:
   ```bash
   npm run deploy
   # or
   npx wrangler deploy
   ```

6. **Configure Public Access** (for serving images):
   - Go to Cloudflare Dashboard > R2
   - Select your bucket
   - Go to Settings > Public Access
   - Enable public access
   - Note the public URL (e.g., `https://pub-xxx.r2.dev`)

## Environment Variables

Update these in your main application's `.env` file:

```env
VITE_USE_R2_STORAGE=true
VITE_R2_WORKER_URL=https://your-worker.workers.dev
VITE_R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

## API Endpoints

- `POST /upload-url` - Get a presigned URL for uploading
- `PUT /upload/:uploadId` - Upload a file
- `DELETE /delete` - Delete an image
- `GET /list?projectId=xxx` - List images for a project

## Development

To run locally:
```bash
wrangler dev
```

This will start the worker on `http://localhost:8787`.

## Security

- The worker validates file types (PNG, JPEG only)
- File size limits are enforced (default 10MB)
- Upload URLs expire after 5 minutes
- CORS is configured for allowed origins only