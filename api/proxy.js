// api/proxy.js
export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // 2. Handle Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    const targetUrl = decodeURIComponent(url);
    
    // 3. Forward the request
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LinkShield/1.1",
        "Authorization": req.headers["authorization"] || "",
        "Content-Type": req.headers["content-type"] || "application/x-www-form-urlencoded"
      },
      // If it's a POST, we send the body as-is
      body: req.method === 'POST' ? req.body : undefined
    });

    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return res.status(response.status).send(data);

  } catch (error) {
    console.error("Proxy Error:", error.message);
    return res.status(502).json({ error: "Proxy Failed", message: error.message });
  }
}
