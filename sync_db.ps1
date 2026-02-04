$ErrorActionPreference = "Stop"

Write-Host ">>> Starting Database Synchronization..."
Write-Host ">>> This script will download the live database from the production server."

# 1. Backup local DB
if (Test-Path ".\data\db.sqlite") {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backupName = "db.sqlite.bak-$timestamp"
    Write-Host ">>> Backing up local database to .\data\$backupName..."
    Rename-Item -Path ".\data\db.sqlite" -NewName $backupName
}

# 2. Download remote DB
try {
    Write-Host ">>> Connecting to server (mastaba.myf-online.com)..."
    Write-Host ">>> You may be asked for the server 'root' password."
    
    scp -O root@mastaba.myf-online.com:/var/www/apps/scientific-bench/data/db.sqlite .\data\db.sqlite
    
    if (Test-Path ".\data\db.sqlite") {
        Write-Host " "
        Write-Host ">>> ✅ Database synchronized successfully!" -ForegroundColor Green
        Write-Host ">>> The application now has the latest data from the live server."
    }
    else {
        Write-Error "Download failed: File not found after SCP."
    }
}
catch {
    Write-Host " "
    Write-Host ">>> ❌ SCP Failed." -ForegroundColor Red
    Write-Host "Error: $_"
    
    # Restore backup if failed
    if (Test-Path ".\data\$backupName") {
        Write-Host ">>> Restoring backup..."
        Rename-Item -Path ".\data\$backupName" -NewName "db.sqlite"
    }
}
