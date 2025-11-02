/**
 * Netlify Function: V2Ray xhttp Reverse Proxy
 * 
 * Forwards all requests from Netlify to the real V2Ray server
 * Target: 20.192.29.205 (ad.sdupdates.news)/xhttp
 * 
 * Using IP address to bypass DNS resolution issues
 * Host header set to domain for proper TLS/SSL and server routing
 * 
 * This proxy preserves:
 * - HTTP method (GET, POST, etc.)
 * - Headers
 * - Request body
 * - Query parameters
 */

// Use IP address to bypass DNS resolution issues from Netlify servers
const TARGET_SERVER = 'https://20.192.29.205';
// Domain name for Host header (required for TLS/SSL and virtual hosting)
const TARGET_DOMAIN = 'ad.sdupdates.news';

exports.handler = async (event, context) => {
  try {
    // Extract path from the original request
    // Event path will be like "/.netlify/functions/proxy"
    // We need to reconstruct the full path including /xhttp
    const originalPath = event.path;
    const queryString = event.rawQuery || '';
    
    // Get the actual path from headers or reconstruct from rawUrl
    let targetPath = '/xhttp';
    
    // If there's additional path info after /xhttp, include it
    if (event.rawUrl) {
      // Parse the rawUrl to get everything after the domain
      const urlMatch = event.rawUrl.match(/\/xhttp(.*?)(\?|$)/);
      if (urlMatch) {
        targetPath = '/xhttp' + (urlMatch[1] || '');
      }
    } else if (event.path && event.path.includes('/xhttp')) {
      // Fallback: extract from event.path if rawUrl is not available
      const pathMatch = event.path.match(/\/xhttp(.*)/);
      if (pathMatch) {
        targetPath = '/xhttp' + (pathMatch[1] || '');
      }
    }
    
    console.log('Original path:', originalPath);
    console.log('Target path:', targetPath);
    console.log('Raw URL:', event.rawUrl);
    
    // Build the full target URL
    const targetUrl = `${TARGET_SERVER}${targetPath}${queryString ? '?' + queryString : ''}`;
    
    // Prepare headers to forward
    const forwardHeaders = {};
    
    // Copy relevant headers from the incoming request
    // Note: Exclude WebSocket headers as Netlify Functions don't support WebSocket upgrades
    // xhttp uses regular HTTP/HTTPS, not WebSockets
    const headersToForward = [
      'accept',
      'accept-language',
      'cache-control',
      'content-type',
      'user-agent',
      'x-forwarded-for',
      'x-forwarded-proto',
      'x-real-ip'
    ];
    
    if (event.headers) {
      Object.keys(event.headers).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (headersToForward.includes(lowerKey) || lowerKey.startsWith('x-')) {
          forwardHeaders[key] = event.headers[key];
        }
      });
    }
    
    // Remove accept-encoding to avoid compression issues with binary data
    delete forwardHeaders['accept-encoding'];
    
    // Set Host header to the domain name (required for TLS/SSL handshake and virtual hosting)
    // Even though we're connecting to IP, the Host header must be the domain name
    forwardHeaders['Host'] = TARGET_DOMAIN;
    
    console.log(`Proxying ${event.httpMethod} request to: ${targetUrl}`);
    console.log('Request headers:', JSON.stringify(forwardHeaders, null, 2));
    
    // Prepare fetch options
    const fetchOptions = {
      method: event.httpMethod,
      headers: forwardHeaders,
      // Netlify functions have a 10-second timeout on free tier, 26s on Pro
      // Set a slightly lower timeout to allow for response processing
      signal: AbortSignal.timeout(25000),
      // Follow redirects automatically
      redirect: 'follow',
      // Don't reject on non-2xx responses (let V2Ray handle errors)
      // This is default behavior for fetch, but being explicit
    };
    
    // Add body for requests that have one
    // xhttp may use various HTTP methods with bodies
    if (event.body) {
      if (event.isBase64Encoded) {
        fetchOptions.body = Buffer.from(event.body, 'base64');
      } else {
        fetchOptions.body = event.body;
      }
    }
    
    // Make the request to the target server
    const response = await fetch(targetUrl, fetchOptions);
    
    // Get response body
    const responseBody = await response.arrayBuffer();
    const responseBuffer = Buffer.from(responseBody);
    
    // Extract response headers
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      // Skip headers that shouldn't be forwarded
      if (!['transfer-encoding', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
        responseHeaders[key] = value;
      }
    });
    
    console.log(`Response status: ${response.status}`);
    console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    console.log('Response body size:', responseBuffer.length);
    
    // Return the proxied response
    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: responseBuffer.toString('base64'),
      isBase64Encoded: true
    };
    
  } catch (error) {
    console.error('Proxy error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      cause: error.cause
    });
    
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Proxy error',
        message: error.message,
        code: error.code || 'UNKNOWN',
        details: 'Failed to forward request to target server. Check if the target server is accessible.'
      })
    };
  }
};
