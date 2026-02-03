# ROSIE Demo Environment - Testing Guide

## Quick Start: First Demo

### Step 1: Trigger the Workflow

1. Go to GitHub: https://github.com/PL-James/ROSIE
2. Click the "Actions" tab
3. Select "Create ROSIE Demo Environment" workflow
4. Click "Run workflow" (green button on the right)
5. (Optional) Configure:
   - User identifier: Enter your name/email for tracking
   - Duration: Select 10, 20, or 30 minutes (default: 30)
6. Click "Run workflow" button

### Step 2: Wait for Provisioning

The workflow will:
- Generate a unique session ID
- Create a GitHub Codespace
- Wait for Codespace to start (~30-40s)
- Start Docker services (~15-30s)
- Wait for services to be healthy
- Create a GitHub issue with your demo details

**Total time:** ~60-90 seconds

### Step 3: Get Your Demo URL

You can find your demo URL in **two places**:

**Option A: Workflow Run Summary**
1. Click on your running workflow
2. Wait for it to complete (green checkmark)
3. Scroll down to "Summary" section
4. Click the Dashboard URL

**Option B: GitHub Issues**
1. Click the "Issues" tab
2. Look for issue titled "🚀 ROSIE Demo Ready: rosie-demo-..."
3. Click the issue
4. Click the Dashboard URL in the issue body

### Step 4: Access Your Demo

1. Click the Dashboard URL
2. You should see a **loading page** with:
   - Animated spinner
   - Progress bar
   - Status messages
   - Educational content about ROSIE
3. Wait ~5-15 seconds for services to finish starting
4. Page will **auto-redirect** to the ROSIE dashboard

If the loading page doesn't redirect after 60 seconds, manually refresh the page.

### Step 5: Explore ROSIE

Your demo environment includes:

- **Dashboard:** Main UI for exploring ROSIE
- **Trace Graph:** Visualization of compliance artifacts
- **Approvals:** Sample approval workflow
- **Evidence:** Linked evidence examples
- **Audit Log:** Browse system activity
- **Release:** Release checklist demonstration

All features are pre-populated with sample data from the example-app.

### Step 6: Automatic Cleanup

Your demo will **automatically shut down** after the selected duration:

- The Codespace will be deleted
- All data will be removed (SQLite is ephemeral)
- The GitHub issue will be closed with a cleanup comment

No action required on your part!

## Detailed Testing Checklist

### Pre-Flight Checks

Before triggering your first demo, verify:

- [ ] Repository has Codespaces enabled (Settings → Codespaces)
- [ ] Workflows have required permissions (Settings → Actions → General → Workflow permissions)
  - Should be "Read and write permissions"
  - "Allow GitHub Actions to create and approve pull requests" can be off
- [ ] No pending Codespace usage issues (check quota)

### Functional Testing

#### Test 1: Basic Provisioning

- [ ] Workflow triggers successfully
- [ ] Codespace created (visible in GitHub Codespaces dashboard)
- [ ] Workflow completes without errors
- [ ] GitHub issue created with demo details
- [ ] URLs are present in both workflow summary and issue

**Expected time:** ~60-90 seconds

#### Test 2: Loading Page

- [ ] Click demo URL from workflow/issue
- [ ] Loading page appears immediately
- [ ] Spinner animates
- [ ] Progress bar fills
- [ ] Status messages update
- [ ] Educational content displays
- [ ] Page auto-redirects to dashboard

**Expected time:** 5-30 seconds for redirect

#### Test 3: Dashboard Functionality

- [ ] Dashboard loads completely
- [ ] All navigation items present
- [ ] Trace graph visualizes
- [ ] Sample data appears in all sections
- [ ] No console errors (F12 → Console tab)

#### Test 4: API Connectivity

- [ ] Open browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Refresh dashboard
- [ ] Verify API calls to `/v1/*` succeed (status 200)
- [ ] Check health endpoint manually: `https://{codespace-name}-3000.app.github.dev/health`
  - Should be **inaccessible** (port 3000 is private)
  - Or return "Codespace not found" (expected)

#### Test 5: Cleanup

