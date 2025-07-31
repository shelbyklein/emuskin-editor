# Simple JWT Login - Detailed Setup Guide

This is a step-by-step guide to configure Simple JWT Login plugin on playcase.gg for the Emulator Skin Generator authentication.

## Step 1: Access the Plugin Settings

1. Log into WordPress admin: `https://playcase.gg/wp-admin`
2. In the left sidebar, navigate to **Settings → Simple JWT Login**

## Step 2: General Settings Tab

Click on the **General** tab if not already selected:

1. **JWT Secret Key**: 
   - Generate a strong secret key (at least 32 characters)
   - You can use: `openssl rand -base64 32` in terminal
   - Or use an online generator
   - Example: `your-super-secret-key-at-least-32-characters-long!`
   
2. **JWT Algorithm**: 
   - Select `HS256` (default and recommended)

3. **JWT Expiration**:
   - Set to `604800` (7 days in seconds)
   - Or `2592000` for 30 days

4. Click **Save Settings** at the bottom

## Step 3: Authentication Settings Tab

Click on the **Authentication** tab:

1. **Enable Authentication**: 
   - ✅ Check this box (IMPORTANT!)

2. **Authentication Parameters**:
   - Username parameter: `username`
   - Password parameter: `password`

3. **Login URL**:
   - Should show: `/wp-json/simple-jwt-login/v1/auth`

4. **Protect Authentication Endpoint**:
   - Can leave unchecked for now

5. Click **Save Settings**

## Step 4: Authorization Settings Tab

Click on the **Authorization** tab:

1. **Authorization Header**:
   - ✅ Enable "Authorization header"
   - Header type: `Bearer`

2. **Allow Usage on All Endpoints**:
   - ✅ Check this box

3. Click **Save Settings**

## Step 5: CORS Settings Tab

Click on the **CORS** tab:

1. **Enable CORS**:
   - ✅ Check this box

2. **CORS Allow Origin**:
   - Add each domain on a new line:
   ```
   http://localhost:3000
   http://localhost:8008
   http://localhost:5173
   https://your-production-domain.com
   ```

3. **CORS Allow Methods**:
   - ✅ GET
   - ✅ POST
   - ✅ PUT
   - ✅ DELETE
   - ✅ OPTIONS

4. **CORS Allow Headers**:
   - Add: `Content-Type, Authorization, X-Requested-With`

5. Click **Save Settings**

## Step 6: User Settings Tab (Optional)

Click on the **User** tab:

1. **Allow Authentication for**:
   - Select "All WordPress users"
   - Or restrict by role if needed

2. **JWT Payload**:
   - ✅ Include User ID
   - ✅ Include User email
   - ✅ Include User display name

3. Click **Save Settings**

## Step 7: Test the Configuration

### Test Login
Open terminal and run:

```bash
curl -X POST https://playcase.gg/wp-json/simple-jwt-login/v1/auth \
  -H "Content-Type: application/json" \
  -d '{
    "username": "sklein91@gmail.com",
    "password": "babayaga123#"
  }'
```

You should receive a response like:
```json
{
  "success": true,
  "data": {
    "jwt": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### Test Token Validation

```bash
curl -X POST https://playcase.gg/wp-json/simple-jwt-login/v1/auth/validate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Step 8: Test in Your App

1. Start your development server: `npm run dev`
2. Click "Login with Playcase"
3. Enter your credentials:
   - Email: `sklein91@gmail.com`
   - Password: `babayaga123#`
4. You should be logged in!

## Troubleshooting

### "Authentication is not enabled"
- Make sure you checked "Enable Authentication" in Step 3
- Save the settings

### CORS Errors
- Add your domain to CORS Allow Origin
- Make sure CORS is enabled
- Clear browser cache

### "Invalid credentials"
- Check username/password are correct
- Try using username instead of email
- Check if user account is active

### Token not working
- Verify JWT Secret Key is set
- Check Authorization header is enabled
- Make sure header format is: `Bearer YOUR_TOKEN`

## Security Notes

1. **Use HTTPS in production** - JWT tokens can be intercepted over HTTP
2. **Keep secret key secure** - Never share or commit to git
3. **Set reasonable expiration** - 7-30 days is typical
4. **Monitor failed logins** - Consider adding rate limiting

## Need Help?

If you get stuck:
1. Check WordPress error logs
2. Enable WordPress debug mode
3. Check browser console for errors
4. Verify all settings are saved

The most common issue is forgetting to enable authentication in Step 3!