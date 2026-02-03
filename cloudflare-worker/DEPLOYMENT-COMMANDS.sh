#!/bin/bash
#
# Cloudflare Worker Deployment Script for ROSIE Demo API
# Run this script after completing the PR to deploy the worker
#

set -e

echo "🚀 ROSIE Demo API - Cloudflare Worker Deployment"
echo "================================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
fi

# Navigate to worker directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing worker dependencies..."
npm install

# Authenticate with Cloudflare
echo ""
echo "🔐 Step 1: Authenticate with Cloudflare"
echo "========================================="
echo ""
echo "Choose authentication method:"
echo ""
echo "Option A - Interactive Login (Recommended):"
echo "  wrangler login"
echo ""
echo "Option B - API Token (from .tokens file):"
echo "  export CLOUDFLARE_API_TOKEN=\$CLOUDFLARE_API_TOKEN"
echo "  (Token will be read from environment)"
echo ""
read -p "Press Enter when authenticated..."

# Verify authentication
echo ""
echo "Verifying authentication..."
wrangler whoami

# Set secrets
echo ""
echo "🔐 Step 2: Set Worker Secrets"
echo "=============================="
echo ""
echo "Setting GITHUB_TOKEN secret..."
echo "Paste your GITHUB_PAT value when prompted"
echo ""
wrangler secret put GITHUB_TOKEN

echo ""
echo "Setting ALLOWED_ORIGINS secret..."
echo "Enter: https://pl-james.github.io"
echo ""
wrangler secret put ALLOWED_ORIGINS

# Deploy worker
echo ""
echo "🚀 Step 3: Deploy Worker"
echo "========================"
echo ""
wrangler deploy

# Get worker URL
echo ""
echo "✅ Deployment Complete!"
echo "======================="
echo ""
echo "Your worker is now deployed. Copy the worker URL from above."
echo ""
echo "📝 Next Steps:"
echo "1. Copy the worker URL (https://rosie-demo-api.YOUR-SUBDOMAIN.workers.dev)"
echo "2. Update src/pages/demo.astro line 396 with this URL"
echo "3. Commit and push the change"
echo "4. Test the demo page"
echo ""
echo "📚 Full deployment guide: ../DEMO-DEPLOYMENT-GUIDE.md"
echo ""
