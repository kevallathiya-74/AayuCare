# 📱 AayuCare - Android APK Build Guide

## 🎯 Quick Start (Choose Your Path)

### ⚡ FASTEST METHOD (5 minutes - Testing)
```powershell
# 1. Start backend (if not running)
cd d:\AayuCare\backend
npm start

# 2. Set up ngrok
.\setup-backend.ps1

# 3. Build APK (after getting ngrok URL)
cd d:\AayuCare\frontend
.\build-apk.ps1 -BackendUrl "https://your-ngrok-url.ngrok-free.app/api"
```

### 🏭 PRODUCTION METHOD (15 minutes - Permanent)
```powershell
# 1. Deploy backend to Railway
cd d:\AayuCare\backend
npm install -g @railway/cli
railway login
railway init
railway up

# 2. Build APK with production URL
cd d:\AayuCare\frontend
.\build-apk.ps1 -BackendUrl "https://your-app.up.railway.app/api"
```

---

## 📋 Complete Step-by-Step Guide

### STEP 1: Verify Backend is Running

✅ **Backend Status:** Running on `http://localhost:5000`
✅ **Database:** MongoDB Atlas connected
✅ **Data:** 14 users, 50 appointments ready

**Test backend health:**
```powershell
# Check if backend responds
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "status": "success",
  "message": "AayuCare Backend Server is running",
  "timestamp": "2026-01-05T...",
  "environment": "development"
}
```

---

### STEP 2: Install EAS CLI (Already Done! ✅)

**Current version:** `eas-cli/16.28.0`

**If you need to reinstall:**
```powershell
npm install -g eas-cli
eas --version
```

**Purpose:** EAS CLI builds your app on Expo's cloud servers, so you don't need Android Studio or Java locally.

---

### STEP 3: Login to Expo Account

```powershell
cd d:\AayuCare\frontend
eas login
```

**You'll be prompted for:**
- Expo username or email
- Password

**Why login?** EAS needs to upload your code to build servers and associate the build with your account.

**Check login status:**
```powershell
eas whoami
```

---

### STEP 4: Configure Backend URL (IMPORTANT!)

**⚠️ CRITICAL DECISION:**

Your APK needs a **publicly accessible backend URL**. You have 3 options:

#### Option A: ngrok (Quick Testing)

**Pros:**
- Instant setup (2 minutes)
- No account needed
- Perfect for testing

**Cons:**
- URL changes when ngrok restarts
- Not suitable for permanent use

**Setup:**
```powershell
# Install ngrok
choco install ngrok
# OR download from https://ngrok.com/download

# Start tunnel
ngrok http 5000

# You'll get a URL like: https://abc123.ngrok-free.app
# USE THIS URL + /api for your backend
```

**Update configuration:**
```powershell
cd d:\AayuCare\frontend
.\build-apk.ps1 -BackendUrl "https://abc123.ngrok-free.app/api"
```

#### Option B: Railway (Production - RECOMMENDED)

**Pros:**
- Free tier (500 hours/month)
- Permanent URL
- Auto-deploys from Git
- Professional solution

**Cons:**
- 10-minute setup
- Requires account

**Setup:**
```powershell
# Install Railway CLI
npm install -g @railway/cli

# Deploy
cd d:\AayuCare\backend
railway login          # Opens browser for authentication
railway init           # Create new project
railway up             # Deploy!

# You'll get a URL like: https://aayucare.up.railway.app
```

