export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    try {
        const targetUrl = decodeURIComponent(url);
        
        // 1. Get the user's real IP address from Vercel's headers
        const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        const options = {
            method: req.method,
            headers: {
                "User-Agent": "LinkShield-Public/1.0",
                "Authorization": req.headers["authorization"] || "",
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Forwarded-For": userIp, // Tell Real-Debrid the user's IP
                "X-Real-IP": userIp      // Some APIs prefer this header
            }
        };

        if (req.method === 'POST' && req.body) {
            options.body = typeof req.body === 'object' ? new URLSearchParams(req.body).toString() : req.body;
        }

        const response = await fetch(targetUrl, options);
        const data = await response.json();

        return res.status(response.status).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Proxy Error", details: error.message });
    }
}
