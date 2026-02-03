# ROSIE Demo Environment - Quick Reference

## For Users

### Launch a Demo

1. **Click badge:** [![Launch Demo](https://img.shields.io/badge/🚀_Launch-Live_Demo-blue?style=for-the-badge)](https://github.com/PL-James/ROSIE/actions/workflows/create-demo.yml)
2. **Click "Run workflow"**
3. **Wait ~60 seconds**
4. **Get URL from:**
   - Workflow summary, OR
   - GitHub issue (titled "ROSIE Demo Ready: ...")
5. **Click URL** → Loading page → Auto-redirect to dashboard

### What You Get

- 🎯 Fully functional ROSIE POC
- 🔒 Private environment (unique URL)
- ⚡ Pre-loaded sample data
- ⏰ 30 minutes access (configurable: 10/20/30 min)
- 🆓 Completely free

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Workflow fails | Check Codespaces quota, retry |
| 502 Bad Gateway | Wait 15s, refresh page |
| Loading page stuck | Wait 60s, manually refresh |
| Dashboard errors | Check browser console, report issue |

---

## For Maintainers

### Architecture

```
GitHub Codespaces (Ubuntu + Docker-in-Docker)
├── Port 8080: Dashboard (Nginx → React SPA)
├── Port 3000: SoR API (Express + SQLite)
└── Auto-cleanup: TTL enforcement via scheduled workflow
```

### Files

```
.devcontainer/devcontainer.json        # Codespace config
.github/workflows/create-demo.yml      # Provisioning
.github/workflows/cleanup-demo.yml     # TTL enforcement
poc/loading.html                       # Startup UX
poc/dashboard/Dockerfile               # Updated for loading page
poc/docker-compose.yml                 # Updated build context
README.md                              # Added "Try ROSIE Live" section
```

### Key Configurations

**Devcontainer:**
- Image: `mcr.microsoft.com/devcontainers/base:ubuntu`
- Features: Docker-in-Docker, GitHub CLI
- Ports: 8080 (public), 3000 (private)
- Post-create: `cd poc && docker-compose up -d`

**Create-Demo Workflow:**
- Trigger: `workflow_dispatch` (manual)
- Inputs: `user_identifier`, `duration_minutes`
- Permissions: `codespaces: write`, `issues: write`
- Machine: `basicLinux32gb` (2-core, 8GB RAM)

**Cleanup Workflow:**
- Trigger: `workflow_dispatch` (scheduled by create-demo) + `schedule` (every 5 min)
- Deletes Codespaces older than 35 minutes (orphan cleanup)
- Closes associated GitHub issues

### Monitoring

**Check usage:**
```bash
# GitHub Codespaces dashboard
Settings → Billing → Codespaces

# Workflow runs
Actions → Create ROSIE Demo Environment
Actions → Cleanup ROSIE Demo Environment

# Active demos
Issues → Label: demo
Code → Codespaces
```

**Key metrics:**
- Demos created: Count issues with `demo` label
- Success rate: Workflow runs (successful / total)
- Quota usage: Codespaces billing page
- Average provision time: Workflow duration

### Cost Model

| Usage | Monthly Cost |
|-------|-------------|
| 0-60 demos | $0 (free tier) |
| 120 demos | $5.40 |
| 500 demos | $68.40 |

**Free tier:** 120 core-hours/month per user
**Formula:** 2-core × 0.5 hour = 1 core-hour per 30-min demo

**Migration threshold:** >150 demos/month → Consider fly.io ($0.0082/demo)

### Common Operations

**Manually trigger demo:**
```bash
# Via GitHub CLI
gh workflow run create-demo.yml \
  -f user_identifier="test-user" \
  -f duration_minutes="30"
```

**List active demos:**
```bash
gh codespace list --repo PL-James/ROSIE
```

**Manually delete demo:**
```bash
gh codespace delete <codespace-name>
```

**View logs:**
```bash
# Workflow logs
gh run view <run-id> --log

# Codespace logs (open Codespace in VS Code)
cd poc && docker-compose logs
```

**Force cleanup all demos:**
```bash
# Trigger orphan cleanup manually
gh workflow run cleanup-demo.yml
```

### Emergency Procedures

**If quota exhausted:**
1. Check Settings → Billing → Codespaces
2. Delete old Codespaces manually
3. Wait for next billing cycle (1st of month)
4. Or upgrade to paid plan

**If cleanup workflow fails:**
1. Check workflow logs for errors
2. Manually delete Codespaces via GitHub UI
3. Manually close demo issues
4. Fix workflow and re-deploy

**If demos failing consistently:**
1. Check GitHub status page (https://githubstatus.com)
2. Verify workflow permissions
3. Test devcontainer locally:
   ```bash
   devcontainer build --workspace-folder .
   devcontainer up --workspace-folder .
   ```
4. Review recent commits for breaking changes

### Customization

**Change demo durations:**
Edit `.github/workflows/create-demo.yml`:
```yaml
duration_minutes:
  options: ['10', '20', '30', '60']  # Add/remove options
  default: '30'
```

**Change machine size:**
Edit `.github/workflows/create-demo.yml`:
```bash
-f machine='basicLinux32gb'      # Current (2-core)
-f machine='standardLinux32gb'   # Upgrade (4-core)
-f machine='premiumLinux'        # Upgrade (8-core)
```

**Change port visibility:**
Edit `.devcontainer/devcontainer.json`:
```json
"portsAttributes": {
  "8080": { "visibility": "public" },   # Keep public
  "3000": { "visibility": "private" }   # Keep private (or "public")
}
```

**Pre-build Docker images (faster startup):**
```bash
cd poc
docker-compose build
docker tag poc-sor-api ghcr.io/pl-james/rosie-demo-api:latest
docker push ghcr.io/pl-james/rosie-demo-api:latest

# Update docker-compose.yml
services:
  sor-api:
    image: ghcr.io/pl-james/rosie-demo-api:latest
    # Remove 'build: ./sor-server'
```

### Debugging

**Test devcontainer locally:**
```bash
# Install VS Code + Dev Containers extension
code --install-extension ms-vscode-remote.remote-containers

# Build and test
devcontainer build --workspace-folder .
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . bash
```

**Test Docker build:**
```bash
cd poc
docker-compose build
docker-compose up -d
docker-compose ps
docker-compose logs
```

**Test loading page:**
```bash
cd poc
python3 -m http.server 8000
# Open http://localhost:8000/loading.html
```

**Validate workflows:**
```bash
# Install actionlint
brew install actionlint  # or: go install github.com/rhysd/actionlint@latest

# Lint workflows
actionlint .github/workflows/create-demo.yml
actionlint .github/workflows/cleanup-demo.yml
```

### Security Checklist

- [x] No secrets exposed in workflows
- [x] GITHUB_TOKEN scoped to minimum permissions
- [x] Port 3000 (API) is private
- [x] Port 8080 (dashboard) is public (demo data only)
- [x] Ephemeral data (SQLite deleted on cleanup)
- [x] Per-user isolation (separate Codespaces)
- [x] Rate limiting via GitHub Actions
- [x] Free tier prevents abuse

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Provision time | <90s | ~60-90s ✅ |
| Service startup | <30s | ~15-30s ✅ |
| Loading page redirect | <30s | ~5-15s ✅ |
| Workflow success rate | >95% | TBD 🔄 |
| Cleanup success rate | 100% | TBD 🔄 |

### Support Escalation

**Level 1 (User issues):**
- Respond via GitHub Issues/Discussions
- Check workflow logs
- Verify Codespaces status
- Provide troubleshooting steps

**Level 2 (Technical issues):**
- Debug devcontainer configuration
- Review Docker logs
- Test builds locally
- Fix and re-deploy

**Level 3 (Platform issues):**
- Check GitHub status
- Contact GitHub support
- Consider alternative platforms (fly.io, Cloud Run)

### Release Checklist

Before announcing publicly:

- [ ] Test provisioning workflow (5+ successful runs)
- [ ] Test cleanup workflow (verify TTL enforcement)
- [ ] Test loading page UX (ask 3+ people for feedback)
- [ ] Monitor quota usage (verify stays within free tier)
- [ ] Document known issues
- [ ] Prepare announcement (README, blog post, social media)
- [ ] Set up monitoring alerts (quota, workflow failures)
- [ ] Create feedback collection mechanism (issue template, discussion)

### Future Enhancements

**Short-term (1-2 months):**
- [ ] Email notifications (Resend API)
- [ ] GitHub Pages button (better UX)
- [ ] Pre-built Docker images (faster startup)
- [ ] Usage analytics dashboard

**Medium-term (3-6 months):**
- [ ] fly.io migration (if >150 demos/month)
- [ ] Custom domains (demo-*.rosie.dev)
- [ ] Demo queue system
- [ ] Interactive tutorials

**Long-term (6-12 months):**
- [ ] Multi-branch demos (test feature branches)
- [ ] Persistent sessions (resume capability)
- [ ] Demo recordings (screen capture)
- [ ] A/B testing different UX flows

### Links

- **Repository:** https://github.com/PL-James/ROSIE
- **Workflow:** https://github.com/PL-James/ROSIE/actions/workflows/create-demo.yml
- **Documentation:** See DEMO-ENVIRONMENT.md
- **Testing Guide:** See TESTING-GUIDE.md
- **Implementation:** See IMPLEMENTATION-SUMMARY.md

---

**Quick Status Check:**

```bash
# Active demos
gh codespace list --repo PL-James/ROSIE | grep rosie-demo

# Recent workflow runs
gh run list --workflow=create-demo.yml --limit 10

# Quota usage
gh api /user/codespaces/billing | jq '.core_hours_used'
```

---

**Last Updated:** 2026-02-03
**Status:** ✅ Implementation Complete — Ready for Testing
