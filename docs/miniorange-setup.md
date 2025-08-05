# miniOrange OAuth Server Setup Guide

This guide explains how to set up miniOrange OAuth Server plugin on WordPress for authenticating users in the Emulator Skin Generator.

## Prerequisites

- WordPress 5.0 or higher
- SSL certificate (HTTPS) - Required for OAuth security
- Administrator access to WordPress

## Installation

### 1. Install miniOrange OAuth Server Plugin

**Via WordPress Admin:**
1. Go to **Plugins > Add New**
2. Search for "miniOrange OAuth Server"
3. Install and activate the plugin

**Via WP-CLI:**
```bash
wp plugin install miniorange-oauth-server --activate
```

## Configuration

### 2. Initial Setup

After activation:
1. Go to **miniOrange OAuth > OAuth Server**
2. Complete the registration form (creates a miniOrange account)
3. Verify your email address

### 3. Configure OAuth Client

1. Navigate to **miniOrange OAuth > OAuth Server > Clients**
2. Click **Add Client**
3. Configure with these settings:

   **Basic Settings:**
   - **Client Name:** Emulator Skin Generator
   - **Redirect/Callback URL:** 
     - Development: `http://localhost:5173/auth/callback`
     - Production: `https://your-domain.com/auth/callback`
   
   **Grant Settings:**
   - **Grant Type:** Authorization Code
   - **Client Credentials:** Generate and save these!
   
   **Scope Settings:**
   - Enable: `openid`, `profile`, `email`

4. Click **Save Client**
5. **Important:** Copy and save:
   - Client ID
   - Client Secret

### 4. Configure CORS

miniOrange includes CORS configuration:

1. Go to **miniOrange OAuth > OAuth Server > Settings**
2. Under **CORS Settings**, add your domains:
   ```
   http://localhost:5173
   https://your-production-domain.com
   ```
3. Enable **Allow Credentials**
4. Save settings

### 5. User Access Control (Optional)

To restrict which users can authenticate:

1. Go to **miniOrange OAuth > OAuth Server > User Restriction**
2. Choose restriction method:
   - By Role (e.g., Subscriber, Author, Editor)
   - By Capability
   - By User

## Environment Configuration

Add these to your Emulator Skin Generator's `.env` file:

```env
# WordPress OAuth Configuration
VITE_WORDPRESS_URL=https://playcase.gg
VITE_OAUTH_CLIENT_ID=your-client-id-from-miniorange
VITE_OAUTH_CLIENT_SECRET=your-client-secret-from-miniorange
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback

# Feature Flags
VITE_ENABLE_AUTH=true
VITE_ENABLE_CLOUD_SYNC=true
```

## Testing the Setup

### 1. Test Authorization Endpoint

Visit this URL in your browser (replace values):
```
https://playcase.gg/wp-json/mo-oauth-server/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:5173/auth/callback&scope=openid profile email
```

Expected: You should see the miniOrange login/consent page.

### 2. Test Token Exchange (Backend Required)

```bash
curl -X POST https://playcase.gg/wp-json/mo-oauth-server/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTHORIZATION_CODE" \
  -d "redirect_uri=http://localhost:5173/auth/callback" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

### 3. Test User Info Endpoint

```bash
curl -X GET https://playcase.gg/wp-json/mo-oauth-server/resource \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Troubleshooting

### Common Issues

1. **"Invalid client" error**
   - Verify Client ID is correct
   - Check redirect URI matches exactly (including trailing slashes)
   - Ensure client is active in miniOrange settings

2. **CORS errors**
   - Add your domain to CORS settings
   - Ensure "Allow Credentials" is enabled
   - Check browser console for specific CORS headers missing

3. **"Invalid redirect URI" error**
   - Redirect URI must match EXACTLY what's configured
   - Include protocol (http:// or https://)
   - Check for trailing slashes

4. **User data not returning**
   - Ensure user has required WordPress capabilities
   - Check scope includes 'profile' and 'email'
   - Verify user restrictions aren't blocking access

### Debug Mode

Enable debug logging:
1. Go to **miniOrange OAuth > OAuth Server > Settings**
2. Enable **Debug Mode**
3. Check logs at **miniOrange OAuth > OAuth Server > Logs**

## Security Best Practices

1. **Always use HTTPS** in production
2. **Rotate Client Secret** periodically
3. **Limit redirect URIs** to only necessary domains
4. **Enable rate limiting** if available
5. **Monitor OAuth logs** for suspicious activity

## API Integration Notes

The integrated API functions need to:
1. Exchange authorization codes with miniOrange
2. Validate tokens with miniOrange
3. Store user data from token response
4. Map WordPress user IDs to your application users

Example token response from miniOrange:
```json
{
  "access_token": "eyJ0eXAiOiJKV1...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJ0eXAiOiJKV1...",
  "user": {
    "ID": "123",
    "user_login": "johndoe",
    "user_email": "john@example.com",
    "display_name": "John Doe",
    "roles": ["subscriber"]
  }
}
```

## Next Steps

1. Complete miniOrange plugin setup on WordPress
2. Configure OAuth client with your app's details
3. Update environment variables in Vercel
4. Test authentication flow
5. Verify API functions handle token exchange properly