// api/proxy.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "No URL provided" });

    try {
        const fetchOptions = {
            method: req.method,
            headers: {
                "User-Agent": "LinkShield-App/1.2",
                "Authorization": req.headers["authorization"] || "",
                "Content-Type": "application/x-www-form-urlencoded" // Force this header
            }
        };

        if (req.method === 'POST') {
            // If the body is an object, convert it back to a URL string
            if (typeof req.body === 'object') {
                fetchOptions.body = new URLSearchParams(req.body).toString();
            } else {
                fetchOptions.body = req.body;
            }
        }

        const response = await fetch(decodeURIComponent(url), fetchOptions);
        const data = await response.json().catch(() => ({}));
        
        return res.status(response.status).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
