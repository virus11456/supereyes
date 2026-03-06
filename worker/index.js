/**
 * SuperEyes CORS Proxy - Cloudflare Worker
 *
 * Deploy this worker to Cloudflare (free tier: 100K requests/day)
 * Then set the Worker URL in SuperEyes settings.
 *
 * Setup:
 *   1. Go to https://dash.cloudflare.com/ → Workers & Pages → Create
 *   2. Click "Create Worker"
 *   3. Paste this code and click "Deploy"
 *   4. Copy the worker URL (e.g. https://supereyes-proxy.your-name.workers.dev)
 *   5. Paste it into SuperEyes settings → Proxy URL
 */

const ALLOWED_ORIGINS = [
  'https://virus11456.github.io',
  'http://localhost',
  'http://127.0.0.1',
];

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request) {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }

    // Get target URL from query param or path
    const url = new URL(request.url);
    let target = url.searchParams.get('url') || url.pathname.slice(1);

    if (!target) {
      return new Response(JSON.stringify({ error: 'Missing ?url= parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      });
    }

    // Decode if needed
    try {
      if (target.startsWith('http%3A') || target.startsWith('https%3A')) {
        target = decodeURIComponent(target);
      }
    } catch {}

    // Forward the request
    try {
      const headers = new Headers();
      // Forward safe headers
      for (const [key, value] of request.headers.entries()) {
        if (['content-type', 'authorization', 'accept'].includes(key.toLowerCase())) {
          headers.set(key, value);
        }
      }

      const resp = await fetch(target, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
      });

      // Return with CORS headers
      const responseHeaders = new Headers(resp.headers);
      for (const [key, value] of Object.entries(getCorsHeaders(request))) {
        responseHeaders.set(key, value);
      }

      return new Response(resp.body, {
        status: resp.status,
        statusText: resp.statusText,
        headers: responseHeaders,
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) },
      });
    }
  },
};
