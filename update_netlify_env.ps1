# PowerShell script to update Netlify environment variables after Railway deployment

Write-Host "🚀 Updating Netlify Environment Variables..." -ForegroundColor Green

# Get Railway domain from user
$RAILWAY_DOMAIN = Read-Host "Please enter your Railway domain (e.g., https://xxx.railway.app)"

# Update Netlify environment variable
Write-Host "Setting NEXT_PUBLIC_API_BASE_URL to $RAILWAY_DOMAIN..." -ForegroundColor Yellow
netlify env:set NEXT_PUBLIC_API_BASE_URL "$RAILWAY_DOMAIN"

# Redeploy to production
Write-Host "Redeploying to production..." -ForegroundColor Yellow
netlify deploy --prod

Write-Host "✅ Done! Your frontend is now connected to the backend." -ForegroundColor Green
Write-Host "🌐 Frontend: https://phenomenal-lebkuchen-289df9.netlify.app" -ForegroundColor Cyan
Write-Host "🔧 Backend: $RAILWAY_DOMAIN" -ForegroundColor Cyan
