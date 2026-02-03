# ROSIE Demo Environment

## Overview

The ROSIE demo environment provides instant, no-installation access to a fully functional ROSIE POC instance using GitHub Codespaces.

## Quick Start

**Launch a demo:**

1. Click the "Launch Demo" badge in README.md
2. Click "Run workflow" on the GitHub Actions page
3. (Optional) Select demo duration: 10, 20, or 30 minutes (default: 30)
4. Wait ~60-90 seconds
5. Get your unique URL from:
   - Workflow run summary (scroll down)
   - GitHub Issues (look for "ROSIE Demo Ready: ..." issue)
6. Click the URL to access your private ROSIE instance

**What's included:**

- ROSIE Dashboard (React SPA)
- System of Record API (Express + SQLite)
- Sample compliance data (example-app artifacts)
- Full trace graph visualization
- Approval workflow demonstration
- Evidence linking examples
- Audit log browser
- Release checklist

## Architecture

### Infrastructure

```
GitHub Codespaces (2-core Ubuntu container)
├── Docker-in-Docker
├── Port 8080: ROSIE Dashboard (Nginx)
├── Port 3000: SoR API (Express)
└── SQLite database (ephemeral)
```

### Services

**sor-api** (port 3000):
- Express server with System of Record API
- SQLite database (auto-initialized)
- Health check endpoint: `/health`
- API endpoints: `/v1/*`

**dashboard** (port 8080):
- React SPA served by Nginx
- Proxies API requests to sor-api
- Loading page during startup
- Auto-redirects when services are ready

### Startup Sequence

1. Codespace created (~30-40s)
2. Docker-in-Docker feature enabled
3. `docker-compose up -d` runs automatically
4. Services start (~15-30s):
   - SQLite database initialized
   - SoR API server starts
   - Dashboard built and served
5. Health checks verified
6. Public URL becomes accessible

Total time: ~60-90 seconds from click to usable environment.

## Demo Duration & Cleanup

### Automatic Cleanup

Demos have a configurable time-to-live (TTL):

- **10 minutes**: Quick exploration
- **20 minutes**: Moderate testing
- **30 minutes**: Full walkthrough (default)

Cleanup happens via two mechanisms:

1. **Primary**: GitHub Actions workflow waits TTL duration, then deletes Codespace
2. **Backup**: Scheduled workflow runs every 5 minutes to catch orphaned instances

### What Gets Deleted

- Codespace container
- All data (SQLite database is ephemeral)
- Associated GitHub issue (closed with cleanup comment)

### Cost Model

**GitHub Codespaces free tier:**
- 120 core-hours/month per user
- 2-core machine = 60 demos @ 30min each
- **Cost: $0/month for typical usage**

**After free tier:**
- $0.18 per 60-minute hour (2-core)
- ~$0.09 per 30-minute demo

**Recommendations:**
- 0-120 demos/month: GitHub Codespaces (free)
- 120+ demos/month: Consider migrating to fly.io ($0.0082/demo)

See implementation plan for detailed cost analysis.

## User Experience Enhancements

### Loading Page

When users first access their demo URL, they see a professional loading screen:

- Animated spinner
- Progress bar
- Status updates
- Educational content about ROSIE
- Auto-redirects when services are ready

This prevents confusion from the 15-30 second startup lag.

### GitHub Issue Notification

Each demo creates a GitHub issue containing:

- Unique dashboard URL
- API endpoint URL
- Session ID
- Duration and expiry time
- Quick start guide
- Links to documentation

The issue serves as:
- Notification mechanism
- Historical record
- User-friendly URL delivery

### Workflow Summary

The GitHub Actions workflow provides:

- Real-time progress updates
- Clickable URLs in summary
- Session ID for tracking
- Error messages if provisioning fails

## Security & Access Control

### Port Visibility

- Port 8080 (dashboard): **Public** — accessible via `https://{codespace}-8080.app.github.dev`
- Port 3000 (API): **Private** — only accessible within Codespace or via dashboard proxy

### Data Privacy

- Each demo is **isolated** (separate Codespace)
- SQLite database is **ephemeral** (destroyed on cleanup)
- No persistent user data
- No secrets or credentials in demo environment

### Rate Limiting

Built-in protection:
- Per-user free tier prevents single-account abuse
- GitHub Actions rate limits (5000 API calls/hour)
- Codespace retention policies (auto-cleanup)

Optional additional measures (not yet implemented):
- Max 5 demos/user/day via workflow concurrency
- Alert at 80% of free tier usage

## Troubleshooting

### "Codespace not found" error

**Cause:** Codespace creation failed or timed out

**Solution:**
1. Check workflow logs for errors
2. Verify GitHub Codespaces permissions
3. Retry workflow

### URL returns 502 Bad Gateway

