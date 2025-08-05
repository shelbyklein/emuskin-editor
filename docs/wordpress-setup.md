# WordPress Authentication Setup Guide

This guide explains how to set up WordPress authentication for the Emulator Skin Generator to integrate with playcase.gg users.

## Required WordPress Plugins

### 1. JWT Authentication for WP REST API
**Plugin:** [JWT Authentication for WP-API](https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/)

**Installation:**
```bash
# Via WordPress admin
# Go to Plugins > Add New > Search "JWT Authentication for WP REST API"
# Install and activate

# Or via WP-CLI
wp plugin install jwt-authentication-for-wp-rest-api --activate
```

**Configuration:**
Add to `wp-config.php`:
```php
// JWT Configuration
define('JWT_AUTH_SECRET_KEY', 'your-top-secret-key-here');
define('JWT_AUTH_CORS_ENABLE', true);
```

### 2. Application Passwords (WordPress 5.6+)
**Built-in feature** - Enable application passwords for API access:

1. Go to Users > Profile
2. Scroll to "Application Passwords" section
3. Generate a new application password for the skin generator

### 3. Custom REST API Endpoints (Optional)
Create custom endpoints for enhanced integration:

**Add to theme's `functions.php`:**
```php
// Add CORS headers for skin generator domain
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        $origin = get_http_origin();
        $allowed_origins = [
            'http://localhost:5173',
            'https://your-skin-generator-domain.com',
        ];
        
        if (in_array($origin, $allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
        }
        
        return $value;
    });
});

// Custom user info endpoint
add_action('rest_api_init', function() {
    register_rest_route('emuskin/v1', '/user/info', [
        'methods' => 'GET',
        'callback' => 'emuskin_get_user_info',
        'permission_callback' => function() {
            return is_user_logged_in();
        }
    ]);
});

function emuskin_get_user_info($request) {
    $user = wp_get_current_user();
    
    return [
        'id' => $user->ID,
        'username' => $user->user_login,
        'email' => $user->user_email,
        'displayName' => $user->display_name,
        'avatar' => get_avatar_url($user->ID),
        'roles' => $user->roles,
    ];
}
```

## OAuth 2.0 Setup (Recommended)

### Install miniOrange OAuth Server Plugin
**Plugin:** [miniOrange OAuth Server](https://wordpress.org/plugins/miniorange-oauth-server/)

**Configuration:**
See the detailed [miniOrange Setup Guide](./miniorange-setup.md) for complete instructions.

**Quick Setup:**
1. Install and activate miniOrange OAuth Server plugin
2. Go to miniOrange OAuth > OAuth Server > Clients
3. Add new client with:
   - **Client Name:** Emulator Skin Generator
   - **Redirect URI:** `http://localhost:5173/auth/callback` (dev) or your production URL
   - **Grant Type:** Authorization Code
   - **Scopes:** openid, profile, email

4. Save Client ID and Client Secret

### OAuth Flow URLs (miniOrange)
- **Authorization URL:** `https://playcase.gg/wp-json/mo-oauth-server/authorize`
- **Token URL:** `https://playcase.gg/wp-json/mo-oauth-server/token`
- **User Info URL:** `https://playcase.gg/wp-json/mo-oauth-server/resource`

## Environment Variables

Add these to your skin generator's `.env` file:

```env
# WordPress Integration
VITE_WORDPRESS_URL=https://playcase.gg
VITE_OAUTH_CLIENT_ID=your-client-id-here
VITE_OAUTH_CLIENT_SECRET=your-client-secret-here
VITE_OAUTH_REDIRECT_URI=https://your-domain.com/auth/callback

# Feature Flags
VITE_ENABLE_AUTH=true
VITE_ENABLE_CLOUD_SYNC=true
```

**Note:** When using Vite, environment variables must be prefixed with `VITE_` to be exposed to the client.

## Testing Authentication

### Test JWT Token Generation
```bash
curl -X POST https://playcase.gg/wp-json/jwt-auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpassword"
  }'
```

### Test User Info Retrieval
```bash
curl -X GET https://playcase.gg/wp-json/wp/v2/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Security Considerations

1. **HTTPS Only:** Always use HTTPS in production
2. **Token Expiration:** Configure reasonable JWT expiration times
3. **Rate Limiting:** Implement rate limiting on authentication endpoints
4. **CORS:** Restrict CORS to your specific domain only
5. **Secret Keys:** Use strong, unique secret keys for JWT signing

## Database Schema

The integrated API functions use this MongoDB schema:

```sql
-- Users table (references WordPress users)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,  -- WordPress user ID
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    identifier VARCHAR(255) NOT NULL,
    console_data JSON,
    device_data JSON,
    orientation_data JSON,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_projects (user_id),
    INDEX idx_public_projects (is_public, created_at)
);

-- Project images table
CREATE TABLE project_images (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    control_id VARCHAR(50),
    image_type ENUM('background', 'thumbstick') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_images (project_id)
);
```

## Next Steps

1. **Set up WordPress plugins** on playcase.gg
2. **Configure OAuth client** and note credentials
3. **Configure MongoDB** with the database schema
4. **Update environment variables** in Vercel
5. **Test the complete authentication flow**

## Troubleshooting

### Common Issues

1. **CORS Errors:** Ensure CORS headers are properly configured
2. **Token Validation Fails:** Check JWT secret key configuration
3. **Redirect URI Mismatch:** Verify OAuth redirect URI matches exactly
4. **SSL Issues:** Ensure all endpoints use HTTPS in production

### Debug Endpoints

- JWT Token Validation: `GET /wp-json/jwt-auth/v1/token/validate`
- User Profile: `GET /wp-json/wp/v2/users/me`
- OAuth Introspection: `POST /wp-json/oauth/introspect`