$source = "d:\Naser-Programs\MYF-Site-main3"
$destination = "d:\Naser-Programs\MYF-Site-main3\deploy_v3_r2_patch.zip"
$exclude = @("node_modules", ".git", "dist", ".vscode", "deploy_v3_sqlite.zip", "data", "deploy_v3_final.zip", "deploy_v3_fixed_r2.zip", "deploy_v3_r2_patch.zip")

if (Test-Path $destination) { Remove-Item $destination }

Get-ChildItem -Path $source | Where-Object { $exclude -notcontains $_.Name } | Compress-Archive -DestinationPath $destination -CompressionLevel Optimal -Force