**Cause:** Services still starting (rare due to health checks)

**Solution:**
1. Wait 15-30 seconds
2. Refresh page
3. Loading page should auto-redirect when ready

### Services not starting

**Cause:** Docker Compose startup failed

**Solution:**
1. Check Codespace logs (open Codespace in VSCode)
2. Run `cd poc && docker-compose logs`
3. Report issue with logs

### Demo expired but Codespace still running

**Cause:** Cleanup workflow failed

**Solution:**
1. Manually delete Codespace from GitHub dashboard
2. Check cleanup workflow logs
3. Report issue if recurring

## Development & Customization

### Local Testing

Test devcontainer configuration locally:

```bash
# Install VS Code + Dev Containers extension
devcontainer build --workspace-folder .
devcontainer up --workspace-folder .
```

### Modify Demo Duration

Edit `.github/workflows/create-demo.yml`:

```yaml
duration_minutes:
  options:
    - '10'
    - '20'
    - '30'
    - '60'  # Add longer durations
  default: '30'
```

### Change Machine Size

Edit `.github/workflows/create-demo.yml`:

```bash
-f machine='basicLinux32gb'  # 2-core, 8GB RAM (current)
-f machine='standardLinux32gb'  # 4-core, 8GB RAM
-f machine='premiumLinux'  # 8-core, 16GB RAM
```

**Note:** Larger machines consume free tier faster.

### Pre-build Docker Images

To speed up startup (20-30s → 10-15s):

```bash
# Build and push to GHCR
cd poc
docker-compose build
docker tag poc-sor-api ghcr.io/pl-james/rosie-demo-api:latest
docker tag poc-dashboard ghcr.io/pl-james/rosie-demo-dashboard:latest
docker push ghcr.io/pl-james/rosie-demo-api:latest
docker push ghcr.io/pl-james/rosie-demo-dashboard:latest

# Update docker-compose.yml
# Replace 'build: ./sor-server' with 'image: ghcr.io/pl-james/rosie-demo-api:latest'
# Replace 'build: ./dashboard' with 'image: ghcr.io/pl-james/rosie-demo-dashboard:latest'
```

## Files Reference

### Core Configuration

- `.devcontainer/devcontainer.json` — Codespace environment setup
- `.github/workflows/create-demo.yml` — Demo provisioning workflow
- `.github/workflows/cleanup-demo.yml` — TTL enforcement and cleanup
- `poc/docker-compose.yml` — Service orchestration
- `poc/loading.html` — Startup loading page

### Modified Files

- `README.md` — Added "Try ROSIE Live" section with badge
- `poc/dashboard/Dockerfile` — Integrated loading page, updated nginx config

## Monitoring & Analytics

### Usage Tracking

Monitor demo usage via:

- GitHub Issues with `demo` label
- GitHub Actions workflow runs
- Codespaces dashboard (quota usage)

### Key Metrics

- Demos created per day/week/month
- Average demo duration
- Codespace quota utilization
- Workflow success/failure rate
- Time to provision (workflow duration)

### Alerts

Set up GitHub Actions notifications for:

- Workflow failures (provisioning errors)
- Quota approaching 80% of free tier
- Cleanup workflow failures (orphaned Codespaces)

## Alternative Implementations

This implementation uses **GitHub Codespaces** (recommended for MVP).

Alternative approaches documented in implementation plan:

### fly.io Machines API

**Best for:** 150+ demos/month (cheaper than Codespaces)

- Cost: $0.0082/demo
- Startup: 10-15s (faster)
- Requires fly.io account + token management

### Google Cloud Run + Cloudflare Workers

**Best for:** Production-grade, high-volume deployments

- Cost: $0.046/demo + $25/month infrastructure
- Startup: 15-30s
- Most sophisticated (Durable Objects for state)

See full implementation plan for migration guides.

## Future Enhancements

### Planned

- [ ] Email notification when demo ready (via Resend API)
- [ ] GitHub Pages button (single-click UX)
- [ ] Pre-built Docker images (faster startup)
- [ ] Usage analytics dashboard
- [ ] Demo queue system (handle concurrent limit)

### Under Consideration

- [ ] Custom domains (demo-*.rosie.dev)
- [ ] Persistent demo sessions (resume after expiry)
- [ ] Multi-branch demos (test feature branches)
- [ ] Demo recordings (screen capture)
- [ ] Interactive tutorials/walkthroughs

## Support

**Issues:** Report problems at https://github.com/PL-James/ROSIE/issues

**Questions:** Open a discussion at https://github.com/PL-James/ROSIE/discussions

**Contributing:** See CONTRIBUTING.md (when available)

## License

Demo environment infrastructure follows the same CC BY-NC-ND 4.0 license as ROSIE.

See `license.md` for details.
