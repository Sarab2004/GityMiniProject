# Script to connect Frontend to Render Backend
Write-Host "Connecting Frontend to Render Backend..." -ForegroundColor Green

# Get Render domain from user
$RENDER_DOMAIN = Read-Host "Enter your Render domain (e.g., https://xxx.onrender.com)"

# Update Netlify environment variable
Write-Host "Updating Netlify environment variables..." -ForegroundColor Yellow
netlify env:set NEXT_PUBLIC_API_BASE_URL "$RENDER_DOMAIN"

# Redeploy to production
Write-Host "Redeploying to production..." -ForegroundColor Yellow
netlify deploy --prod

# Final status
Write-Host "`nDeployment Complete!" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host "Frontend: https://phenomenal-lebkuchen-289df9.netlify.app" -ForegroundColor Cyan
Write-Host "Backend: $RENDER_DOMAIN" -ForegroundColor Cyan
Write-Host "Admin: $RENDER_DOMAIN/admin" -ForegroundColor Cyan
Write-Host "Login: admin / admin123" -ForegroundColor Cyan

Write-Host "`nYour HSE System is now fully connected and live!" -ForegroundColor Green
