# Script to connect Frontend to Backend after Railway deployment
Write-Host "Connecting Frontend to Backend..." -ForegroundColor Green

# Get Railway domain from user
$RAILWAY_DOMAIN = Read-Host "Enter your Railway domain (e.g., https://xxx.railway.app)"

# Update Netlify environment variable
Write-Host "Updating Netlify environment variables..." -ForegroundColor Yellow
netlify env:set NEXT_PUBLIC_API_BASE_URL "$RAILWAY_DOMAIN"

# Redeploy to production
Write-Host "Redeploying to production..." -ForegroundColor Yellow
netlify deploy --prod

# Final status
Write-Host "`nDeployment Complete!" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host "Frontend: https://phenomenal-lebkuchen-289df9.netlify.app" -ForegroundColor Cyan
Write-Host "Backend: $RAILWAY_DOMAIN" -ForegroundColor Cyan
Write-Host "Admin: $RAILWAY_DOMAIN/admin" -ForegroundColor Cyan
Write-Host "Login: admin / admin123" -ForegroundColor Cyan

Write-Host "`nYour HSE System is now fully connected and live!" -ForegroundColor Green
