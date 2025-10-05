# Complete Deployment Script for HSE System
Write-Host "HSE System Complete Deployment Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

Write-Host "`nCurrent Status:" -ForegroundColor Yellow
Write-Host "Frontend (Netlify): https://phenomenal-lebkuchen-289df9.netlify.app" -ForegroundColor Green
Write-Host "Backend (Railway): Ready for deployment" -ForegroundColor Yellow

Write-Host "`nRailway Deployment Steps:" -ForegroundColor Yellow
Write-Host "1. Go to: https://railway.app" -ForegroundColor Cyan
Write-Host "2. Sign in with GitHub" -ForegroundColor Cyan
Write-Host "3. Click New Project > Deploy from GitHub repo" -ForegroundColor Cyan
Write-Host "4. Select repository: Sarab2004/GityMiniProject" -ForegroundColor Cyan
Write-Host "5. Set Root Directory to: backend" -ForegroundColor Cyan
Write-Host "6. Add Environment Variables:" -ForegroundColor Cyan
Write-Host "   - DEBUG=False" -ForegroundColor White
Write-Host "   - SECRET_KEY=django-insecure-change-me-for-production" -ForegroundColor White
Write-Host "   - ALLOWED_HOSTS=*" -ForegroundColor White
Write-Host "   - CORS_ALLOWED_ORIGINS=https://phenomenal-lebkuchen-289df9.netlify.app" -ForegroundColor White
Write-Host "7. Add PostgreSQL Database" -ForegroundColor Cyan
Write-Host "8. Click Deploy and wait 5-10 minutes" -ForegroundColor Cyan

Write-Host "`nAfter Railway deployment is complete:" -ForegroundColor Yellow
$RAILWAY_DOMAIN = Read-Host "Enter your Railway domain (e.g., https://xxx.railway.app)"

Write-Host "`nUpdating Netlify environment variables..." -ForegroundColor Yellow
netlify env:set NEXT_PUBLIC_API_BASE_URL "$RAILWAY_DOMAIN"

Write-Host "`nRedeploying to Netlify..." -ForegroundColor Yellow
netlify deploy --prod

Write-Host "`nDeployment Complete!" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host "Frontend: https://phenomenal-lebkuchen-289df9.netlify.app" -ForegroundColor Cyan
Write-Host "Backend: $RAILWAY_DOMAIN" -ForegroundColor Cyan
Write-Host "Admin: $RAILWAY_DOMAIN/admin" -ForegroundColor Cyan
Write-Host "Login: admin / admin123" -ForegroundColor Cyan

Write-Host "`nYour HSE System is now live and fully functional!" -ForegroundColor Green
