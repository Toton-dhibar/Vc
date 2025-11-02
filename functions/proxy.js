/**
 * Netlify Function: V2Ray xhttp Reverse Proxy
 * 
 * Forwards all requests from Netlify to the real V2Ray server
 * Target: ra.sdupdates.news/xhttp
 * 
 * This proxy preserves:
 * - HTTP method (GET, POST, etc.)
 * - Headers
 * - Request body
 * - Query parameters
 */

const TARGET_SERVER = 'https://ra.sdupdates.news';

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
    }
    
    // Build the full target URL
    const targetUrl = `${TARGET_SERVER}${targetPath}${queryString ? '?' + queryString : ''}`;
    
    console.log(`Proxying ${event.httpMethod} request to: ${targetUrl}`);
    
    // Prepare headers to forward
    const forwardHeaders = {};
    
    // Copy relevant headers from the incoming request
    const headersToForward = [
      'accept',
      'accept-encoding',
      'accept-language',
      'cache-control',
      'content-type',
      'user-agent',
      'sec-websocket-key',
      'sec-websocket-version',
      'sec-websocket-protocol',
      'sec-websocket-extensions',
      'upgrade',
      'connection',
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
    
    // Set Host header to target server
    forwardHeaders['Host'] = 'ra.sdupdates.news';
    
    // Prepare fetch options
    const fetchOptions = {
      method: event.httpMethod,
      headers: forwardHeaders,
    };
    
    // Add body for POST, PUT, PATCH requests
    if (event.body && ['POST', 'PUT', 'PATCH'].includes(event.httpMethod)) {
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
    
    // Return the proxied response
    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: responseBuffer.toString('base64'),
      isBase64Encoded: true
    };
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Proxy error',
        message: error.message,
        details: 'Failed to forward request to target server'
      })
    };
  }
};