- [ ] Wait for TTL to expire (or test with 10-minute duration)
- [ ] Verify Codespace deleted from GitHub Codespaces dashboard
- [ ] Verify GitHub issue closed automatically
- [ ] Check issue for cleanup comment

**Expected time:** Matches selected duration (10/20/30 minutes)

### Edge Case Testing

#### Test 6: Multiple Concurrent Demos

- [ ] Trigger workflow twice in quick succession
- [ ] Verify both Codespaces created with unique names
- [ ] Both demos accessible simultaneously
- [ ] Both clean up independently after TTL

#### Test 7: Short Duration (10 minutes)

- [ ] Trigger workflow with 10-minute duration
- [ ] Verify cleanup happens after exactly 10 minutes (±30 seconds)

#### Test 8: Long Duration (30 minutes)

- [ ] Trigger workflow with 30-minute duration
- [ ] Verify environment stays alive for full 30 minutes
- [ ] Verify cleanup happens after 30 minutes

#### Test 9: Custom User Identifier

- [ ] Trigger workflow with custom user identifier (e.g., "test-user@example.com")
- [ ] Verify identifier appears in GitHub issue
- [ ] Check if tracking works (issue labeling, session ID format)

### Error Handling

#### Test 10: Workflow Failure Recovery

- [ ] (Intentionally) Cause workflow failure (e.g., invalid input)
- [ ] Verify error message is clear
- [ ] Verify no orphaned Codespaces created
- [ ] Retry workflow successfully

#### Test 11: Service Startup Failure

- [ ] (If possible) Cause docker-compose to fail
- [ ] Verify loading page eventually redirects or times out gracefully
- [ ] Verify workflow health check reports issue
- [ ] Check workflow logs for debugging info

### Performance Testing

#### Test 12: Provision Time

Measure and record:

- [ ] Time from workflow trigger to Codespace creation: _____ seconds
- [ ] Time from Codespace creation to "Available" state: _____ seconds
- [ ] Time from "Available" to health check pass: _____ seconds
- [ ] Total time from trigger to usable URL: _____ seconds

**Target:** <90 seconds total

#### Test 13: Service Startup Time

Measure and record:

- [ ] Time from clicking URL to loading page display: _____ seconds
- [ ] Time from loading page to dashboard redirect: _____ seconds
- [ ] Time from redirect to fully loaded dashboard: _____ seconds

**Target:** <30 seconds for loading page → dashboard

### Monitoring & Quota

#### Test 14: Codespaces Quota Usage

After 5-10 demo runs:

- [ ] Check Codespaces usage: Settings → Billing → Codespaces
- [ ] Verify core-hours consumed matches expectations:
  - 30-min demo = 1 core-hour (2-core machine)
  - 10 demos = ~10 core-hours
- [ ] Verify still within free tier (120 core-hours/month)

#### Test 15: Orphan Cleanup

- [ ] Manually create a Codespace (not via workflow)
- [ ] Name it `rosie-demo-test-orphan`
- [ ] Wait 35 minutes
- [ ] Verify scheduled cleanup workflow deletes it
- [ ] Check cleanup workflow logs

**Note:** Scheduled cleanup runs every 5 minutes.

### Documentation Testing

#### Test 16: README Badge

- [ ] View README.md on GitHub
- [ ] Verify "Try ROSIE Live" section displays correctly
- [ ] Click "Launch Demo" badge
- [ ] Verify redirects to correct workflow
- [ ] Verify instructions are accurate

#### Test 17: Issue Template

- [ ] Create a demo
- [ ] Open the created GitHub issue
- [ ] Verify all information is present:
  - Dashboard URL (clickable)
  - API URL (informational)
  - Session ID
  - User identifier
  - Duration
  - Created timestamp
  - Expires timestamp
  - Quick start guide
  - Documentation links

#### Test 18: Loading Page UX

- [ ] Create demo
- [ ] Ask someone unfamiliar with ROSIE to access it
- [ ] Observe their experience:
  - Do they understand what's happening?
  - Do they wait patiently?
  - Do they find the educational content helpful?
- [ ] Collect feedback for improvements

## Troubleshooting Common Issues

### Issue: Workflow fails with "Codespace creation failed"

**Diagnosis:**
1. Check workflow logs for specific error message
2. Verify Codespaces enabled for repository
3. Check Codespaces quota (Settings → Billing → Codespaces)

