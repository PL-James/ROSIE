# Quick Start - Complete the Demo Environment Setup

## Status

✅ **Implementation Complete** - All code written and committed
✅ **Branch Created** - `feat/ephemeral-demo-environment`
⏳ **PR Pending** - Needs push to GitHub
⏳ **Worker Pending** - Needs deployment to Cloudflare

---

## Step 1: Push Branch and Create PR (2 minutes)

```bash
# Push the branch
git push -u origin feat/ephemeral-demo-environment

# Create PR via GitHub CLI
gh pr create \
  --title "feat: Add ephemeral demo environment with public access" \
  --body "See PR description in terminal output above" \
  --base main

# OR create via GitHub UI:
# Visit: https://github.com/PL-James/ROSIE/compare/feat/ephemeral-demo-environment
```

---

## Step 2: Deploy Cloudflare Worker (15 minutes)

### Prerequisites

From your `.tokens` file, you need:
- `CLOUDFLARE_API_TOKEN` (or use interactive login)
- `GITHUB_PAT` (for worker secret)

### Quick Deploy

```bash
cd cloudflare-worker

# Option A: Interactive (Recommended)
chmod +x DEPLOYMENT-COMMANDS.sh
./DEPLOYMENT-COMMANDS.sh

# Option B: Manual Steps
npm install
wrangler login                           # Opens browser for auth
wrangler secret put GITHUB_TOKEN         # Paste GITHUB_PAT
wrangler secret put ALLOWED_ORIGINS      # Enter: https://pl-james.github.io
wrangler deploy                          # Deploy worker
```

### Copy Worker URL

After deployment, copy the worker URL:
```
https://rosie-demo-api.YOUR-SUBDOMAIN.workers.dev
```

---

## Step 3: Update Demo Page with Worker URL (1 minute)

```bash
# Edit src/pages/demo.astro
# Find line ~396:
const WORKER_URL = 'https://rosie-demo-api.your-subdomain.workers.dev';

# Replace with YOUR actual worker URL:
const WORKER_URL = 'https://rosie-demo-api.YOUR-ACTUAL-SUBDOMAIN.workers.dev';

# Commit and push
git add src/pages/demo.astro
git commit -m "Configure Cloudflare Worker URL"
git push
```

---

## Step 4: Test End-to-End (5 minutes)

### 4a. Wait for GitHub Pages Deployment

```bash
# Check deployment status
gh run list --workflow=pages-build-deployment --limit 3

# Or visit: https://github.com/PL-James/ROSIE/actions
```

Wait for "pages-build-deployment" to complete (~2-3 minutes).

### 4b. Test Worker Health

```bash
curl https://rosie-demo-api.YOUR-SUBDOMAIN.workers.dev/health

# Expected response:
# {"status":"healthy","timestamp":"2026-02-03T..."}
```

### 4c. Test Demo Page

1. Open: https://pl-james.github.io/ROSIE/demo/
2. Fill in optional email
3. Select duration (30 min)
4. Click "Launch Demo Environment"
5. Verify:
   - Progress bar animates
   - Status messages update
   - No CORS errors in console (F12)
   - Demo URL appears after ~60-90s
   - Dashboard loads when you click URL

### 4d. Verify Cleanup

```bash
# Check Codespace was created
gh codespace list --repo PL-James/ROSIE

# Check workflow ran
gh run list --workflow=create-demo.yml --limit 3

# Check demo issue created
gh issue list --label demo --state open --limit 3
```

---

## Troubleshooting

### Issue: "CORS error" in browser console

**Solution:**
```bash
cd cloudflare-worker
wrangler secret put ALLOWED_ORIGINS
# Enter EXACTLY: https://pl-james.github.io
# NO trailing slash!
wrangler deploy
```

### Issue: "Failed to trigger workflow"

**Causes:**
- GITHUB_TOKEN secret not set correctly
- Token doesn't have required scopes (`repo`, `workflow`)

**Solution:**
```bash
# Test your GITHUB_PAT
curl -H "Authorization: Bearer YOUR_GITHUB_PAT" \
  https://api.github.com/user

# Should return your GitHub user info
# If 401/403 error, regenerate token with correct scopes

# Update worker secret
wrangler secret put GITHUB_TOKEN
# Paste new token
```

### Issue: "Demo never becomes ready"

**Check:**
```bash
# 1. Check workflow status
gh run list --workflow=create-demo.yml --limit 3
gh run view <run-id> --log

# 2. Check if Codespace was created
gh codespace list --repo PL-James/ROSIE

# 3. Check if issue was created
gh issue list --label demo --state open --limit 3
```

---

## Verification Checklist

Before announcing publicly:

