# Script to clean ALL corrupted TypeScript files in MCPQL
# Run from PowerShell

$projectPath = "..\src"
$backupPath = "..\src_backup"

Write-Host "Cleaning all TypeScript files in MCPQL..." -ForegroundColor Yellow

# Create backup directory
if (-not (Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath -Force
    Write-Host "Backup directory created: $backupPath" -ForegroundColor Green
}

# Get all .ts files
$tsFiles = Get-ChildItem -Path $projectPath -Filter "*.ts" -Recurse

foreach ($file in $tsFiles) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Cyan
    
    # Create backup
    $backupFile = Join-Path $backupPath $file.Name
    Copy-Item $file.FullName $backupFile -Force
    
    try {
        # Read as bytes
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        
        # Remove UTF-8 BOM (EF BB BF) if exists
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            $bytes = $bytes[3..($bytes.Length-1)]
            Write-Host "  - UTF-8 BOM removed from $($file.Name)" -ForegroundColor Yellow
        }
        
        # Convert to string and clean invalid characters
        $content = [System.Text.Encoding]::UTF8.GetString($bytes)
        
        # Remove problematic control characters but keep line breaks and tabs
        $content = $content -replace '[^\x09\x0A\x0D\x20-\x7E]', ''
        
        # Write clean file without BOM
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        
        Write-Host "  - File cleaned: $($file.Name)" -ForegroundColor Green
        
    } catch {
        Write-Host "  - Error processing $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "`nProcess completed. Backup files in: $backupPath" -ForegroundColor Green
Write-Host "Try running: npx tsx ./src/server.ts" -ForegroundColor Cyan