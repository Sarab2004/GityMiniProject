#!/bin/bash

# Script to update Netlify environment variables after Railway deployment

echo "🚀 Updating Netlify Environment Variables..."

# Get Railway domain from user
echo "Please enter your Railway domain (e.g., https://xxx.railway.app):"
read RAILWAY_DOMAIN

# Update Netlify environment variable
echo "Setting NEXT_PUBLIC_API_BASE_URL to $RAILWAY_DOMAIN..."
netlify env:set NEXT_PUBLIC_API_BASE_URL "$RAILWAY_DOMAIN"

# Redeploy to production
echo "Redeploying to production..."
netlify deploy --prod

echo "✅ Done! Your frontend is now connected to the backend."
echo "🌐 Frontend: https://phenomenal-lebkuchen-289df9.netlify.app"
echo "🔧 Backend: $RAILWAY_DOMAIN"
