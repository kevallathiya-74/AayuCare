# AayuCare - Quick System Check
# Verifies all prerequisites before building APK

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " AayuCare - System Check" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    $allGood = $false
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    $allGood = $false
}

# Check Expo CLI
Write-Host "Checking Expo CLI..." -ForegroundColor Yellow
try {
    $expoVersion = npx expo --version 2>&1
    Write-Host "✅ Expo CLI: v$expoVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Expo CLI not found!" -ForegroundColor Red
    Write-Host "   Install: npm install -g expo-cli" -ForegroundColor Yellow
    $allGood = $false
}

# Check EAS CLI
Write-Host "Checking EAS CLI..." -ForegroundColor Yellow
try {
    $easVersion = eas --version 2>&1
    if ($easVersion -match "(\d+\.\d+\.\d+)") {
        Write-Host "✅ EAS CLI: $easVersion" -ForegroundColor Green
    } else {
        throw "Invalid version"
    }
} catch {
    Write-Host "❌ EAS CLI not found!" -ForegroundColor Red
    Write-Host "   Install: npm install -g eas-cli" -ForegroundColor Yellow
    $allGood = $false
}

# Check backend
Write-Host "Checking backend server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        $health = $response.Content | ConvertFrom-Json
        Write-Host "✅ Backend: Running ($($health.environment) mode)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend: Not responding on localhost:5000" -ForegroundColor Yellow
    Write-Host "   Start with: cd backend && npm start" -ForegroundColor Yellow
}

# Check frontend dependencies
Write-Host "Checking frontend dependencies..." -ForegroundColor Yellow
$frontendPath = "d:\AayuCare\frontend"
if (Test-Path "$frontendPath\node_modules") {
    Write-Host "✅ Frontend: Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend: Dependencies missing" -ForegroundColor Yellow
    Write-Host "   Install: cd frontend && npm install" -ForegroundColor Yellow
}

# Check backend dependencies
Write-Host "Checking backend dependencies..." -ForegroundColor Yellow
$backendPath = "d:\AayuCare\backend"
if (Test-Path "$backendPath\node_modules") {
    Write-Host "✅ Backend: Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend: Dependencies missing" -ForegroundColor Yellow
    Write-Host "   Install: cd backend && npm install" -ForegroundColor Yellow
}

# Check app.json
Write-Host "Checking app configuration..." -ForegroundColor Yellow
try {
    $appJson = Get-Content "$frontendPath\app.json" -Raw | ConvertFrom-Json
    
    if ($appJson.expo.android.package) {
        Write-Host "✅ Package: $($appJson.expo.android.package)" -ForegroundColor Green
    }
    
    if ($appJson.expo.android.versionCode) {
        Write-Host "✅ Version Code: $($appJson.expo.android.versionCode)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Version Code: Not set" -ForegroundColor Yellow
    }
    
    if ($appJson.expo.extra.API_BASE_URL -and $appJson.expo.extra.API_BASE_URL -ne "https://your-backend-url.com/api") {
        Write-Host "✅ API URL: $($appJson.expo.extra.API_BASE_URL)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  API URL: Not configured (will use auto-detection)" -ForegroundColor Yellow
        Write-Host "   For production APK, set API_BASE_URL in app.json" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ app.json: Error reading file" -ForegroundColor Red
    $allGood = $false
}

# Check eas.json
Write-Host "Checking EAS configuration..." -ForegroundColor Yellow
if (Test-Path "$frontendPath\eas.json") {
    try {
        $easJson = Get-Content "$frontendPath\eas.json" -Raw | ConvertFrom-Json
        if ($easJson.build.preview.android.buildType -eq "apk") {
            Write-Host "✅ EAS: Configured for APK builds" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  eas.json: Invalid format" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  eas.json: Not found" -ForegroundColor Yellow
    Write-Host "   Run: eas build:configure" -ForegroundColor Yellow
}

# Check EAS login
Write-Host "Checking Expo authentication..." -ForegroundColor Yellow
try {
    $whoami = eas whoami 2>&1 | Out-String
    if ($whoami -match "Not logged in" -or $whoami -match "error") {
        Write-Host "⚠️  Expo: Not logged in" -ForegroundColor Yellow
        Write-Host "   Login: eas login" -ForegroundColor Yellow
    } else {
        $username = $whoami.Trim()
        Write-Host "✅ Logged in as: $username" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Expo: Not logged in" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host " ✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ready to build! Next steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Set up backend URL:" -ForegroundColor White
    Write-Host "   .\setup-backend.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Build APK:" -ForegroundColor White
    Write-Host "   .\build-apk.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "OR follow the complete guide:" -ForegroundColor White
    Write-Host "   See BUILD_GUIDE.md" -ForegroundColor Gray
} else {
    Write-Host " ⚠️  SOME CHECKS FAILED" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please fix the issues above before building." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"
