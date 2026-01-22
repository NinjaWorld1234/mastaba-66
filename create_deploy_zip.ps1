$zipName = "deploy_fix_student_login.zip"
$files = @(
    "dist",
    "server",
    "server.cjs",
    "package.json",
    "package-lock.json",
    "db.json"
)

if (Test-Path $zipName) {
    Remove-Item $zipName
}

Compress-Archive -Path $files -DestinationPath $zipName -Force
Write-Host "Created $zipName"
