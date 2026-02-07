$envContent = Get-Content .env -Raw
$newConfig = "`n# NEW VPS CONFIGURATION FOR MUSLIMYOUTH.PS`n# PORT=3001`n# SMTP_HOST=smtp.gmail.com`n# SMTP_PORT=587`n# SMTP_USER=(Fill in)`n# SMTP_PASS=(Fill in)"
Set-Content -Path .env.production.vps -Value ($envContent + $newConfig) -Encoding UTF8
if (Test-Path deploy_vps_new.zip) { Remove-Item deploy_vps_new.zip -Force }
$files = @("dist", "server", "server.cjs", "package.json", "package-lock.json", "db.json", ".env.production.vps", "docker-compose.yml", "Dockerfile")
Compress-Archive -Path $files -DestinationPath deploy_vps_new.zip -Force
Write-Host "Zip Created. Size: $((Get-Item deploy_vps_new.zip).Length / 1MB) MB"
