# 🐛 Debugging Guide - Runtime Errors on Device

## ⚠️ IMPORTANT: The app crashes ONLY on your phone, not during build

Since the bundle builds successfully but crashes on the device, you need to view **device logs** to see the actual error.

---

## 📱 **Method 1: Use Expo's Built-in Debugger (EASIEST & BEST)**

### **Step 1: Start Expo Dev Server**
```bash




    **frontend** 

this is normal mode
cd frontend
npx expo start -c


this is tunnel mode 
cd .\frontend;  npx expo start --tunnel --clear







### **Step 2: Open the App on Your Phone**
- Scan the QR code with **Expo Go** app

### **Step 3: Open Chrome Debugger**
**While the Expo terminal is active**, press:
- Press **`j`** key (opens JavaScript debugger in Chrome)

OR

**On your phone:**
- **Shake the device** (or press Ctrl+M on emulator)
- Select **"Debug Remote JS"**

### **Step 4: View the Error**
Chrome DevTools will open showing:
- **Console tab** → Full error message with stack trace
- **Red error screen** → Exact file and line number

**Example Error:**
```
TypeError: Cannot read property 'main' of undefined
    at BoxSelectionScreen.js:125:43
    at App.js:89:12
```

---

## 💻 **Method 2: View Logs in Expo Terminal (GOOD FOR QUICK CHECKS)**

### **While Expo is running (`npx expo start`):**

Your terminal will automatically show device logs including my enhanced logging:

```
[App] Starting initialization...
[App] Checking theme...
[AppNavigator] Initializing...
[SplashScreen] Rendering...

# If error occurs:
═══════════════════════════════════════════
[GLOBAL ERROR CAUGHT]
Error: Cannot read property 'xxx' of undefined
Stack: at SomeComponent.js:123
Fatal: true
═══════════════════════════════════════════
```

### **Terminal Shortcuts:**
- Press **`j`** → Open JavaScript debugger (Chrome)
- Press **`m`** → Open developer menu on device
- Press **`r`** → Reload app
- Press **`c`** → Clear terminal

---

## 🔍 **Method 3: View Error on Device Screen**

### **On your phone:**
1. **Shake the device** while app is running
2. Select **"Show Performance Monitor"** or **"Toggle Inspector"**
3. **Red error screen** will show the full error

### **What to look for:**
- Error message
- File path (e.g., `BoxSelectionScreen.js:125`)
- Component stack trace

---

## 📊 **What to Look For**

The enhanced logging will show messages like:

### ✅ **Normal Startup (No Errors):**
```
[App] Starting initialization...
[App] Checking theme...
[App] Theme loaded successfully
[App] Initialization complete
[AppNavigator] Initializing...
[AppNavigator] Loading user...
[SplashScreen] Rendering...
[SplashScreen] Starting animations...
```

### ❌ **Error Occurred:**
```
═══════════════════════════════════════════
[GLOBAL ERROR CAUGHT]
Error: Cannot read property 'xxx' of undefined
Stack: at SomeComponent.js:123
Fatal: true
═══════════════════════════════════════════
```

OR

```
═══════════════════════════════════════════
[ERROR BOUNDARY CAUGHT ERROR]
Error: ReferenceError: variable is not defined
Component Stack: in SplashScreen, in App
═══════════════════════════════════════════
```

---

## 🚀 **Quick Test Steps**

1. **Stop any running Expo server**
2. **Run:** `npx expo start --clear`
3. **Scan QR code with your phone**
4. **Watch BOTH:**
   - The terminal on your computer (enhanced logs)
   - Your phone screen (error messages)

---

## 📝 **Common Errors You Might See**

### 1. **"Cannot read property 'xxx' of undefined"**
   - **Cause:** A variable or object is null/undefined
   - **Look for:** The component name in the error stack

### 2. **"Invariant Violation: Element type is invalid"**
   - **Cause:** Import issue or component not found
   - **Look for:** The import statement mentioned in the error

### 3. **"ReferenceError: xxx is not defined"**
   - **Cause:** Variable used before declaration
   - **Look for:** The file and line number in the stack trace

### 4. **Network errors (ECONNREFUSED, timeout)**
   - **Cause:** Backend API not running or wrong URL
   - **Solution:** Start your backend server at http://10.9.15.29:5000

---

## 🔧 **After Finding the Error**

Once you see the actual error message:

1. **Copy the complete error message**
2. **Note the file path and line number**
3. **Share it with me** so I can fix the exact issue

The enhanced logging I added will make errors MUCH more visible!

---

## 💡 **Pro Tip**

If you see **NO logs at all** in the terminal, it means the app is crashing before logging can happen. This usually indicates:
- Missing required package
- Invalid JavaScript syntax
- Circular dependency

Try running: `npx expo doctor` to check for issues.