**Solutions:**
- If quota exhausted: Wait for next billing cycle or upgrade plan
- If permissions issue: Update workflow permissions in Settings → Actions
- If API error: Check GitHub status page, retry later

### Issue: Loading page never redirects

**Diagnosis:**
1. Open browser DevTools (F12) → Console tab
2. Check for JavaScript errors
3. Check Network tab for failed `/health` requests

**Solutions:**
- Refresh page manually after 60 seconds
- Check if services started: Open Codespace in VS Code
  ```bash
  cd poc && docker-compose ps
  cd poc && docker-compose logs
  ```
- If services failed, restart: `docker-compose restart`

### Issue: Dashboard loads but shows errors

**Diagnosis:**
1. Check browser console for errors
2. Check Network tab for failed API requests
3. Verify sor-api is running

**Solutions:**
- Check API health: Try accessing `/health` via dashboard (should be proxied)
- Restart services in Codespace
- Check sor-api logs: `docker-compose logs sor-api`

### Issue: Cleanup doesn't happen

**Diagnosis:**
1. Check cleanup workflow runs: Actions → Cleanup ROSIE Demo Environment
2. Verify workflow wasn't manually cancelled
3. Check for workflow errors

**Solutions:**
- Manually trigger cleanup workflow with Codespace name
- Manually delete Codespace from GitHub dashboard
- Check cleanup workflow permissions

### Issue: 502 Bad Gateway when accessing URL

**Diagnosis:**
- Services are still starting (should be rare after health check implementation)

**Solutions:**
- Wait 15-30 seconds
- Refresh page
- Loading page should appear and auto-redirect

## Success Metrics

After completing initial testing, evaluate:

### ✅ Core Functionality

- [ ] Workflow runs successfully (≥95% success rate)
- [ ] Codespaces created consistently
- [ ] URLs accessible within 90 seconds
- [ ] Loading page provides good UX
- [ ] Dashboard fully functional
- [ ] Cleanup happens automatically (100% success rate)

### ✅ Performance

- [ ] Provision time: <90 seconds
- [ ] Loading → dashboard: <30 seconds
- [ ] No significant delays or timeouts

### ✅ Cost

- [ ] Within free tier for expected usage
- [ ] No unexpected charges
- [ ] Quota monitoring in place

### ✅ User Experience

- [ ] Instructions clear and accurate
- [ ] URLs easy to find
- [ ] Loading page helpful (reduces confusion)
- [ ] Demo provides value (showcases ROSIE effectively)

## Next Steps After Testing

### If Testing Succeeds

1. **Document success:**
   - Record test results
   - Note any issues encountered and resolutions
   - Update documentation if needed

2. **Announce availability:**
   - Add to project README (already done)
   - Share in discussions/announcements
   - Promote via social media/blog

3. **Monitor usage:**
   - Track demos created per week
   - Monitor quota usage
   - Gather user feedback

### If Testing Reveals Issues

1. **Prioritize fixes:**
   - Critical: Workflow failures, broken URLs
   - High: Poor UX, confusing messages
   - Medium: Performance optimizations
   - Low: Cosmetic improvements

2. **Debug and fix:**
   - Review workflow logs
   - Test fixes locally (devcontainer)
   - Re-run testing checklist

3. **Iterate:**
   - Make improvements based on feedback
   - Re-test
   - Document changes

## Feedback Collection

Create a discussion thread or issue template for demo feedback:

**Questions to ask users:**

1. How long did it take from clicking "Launch Demo" to accessing the dashboard?
2. Was the loading page helpful or confusing?
3. Did you encounter any errors or issues?
4. Was the demo useful in understanding ROSIE?
5. What would you improve about the demo experience?

**Track metrics:**

- Demos created
- Workflow success rate
- Average provision time
- User-reported issues
- Positive vs. negative feedback

## Support

**Questions:** Open a discussion at https://github.com/PL-James/ROSIE/discussions

**Issues:** Report problems at https://github.com/PL-James/ROSIE/issues

**Urgent:** Contact repository maintainers directly

---

**Happy Testing! 🚀**

Once testing is complete and successful, the demo environment will be ready for public use.
