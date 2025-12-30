
export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).send('No URL provided');

  try {
    const targetUrl = decodeURIComponent(url);
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'LinkShield/1.0',
      },
    });
    const data = await response.text();

    // ✅ Critical CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    res.send(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
