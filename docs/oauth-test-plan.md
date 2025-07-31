# OAuth Authentication Test Plan

This document outlines how to test the WordPress OAuth authentication flow.

## Prerequisites

1. Create a `.env` file based on `.env.example`
2. Set up OAuth on WordPress side (see wordpress-setup.md)

## Test Scenarios

### 1. Development Mode Testing (No Backend)

**Setup:**
```env
VITE_WORDPRESS_URL=https://playcase.gg
VITE_OAUTH_CLIENT_ID=test-client-id
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

**Expected Behavior:**
1. Click "Login with Playcase" button
2. Redirected to WordPress OAuth page
3. After authorization, redirected back to `/auth/callback`
4. Mock authentication activates (dev mode)
5. User appears as logged in with mock data

### 2. OAuth Configuration Missing

**Setup:**
Remove `VITE_OAUTH_CLIENT_ID` from `.env`

**Expected Behavior:**
1. Click "Login with Playcase" button
2. Alert shows "Authentication is not configured"
3. Error logged to console

### 3. State Parameter Verification

**Test CSRF Protection:**
1. Start login flow
2. Check sessionStorage has `oauth_state`
3. Manually navigate to `/auth/callback?code=test&state=wrong`
4. Should show "Invalid state parameter" error

### 4. OAuth Error Handling

**Test Error Response:**
Navigate to `/auth/callback?error=access_denied&error_description=User+denied+access`

**Expected:**
Shows "Authentication failed: User denied access"

### 5. Token Validation

**Test Token Persistence:**
1. Log in successfully
2. Refresh page
3. User should remain logged in
4. Check network tab for validation attempt

### 6. Logout Flow

**Test:**
1. Log in
2. Click logout button
3. Verify localStorage cleared
4. User shown as logged out

## Manual Testing Checklist

- [ ] OAuth URL generation includes all required parameters
- [ ] State parameter saved to sessionStorage
- [ ] Redirect URI matches configuration
- [ ] Authorization code exchange attempted
- [ ] Mock fallback works in development
- [ ] Error states display correctly
- [ ] Token persists across page refreshes
- [ ] Logout clears all auth data

## Console Commands for Testing

```javascript
// Check OAuth configuration
import { isOAuthConfigured } from './src/utils/oauth';
console.log('OAuth configured:', isOAuthConfigured());

// Generate auth URL
import { generateAuthorizationUrl } from './src/utils/oauth';
console.log('Auth URL:', generateAuthorizationUrl());

// Check stored state
console.log('OAuth state:', sessionStorage.getItem('oauth_state'));

// Check auth status
console.log('Token:', localStorage.getItem('emuskin-auth-token'));
console.log('User:', localStorage.getItem('emuskin-user'));
```