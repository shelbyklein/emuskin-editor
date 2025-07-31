# JWT Authentication Setup Guide

This guide explains how to set up JWT authentication for the Emulator Skin Generator using the free JWT Authentication for WP REST API plugin.

## Prerequisites

- WordPress 5.0 or higher
- HTTPS strongly recommended (required for production)
- Administrator access to WordPress

## Installation

### 1. Install JWT Authentication Plugin

**Via WordPress Admin:**
1. Go to **Plugins > Add New**
2. Search for "JWT Authentication for WP REST API"
3. Install the plugin by **Useful Team**
4. Activate the plugin

**Via WP-CLI:**
```bash
wp plugin install jwt-authentication-for-wp-rest-api --activate
```

## Configuration

### 2. Configure WordPress

Add the following to your `wp-config.php` file (before the "That's all, stop editing!" line):

```php
// JWT Authentication Configuration
define('JWT_AUTH_SECRET_KEY', 'your-strong-secret-key-here');
define('JWT_AUTH_CORS_ENABLE', true);
```

**Important:** Generate a strong secret key. You can use:
- [WordPress Secret Key Generator](https://api.wordpress.org/secret-key/1.1/salt/)
- Or run: `openssl rand -base64 32`

### 3. Configure .htaccess (Apache)

Add these lines to your `.htaccess` file:

```apache
RewriteEngine On
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]

# Enable CORS for JWT endpoints
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
</IfModule>
```

### 4. Configure Nginx (if applicable)

Add to your server block:

```nginx
# Pass Authorization header
fastcgi_pass_header Authorization;

# CORS headers
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS, PUT, DELETE';
add_header Access-Control-Allow-Headers 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
```

## Environment Variables

Update your Emulator Skin Generator's `.env` file:

```env
# WordPress URL (no trailing slash)
VITE_WORDPRESS_URL=https://playcase.gg

# Backend API (if using separate backend)
VITE_API_URL=http://localhost:3001/api

# Feature Flags
VITE_ENABLE_AUTH=true
VITE_ENABLE_CLOUD_SYNC=true
```

## Testing the Setup

### 1. Test JWT Token Generation

```bash
curl -X POST https://playcase.gg/wp-json/jwt-auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-password"
  }'
```

Expected response:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user_email": "user@example.com",
  "user_nicename": "username",
  "user_display_name": "User Name"
}
```

### 2. Test Token Validation

```bash
curl -X POST https://playcase.gg/wp-json/jwt-auth/v1/token/validate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected response:
```json
{
  "code": "jwt_auth_valid_token",
  "data": {
    "status": 200
  }
}
```

### 3. Test User Info Retrieval

```bash
curl -X GET https://playcase.gg/wp-json/wp/v2/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Usage in the App

1. **Login Flow:**
   - User enters username/password in the login modal
   - App sends credentials to `/wp-json/jwt-auth/v1/token`
   - Receives JWT token and stores it in localStorage
   - Uses token for all authenticated requests

2. **Authenticated Requests:**
   - Include `Authorization: Bearer TOKEN` header
   - Token is automatically included by the API utilities

3. **Token Expiration:**
   - Default expiration is 7 days
   - App validates token on startup
   - Prompts re-login when token expires

## Troubleshooting

### Common Issues

1. **"JWT is not configured properly"**
   - Verify `JWT_AUTH_SECRET_KEY` is set in wp-config.php
   - Ensure it's defined before "That's all, stop editing!"

2. **"Authorization header missing"**
   - Check .htaccess or nginx configuration
   - Verify hosting doesn't strip Authorization headers

3. **CORS errors**
   - Enable `JWT_AUTH_CORS_ENABLE` in wp-config.php
   - Add your app domain to allowed origins
   - Check browser console for specific CORS headers

4. **"Invalid credentials"**
   - Verify username/password are correct
   - Check if user account is active
   - Ensure user has required capabilities

### Debug Mode

Enable WordPress debug mode in `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Check logs at: `/wp-content/debug.log`

## Security Best Practices

1. **Use HTTPS** - Required for production
2. **Strong Secret Key** - At least 32 characters
3. **Limit Login Attempts** - Use a security plugin
4. **Regular Updates** - Keep WordPress and plugins updated
5. **Monitor Access** - Review user activity logs

## Advantages of JWT over OAuth

- **Simpler Setup** - No complex OAuth configuration
- **Free** - No premium plugins required
- **Direct Login** - Users stay in your app
- **Lightweight** - Minimal server resources
- **Stateless** - Tokens contain all needed info

## Next Steps

1. Install and configure the JWT plugin on WordPress
2. Update your `.env` file
3. Test the authentication flow
4. Monitor for any issues in production