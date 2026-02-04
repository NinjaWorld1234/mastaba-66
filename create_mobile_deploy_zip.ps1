$zipName = "deploy_mobile_update.zip"
$files = @(
    "dist",
    "server",
    "server.cjs",
    "package.json",
    "package-lock.json",
    "db.json",
    "deploy.sh"
)

if (Test-Path $zipName) {
    Remove-Item $zipName
}

Compress-Archive -Path $files -DestinationPath $zipName -Force
Write-Host "Created $zipName"
