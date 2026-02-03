# ROSIE Demo Environment - Deployment Guide

## Critical Context

**External developers do NOT have:**
- Write access to this repository
- GitHub Actions trigger permissions
- Ability to run workflows

Therefore, the **Cloudflare Worker + GitHub Pages button** is the **only viable approach** for public demo access. The GitHub Actions workflow badge in README is only usable by repository maintainers.

## Deployment Checklist

Follow these steps to enable public demo access:

### ✅ Step 1: Deploy Cloudflare Worker

**Prerequisites:**
- Cloudflare account (free tier sufficient)
- GitHub Personal Access Token (from `.tokens`: `GITHUB_PAT`)

**Commands:**

```bash
# Install Wrangler CLI (if not already installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Navigate to worker directory
cd cloudflare-worker

# Install dependencies
npm install

# Set secrets
wrangler secret put GITHUB_TOKEN
# Paste value of GITHUB_PAT from .tokens file

wrangler secret put ALLOWED_ORIGINS
# Enter: https://pl-james.github.io

# Deploy worker
wrangler deploy
```

**Expected output:**
```
✨ Deployed to: https://rosie-demo-api.YOUR-SUBDOMAIN.workers.dev
```

**Copy this URL** - you'll need it in Step 2.

---

### ✅ Step 2: Update Demo Page Configuration

Edit `src/pages/demo.astro` (line ~396):

```typescript
// BEFORE:
const WORKER_URL = 'https://rosie-demo-api.your-subdomain.workers.dev';

// AFTER (replace with YOUR worker URL from Step 1):
const WORKER_URL = 'https://rosie-demo-api.YOUR-ACTUAL-SUBDOMAIN.workers.dev';
```

---

### ✅ Step 3: Commit and Push Changes

```bash
git add src/pages/demo.astro src/layouts/BaseLayout.astro README.md
git commit -m "Add public demo page with Cloudflare Worker integration"
git push origin main
```

GitHub Pages will automatically rebuild and deploy (takes ~2-3 minutes).

---

### ✅ Step 4: Verify Deployment

**4a. Check GitHub Pages deployment:**

1. Go to: Settings → Pages
2. Verify deployment status: ✅ "Your site is live at https://pl-james.github.io/ROSIE/"
3. Wait for build to complete (Actions tab)

**4b. Test worker endpoint:**

```bash
# Health check
curl https://rosie-demo-api.YOUR-SUBDOMAIN.workers.dev/health

# Expected response:
# {"status":"healthy","timestamp":"2026-02-03T..."}
```

**4c. Test demo page:**

1. Open: https://pl-james.github.io/ROSIE/demo/
2. Click "Launch Demo Environment"
3. Verify no CORS errors in browser console (F12)
4. Wait ~60-90 seconds
5. Check for demo URL

**4d. Verify workflow triggered:**

```bash
# Check recent workflow runs
gh run list --workflow=create-demo.yml --limit 5

# Should show a new run with status "in_progress" or "completed"
```

---

### ✅ Step 5: Test End-to-End

**Full user journey test:**

1. ✅ Visit demo page
2. ✅ Enter optional email
3. ✅ Select duration
4. ✅ Click "Launch Demo Environment"
5. ✅ See status screen with progress bar
6. ✅ Wait for "Demo Ready" screen (~60-90s)
7. ✅ Click "Open ROSIE Dashboard"
8. ✅ Verify dashboard loads with sample data
9. ✅ Wait for TTL expiry (or test with 10min duration)
10. ✅ Verify Codespace auto-deleted

---

## Troubleshooting Deployment

### Issue: Worker deployment fails

**Error:** `Authentication required`

**Solution:**
```bash
wrangler logout
wrangler login
wrangler deploy
```

---

### Issue: CORS error in browser console

**Error:** `Access to fetch at '...' from origin 'https://pl-james.github.io' has been blocked by CORS policy`

**Solution:**
```bash
# Update allowed origins
wrangler secret put ALLOWED_ORIGINS

# Enter exactly: https://pl-james.github.io
# NO trailing slash!

# Redeploy
wrangler deploy
```

---

### Issue: "Failed to trigger workflow"

**Error:** `401 Unauthorized` or `403 Forbidden`

**Solution:**

1. Verify GITHUB_PAT has correct scopes:
   ```bash
   # Test token
   curl -H "Authorization: Bearer $GITHUB_PAT" https://api.github.com/user
   ```

2. Required scopes:
   - ✅ `repo` (full control of private repositories)
   - ✅ `workflow` (update GitHub Action workflows)

3. Regenerate token if needed:
   - Go to: GitHub → Settings → Developer settings → Personal access tokens
   - Generate new token with required scopes
   - Update `.tokens` file
   - Update worker secret:
     ```bash
     wrangler secret put GITHUB_TOKEN
     ```

---

### Issue: GitHub Pages not updating

**Solution:**

1. Check Actions tab for deployment status
2. Verify `gh-pages` branch exists
3. Check Settings → Pages → Source: `gh-pages` branch
4. Force rebuild:
   ```bash
   git commit --allow-empty -m "Trigger Pages rebuild"
   git push
   ```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User (No GitHub Account)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 1. Visits demo page
                     ↓
┌─────────────────────────────────────────────────────────┐
│             GitHub Pages (pl-james.github.io/ROSIE)     │
│  • Astro static site                                    │
│  • /demo page with JavaScript button                   │
│  • No authentication required                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 2. POST /create (email, duration)
                     ↓
┌─────────────────────────────────────────────────────────┐
│         Cloudflare Worker (rosie-demo-api)              │
│  • Proxies GitHub API requests                          │
│  • Stores GITHUB_TOKEN securely (server-side)          │
│  • Enforces CORS (only allows GitHub Pages origin)     │
│  • Triggers workflow via GitHub API                     │
│  • Polls for demo status                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 3. Triggers workflow_dispatch
                     ↓
