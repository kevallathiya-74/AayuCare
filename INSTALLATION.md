# AayuCare - Installation Guide for New Devices

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20.19.5 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)
- **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Expo Go App** (for mobile testing) - Download from Play Store or App Store

---

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/kevallathiya-74/AayuCare.git
cd AayuCare
```

### 2. Backend Setup

#### Navigate to backend folder
```bash
cd backend
```

#### Install dependencies
```bash
npm install
```

#### Create environment file
Create a `.env` file in the `backend` folder:

```bash
# Windows PowerShell
New-Item -Path .env -ItemType File
```

#### Configure environment variables
Open `backend/.env` and add:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection String
MONGODB_URI=your_mongodb_connection_string

# JWT Secret (generate a random string)
JWT_SECRET=your_random_secret_key_here
JWT_EXPIRE=30d

# Twilio Configuration (optional for OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# App Configuration
FRONTEND_URL=http://localhost:8081
```

**Important:** Replace the placeholder values with your actual credentials:
- Get MongoDB URI from MongoDB Atlas
- Generate a secure JWT_SECRET (use a random string generator)
- Twilio credentials are optional (for OTP feature)

#### Start the backend server
```bash
npm run dev
```

Backend should now be running on `http://localhost:5000`

---

### 3. Frontend Setup

#### Open a new terminal and navigate to frontend folder
```bash
cd AayuCare/frontend
```

#### Install dependencies
```bash
npm install
```

#### Update API configuration

Open `frontend/src/config/api.js` and update the IP address:

1. **For Web development:** Keep `localhost:5000`
2. **For Mobile testing:** Replace with your computer's local IP address

To find your IP address:
```bash
# Windows
ipconfig
# Look for IPv4 Address under your active network adapter
```

Then update `api.js`:
```javascript
// Line 11 - Replace with your IP address
return 'http://YOUR_IP_ADDRESS:5000/api';
// Example: return 'http://192.168.1.100:5000/api';
```

#### Start the frontend
```bash
npm start
```

Expo will start and show a QR code. You can:
- Press `w` to open in web browser
- Scan QR code with Expo Go app for mobile testing

---

## Quick Start Commands

### Start Backend (from project root)
```bash
cd backend
npm run dev
```

### Start Frontend (from project root)
```bash
cd frontend
npm start
```

### Run Both (use two terminals)

**Terminal 1 - Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend && npm start
```

---

## MongoDB Atlas Setup

### 1. Create a MongoDB Atlas Account
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Sign up for a free account

### 2. Create a Cluster
- Click "Build a Database"
- Choose "FREE" tier (M0)
- Select a cloud provider and region
- Click "Create Cluster"

### 3. Create Database User
- Go to "Database Access"
- Click "Add New Database User"
- Create username and password
- Give "Read and write to any database" permission

### 4. Whitelist IP Address
- Go to "Network Access"
- Click "Add IP Address"
- Click "Allow Access from Anywhere" (0.0.0.0/0) for development
- Click "Confirm"

### 5. Get Connection String
- Go to "Database" → Click "Connect"
- Choose "Connect your application"
- Copy the connection string
- Replace `<password>` with your database user password
- Paste into `backend/.env` as `MONGODB_URI`

---

## Troubleshooting

### Port Already in Use

If you see "EADDRINUSE" error:

**Kill process on port 5000:**
```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 5000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

**Kill process on port 8081:**
```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 8081 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

### Network Error on Mobile

If mobile app shows "Network Error":
- Make sure backend is running
- Check that you updated the IP address in `frontend/src/config/api.js`
- Ensure both your computer and phone are on the same WiFi network
- Try disabling firewall temporarily

### MongoDB Connection Failed

- Verify your connection string is correct
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure password doesn't contain special characters (URL encode if needed)

### Module Not Found Errors

Clear cache and reinstall:
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json .expo
npm install
```

---

## Testing the Application

### 1. Check Backend API
Open browser and go to: `http://localhost:5000`

You should see:
```json
{
  "message": "AayuCare API Server Running",
  "status": "OK",
  "timestamp": "2025-12-01T12:00:00.000Z"
}
```

### 2. Test Frontend Web
- Start frontend with `npm start`
- Press `w` to open web
- Try to register a new account
- Try to login

### 3. Test Mobile
- Start frontend with `npm start`
- Open Expo Go app on your phone
- Scan the QR code
- Test registration and login

---

## Project Structure Overview

```
AayuCare/
├── backend/                 # Express.js backend
│   ├── controllers/        # Business logic
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Auth middleware
│   ├── .env               # Environment variables (create this)
│   ├── server.js          # Entry point
│   └── package.json
│
├── frontend/               # React Native Expo app
│   ├── src/
│   │   ├── screens/       # App screens
│   │   ├── components/    # Reusable components
│   │   ├── navigation/    # Navigation setup
│   │   ├── context/       # Auth context
│   │   ├── config/        # API configuration
│   │   └── constants/     # Theme constants
│   ├── App.js
│   └── package.json
│
└── README.md
```

---

## Environment Requirements

- **Node.js:** v20.19.5
- **npm:** 10.x
- **Expo SDK:** 54.0.25
- **React Native:** 0.81.5
- **MongoDB:** 8.3.0+

---

## Support

For issues or questions:
1. Check the [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup
2. Check [END_TO_END_VERIFICATION.md](./END_TO_END_VERIFICATION.md) for API testing
3. Review error logs in terminal
4. Create an issue on GitHub

---

## Next Steps After Installation

1. ✅ Backend running on port 5000
2. ✅ Frontend running on port 8081/8082
3. ✅ MongoDB connected
4. 📱 Test user registration
5. 🔐 Test user login
6. 📊 Explore the app features
7. 📝 Read [FEATURES.md](./FEATURES.md) for feature overview

---

**Happy Coding! 🚀**
