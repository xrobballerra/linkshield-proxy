export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  // Get raw URL — no crash on malformed input
  const urlParam = req.query.url;
  if (!urlParam) return res.status(400).json({ error: 'Missing url', error_code: 1 });

  // Safely decode — fallback to raw if malformed
  let targetUrl;
  try {
    targetUrl = decodeURIComponent(urlParam);
  } catch (e) {
    // If decode fails, assume it's already decoded (common with %20 → space artifacts)
    targetUrl = urlParam;
  }

  // Read body only for POST/PUT
  let body = null;
  if (req.method === 'POST' || req.method === 'PUT') {
    body = await new Promise(resolve => {
      let data = '';
      req.setEncoding('utf8');
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(data));
    }).catch(() => null);
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'LinkShield/1.0',
        'Accept': '*/*',
        ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {}),
        ...(req.headers['content-type'] ? { 'Content-Type': req.headers['content-type'] } : {}),
      },
      body: body,
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Forward response
    response.headers.forEach((val, key) => {
      if (!['connection', 'transfer-encoding', 'keep-alive'].includes(key.toLowerCase())) {
        res.setHeader(key, val);
      }
    });

    res.status(response.status);
    const buf = await response.buffer();
    return res.end(buf);

  } catch (e) {
    console.error('Proxy error:', e.message, 'URL:', targetUrl);
    return res.status(500).json({ error: 'fetch failed', error_code: -1 });
  }
}
