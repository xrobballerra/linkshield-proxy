// api/proxy.js
module.exports = async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('No URL provided');
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    const data = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // ✅ Always end the response
    res.send(data);
    res.end();

  } catch (e) {
    // ✅ Send error as JSON
    res.status(500).json({ error: e.message });
    res.end();
  }
};