┌─────────────────────────────────────────────────────────┐
│          GitHub Actions (create-demo.yml)               │
│  • Creates GitHub Codespace                             │
│  • Starts ROSIE services (Docker Compose)              │
│  • Creates issue with demo URL                          │
│  • Schedules cleanup after TTL                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 4. Codespace created
                     ↓
┌─────────────────────────────────────────────────────────┐
│          GitHub Codespace (ephemeral)                   │
│  • Ubuntu + Docker-in-Docker                            │
│  • Port 8080: ROSIE Dashboard (public)                 │
│  • Port 3000: SoR API (private)                        │
│  • Auto-cleanup after TTL (10/20/30 min)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 5. URL: https://{codespace}-8080.app.github.dev
                     ↓
┌─────────────────────────────────────────────────────────┐
│                         User                            │
│  • Receives unique demo URL                             │
│  • Accesses ROSIE dashboard in browser                 │
│  • Explores POC for 10-30 minutes                      │
└─────────────────────────────────────────────────────────┘
```

---

## Security Model

### Token Protection

**CRITICAL:** GITHUB_PAT must NEVER be exposed to clients.

✅ **Correct (current implementation):**
- Token stored as Cloudflare Worker secret
- Only accessible server-side
- Never sent to browser
- Not visible in network requests

❌ **Incorrect (don't do this):**
- Token in client-side JavaScript
- Token in HTML/environment variables visible to browser
- Token in git repository

### CORS Protection

Worker only accepts requests from:
- `https://pl-james.github.io` (production)
- `http://localhost:4321` (local development, optional)

Any other origin is rejected with 403 Forbidden.

### Rate Limiting

- Inherits GitHub Actions rate limits (5000 req/hour)
- All demo creations count against GITHUB_PAT quota
- Monitor usage: `curl -H "Authorization: Bearer $GITHUB_PAT" https://api.github.com/rate_limit`

---

## Cost Analysis

### GitHub Codespaces
- **Free tier:** 120 core-hours/month
- **Per demo:** 1 core-hour (30 min × 2 cores)
- **Free demos:** 60/month
- **After free tier:** $0.18/hour = $0.09/demo

### Cloudflare Workers
- **Free tier:** 100,000 requests/day
- **Per demo:** ~13 requests (1 create + 12 status polls)
- **Free demos:** ~7,700/day
- **After free tier:** $0.50/million requests (negligible)

### GitHub Actions
- **Free tier:** Unlimited for public repos
- **Cost:** $0

**Total cost for 100 demos/month:** $3.60 (40 demos over free tier)

---

## Monitoring

### Daily Checks

```bash
# Check worker health
curl https://rosie-demo-api.YOUR-SUBDOMAIN.workers.dev/health

# Check recent demos (Issues tab)
gh issue list --label demo --state all --limit 10

# Check active Codespaces
gh codespace list --repo PL-James/ROSIE

# Check Codespaces quota
# Go to: GitHub Settings → Billing → Codespaces
```

### Weekly Checks

- Review Cloudflare Worker analytics (requests, errors, CPU time)
- Review GitHub Actions workflow runs (success rate)
- Check Codespaces usage (approaching free tier limit?)
- Review demo feedback (GitHub Discussions/Issues)

### Alerts to Set Up

1. **Cloudflare Worker errors > 5% rate**
   - Dashboard → Workers → rosie-demo-api → Alerts

2. **GitHub Actions workflow failures**
   - Enable email notifications for workflow failures

3. **Codespaces quota > 80% used**
   - Manual check weekly (no auto-alert available)

---

## Rollback Procedure

If deployment breaks production:

1. **Rollback worker:**
   ```bash
   cd cloudflare-worker
   wrangler rollback
   ```

2. **Disable demo page temporarily:**
   ```bash
   # Edit src/pages/demo.astro
   # Add maintenance message at top
   git commit -m "Disable demo page for maintenance"
   git push
   ```

3. **Restore previous version:**
   ```bash
   git revert HEAD
   git push
   ```

4. **Debug locally:**
   ```bash
   cd cloudflare-worker
   wrangler dev
   # Test with curl
   ```

5. **Redeploy when fixed:**
   ```bash
   wrangler deploy
   git push
   ```

---

## Maintenance

### Update Worker Code

```bash
cd cloudflare-worker
# Edit demo-api-proxy.ts
wrangler deploy
```

### Update Demo Page UI

```bash
# Edit src/pages/demo.astro
git commit -m "Update demo page UI"
git push
# Wait for GitHub Pages rebuild (~2-3 min)
```

### Rotate GitHub Token

```bash
# Generate new token on GitHub
# Update .tokens file
wrangler secret put GITHUB_TOKEN
# Paste new token
```

---

## Custom Domain (Optional)

To use custom domain like `demo.rosie.dev`:

1. Add domain to Cloudflare (DNS)
2. Update `wrangler.toml`:
   ```toml
   [env.production]
   route = { pattern = "demo.rosie.dev/*", zone_name = "rosie.dev" }
   ```
3. Deploy: `wrangler deploy`
4. Update `src/pages/demo.astro` with new URL
5. Redeploy GitHub Pages

---

## Support

**Questions:** Open a discussion at https://github.com/PL-James/ROSIE/discussions

**Issues:** Report at https://github.com/PL-James/ROSIE/issues

**Cloudflare Support:** https://developers.cloudflare.com/workers/

---

**Status:** ✅ Ready for deployment
**Last Updated:** 2026-02-03
**Deployed:** TBD (update after Step 1 completion)
