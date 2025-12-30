// api/proxy.js
export default async function handler(req, res) {
  // 1. CORS Headers - THE FIX FOR YOUR ERRORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allows your GitHub Pages site
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // 2. Handle Preflight (The "OPTIONS" request)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    // 3. Forward the request to Real-Debrid
    const response = await fetch(decodeURIComponent(url), {
      method: req.method,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LinkShield/1.0",
        "Authorization": req.headers["authorization"] || "",
        "Content-Type": req.headers["content-type"] || "application/json"
      },
      // Only attach body if it's a POST/PUT request
      body: (req.method === 'POST' || req.method === 'PUT') ? JSON.stringify(req.body) : undefined
    });

    // 4. Get the response data safely
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // 5. Send back the exact status and data
    return res.status(response.status).send(data);

  } catch (error) {
    console.error("Proxy Error:", error.message);
    return res.status(502).json({ error: "Bad Gateway", message: error.message });
  }
}
