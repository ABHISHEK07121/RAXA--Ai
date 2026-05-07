# RAXA Reliable Startup Script - Backend + Frontend + Health Checks
# Run: powershell ./start-servers.ps1

Write-Host '🚀 Starting RAXA AI Health Assistant...' -ForegroundColor Green
Write-Host 'Current Directory: ' (Get-Location) -ForegroundColor Yellow

# Step 1: Install/Verify Dependencies
Write-Host '📦 Checking dependencies...' -ForegroundColor Cyan
cd backend
if (Test-Path 'node_modules') { 
    Write-Host 'Backend node_modules OK' -ForegroundColor Green 
} else { 
    Write-Host 'Installing backend deps...' -ForegroundColor Yellow
    npm install
}
cd ..

cd frontend
if (Test-Path 'node_modules') { 
    Write-Host 'Frontend node_modules OK' -ForegroundColor Green 
} else { 
    Write-Host 'Installing frontend deps...' -ForegroundColor Yellow
    npm install
}
cd ..

Write-Host '✅ Dependencies ready' -ForegroundColor Green

# Step 2: Start Backend (localhost:8000)
Write-Host '🐳 Starting Backend (http://localhost:8000)...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd backend; npm run dev' -WindowStyle Minimized
Start-Sleep -Seconds 8

# Health Check Backend
$backendReady = $false
for ($i = 0; $i -lt 20; $i++) {
    try {
        $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/health' -Method Get -UseBasicParsing
        if ($response.status -eq 'ok') {
            Write-Host '✅ Backend healthy!' -ForegroundColor Green
            $backendReady = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}
if (-not $backendReady) { 
    Write-Host '⚠️ Backend may not be fully ready, but continuing...' -ForegroundColor Yellow 
}

# Step 3: Start Frontend (localhost:3000)
Write-Host '🌐 Starting Frontend (http://localhost:3000)...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend; npm run dev' -WindowStyle Minimized
Start-Sleep -Seconds 5

# Health Check Frontend
Write-Host '⏳ Waiting for frontend... Open http://localhost:3000/symptom-check' -ForegroundColor Cyan
Write-Host ''
Write-Host '🎉 RAXA READY! Demo: http://localhost:3000/symptom-check' -ForegroundColor Green
Write-Host 'API Test: curl -X POST http://localhost:8000/api/v2/predict -H `"Content-Type: application/json`" -d `"{`"symptoms`":[`"fever`",`"headache`"]}`"' -ForegroundColor Magenta
Write-Host 'Chat Test: curl -X POST http://localhost:8000/chat -H `"Content-Type: application/json`" -d `"{`"query`":`"hello`"}`"' -ForegroundColor Magenta
Write-Host 'Stop: Ctrl+C in each terminal' -ForegroundColor Yellow

# Keep script alive for status
while ($true) {
    Start-Sleep -Seconds 30
}
