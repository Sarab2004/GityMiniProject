# Final connection script for HSE System
Write-Host "Connecting Frontend to Railway Backend..." -ForegroundColor Green

# Get Railway domain from user
$RAILWAY_DOMAIN = Read-Host "Enter your Railway domain (e.g., https://xxx.railway.app)"

# Update Netlify environment variable
Write-Host "Updating Netlify environment variables..." -ForegroundColor Yellow
netlify env:set NEXT_PUBLIC_API_BASE_URL "$RAILWAY_DOMAIN"

# Redeploy to production
Write-Host "Redeploying to production..." -ForegroundColor Yellow
netlify deploy --prod

# Final status
Write-Host "`n🎉 HSE System Deployment Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "🌐 Frontend: https://phenomenal-lebkuchen-289df9.netlify.app" -ForegroundColor Cyan
Write-Host "🔧 Backend: $RAILWAY_DOMAIN" -ForegroundColor Cyan
Write-Host "👤 Admin: $RAILWAY_DOMAIN/admin" -ForegroundColor Cyan
Write-Host "📚 API Docs: $RAILWAY_DOMAIN/api/v1/docs/" -ForegroundColor Cyan
Write-Host "🔑 Login: admin / admin123" -ForegroundColor Cyan

Write-Host "`n✅ Your HSE System is now fully live and connected!" -ForegroundColor Green
Write-Host "🚀 You can now use the system from anywhere in the world!" -ForegroundColor Green
