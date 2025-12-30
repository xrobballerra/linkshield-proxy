export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).send('No URL provided');

  try {
    const targetUrl = decodeURIComponent(url);
    let body = null;

    if (req.method === 'POST') {
      body = await getRawBody(req);
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'LinkShield/1.0',
        'Accept': '*/*',
      },
      body: body,
    });

    const data = await response.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    res.status(response.status).send(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getRawBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => data += chunk);
    req.on('end', () => resolve(data));
  });
}