**Environment variables for Railway:**
Add these in Railway dashboard:
- `MONGODB_URI` - (your MongoDB Atlas connection string)
- `JWT_SECRET` - (from your .env)
- `JWT_REFRESH_SECRET` - (from your .env)
- `PORT` - (Railway auto-assigns, use Railway's PORT variable)

#### Option C: Other Services

**Render (Free):**
- Go to https://render.com
- Create Web Service
- Connect GitHub repo
- Auto-deploys

**Heroku, AWS, DigitalOcean:**
- Follow their deployment guides
- Make sure to expose port 5000 or configure accordingly

---

### STEP 5: Verify app.json Configuration

**File:** `d:\AayuCare\frontend\app.json`

**Required fields (Already configured! ✅):**

```json
{
  "expo": {
    "name": "AayuCare",                    // ✅ App name
    "slug": "aayucare",                     // ✅ Unique identifier
    "version": "1.0.0",                     // ✅ Version
    "android": {
      "package": "com.aayucare.app",       // ✅ Android package name
      "versionCode": 1                      // ✅ Build number
    },
    "extra": {
      "API_BASE_URL": "https://..."        // ⚠️ UPDATE THIS!
    }
  }
}
```

**Key fields explained:**

- **`name`**: Display name users see
- **`slug`**: Project identifier (lowercase, no spaces)
- **`android.package`**: Unique Android package ID (reverse domain format)
- **`android.versionCode`**: Build number (increment for each new build)
  - First build: 1
  - Update: 2, 3, 4...
  - **When to increment:** Every new APK build for distribution
  - **Can skip:** If rebuilding for testing only

- **`extra.API_BASE_URL`**: Your production backend URL
  - **Development:** Auto-detected from network
  - **Production APK:** MUST be set explicitly

---

### STEP 6: Configure eas.json (Already Done! ✅)

**File:** `d:\AayuCare\frontend\eas.json`

**Current configuration:**
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"           // ✅ APK (not AAB)
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"    // AAB for Play Store
      }
    }
  }
}
```

**Profile explanation:**

| Profile | Build Type | Use Case |
|---------|------------|----------|
| `preview` | APK | Local testing, internal distribution |
| `production` | AAB | Google Play Store submission |
| `development` | APK | Development with dev client |

**For your use case:** Use `preview` profile (APK only, no Play Store)

---

### STEP 7: Build the APK

**Option 1: Use Helper Script (Easiest)**
```powershell
cd d:\AayuCare\frontend
.\build-apk.ps1 -BackendUrl "https://your-backend-url.com/api"
```

**Option 2: Manual Command**
```powershell
cd d:\AayuCare\frontend
eas build -p android --profile preview
```

**What happens during build:**

1. **Code upload** (1-2 min)
   - EAS compresses and uploads your frontend code
   - Uploads package.json dependencies
   - Uploads assets (images, fonts, etc.)

2. **Cloud build** (10-15 min)
   - Expo servers download dependencies
   - Compile JavaScript bundle
   - Build Android native code
   - Package into APK
   - Sign with temporary certificate

3. **Output**
   - Download URL provided
   - Build stored in Expo dashboard
   - APK size: typically 30-50 MB

**Build progress:**
```
✔ Build ID: abc123-def456-ghi789
✔ Build URL: https://expo.dev/accounts/...
⠧ Waiting for build to complete...
```

**Monitor build:**
- Watch progress in terminal
- OR open build URL in browser
- OR check Expo dashboard: https://expo.dev

---

### STEP 8: Download and Install APK

**After build completes:**

1. **Download APK:**
   - Click the download link provided
   - OR visit: https://expo.dev → Your project → Builds
   - Download the `.apk` file (e.g., `build-123456789.apk`)

2. **Transfer to Android device:**

   **Method A: USB Cable**
   ```powershell
   # Connect phone via USB
   # Copy APK to phone's Download folder
   adb push build-123456789.apk /sdcard/Download/
   ```

   **Method B: Cloud Storage**
   - Upload APK to Google Drive, Dropbox, etc.
   - Open on phone and download

   **Method C: Direct Download**
   - Open Expo build URL on phone's browser
   - Download directly

3. **Install APK:**
   - Open file manager on Android
   - Navigate to Downloads
   - Tap the APK file
   - If prompted, enable "Install from unknown sources"
   - Tap "Install"

4. **Security prompt:**
   - Android may warn "App from unknown source"
   - Tap "Install anyway" or "More details" → "Install anyway"
   - This is normal for apps not from Play Store

---

### STEP 9: Test APK Functionality

**Critical tests:**

✅ **1. App launches successfully**
- Icon appears in app drawer
- App opens without crashing
- Splash screen displays correctly

✅ **2. Login works**
```
Test credentials (from your database):
- Email: rajjadav0906@gmail.com
- Phone: 6353837201
```

✅ **3. Backend API connection**
- Login request succeeds
- Dashboard loads
- Real data appears (not placeholder data)

✅ **4. Navigation works**
- All tabs accessible
- Screens load without errors
- Back button functions correctly

✅ **5. Features work**
- Appointments list loads
- Doctor profiles display
- Medical records accessible
- Notifications appear

**Common issues and fixes:**

❌ **"Cannot connect to server"**
- **Cause:** Backend URL incorrect or not accessible
- **Fix:** Verify backend URL in app.json
- **Test:** Open backend URL in phone's browser

❌ **"Network request failed"**
- **Cause:** Phone can't reach backend
- **Fix:** 
  - Check backend is running
  - Verify URL is HTTPS (required for production)
  - Check firewall/network settings

❌ **Login fails with 401/404**
- **Cause:** Backend not properly deployed or wrong endpoint
- **Fix:** Test backend health endpoint first

❌ **App crashes on launch**
- **Cause:** Missing dependencies or code errors
- **Fix:** Check Expo build logs, look for red error messages

---

### STEP 10: UI/UX Quality Review

**Check these on REAL device:**

📱 **Layout Issues:**
- [ ] No overlapping text/buttons
- [ ] Proper padding/margins
- [ ] Content not cut off
- [ ] Scrolling works smoothly
- [ ] Status bar height correct

📐 **Responsive Design:**
- Test on different screen sizes if possible
- Portrait and landscape orientations
- Text readable without zooming
- Buttons large enough to tap

🎨 **Visual Polish:**
- [ ] Images load correctly
- [ ] Icons display properly
- [ ] Consistent fonts and colors
- [ ] Loading states show
- [ ] Error messages are clear

⚡ **Performance:**
- [ ] App responds quickly
- [ ] No lag when scrolling
- [ ] Transitions are smooth
- [ ] API calls complete reasonably fast

**If issues found:**
- Fix in code
- Increment `android.versionCode` in app.json
- Rebuild APK
- Uninstall old APK
- Install new APK

---

### STEP 11: Cross-Platform Considerations

**Android variations:**
- Test on different Android versions if possible
- Check on phones with notches/punch-holes
- Verify on tablets (different aspect ratios)

**iOS (Future):**
```powershell
# When ready for iOS
eas build -p ios --profile preview
```

**Universal fixes:**
- Use SafeAreaView for safe areas
- Use flexbox for responsive layouts
- Test on smallest target screen (e.g., iPhone SE, small Android)
- Use relative units (percentages, flex) not fixed pixels

---

### STEP 12: Common Build Failures

**❌ "Build failed: Cannot resolve module"**
```
Cause: Missing dependency
Fix: npm install <missing-package>
      Rebuild