- [ ] ✅ Branch pushed to GitHub
- [ ] ✅ PR created and reviewed
- [ ] ✅ Cloudflare Worker deployed
- [ ] ✅ Worker URL updated in demo page
- [ ] ✅ GitHub Pages rebuilt with changes
- [ ] ✅ Worker health check passes
- [ ] ✅ Demo launches successfully (end-to-end test)
- [ ] ✅ Workflow triggers and completes
- [ ] ✅ Codespace created
- [ ] ✅ Demo URL returned to page
- [ ] ✅ Dashboard accessible and functional
- [ ] ✅ Auto-cleanup works (wait for TTL)
- [ ] ✅ No console errors
- [ ] ✅ Tested in incognito/private mode
- [ ] ✅ Tested on different browsers

---

## What Was Built

### Files Created (19 new files)

**Infrastructure:**
- `.devcontainer/devcontainer.json`
- `.github/workflows/create-demo.yml`
- `.github/workflows/cleanup-demo.yml`

**Frontend:**
- `src/pages/demo.astro` (public demo page)
- `poc/loading.html` (startup screen)

**Backend Proxy:**
- `cloudflare-worker/demo-api-proxy.ts`
- `cloudflare-worker/wrangler.toml`
- `cloudflare-worker/package.json`
- `cloudflare-worker/README.md`
- `cloudflare-worker/DEPLOYMENT-COMMANDS.sh`

**Documentation:**
- `DEMO-DEPLOYMENT-GUIDE.md`
- `PUBLIC-DEMO-IMPLEMENTATION.md`
- `DEMO-ENVIRONMENT.md`
- `TESTING-GUIDE.md`
- `DEMO-QUICK-REFERENCE.md`
- `IMPLEMENTATION-SUMMARY.md`
- `QUICK-START.md` (this file)

**Modified:**
- `README.md` (updated demo section)
- `src/layouts/BaseLayout.astro` (added demo link)
- `poc/dashboard/Dockerfile` (loading page integration)
- `poc/docker-compose.yml` (build context update)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User (No GitHub Account)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 1. Visits /demo page
                     ↓
┌─────────────────────────────────────────────────────────┐
│             GitHub Pages (pl-james.github.io/ROSIE)     │
│  • Astro static site                                    │
│  • /demo page with JavaScript                          │
│  • No auth required                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 2. POST /create
                     ↓
┌─────────────────────────────────────────────────────────┐
│         Cloudflare Worker (rosie-demo-api)              │
│  • Proxies GitHub API                                   │
│  • Stores GITHUB_PAT securely                           │
│  • Enforces CORS                                        │
│  • Triggers workflow                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 3. workflow_dispatch
                     ↓
┌─────────────────────────────────────────────────────────┐
│          GitHub Actions (create-demo.yml)               │
│  • Creates Codespace                                    │
│  • Starts services                                      │
│  • Creates issue                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 4. Unique URL
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   GitHub Codespace                      │
│  • ROSIE Dashboard (port 8080)                         │
│  • SoR API (port 3000)                                 │
│  • Auto-cleanup after TTL                              │
└─────────────────────────────────────────────────────────┘
```

---

## Cost Summary

| Resource | Free Tier | Per Demo | Notes |
|----------|-----------|----------|-------|
| GitHub Codespaces | 120 core-hrs/mo | $0.09 | 2-core, 30 min |
| Cloudflare Workers | 100K req/day | ~$0.000007 | 13 req/demo |
| GitHub Actions | Unlimited | $0.00 | Public repos |
| GitHub Pages | Unlimited | $0.00 | Static hosting |

**Total:** First 60 demos/month FREE, then $0.09/demo

---

## Next Steps After Testing

1. **Monitor usage**
   - Check Codespaces quota: Settings → Billing → Codespaces
   - View worker analytics: Cloudflare dashboard
   - Track demos: GitHub Issues with `demo` label

2. **Gather feedback**
   - Create GitHub Discussion for user feedback
   - Monitor Issues for bug reports
   - Test with external users

3. **Announce publicly**
   - Blog post / social media
   - Update main README
   - Add to project homepage

4. **Consider enhancements** (optional)
   - Email notifications via Resend API
   - Pre-built Docker images (faster startup)
   - Custom domain (demo.rosie.dev)
   - Usage analytics dashboard

---

## Support

**Documentation:**
- Full deployment: `DEMO-DEPLOYMENT-GUIDE.md`
- Architecture: `PUBLIC-DEMO-IMPLEMENTATION.md`
- Testing: `TESTING-GUIDE.md`
- User guide: `DEMO-ENVIRONMENT.md`

**Help:**
- GitHub Discussions: https://github.com/PL-James/ROSIE/discussions
- GitHub Issues: https://github.com/PL-James/ROSIE/issues

---

**Total Time:** ~20 minutes to complete all steps

**Status after completion:** 🎉 Public demos live and accessible!
