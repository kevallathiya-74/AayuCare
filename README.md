# AayuCare - Healthcare Mobile Application

🎉 **Now running on Expo SDK 54 with React 19!** - Optimized for maximum performance!

Complete healthcare management mobile application built with React Native (Expo) and Node.js backend.

## Project Structure

```
AayuCare1/
├── backend/               # Node.js Express Backend
│   ├── controllers/      # Request handlers
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── server.js        # Server entry point
│   └── package.json
│
└── frontend/            # React Native Expo Frontend
    ├── src/
    │   ├── screens/    # App screens
    │   ├── navigation/ # Navigation setup
    │   ├── context/    # React context
    │   ├── config/     # Configuration
    │   └── constants/  # Theme constants
    ├── App.js
    └── package.json
```

## Setup Instructions

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB Atlas connection string and other credentials

5. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start Expo:
```bash
npx expo start
```

4. Scan QR code with Expo Go app on your phone

## Features

- User Authentication (Login/Register)
- Book Appointments
- Health Records Management
- Vital Signs Tracking
- User Profile
- Appointment Management

## Technologies Used

### Backend
- Express.js 4.19.2
- MongoDB with Mongoose 8.3.0
- JWT Authentication
- Bcrypt for password hashing
- Twilio for SMS

### Frontend
- **Expo SDK 54** ⚡ (Latest)
- **React 19.1.0** ⚡ (Concurrent features)
- **React Native 0.81.5** ⚡ (Latest stable)
- React Navigation
- Axios for API calls
- AsyncStorage for local data

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Users
- GET /api/users/profile
- PUT /api/users/profile

### Health Records
- POST /api/health
- GET /api/health
- GET /api/health/:id
- PUT /api/health/:id
- DELETE /api/health/:id

### Appointments
- POST /api/appointments
- GET /api/appointments
- GET /api/appointments/:id
- PUT /api/appointments/:id
- DELETE /api/appointments/:id

## Environment Variables

Backend `.env`:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

## License

ISC
