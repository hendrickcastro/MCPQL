# Fix for Azure MSAL module issue when using npx
# This script addresses the "Cannot find module './index-node-CtW_2rqJ.js'" error

Write-Host "Fixing Azure MSAL dependencies for npx usage..." -ForegroundColor Yellow

# Clear npm cache
npm cache clean --force

# Remove problematic cached npx packages
$npxCachePath = "$env:LOCALAPPDATA\npm-cache\_npx"
if (Test-Path $npxCachePath) {
    Write-Host "Clearing npx cache..." -ForegroundColor Green
    Remove-Item -Recurse -Force $npxCachePath -ErrorAction SilentlyContinue
}

# Alternative: Install globally to avoid npx cache issues
Write-Host "Installing MCPQL globally to avoid npx cache issues..." -ForegroundColor Green
npm install -g mcpql

Write-Host "Fix completed. You can now use 'mcpql' directly instead of 'npx mcpql'" -ForegroundColor Green
Write-Host "If you still prefer npx, try: npx --yes mcpql" -ForegroundColor Cyan