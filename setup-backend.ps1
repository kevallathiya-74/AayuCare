# AayuCare - Quick Backend Setup with ngrok
# This script helps you expose your local backend for APK testing

Write-Host "==================================" -ForegroundColor Cyan
Write-Host " AayuCare Backend Setup Helper" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "Checking if backend is running on port 5000..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is running!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host "Please start backend first: cd backend && npm start" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host " DEPLOYMENT OPTIONS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose your deployment method:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. ngrok (Quick test - URL changes on restart)" -ForegroundColor White
Write-Host "   - Free, instant setup" -ForegroundColor Gray
Write-Host "   - Good for testing APK" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Railway (Production - Permanent URL)" -ForegroundColor White
Write-Host "   - Free tier available" -ForegroundColor Gray
Write-Host "   - Best for real deployment" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Already deployed elsewhere" -ForegroundColor White
Write-Host "   - Enter your existing URL" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter choice (1/2/3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Setting up ngrok..." -ForegroundColor Cyan
        
        # Check if ngrok is installed
        $ngrokPath = where.exe ngrok 2>$null
        if (-not $ngrokPath) {
            Write-Host "❌ ngrok not found!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Install ngrok using one of these methods:" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Option A: Chocolatey (if installed)" -ForegroundColor White
            Write-Host "  choco install ngrok" -ForegroundColor Gray
            Write-Host ""
            Write-Host "Option B: Download manually" -ForegroundColor White
            Write-Host "  1. Go to: https://ngrok.com/download" -ForegroundColor Gray
            Write-Host "  2. Download and extract ngrok.exe" -ForegroundColor Gray
            Write-Host "  3. Add to PATH or run from ngrok folder" -ForegroundColor Gray
            Write-Host ""
            Write-Host "After installing ngrok, run this script again." -ForegroundColor Yellow
            Write-Host ""
            Read-Host "Press Enter to exit"
            exit
        }
        
        Write-Host "✅ ngrok found!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Starting ngrok tunnel on port 5000..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "IMPORTANT: After ngrok starts:" -ForegroundColor Yellow
        Write-Host "1. Look for the 'Forwarding' line" -ForegroundColor White
        Write-Host "2. Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)" -ForegroundColor White
        Write-Host "3. Come back and tell me that URL" -ForegroundColor White
        Write-Host ""
        Write-Host "Press Ctrl+C in ngrok window to stop tunnel" -ForegroundColor Gray
        Write-Host ""
        
        Start-Sleep -Seconds 2
        
        # Start ngrok
        ngrok http 5000
    }
    
    "2" {
        Write-Host ""
        Write-Host "Setting up Railway deployment..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check if Railway CLI is installed
        $railwayPath = where.exe railway 2>$null
        if (-not $railwayPath) {
            Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
            npm install -g @railway/cli
        }
        
        Write-Host ""
        Write-Host "Follow these steps:" -ForegroundColor Yellow
        Write-Host "1. Run: railway login" -ForegroundColor White
        Write-Host "2. Run: railway init" -ForegroundColor White
        Write-Host "3. Run: railway up" -ForegroundColor White
        Write-Host ""
        Write-Host "After deployment, Railway will give you a URL." -ForegroundColor White
        Write-Host "Come back and provide that URL." -ForegroundColor White
        Write-Host ""
        
        Set-Location "d:\AayuCare\backend"
        Write-Host "Opening backend directory..." -ForegroundColor Cyan
        Write-Host "Current directory: $PWD" -ForegroundColor Gray
    }
    
    "3" {
        Write-Host ""
        $backendUrl = Read-Host "Enter your backend URL (e.g., https://api.example.com/api)"
        
        if ($backendUrl) {
            Write-Host ""
            Write-Host "Testing connection to: $backendUrl" -ForegroundColor Yellow
            
            try {
                $healthUrl = "$backendUrl/health"
                if ($backendUrl -notmatch "/api$") {
                    $healthUrl = "$backendUrl/api/health"
                }
                
                $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
                if ($response.StatusCode -eq 200) {
                    Write-Host "✅ Backend is reachable!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Your backend URL is: $backendUrl" -ForegroundColor Cyan
                    Write-Host ""
                    Write-Host "Next step: Update app.json with this URL" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "⚠️  Could not reach backend at: $healthUrl" -ForegroundColor Yellow
                Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host ""
                Write-Host "Make sure:" -ForegroundColor Yellow
                Write-Host "- Backend is deployed and running" -ForegroundColor White
                Write-Host "- URL is correct (include /api if needed)" -ForegroundColor White
                Write-Host "- CORS is configured to allow requests" -ForegroundColor White
            }
        }
    }
    
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
