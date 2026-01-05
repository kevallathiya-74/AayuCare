# AayuCare - EAS Build Helper Script
# This script guides you through building an Android APK

param(
    [string]$BackendUrl = ""
)

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " AayuCare - Android APK Build Helper" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Set location to frontend directory
Set-Location "d:\AayuCare\frontend"

# Step 1: Check prerequisites
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    exit
}

# Check Expo CLI
try {
    $expoVersion = npx expo --version 2>&1
    Write-Host "✅ Expo CLI: $expoVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Expo CLI not found!" -ForegroundColor Red
    exit
}

# Check EAS CLI
try {
    $easVersion = eas --version 2>&1
    Write-Host "✅ EAS CLI: $easVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ EAS CLI not found!" -ForegroundColor Red
    Write-Host "Installing EAS CLI..." -ForegroundColor Yellow
    npm install -g eas-cli
}

Write-Host ""

# Step 2: Check backend URL
Write-Host "Step 2: Backend URL Configuration" -ForegroundColor Yellow
Write-Host ""

if (-not $BackendUrl) {
    Write-Host "⚠️  No backend URL provided!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For a working APK, you need a publicly accessible backend." -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "1. Run: .\setup-backend.ps1 (to set up ngrok or Railway)" -ForegroundColor White
    Write-Host "2. Provide URL now" -ForegroundColor White
    Write-Host "3. Continue anyway (APK will only work on same network)" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Choose (1/2/3)"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            Write-Host "Running backend setup..." -ForegroundColor Cyan
            & "d:\AayuCare\setup-backend.ps1"
            exit
        }
        "2" {
            $BackendUrl = Read-Host "Enter backend URL (e.g., https://abc123.ngrok-free.app/api)"
        }
        "3" {
            Write-Host ""
            Write-Host "⚠️  WARNING: APK will use auto-detected backend!" -ForegroundColor Yellow
            Write-Host "This may not work outside your network." -ForegroundColor Yellow
            $continue = Read-Host "Continue anyway? (y/n)"
            if ($continue -ne "y") {
                exit
            }
        }
    }
}

# Update app.json if backend URL provided
if ($BackendUrl) {
    Write-Host ""
    Write-Host "Updating app.json with backend URL: $BackendUrl" -ForegroundColor Cyan
    
    $appJsonPath = ".\app.json"
    $appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
    
    if (-not $appJson.expo.extra) {
        $appJson.expo | Add-Member -MemberType NoteProperty -Name "extra" -Value @{}
    }
    
    $appJson.expo.extra.API_BASE_URL = $BackendUrl
    
    $appJson | ConvertTo-Json -Depth 10 | Set-Content $appJsonPath
    
    Write-Host "✅ app.json updated!" -ForegroundColor Green
    Write-Host ""
}

# Step 3: Check EAS login
Write-Host "Step 3: Checking Expo authentication..." -ForegroundColor Yellow
Write-Host ""

try {
    $whoami = eas whoami 2>&1
    if ($whoami -match "Not logged in") {
        Write-Host "Please login to Expo..." -ForegroundColor Yellow
        eas login
    } else {
        Write-Host "✅ Logged in as: $whoami" -ForegroundColor Green
    }
} catch {
    Write-Host "Please login to Expo..." -ForegroundColor Yellow
    eas login
}

Write-Host ""

# Step 4: Verify configuration
Write-Host "Step 4: Verifying app configuration..." -ForegroundColor Yellow
Write-Host ""

$appJson = Get-Content ".\app.json" -Raw | ConvertFrom-Json

Write-Host "App Name: $($appJson.expo.name)" -ForegroundColor White
Write-Host "Package: $($appJson.expo.android.package)" -ForegroundColor White
Write-Host "Version: $($appJson.expo.version)" -ForegroundColor White
Write-Host "Version Code: $($appJson.expo.android.versionCode)" -ForegroundColor White

if ($appJson.expo.extra.API_BASE_URL) {
    Write-Host "API URL: $($appJson.expo.extra.API_BASE_URL)" -ForegroundColor White
} else {
    Write-Host "API URL: Auto-detected (development mode)" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Build APK
Write-Host "Step 5: Ready to build APK!" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "- Build an Android APK (not AAB)" -ForegroundColor Gray
Write-Host "- Use 'preview' profile from eas.json" -ForegroundColor Gray
Write-Host "- Upload to Expo servers for building" -ForegroundColor Gray
Write-Host "- Take 10-20 minutes to complete" -ForegroundColor Gray
Write-Host ""

$build = Read-Host "Start build now? (y/n)"

if ($build -eq "y") {
    Write-Host ""
    Write-Host "Building APK..." -ForegroundColor Cyan
    Write-Host "This will take several minutes. Please wait..." -ForegroundColor Yellow
    Write-Host ""
    
    eas build -p android --profile preview
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host " Build Complete!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Download APK from the URL provided above" -ForegroundColor White
    Write-Host "2. Transfer to your Android device" -ForegroundColor White
    Write-Host "3. Enable 'Install from unknown sources' in device settings" -ForegroundColor White
    Write-Host "4. Install and test the APK" -ForegroundColor White
    Write-Host ""
    Write-Host "To rebuild after changes:" -ForegroundColor Cyan
    Write-Host "  .\build-apk.ps1 -BackendUrl 'your-url'" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Build cancelled. To build later, run:" -ForegroundColor Yellow
    Write-Host "  eas build -p android --profile preview" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Read-Host "Press Enter to exit"
