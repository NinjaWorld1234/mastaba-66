$envContent = Get-Content .env -Raw
$newConfig = "`n# NEW VPS CONFIGURATION FOR MUSLIMYOUTH.PS`n# PORT=3001`n# SMTP_HOST=smtp.gmail.com`n# SMTP_PORT=587`n# SMTP_USER=(Fill in)`n# SMTP_PASS=(Fill in)"
Set-Content -Path .env.production.vps -Value ($envContent + $newConfig) -Encoding UTF8
# Create a copy as .env for Docker Compose
Copy-Item .env.production.vps .env.deploy_temp -Force
if (Test-Path deploy_production_latest.zip) { Remove-Item deploy_production_latest.zip -Force }
$files = @("dist", "server", "server.cjs", "package.json", "package-lock.json", "db.json", ".env.production.vps", "docker-compose.yml", "Dockerfile", "nginx_app.conf", "deploy.sh")
# Temporarily rename to .env for zipping
Rename-Item .env.deploy_temp .env -Force
Compress-Archive -Path ($files + ".env") -DestinationPath deploy_production_latest.zip -Force
Remove-Item .env -Force # Remove local .env if we created it (assuming we use .env.production.vps as source)
Write-Host "Zip Created. Size: $((Get-Item deploy_production_latest.zip).Length / 1MB) MB"
