# start.ps1 - One-click start for MQTT broker + React frontend

Write-Host "Starting MQTT + React project" -ForegroundColor Cyan

# 1. Start Mosquitto Broker
Write-Host "Starting Mosquitto Broker..." -ForegroundColor Yellow

# Change these paths to match your actual installation
$mosquittoExe  = "C:\Program Files\mosquitto\mosquitto.exe"
$mosquittoConf = "C:\Program Files\mosquitto\mosquitto.conf"

if (Test-Path $mosquittoExe) {
    # Use escaped quotes for paths with spaces
    $argList = "-c", "`"$mosquittoConf`""
    
    Start-Process -FilePath $mosquittoExe -ArgumentList $argList -NoNewWindow -Wait:$false
    Write-Host "Mosquitto launch command sent" -ForegroundColor Green
    Write-Host "(Check for a separate Mosquitto console window to see if it starts successfully)"
} else {
    Write-Host "Mosquitto executable not found: $mosquittoExe" -ForegroundColor Red
    Write-Host "Please update the path in the script." -ForegroundColor Red
}

Start-Sleep -Seconds 3

# 2. Start React frontend
$reactFolder = "C:\Users\omen\Desktop\Documents\Projects\mqtt-sensor-dashboard\"

if (Test-Path $reactFolder) {
    Write-Host "Changing to React project folder: $reactFolder" -ForegroundColor Yellow
    Set-Location $reactFolder

    Write-Host "Running npm start..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
} else {
    Write-Host "React project folder not found: $reactFolder" -ForegroundColor Red
    Write-Host "Please update the path in the script." -ForegroundColor Red
}

Write-Host "`nStartup commands sent!" -ForegroundColor Cyan
Write-Host "→ Mosquitto should now start correctly (watch for its own window or logs)"
Write-Host "→ React dev server usually opens at http://localhost:3000"
Write-Host "Use Ctrl+C in each window to stop the services`n"

pause