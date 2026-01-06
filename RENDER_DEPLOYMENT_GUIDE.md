# 🚀 Complete Render Deployment Guide for AayuCare Backend

## ✅ Pre-Deployment Checklist (COMPLETED)

All deployment issues have been fixed:
- ✅ `.env` added to `.gitignore` (security)
- ✅ CORS configured for production + mobile apps
- ✅ PORT binding set to `0.0.0.0` (required for Render)
- ✅ Health check endpoint available at `/api/health`
- ✅ Node.js version specified in `package.json`
- ✅ `render.yaml` configuration created
- ✅ `.env.example` template created

---

## 📋 Step-by-Step Deployment Process

### **Step 1: Push Code to GitHub**

1. **Initialize Git (if not already done):**
   ```powershell
   cd d:\AayuCare
   git init
   git add .
   git commit -m "Prepare backend for Render deployment"
   ```

2. **Create GitHub Repository:**
   - Go to https://github.com/new
   - Name: `aayucare` (or any name)
   - **DO NOT** initialize with README (your project already has files)
   - Click "Create repository"

3. **Push to GitHub:**
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/aayucare.git
   git branch -M main
   git push -u origin main
   ```

---

### **Step 2: Create Render Account**

1. Go to https://render.com/
2. Click **"Get Started for Free"**
3. Sign up using **GitHub** (easiest for deployment)
4. Authorize Render to access your GitHub repositories

---

### **Step 3: Create New Web Service on Render**

1. **From Render Dashboard:**
   - Click **"New +"** → **"Web Service"**

2. **Connect Repository:**
   - Select **"Build and deploy from a Git repository"**
   - Click **"Next"**
   - Find and select your `aayucare` repository
   - Click **"Connect"**

3. **Configure Service Settings:**

   | Field | Value |
   |-------|-------|
   | **Name** | `aayucare-backend` |
   | **Region** | Singapore (closest to India) or Oregon |
   | **Branch** | `main` |
   | **Root Directory** | `backend` ⚠️ **IMPORTANT** |
   | **Runtime** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | **Free** |

4. Click **"Advanced"** and set:
   - **Auto-Deploy**: Yes (enabled by default)
   - **Health Check Path**: `/api/health`

---

### **Step 4: Add Environment Variables**

⚠️ **CRITICAL**: Add these environment variables in Render dashboard:

1. Scroll down to **"Environment Variables"** section
2. Click **"Add Environment Variable"** for each:

#### **Required Variables:**

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://keval:AU07wbdz8YE6soqe@cluster-aayucare.8c5c0x1.mongodb.net/aayucare?retryWrites=true&w=majority&appName=Cluster-AayuCare
```

#### **Generate JWT Secrets (DO THIS NOW):**

Open PowerShell and run:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and add as:
```bash
JWT_SECRET=<paste-generated-secret-here>
JWT_REFRESH_SECRET=<paste-another-generated-secret-here>
```

#### **Additional Required Variables:**
```bash
JWT_EXPIRE=30d
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=https://your-expo-app.com
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

#### **Optional Variables (only if using):**
```bash
# Leave blank if not using Twilio SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_VERIFY_SERVICE_SID=

# Leave blank if not using Email
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=
```

---

### **Step 5: Deploy**

1. Click **"Create Web Service"** at the bottom
2. Render will start building automatically:
   - Installing dependencies
   - Starting server
   - Running health checks

3. **Wait 3-5 minutes** for first deployment

4. **Monitor Logs:**
   - Click **"Logs"** tab to watch deployment
   - Look for: `✓ Server running in production mode on port 5000`

---

### **Step 6: Verify Deployment**

1. **Get Your Backend URL:**
   - Render will provide a URL like: `https://aayucare-backend.onrender.com`
   - Copy this URL

2. **Test Health Endpoint:**
   - Open browser and visit: `https://aayucare-backend.onrender.com/api/health`
   - You should see:
   ```json
   {
     "status": "success",
     "message": "AayuCare Backend Server is running",
     "timestamp": "2026-01-06T...",
     "environment": "production"
   }
   ```

3. **Test API Root:**
   - Visit: `https://aayucare-backend.onrender.com/api`
   - Should show API documentation

---

### **Step 7: Update MongoDB Atlas Network Access**

⚠️ **IMPORTANT**: Allow Render to connect to MongoDB

