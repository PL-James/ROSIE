# ROSIE Demo API Proxy - Cloudflare Worker

This Cloudflare Worker acts as a proxy between the public demo page and GitHub Actions API, enabling anonymous users to launch demo environments without GitHub authentication.

## Architecture

```
User clicks "Launch Demo" on GitHub Pages
  ↓
JavaScript calls Cloudflare Worker
  ↓
Worker authenticates with GitHub API (server-side)
  ↓
Triggers create-demo.yml workflow
  ↓
Worker polls for demo status
  ↓
Returns demo URL when ready
```

## Prerequisites

1. **Cloudflare account** (free tier is sufficient)
2. **Wrangler CLI** installed:
   ```bash
   npm install -g wrangler
   ```
3. **GitHub Personal Access Token** with permissions:
   - `repo` scope (full control of private repositories)
   - `workflow` scope (update GitHub Action workflows)

## Setup Instructions

### Step 1: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window for authentication.

### Step 2: Set Secrets

The worker needs two secrets:

```bash
# Set GitHub token (from .tokens file: GITHUB_PAT)
wrangler secret put GITHUB_TOKEN
# Paste your GITHUB_PAT when prompted

# Set allowed origins (GitHub Pages domain)
wrangler secret put ALLOWED_ORIGINS
# Enter: https://pl-james.github.io
# (You can add multiple origins separated by commas)
```

### Step 3: Deploy the Worker

```bash
cd cloudflare-worker
wrangler deploy
```

This will deploy the worker and give you a URL like:
```
https://rosie-demo-api.YOUR-SUBDOMAIN.workers.dev
```

### Step 4: Update Demo Page Configuration

Edit `src/pages/demo.astro` and update the `WORKER_URL`:

```typescript
const WORKER_URL = 'https://rosie-demo-api.YOUR-SUBDOMAIN.workers.dev';
```

### Step 5: Redeploy GitHub Pages

Commit and push the changes:

```bash
git add src/pages/demo.astro
git commit -m "Configure Cloudflare Worker URL for demo page"
git push
```

GitHub Pages will automatically rebuild and deploy.

### Step 6: Test the Demo Page

1. Visit: https://pl-james.github.io/ROSIE/demo/
2. Click "Launch Demo Environment"
3. Verify workflow triggers and demo provisions
4. Check for any CORS or API errors in browser console

## API Endpoints

### POST /create

**Description:** Trigger a new demo environment

**Request:**
```json
{
  "email": "user@example.com",  // optional
  "duration": "30"               // "10", "20", or "30"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Demo provisioning started",
  "workflowRunId": 12345678,
  "estimatedTime": "60-90 seconds"
}
```

**Error Response:**
```json
{
  "error": "Failed to trigger workflow",
  "details": "Rate limit exceeded"
}
```

### GET /status/:workflowRunId

**Description:** Check demo provisioning status

**Response (provisioning):**
```json
{
  "status": "provisioning",
  "message": "Creating your demo environment...",
  "workflowStatus": "in_progress"
}
```

**Response (ready):**
```json
{
  "status": "ready",
  "message": "Your demo is ready!",
  "demoUrl": "https://codespace-name-8080.app.github.dev",
  "sessionId": "rosie-demo-1234567890-abcd1234",
  "issueUrl": "https://github.com/PL-James/ROSIE/issues/123"
}
```

**Response (error):**
```json
{
  "status": "error",
  "message": "Demo provisioning failed. Please try again."
}
```

### GET /health

**Description:** Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-03T16:00:00.000Z"
}
```

## Security

### CORS Configuration

The worker enforces CORS and only accepts requests from:
- Domains listed in `ALLOWED_ORIGINS` secret
- Default: `https://pl-james.github.io`

To add additional origins:
```bash
wrangler secret put ALLOWED_ORIGINS
# Enter: https://pl-james.github.io,http://localhost:4321,https://your-custom-domain.com
```

### Rate Limiting

The worker inherits GitHub Actions rate limits:
- 5,000 API requests per hour (per authenticated user)
- The worker uses your GITHUB_PAT, so all requests count against your GitHub account

To monitor rate limit usage:
```bash
curl -H "Authorization: Bearer YOUR_GITHUB_PAT" \
  https://api.github.com/rate_limit
```

### Token Security

**CRITICAL:** Never expose the GITHUB_TOKEN in client-side code. This is why we use a Cloudflare Worker:

- ✅ Token stored as Worker secret (server-side)
- ✅ Not visible in browser/network requests
- ✅ Cannot be extracted by users
- ❌ Never commit tokens to git
- ❌ Never log tokens in Worker code

