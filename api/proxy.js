export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).send('No URL provided');

  try {
    // ✅ Read body as text for POST
    const body = req.method === 'POST' ? await getRawBody(req) : null;

    const response = await fetch(decodeURIComponent(url), {
      method: req.method,
      headers: {
        ...req.headers,
        'content-length': body ? body.length.toString() : undefined,
      },
      body: body,
    });

    const data = await response.text();

    // ✅ Critical: CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    res.status(response.status).send(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ✅ Helper to read raw body (required for POST in Vercel)
async function getRawBody(req) {
  const enc = 'utf8';
  return new Promise((resolve) => {
    let data = '';
    req.setEncoding(enc);
    req.on('data', (chunk) => data += chunk);
    req.on('end', () => resolve(data));
  });
}