```

**❌ "Build failed: Invalid app.json"**
```
Cause: Syntax error in app.json or eas.json
Fix: Validate JSON syntax
     Check for trailing commas
     Verify all required fields present
```

**❌ "Build failed: Invalid package name"**
```
Cause: Package name contains invalid characters
Fix: android.package must be like: com.company.appname
     No spaces, no special chars except dots
```

**❌ "Build failed: Version code must be > previous"**
```
Cause: Trying to build with same/lower versionCode
Fix: Increment versionCode in app.json
     OR use "appVersionSource": "remote" in eas.json
```

**❌ "Environment variable not found"**
```
Cause: Production build can't access .env files
Fix: Set variables in app.json extra field
     OR use EAS Secrets: eas secret:create
```

---

### STEP 13: Rebuilding After Code Changes

**When to rebuild:**
- ✅ Any code changes (JavaScript, screens, components)
- ✅ Asset changes (images, fonts)
- ✅ Configuration changes (app.json, eas.json)
- ✅ Dependency updates (package.json)

**When NOT to rebuild:**
- ❌ Backend-only changes (backend code updates don't need new APK)
- ❌ Database changes (data updates, no code changes)

**Rebuild process:**

1. **Update version code:**
```json
// app.json
{
  "expo": {
    "android": {
      "versionCode": 2  // Increment from 1 → 2 → 3...
    }
  }
}
```

2. **Rebuild:**
```powershell
cd d:\AayuCare\frontend
eas build -p android --profile preview
```

3. **Install new APK:**
```
Option A: Uninstall old, install new (clean install)
Option B: Install over existing (may cause issues)

