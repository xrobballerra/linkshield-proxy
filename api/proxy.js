export default async function handler(req, res) {
  // ✅ Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  // ✅ Validate URL parameter
  const urlParam = req.query.url;
  if (!urlParam) {
    return res.status(400).json({ error: 'Missing url parameter', error_code: 1 });
  }

  let targetUrl;
  try {
    targetUrl = decodeURIComponent(urlParam);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL encoding', error_code: 2 });
  }

  // ✅ Read raw body for POST/PUT
  let body = null;
  if (req.method === 'POST' || req.method === 'PUT') {
    body = await new Promise((resolve, reject) => {
      let data = '';
      req.setEncoding('utf8');
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(data));
      req.on('error', reject);
    }).catch(err => {
      console.error('Body read error:', err);
      return null;
    });
  }

  try {
    // ✅ Prepare fetch options
    const fetchOptions = {
      method: req.method,
      headers: {
        'User-Agent': 'LinkShield/1.0',
        'Accept': '*/*',
      },
    };

    // ✅ Forward essential headers
    const safeHeaders = ['authorization', 'content-type'];
    for (const [key, value] of Object.entries(req.headers)) {
      if (safeHeaders.includes(key.toLowerCase())) {
        fetchOptions.headers[key] = value;
      }
    }

    // ✅ Set body and content-length for POST/PUT
    if (body !== null) {
      fetchOptions.body = body;
      fetchOptions.headers['content-length'] = Buffer.byteLength(body).toString();
    }

    // ✅ Make request to target
    const response = await fetch(targetUrl, fetchOptions);

    // ✅ Forward response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Copy non-hop-by-hop headers
    const excludedHeaders = [
      'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
      'te', 'trailer', 'transfer-encoding', 'upgrade'
    ];
    response.headers.forEach((value, key) => {
      if (!excludedHeaders.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.status(response.status);
    const data = await response.buffer();
    return res.end(data);

  } catch (e) {
    console.error('Proxy error:', e.message);
    return res.status(500).json({ error: 'fetch failed', error_code: -1 });
  }
}
