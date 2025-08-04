# Fix for Vercel Function Limit Error

## The Problem
Vercel was counting every JavaScript file as a potential serverless function, and the Hobby plan only allows 12 functions per deployment.

## The Solution
I've updated the `vercel.json` configuration to use the `builds` format instead of `functions`, which gives us more control over what gets deployed as a function.

## Deploy Instructions

### Option 1: Deploy from Command Line
```bash
cd api
vercel --prod --yes
```

### Option 2: Deploy via Git Push
```bash
git add .
git commit -m "Fix Vercel function limit configuration"
git push origin main
```

## What Changed
The new `vercel.json`:
- Uses `builds` array to explicitly define only ONE serverless function
- Includes only the necessary files (src/**, package.json)
- Routes all requests to that single function
- This ensures Vercel only creates 1 function instead of 27

## If You Still Get the Error
You might need to:
1. Delete the existing Vercel project and create a new one
2. Or upgrade to Vercel Pro (which allows unlimited functions)

## Alternative: Deploy to Different Platform
If Vercel continues to be problematic, the API is also configured for:
- Railway (railway.json included)
- Render (render.yaml included)
- Any Node.js hosting platform

Both Railway and Render offer free tiers that would work for this API.