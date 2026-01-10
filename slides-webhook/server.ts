import http from 'node:http';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const PORT = Number(process.env.PORT) || 9000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const DEPLOY_SCRIPT = '/deploy/deploy.sh';
const REPO_FILTER = process.env.REPO_FILTER || 'decoupling';

interface GithubPayload {
  ref?: string;
  repository?: {
    name?: string;
    full_name?: string;
  };
}

function verifySignature(payload: string, signature: string | undefined): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('WEBHOOK_SECRET not set - skipping signature verification');
    return true;
  }
  if (!signature) return false;

  const sig = Buffer.from(signature.replace('sha256=', ''), 'hex');
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest();

  return crypto.timingSafeEqual(sig, digest);
}

function runDeploy(): boolean {
  console.log('Running deploy script...');
  try {
    execSync(DEPLOY_SCRIPT, {
      stdio: 'inherit',
      timeout: 300000, // 5 minute timeout
    });
    console.log('Deploy completed successfully');
    return true;
  } catch (error) {
    console.error('Deploy failed:', (error as Error).message);
    return false;
  }
}

const server = http.createServer((req, res) => {
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // Only accept POST to /webhook
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    const signature = req.headers['x-hub-signature-256'] as string | undefined;

    if (!verifySignature(body, signature)) {
      console.error('Invalid signature');
      res.writeHead(401);
      res.end('Invalid signature');
      return;
    }

    let payload: GithubPayload;
    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400);
      res.end('Invalid JSON');
      return;
    }

    const event = req.headers['x-github-event'];
    console.log(`Received event: ${event}`);

    // Only handle push events
    if (event !== 'push') {
      res.writeHead(200);
      res.end('Ignored (not a push event)');
      return;
    }

    // Check if it's the master/main branch
    const ref = payload.ref || '';
    const branch = ref.replace('refs/heads/', '');

    if (branch !== 'master' && branch !== 'main') {
      console.log(`Ignoring push to branch: ${branch}`);
      res.writeHead(200);
      res.end(`Ignored (branch: ${branch})`);
      return;
    }

    // Check repo name filter
    const repoName = payload.repository?.name || '';
    if (REPO_FILTER && !repoName.includes(REPO_FILTER)) {
      console.log(`Ignoring repo: ${repoName}`);
      res.writeHead(200);
      res.end(`Ignored (repo: ${repoName})`);
      return;
    }

    console.log(`Push to ${branch} on ${repoName} - triggering deploy`);

    // Respond immediately, deploy async
    res.writeHead(200);
    res.end('Deployment triggered');

    // Run deploy in background
    setImmediate(() => runDeploy());
  });
});

server.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
  console.log(`Repo filter: ${REPO_FILTER || 'none'}`);
  console.log(`Secret configured: ${WEBHOOK_SECRET ? 'yes' : 'no'}`);
});
