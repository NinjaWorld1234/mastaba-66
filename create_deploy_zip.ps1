$zipName = "deploy_production_latest.zip"
$files = @(
    "dist",
    "server",
    "server.cjs",
    "package.json",
    "package-lock.json",
    "db.json",
    ".env",
    "deploy.sh",
    "docker-compose.yml",
    "Dockerfile",
    "nginx_app.conf"
)

if (Test-Path $zipName) {
    Remove-Item $zipName
}

Compress-Archive -Path $files -DestinationPath $zipName -Force
Write-Host "Created $zipName"
