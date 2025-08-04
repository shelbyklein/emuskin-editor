# API Routes

This folder contains Vercel Functions that serve as the backend API.

## Endpoints

- `GET /api/health` - Health check
- `GET /api/projects` - Get all projects for authenticated user
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get specific project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

## Environment Variables

Set these in Vercel dashboard:

- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Set to `production`

## Local Development

The API routes work automatically with `npm run dev`. No separate server needed!