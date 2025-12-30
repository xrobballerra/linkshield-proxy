export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    try {
        const targetUrl = decodeURIComponent(url);
        
        // Get the user's real IP address from Vercel's headers
        const userIp = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || 'unknown';

        const options = {
            method: req.method,
            headers: {
                "User-Agent": "LinkShield-Public/1.0",
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Forwarded-For": userIp,
                "X-Real-IP": userIp
            }
        };

        // Add Authorization header if present
        if (req.headers["authorization"]) {
            options.headers["Authorization"] = req.headers["authorization"];
        }

        // Handle POST body properly
        if (req.method === 'POST') {
            // Read the raw body from the request
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            const body = Buffer.concat(chunks).toString();
            
            if (body) {
                options.body = body;
            }
        }

        const response = await fetch(targetUrl, options);
        const contentType = response.headers.get('content-type');
        
        // Handle JSON responses
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return res.status(response.status).json(data);
        } else {
            // Handle text responses
            const text = await response.text();
            return res.status(response.status).send(text);
        }
        
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ 
            error: "Proxy Error", 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

// This tells Vercel to NOT parse the body automatically
export const config = {
    api: {
        bodyParser: false,
    },
};
