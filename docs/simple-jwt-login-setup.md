# Simple JWT Login Setup Guide

The WordPress site at playcase.gg has the Simple JWT Login plugin installed. Here's how to configure it.

## Current Status

The plugin is installed but authentication is not enabled. You'll need to configure it in the WordPress admin.

## Configuration Steps

### 1. Access Plugin Settings

1. Log into WordPress admin at `https://playcase.gg/wp-admin`
2. Go to **Settings → Simple JWT Login**

### 2. Enable Authentication

In the **Authentication** tab:
1. Check **Enable Authentication**
2. Set Authentication key parameter name to `username` and `password`
3. Save changes

### 3. Configure JWT Settings

In the **JWT Settings** tab:
1. Set a strong JWT Secret Key (at least 32 characters)
2. Set token expiration time (e.g., 7 days)
3. Choose algorithm (HS256 is fine)

### 4. Configure CORS

In the **CORS** tab:
1. Enable CORS
2. Add allowed domains:
   - `http://localhost:3000`
   - `http://localhost:8008`
   - Your production domain

### 5. User Settings

In the **User** tab:
1. Enable "Allow authentication for all users"
2. Or restrict by user role if needed

## Testing

Once configured, test with:

```bash
curl -X POST https://playcase.gg/wp-json/simple-jwt-login/v1/auth \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-password"
  }'
```

## Endpoints

Simple JWT Login uses these endpoints:
- **Login**: `/wp-json/simple-jwt-login/v1/auth`
- **Validate**: `/wp-json/simple-jwt-login/v1/auth/validate`
- **Refresh**: `/wp-json/simple-jwt-login/v1/auth/refresh`

## Differences from JWT Authentication Plugin

Our code has been updated to use Simple JWT Login endpoints instead of the JWT Authentication for WP REST API plugin endpoints.