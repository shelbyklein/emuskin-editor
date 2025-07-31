# WordPress Authentication Options

Based on testing, here's the current situation with playcase.gg:

## Current Status

1. **Simple JWT Login** - Installed but authentication is NOT enabled
   - Error: "Authentication is not enabled" (errorCode: 45)
   - You need admin access to enable it

2. **Application Passwords** - Available but requires setup
   - Built into WordPress 5.6+
   - Requires creating app-specific passwords

## Option 1: Enable Simple JWT Login (Recommended)

You need to:
1. Log into WordPress admin: https://playcase.gg/wp-admin
2. Go to **Settings → Simple JWT Login**
3. In **Authentication** tab, check **"Enable Authentication"**
4. Click **Save All Settings** (make sure it saves!)

**Common Issues:**
- Make sure you're clicking the right save button
- Check if you have permission to change settings
- Some hosts disable certain settings

## Option 2: Use Application Passwords

If you can't enable Simple JWT Login:

1. Log into WordPress: https://playcase.gg/wp-admin
2. Go to **Users → Profile** (or **Users → All Users → Edit your user**)
3. Scroll down to **Application Passwords** section
4. Enter a name like "Emulator Skin Generator"
5. Click **Add New Application Password**
6. **SAVE THE GENERATED PASSWORD** - it won't be shown again!

Then use it like:
- Username: `sklein91@gmail.com` (or your username)
- Password: `xxxx xxxx xxxx xxxx xxxx xxxx` (the generated app password)

## Option 3: Check with Site Admin

If neither option works:
1. You may not have admin permissions
2. The plugin settings might be locked
3. Security plugins might be blocking changes

Ask the site administrator to:
- Enable authentication in Simple JWT Login
- Or help you create an Application Password
- Or install the standard JWT Authentication plugin

## Testing Authentication

Once enabled, test with:

```bash
# For Simple JWT Login
curl -X POST https://playcase.gg/wp-json/simple-jwt-login/v1/auth \
  -H "Content-Type: application/json" \
  -d '{"username": "your-username", "password": "your-password"}'

# For Application Passwords
curl https://playcase.gg/wp-json/wp/v2/users/me \
  -u "username:application-password"
```

## Which Should You Use?

- **Simple JWT Login**: Better for web apps (what we built for)
- **Application Passwords**: Simpler but less secure for web apps

The app is currently set up for Simple JWT Login, so enabling that would be easiest.