Recommended: Uninstall first for major changes
```

**Version management:**
- **`version`**: User-facing (1.0.0 → 1.0.1 → 1.1.0)
- **`versionCode`**: Internal build number (1 → 2 → 3)

**Example versioning:**
```
v1.0.0 (versionCode 1) - Initial release
v1.0.1 (versionCode 2) - Bug fixes
v1.0.2 (versionCode 3) - More fixes
v1.1.0 (versionCode 4) - New features
```

---

## 🔧 Troubleshooting Checklist

### Before Building:
- [ ] Backend server running
- [ ] Backend URL is publicly accessible
- [ ] MongoDB connected and has data
- [ ] EAS CLI installed and logged in
- [ ] app.json has correct API_BASE_URL
- [ ] eas.json has preview profile with APK buildType

### After Building:
- [ ] APK downloaded successfully
- [ ] APK transferred to Android device
- [ ] "Install from unknown sources" enabled
- [ ] APK installed without errors

### After Installing:
- [ ] App icon appears
- [ ] App launches without crash
- [ ] Login screen shows
- [ ] Login works with real credentials
- [ ] Dashboard loads with real data
- [ ] All navigation tabs work
- [ ] API calls return data

### If Problems Occur:
1. **Check backend health:** Open backend URL in browser
2. **Check device logs:** Use `adb logcat` for crash details
3. **Check build logs:** Review Expo dashboard build logs
4. **Test in Expo Go first:** Verify app works before building APK
5. **Rebuild clean:** Increment versionCode and rebuild

---

## 📞 Quick Reference Commands

```powershell
# Check installations
node --version
npm --version
npx expo --version
eas --version

# Backend setup
cd d:\AayuCare\backend
npm start

# Setup scripts
cd d:\AayuCare
.\setup-backend.ps1      # Configure backend URL
.\build-apk.ps1          # Build APK

# Manual EAS commands
cd d:\AayuCare\frontend
eas login
eas whoami
eas build -p android --profile preview
eas build:list           # View past builds

# Android debugging
adb devices              # List connected devices
adb install app.apk      # Install APK via USB
adb logcat               # View device logs
adb uninstall com.aayucare.app  # Uninstall app
```

---

## 🎯 Success Checklist

Once you complete all steps, you should have:

- ✅ Backend deployed and accessible (ngrok or Railway)
- ✅ APK built successfully via EAS
- ✅ APK installed on Android device
- ✅ App launches without Expo Go
- ✅ Login works with real backend
- ✅ Dashboard shows real data from MongoDB
- ✅ All screens navigate correctly
- ✅ UI looks professional and responsive
- ✅ No crashes or errors

**You now have a standalone, production-ready Android APK!** 🎉

---

## 📚 Additional Resources

- **Expo EAS Build:** https://docs.expo.dev/build/introduction/
- **App Configuration:** https://docs.expo.dev/workflow/configuration/
- **Railway Deployment:** https://docs.railway.app/
- **ngrok Documentation:** https://ngrok.com/docs
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas/

---

## 🆘 Need Help?

If you encounter issues:
1. Check build logs in Expo dashboard
2. Review error messages carefully
3. Test backend URL in browser first
4. Verify app works in Expo Go before building APK
5. Check device logs with `adb logcat`

**Remember:** Most issues are related to backend URL configuration or network connectivity!
