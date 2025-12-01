# AayuCare - Quick Commands Reference

## 🚀 Start Commands

# Start backend server
cd backend
npm run dev

# Start frontend (normal)
cd frontend
npm start

# Start frontend (clear cache)
cd frontend
npm run start:clear

# Start web only
cd frontend
npm run web

# Start on Android
cd frontend
npm run android

# Start with tunnel (remote access)
cd frontend
npm run tunnel

## 🔧 Maintenance Commands

# Update all dependencies
cd frontend
npx expo install --fix

# Check dependencies
cd frontend
npx expo install --check

# Clear cache completely
cd frontend
rm -rf node_modules
npm install
npx expo start --clear

# Clear Metro bundler cache
cd frontend
npx expo start -c

## 🐛 Debug Commands

# Enable debugger
# Press 'j' in running Expo terminal

# Toggle performance monitor
# Press 'Shift+M' in app, select "Toggle Performance Monitor"

# Reload app
# Press 'r' in running Expo terminal

# Open developer menu
# Press 'm' in running Expo terminal

## 📦 Build Commands

# Build Android APK
cd frontend
npm run build:android

# Build iOS IPA
cd frontend
npm run build:ios

## 🗄️ Database Commands

# Connect to MongoDB (if local)
mongosh

# Check MongoDB connection
cd backend
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(e => console.log(e))"

## 🧹 Cleanup Commands

# Clean frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Clean backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Clean everything
rm -rf frontend/node_modules backend/node_modules
cd frontend; npm install
cd ../backend; npm install

## 📱 Device Testing

# Find your IP address
ipconfig

# Test on same network
# Use QR code

# Test on different network
cd frontend
npm run tunnel

# Test on USB device
cd frontend
npm run android

## 🔍 Troubleshooting

# Port already in use
# Change port in backend/.env
PORT=5000

# Expo Go compatibility
# Update Expo Go app to latest version

# Metro bundler issues
cd frontend
npx expo start --clear

# Network issues
cd frontend
npm run tunnel

# Build cache issues
cd frontend
rm -rf .expo node_modules
npm install
npx expo start --clear

## 📊 Performance Monitoring

# Check bundle size
cd frontend
npx expo export --dump-sourcemap

# Analyze performance
# Press 'Shift+M' in running app
# Select "Toggle Performance Monitor"

## 🎯 Quick Links

Backend API:     http://localhost:5001
Frontend Web:    http://localhost:8081
API Health:      http://localhost:5001/

## ✨ Pro Tips

- Use 'npm run start:clear' when switching branches
- Press 'r' to quick reload during development
- Press 'Shift+M' in app for advanced tools
- Use tunnel mode for remote testing
- Keep Expo Go updated for best compatibility
- Monitor performance with built-in tools
- Clear cache if seeing weird errors

## 🎉 All Set!

Backend running: http://localhost:5001 ✅
Frontend running: http://localhost:8081 ✅
Ready to code! 🚀
