#!/bin/bash
# Initial setup script
# Usage: ./setup.sh

set -e

echo "======================================"
echo "V2Ray Netlify Proxy - Setup"
echo "======================================"
echo ""

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Found $NODE_VERSION"
else
    echo "✗ Not found!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✓ Found v$NPM_VERSION"
else
    echo "✗ Not found!"
    echo "npm should come with Node.js"
    exit 1
fi

# Install Netlify CLI
echo -n "Checking Netlify CLI... "
if command -v netlify &> /dev/null; then
    NETLIFY_VERSION=$(netlify --version | head -n1)
    echo "✓ Found $NETLIFY_VERSION"
else
    echo "Not found. Installing..."
    npm install -g netlify-cli
    echo "✓ Installed"
fi

# Login to Netlify
echo ""
echo "Logging in to Netlify..."
netlify login

# Initialize site
echo ""
echo "Initializing Netlify site..."
netlify init

echo ""
echo "======================================"
echo "✓ Setup complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Deploy: ./scripts/deploy.sh production"
echo "2. Test: ./scripts/test-proxy.sh <your-domain>.netlify.app"
echo "3. Configure V2Ray client (see V2RAY_CONFIG_EXAMPLES.md)"
echo ""
echo "Useful commands:"
echo "  netlify status         - Check site status"
echo "  netlify open           - Open admin panel"
echo "  netlify functions:log  - View function logs"