## Monitoring

### View Worker Logs

```bash
wrangler tail
```

This shows real-time logs including:
- Demo creation requests
- GitHub API responses
- Errors and exceptions

### Worker Analytics

View analytics in Cloudflare dashboard:
1. Go to: https://dash.cloudflare.com
2. Workers & Pages → rosie-demo-api
3. Check:
   - Total requests
   - Errors
   - CPU time
   - Response times

### Cost Monitoring

**Cloudflare Workers Free Tier:**
- 100,000 requests/day
- 10ms CPU time per request

**Typical usage:**
- Create request: ~5ms CPU
- Status poll: ~3ms CPU
- 1 demo = 1 create + ~12 status polls = ~41ms total
- **Free tier covers ~2,400 demos/day**

After free tier: $0.50 per million requests (negligible cost)

## Troubleshooting

### "Workflow failed to trigger"

**Cause:** GitHub API authentication or permissions issue

**Solutions:**
1. Verify GITHUB_TOKEN has correct scopes:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.github.com/user
   ```
2. Check token hasn't expired
3. Regenerate token if needed
4. Update worker secret:
   ```bash
   wrangler secret put GITHUB_TOKEN
   ```

### "CORS error" in browser console

**Cause:** Request origin not in ALLOWED_ORIGINS

**Solutions:**
1. Check current allowed origins:
   ```bash
   wrangler secret list
   ```
2. Update ALLOWED_ORIGINS:
   ```bash
   wrangler secret put ALLOWED_ORIGINS
   # Add your domain
   ```
3. Redeploy worker:
   ```bash
   wrangler deploy
   ```

### "Demo status always shows provisioning"

**Cause:** Polling logic can't find demo issue or workflow

**Solutions:**
1. Check worker logs: `wrangler tail`
2. Verify GitHub issue was created (check repo issues)
3. Manually check workflow status:
   ```bash
   gh run list --workflow=create-demo.yml --limit 5
   ```
4. Workflow may have failed - check Actions tab

### "Rate limit exceeded"

**Cause:** Too many requests to GitHub API

**Solutions:**
1. Check rate limit status:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.github.com/rate_limit
   ```
2. Wait for rate limit reset (shown in response)
3. Consider upgrading GitHub plan for higher limits
4. Implement caching in worker (advanced)

## Local Development

### Run locally with Miniflare

```bash
cd cloudflare-worker
npm install
wrangler dev
```

This starts a local server at http://localhost:8787

### Set local secrets

Create `.dev.vars` file (DO NOT COMMIT):
```
GITHUB_TOKEN=your_token_here
ALLOWED_ORIGINS=http://localhost:4321,https://pl-james.github.io
```

### Test locally

```bash
# Health check
curl http://localhost:8787/health

# Create demo
curl -X POST http://localhost:8787/create \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:4321" \
  -d '{"email":"test@example.com","duration":"30"}'

# Check status
curl http://localhost:8787/status/latest \
  -H "Origin: http://localhost:4321"
```

## Updating the Worker

### Deploy changes

```bash
cd cloudflare-worker
wrangler deploy
```

Changes take effect immediately (no cache purge needed).

### Rollback

If deployment fails, Cloudflare automatically keeps previous version.

To manually rollback:
```bash
wrangler rollback
```

## Custom Domain (Optional)

To use a custom domain like `demo-api.rosie.dev`:

1. Add domain to Cloudflare (DNS management)
2. Add worker route:
   ```bash
   wrangler route add demo-api.rosie.dev/*
   ```
3. Update `wrangler.toml`:
   ```toml
   [env.production]
   route = { pattern = "demo-api.rosie.dev/*", zone_name = "rosie.dev" }
   ```
4. Redeploy: `wrangler deploy`
5. Update demo page WORKER_URL

## Alternative: Vercel Edge Functions

If you prefer Vercel over Cloudflare Workers:

1. Create `api/create.ts` and `api/status.ts` in Vercel project
2. Deploy to Vercel: `vercel deploy`
3. Update demo page to call Vercel functions
4. Same security considerations apply (use environment variables for GITHUB_TOKEN)

## Support

**Issues:** Report at https://github.com/PL-James/ROSIE/issues

**Cloudflare Workers Docs:** https://developers.cloudflare.com/workers/

**Wrangler CLI Docs:** https://developers.cloudflare.com/workers/wrangler/

---

**Deployed:** TBD
**Last Updated:** 2026-02-03
**Worker URL:** TBD (update after deployment)
