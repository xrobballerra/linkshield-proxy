export default async function handler(req, res) {
  // ✅ Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  // ✅ Validate URL
  const urlParam = req.query.url;
  if (!urlParam) return res.status(400).json({ error: 'Missing url', error_code: 1 });

  let targetUrl;
  try {
    targetUrl = decodeURIComponent(urlParam);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL encoding', error_code: 2 });
  }

  // ✅ Read raw body for POST/PUT
  let body = null;
  if (req.method === 'POST' || req.method === 'PUT') {
    body = await new Promise((resolve) => {
      let data = '';
      req.setEncoding('utf8');
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(data));
    });
  }

  try {
    // ✅ Forward request — compliant with RD TOS
    const fetchOptions = {
      method: req.method,
      headers: {
        'User-Agent': 'LinkShield/1.0',
        'Accept': '*/*',
      },
    };

    // ✅ Only forward safe headers (RD requires Authorization, Content-Type)
    const safe = ['authorization', 'content-type'];
    for (const [key, val] of Object.entries(req.headers)) {
      if (safe.includes(key.toLowerCase())) {
        fetchOptions.headers[key] = val;
      }
    }

    if (body !== null) {
      fetchOptions.body = body;
      fetchOptions.headers['content-length'] = Buffer.byteLength(body).toString();
    }

    const response = await fetch(targetUrl, fetchOptions);

    // ✅ Forward response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Avoid hop-by-hop headers
    const skip = ['connection', 'keep-alive', 'transfer-encoding'];
    response.headers.forEach((val, key) => {
      if (!skip.includes(key.toLowerCase())) res.setHeader(key, val);
    });

    res.status(response.status);
    const data = await response.buffer();
    return res.end(data);

  } catch (e) {
    console.error('Proxy error:', e.message);
    return res.status(500).json({ error: 'fetch failed', error_code: -1 });
  }
}
