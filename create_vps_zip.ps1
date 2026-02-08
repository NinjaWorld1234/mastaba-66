$zipName = "deploy_vps_new.zip"
$files = @(
    "dist",
    "server",
    "server.cjs",
    "package.json",
    "package-lock.json",
    "db.json",
    ".env.production.vps", 
    "docker-compose.yml",
    "Dockerfile"
)

if (Test-Path $zipName) {
    Remove-Item $zipName
}

Compress-Archive -Path $files -DestinationPath $zipName -Force
Write-Host "Created $zipName"
