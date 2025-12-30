export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: "Missing URL parameter" });
    }

    try {
        const targetUrl = decodeURIComponent(url);
        console.log('Proxying request to:', targetUrl);
        
        // Get user's real IP from Vercel headers
        const forwardedFor = req.headers['x-forwarded-for'];
        const userIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
        
        console.log('User IP:', userIp);

        // Build fetch options
        const fetchOptions = {
            method: req.method,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        // Forward authorization header if present
        if (req.headers.authorization) {
            fetchOptions.headers.Authorization = req.headers.authorization;
        }

        // Add user's IP to headers (for Real-Debrid IP verification)
        if (userIp !== 'unknown') {
            fetchOptions.headers["X-Forwarded-For"] = userIp;
            fetchOptions.headers["X-Real-IP"] = userIp;
        }

        // Handle POST body
        if (req.method === 'POST') {
            const chunks = [];
            
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            
            const bodyBuffer = Buffer.concat(chunks);
            const bodyString = bodyBuffer.toString('utf8');
            
            if (bodyString) {
                fetchOptions.body = bodyString;
                console.log('POST body:', bodyString);
            }
        }

        // Make the request
        const response = await fetch(targetUrl, fetchOptions);
        const responseText = await response.text();
        
        console.log('Response status:', response.status);
        console.log('Response body:', responseText.substring(0, 200));

        // Try to parse as JSON
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch {
            responseData = responseText;
        }

        // Return response
        return res.status(response.status).json(responseData);
        
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ 
            error: "Proxy Error", 
            details: error.message,
            stack: error.stack
        });
    }
}

// Disable body parser
export const config = {
    api: {
        bodyParser: false,
    },
};
