#!/bin/bash
# Quick deployment script for Netlify
# Usage: ./deploy.sh [production|preview]

set -e

MODE=${1:-preview}

echo "======================================"
echo "Deploying to Netlify"
echo "Mode: $MODE"
echo "======================================"
echo ""

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found!"
    echo "Install with: npm install -g netlify-cli"
    exit 1
fi

# Check if logged in
if ! netlify status &> /dev/null; then
    echo "❌ Not logged in to Netlify!"
    echo "Run: netlify login"
    exit 1
fi

# Deploy
if [ "$MODE" == "production" ] || [ "$MODE" == "prod" ]; then
    echo "🚀 Deploying to PRODUCTION..."
    netlify deploy --prod
else
    echo "🔍 Deploying PREVIEW..."
    netlify deploy
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Check deployment status: netlify status"
echo "2. View function logs: netlify functions:log proxy"
echo "3. Test the deployment: ./scripts/test-proxy.sh <domain>"
