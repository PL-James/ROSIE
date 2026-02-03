/**
 * ROSIE Demo API Proxy - Cloudflare Worker
 *
 * Proxies demo creation requests to GitHub Actions API
 * Allows public (unauthenticated) access to demo provisioning
 */

export interface Env {
  GITHUB_TOKEN: string;
  ALLOWED_ORIGINS: string; // Comma-separated list of allowed origins
}

interface DemoRequest {
  email?: string;
  duration?: '10' | '20' | '30';
}

interface DemoStatusResponse {
  status: 'provisioning' | 'ready' | 'error';
  message: string;
  demoUrl?: string;
  sessionId?: string;
  workflowRunId?: number;
}

const GITHUB_REPO = 'PL-James/ROSIE';
const WORKFLOW_FILE = 'create-demo.yml';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS configuration
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = (env.ALLOWED_ORIGINS || 'https://pl-james.github.io').split(',');

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };

    // Check if origin is allowed
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.trim()))) {
      corsHeaders['Access-Control-Allow-Origin'] = origin;
    }

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Route: POST /create - Create new demo
    if (url.pathname === '/create' && request.method === 'POST') {
      return handleCreateDemo(request, env, corsHeaders);
    }

    // Route: GET /status/:workflowRunId - Check demo status
    if (url.pathname.startsWith('/status/') && request.method === 'GET') {
      const workflowRunId = url.pathname.split('/')[2];
      return handleCheckStatus(workflowRunId, env, corsHeaders);
    }

    // Route: GET /health - Health check
    if (url.pathname === '/health' && request.method === 'GET') {
      return new Response(
        JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};

async function handleCreateDemo(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Parse request body
    const body = await request.json() as DemoRequest;
    const userIdentifier = body.email || 'anonymous-web-user';
    const duration = body.duration || '30';

    // Validate duration
    if (!['10', '20', '30'].includes(duration)) {
      return new Response(
        JSON.stringify({ error: 'Invalid duration. Must be 10, 20, or 30.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating demo for: ${userIdentifier}, duration: ${duration}min`);

    // Trigger GitHub Actions workflow
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'ROSIE-Demo-Worker/1.0',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            user_identifier: userIdentifier,
            duration_minutes: duration
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', response.status, errorText);

      return new Response(
        JSON.stringify({
          error: 'Failed to trigger workflow',
          details: response.status === 403 ? 'Rate limit exceeded' : 'GitHub API error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Workflow triggered successfully
    // Now we need to find the workflow run ID
    // Wait a moment for the workflow to appear in the list
    await sleep(2000);

    const workflowRunId = await getLatestWorkflowRunId(env);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo provisioning started',
        workflowRunId: workflowRunId,
        estimatedTime: '60-90 seconds'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating demo:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleCheckStatus(
  workflowRunId: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // If no workflow run ID, check latest demo issue
    if (!workflowRunId || workflowRunId === 'latest') {
      return await checkLatestDemoIssue(env, corsHeaders);
    }

    // Check workflow run status
    const runResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/runs/${workflowRunId}`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'ROSIE-Demo-Worker/1.0',
        }
      }
    );

    if (!runResponse.ok) {
      throw new Error(`GitHub API error: ${runResponse.status}`);
    }

    const runData = await runResponse.json() as any;
    const status = runData.status; // queued, in_progress, completed
    const conclusion = runData.conclusion; // success, failure, etc.

    // If completed successfully, get demo URL from issues
    if (status === 'completed' && conclusion === 'success') {
      return await checkLatestDemoIssue(env, corsHeaders);
    }

    // If still running
    if (status === 'in_progress' || status === 'queued') {
      return new Response(
        JSON.stringify({
          status: 'provisioning',
          message: 'Creating your demo environment...',
          workflowStatus: status
        } as DemoStatusResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If failed
    if (conclusion === 'failure') {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Demo provisioning failed. Please try again.'
        } as DemoStatusResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unknown state
    return new Response(
      JSON.stringify({
        status: 'provisioning',
        message: 'Checking demo status...'
      } as DemoStatusResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking status:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Failed to check demo status',
        error: String(error)
      } as DemoStatusResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function checkLatestDemoIssue(
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Get latest demo issue
    const issuesResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues?labels=demo&state=open&sort=created&direction=desc&per_page=1`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'ROSIE-Demo-Worker/1.0',
        }
      }
    );

    if (!issuesResponse.ok) {
      throw new Error(`Failed to fetch issues: ${issuesResponse.status}`);
    }

    const issues = await issuesResponse.json() as any[];

    if (issues.length === 0) {
      return new Response(
        JSON.stringify({
          status: 'provisioning',
          message: 'Demo is being created...'
        } as DemoStatusResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const latestIssue = issues[0];
    const issueBody = latestIssue.body || '';

    // Extract demo URL from issue body
    // Format: **🌐 Dashboard:** [URL](URL)
    const urlMatch = issueBody.match(/\*\*🌐 Dashboard:\*\* \[(https:\/\/[^\]]+)\]/);

    if (urlMatch && urlMatch[1]) {
      const demoUrl = urlMatch[1];

      // Extract session ID from title
      // Format: 🚀 ROSIE Demo Ready: rosie-demo-TIMESTAMP-RANDOMID
      const titleMatch = latestIssue.title.match(/rosie-demo-\d+-[a-f0-9]+/);
      const sessionId = titleMatch ? titleMatch[0] : 'unknown';

      return new Response(
        JSON.stringify({
          status: 'ready',
          message: 'Your demo is ready!',
          demoUrl: demoUrl,
          sessionId: sessionId,
          issueUrl: latestIssue.html_url
        } as DemoStatusResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // URL not found yet
    return new Response(
      JSON.stringify({
        status: 'provisioning',
        message: 'Demo is almost ready...'
      } as DemoStatusResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking demo issue:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Failed to retrieve demo URL',
        error: String(error)
      } as DemoStatusResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getLatestWorkflowRunId(env: Env): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=1`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'ROSIE-Demo-Worker/1.0',
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as any;
    if (data.workflow_runs && data.workflow_runs.length > 0) {
      return data.workflow_runs[0].id;
    }

    return null;
  } catch (error) {
    console.error('Error getting workflow run ID:', error);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
