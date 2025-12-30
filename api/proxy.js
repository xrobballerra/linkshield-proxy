export default async function handler(req, res) {
  // 1. Extract the target URL from query parameters
  const { url } = req.query;

  // 2. Immediate Validation (Returns 400 instead of crashing with 500)
  if (!url) {
    return res.status(400).json({ 
      error: "Bad Request", 
      message: "The 'url' query parameter is required." 
    });
  }

  try {
    // 3. URL Format Validation
    const targetUrl = new URL(url);

    // 4. Execute the Proxy Request
    const response = await fetch(targetUrl.toString(), {
      method: req.method, // Forwards GET, POST, etc.
      headers: {
        "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
        "Accept": "application/json",
      },
      // Real-Debrid often blocks requests with no User-Agent
    });

    // 5. Safely handle the response body
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // 6. Forward the exact status code and data
    return res.status(response.status).send(data);

  } catch (error) {
    // 7. Error Logging & Graceful Failure
    console.error("[Proxy Error]:", error.message);

    // Differentiate between a bad URL and a connection failure
    const statusCode = error.code === 'ERR_INVALID_URL' ? 400 : 502;
    
    return res.status(statusCode).json({
      error: "Proxy Execution Failed",
      details: error.message
    });
  }
}
