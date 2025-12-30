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
        const forwardedFor = req.headers['x-forwarded-for'];
        const userIp = forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers['x-real-ip'] || 'unknown';
        
        console.log('User IP:', userIp); // Debug log

        const options = {
            method: req.method,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        // Add Authorization header if present
        if (req.headers["authorization"]) {
            options.headers["Authorization"] = req.headers["authorization"];
        }

        // CRITICAL: Add user's real IP to the request
        // Real-Debrid checks this to ensure the request comes from the authenticated user
        if (userIp && userIp !== 'unknown') {
            options.headers["X-Forwarded-For"] = userIp;
            options.headers["X-Real-IP"] = userIp;
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
            details: error.message
        });
    }
}

// This tells Vercel to NOT parse the body automatically
export const config = {
    api: {
        bodyParser: false,
    },
};
