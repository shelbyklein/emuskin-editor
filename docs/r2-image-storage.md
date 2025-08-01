# R2 Image Storage Implementation

## Overview

The Emuskin Generator now supports Cloudflare R2 for image storage, providing a scalable and reliable solution for storing skin images. This replaces the previous approach of using browser blob URLs and IndexedDB.

## How It Works

1. **Image Upload Flow**:
   - User selects an image file
   - Frontend requests a presigned upload URL from the Cloudflare Worker
   - File is uploaded directly to R2 using the presigned URL
   - Public URL is returned and stored in the project data
   - Image is immediately accessible via Cloudflare's global CDN

2. **Storage Structure**:
   ```
   projects/
   └── {projectId}/
       ├── background/
       │   ├── portrait/
       │   │   └── {timestamp}-{filename}
       │   └── landscape/
       │       └── {timestamp}-{filename}
       └── thumbstick/
           └── {controlId}/
               └── {timestamp}-{filename}
   ```

3. **Feature Flag**:
   - R2 storage is controlled by `VITE_USE_R2_STORAGE` environment variable
   - When disabled, the app falls back to IndexedDB storage

## Benefits

- **No Blob URLs**: Images have permanent URLs that don't expire
- **Global CDN**: Fast image delivery worldwide
- **Scalable**: No browser storage limitations
- **Direct Uploads**: Images go straight from browser to R2
- **Cost Effective**: Pay only for what you use

## Configuration

1. **Deploy the Cloudflare Worker**:
   ```bash
   cd cloudflare-worker
   npm install
   wrangler deploy
   ```

2. **Set Environment Variables**:
   ```env
   VITE_USE_R2_STORAGE=true
   VITE_R2_WORKER_URL=https://your-worker.workers.dev
   VITE_R2_PUBLIC_URL=https://pub-your-account.r2.dev
   ```

3. **Configure R2 Bucket**:
   - Enable public access for image serving
   - Set appropriate CORS rules
   - Configure lifecycle rules if needed

## Migration

Existing projects using IndexedDB will continue to work. The system automatically:
- Uses R2 URLs if available
- Falls back to IndexedDB for legacy images
- Supports mixed storage (some images in R2, some in IndexedDB)

## Security

- File type validation (PNG, JPEG only)
- File size limits (10MB default)
- Presigned URLs expire after 5 minutes
- CORS restricted to allowed origins
- No direct bucket access

## Troubleshooting

1. **Images not uploading**: Check if R2 is enabled and worker URL is correct
2. **CORS errors**: Verify allowed origins in worker configuration
3. **Images not displaying**: Ensure R2 bucket has public access enabled
4. **Upload failures**: Check browser console for detailed error messages