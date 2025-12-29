// api/proxy.js
export default async function handler(req, res) {
  console.log('Proxy called with URL:', req.query.url);

  const url = req.query.url;
  if (!url) {
    console.error('No URL provided');
    return res.status(400).send('No URL provided');
  }

  try {
    const targetUrl = decodeURIComponent(url);
    console.log('Fetching:', targetUrl);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    const data = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    console.log('Success - Status:', response.status);
    res.send(data);
    res.end();

  } catch (e) {
    console.error('Proxy error:', e.message);
    res.status(500).json({ error: e.message });
    res.end();
  }
}
