# Emulator Skin Generator API

Backend API for the Emulator Skin Generator application, providing cross-device project synchronization.

## Features

- JWT authentication (validates tokens from WordPress)
- MongoDB database for project storage
- RESTful API endpoints for CRUD operations
- CORS support for frontend integration
- Rate limiting for API protection

## Prerequisites

- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)
- Frontend with JWT tokens from WordPress Simple JWT Login

## Installation

1. Install dependencies:
```bash
cd api
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
- `MONGODB_URI`: Your MongoDB connection string
- `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend URLs
- `PORT`: API port (default: 3001)

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## Production

Start the production server:
```bash
npm start
```

## API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Projects

- `GET /api/projects` - Get all user's projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Health Check

- `GET /health` - API health status (no auth required)

## Deployment

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Create `vercel.json` in api directory
3. Deploy: `vercel`
4. Set environment variables in Vercel dashboard

### Railway

1. Connect GitHub repository
2. Set root directory to `/api`
3. Add environment variables
4. Deploy automatically on push

### Render

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `ALLOWED_ORIGINS` - Comma-separated allowed CORS origins

## Security

- JWT tokens validated from WordPress
- Users can only access their own projects
- Rate limiting prevents abuse
- CORS configured for specific origins
- Helmet.js for security headers

## Database Schema

Projects are stored with:
- Unique ID matching frontend format
- User email for ownership
- Full orientation and control data
- Timestamps for sync tracking

## Frontend Integration

Set `VITE_API_URL` in your frontend to the deployed API URL:
```
VITE_API_URL=https://your-api.vercel.app
```

The frontend will automatically sync projects when this is configured.