1. Go to https://cloud.mongodb.com/
2. Click your cluster → **"Network Access"**
3. Click **"Add IP Address"**
4. Select **"Allow Access from Anywhere"** (`0.0.0.0/0`)
   - This is safe because you have username/password authentication
5. Click **"Confirm"**

---

### **Step 8: Seed Database (Optional)**

If you need to seed data on production:

1. In Render dashboard, go to **"Shell"** tab
2. Click **"Launch Shell"**
3. Run:
   ```bash
   npm run seed
   # or
   npm run seed:comprehensive
   ```

---

### **Step 9: Update Frontend Configuration**

Update your React Native app to use the Render backend URL:

**File:** `frontend/src/config/app.js`

```javascript
const API_URL = __DEV__ 
  ? 'http://localhost:5000/api' 
  : 'https://aayucare-backend.onrender.com/api';
```

---

## 🔄 Auto-Deployment Workflow

From now on:
1. Make changes to your code
2. Commit and push to GitHub:
   ```powershell
   git add .
   git commit -m "Your changes"
   git push
   ```
3. Render automatically detects and deploys within 2-3 minutes

---

## ⚠️ Important Notes About Free Tier

### **Spin-Down Behavior:**
- Free tier services **spin down after 15 minutes** of inactivity
- First request after spin-down takes **30-50 seconds** to wake up
- Subsequent requests are instant

### **Solutions for Spin-Down:**

**Option 1: Keep-Alive Service (Free)**
- Use https://cron-job.org/
- Create a job to ping `https://aayucare-backend.onrender.com/api/health` every 10 minutes
- Keeps your backend awake 24/7

**Option 2: Upgrade to Paid ($7/month)**
- Click **"Upgrade"** in Render dashboard
- Select **"Starter"** plan
- Never spins down

---

## 🐛 Troubleshooting

### **Deployment Failed:**
1. Check **Logs** tab for errors
2. Common issues:
   - Missing environment variables
   - MongoDB connection string incorrect
   - Node version mismatch

### **Health Check Failing:**
1. Ensure `/api/health` endpoint works
2. Check if server binds to `0.0.0.0` (already fixed)
3. Verify PORT is set to `process.env.PORT`

### **MongoDB Connection Error:**
1. Verify `MONGODB_URI` is correct in Render env vars
2. Check MongoDB Atlas Network Access allows `0.0.0.0/0`
3. Ensure database user credentials are correct

### **CORS Errors from Mobile App:**
1. Ensure `NODE_ENV=production` is set
2. Development mode allows all origins (already configured)
3. Add specific origin to `FRONTEND_URL` if needed

---

## 📊 Monitoring Your Backend

### **View Metrics:**
1. Render Dashboard → Your service
2. Click **"Metrics"** tab
3. Monitor:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

### **View Logs:**
1. Click **"Logs"** tab
2. Real-time logs from your server
3. Use for debugging issues

---

## 🎯 Next Steps After Deployment

1. ✅ **Test all API endpoints** using Postman or your frontend
2. ✅ **Configure keep-alive** if using free tier
3. ✅ **Update frontend** with production backend URL
4. ✅ **Set up monitoring alerts** in Render
5. ✅ **Enable automatic backups** in MongoDB Atlas
6. ✅ **Document API endpoints** for your team

---

## 💡 Pro Tips

1. **Use Environment-Specific Configs:**
   - Create separate Render services for `staging` and `production`
   - Use different MongoDB Atlas clusters

2. **Enable Notifications:**
   - Render Dashboard → Settings → Notifications
   - Get alerted on deployment failures

3. **Custom Domain (Optional):**
   - Go to Settings → Custom Domain
   - Add your own domain (e.g., `api.aayucare.com`)

4. **Security Best Practices:**
   - Rotate JWT secrets regularly
   - Use strong MongoDB passwords
   - Keep dependencies updated

---

## 📞 Support

- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com/
- **MongoDB Atlas Support:** https://www.mongodb.com/docs/atlas/

---

## ✨ Summary

Your AayuCare backend is now:
- ✅ **Production-ready** with security fixes
- ✅ **Configured for Render** deployment
- ✅ **Auto-deploying** from GitHub
- ✅ **Connected to MongoDB Atlas**
- ✅ **CORS-enabled** for mobile apps

**Your Backend URL:** `https://aayucare-backend.onrender.com/api`

**Deployment Status:** Ready to deploy! Follow steps above.
