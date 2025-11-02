/**
 * Netlify Function: V2Ray xhttp Reverse Proxy
 * 
 * Forwards all requests from Netlify to the real V2Ray server
 * Target: 20.192.29.205 (ad.sdupdates.news)/xhttp
 * 
 * Using IP address with custom TLS settings to bypass DNS issues
 * SNI set to domain for proper TLS/SSL certificate validation
 * 
 * This proxy preserves:
 * - HTTP method (GET, POST, etc.)
 * - Headers
 * - Request body
 * - Query parameters
 */

const https = require('https');
const http = require('http');

// Use IP address to bypass DNS resolution issues from Netlify servers
const TARGET_IP = '20.192.29.205';
const TARGET_PORT = 443;
const TARGET_PROTOCOL = 'https';
// Domain name for SNI and Host header (required for TLS/SSL certificate validation)
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
    
    // Build the full target path with query string
    const fullPath = targetPath + (queryString ? '?' + queryString : '');
    
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
    
    // Set Host header to the domain name (required for virtual hosting)
    forwardHeaders['Host'] = TARGET_DOMAIN;
    
    console.log(`Proxying ${event.httpMethod} request to: ${TARGET_PROTOCOL}://${TARGET_IP}:${TARGET_PORT}${fullPath}`);
    console.log('SNI: ', TARGET_DOMAIN);
    console.log('Request headers:', JSON.stringify(forwardHeaders, null, 2));
    
    // Prepare request body
    let requestBody = null;
    if (event.body) {
      if (event.isBase64Encoded) {
        requestBody = Buffer.from(event.body, 'base64');
      } else {
        requestBody = Buffer.from(event.body);
      }
    }
    
    // Make the HTTPS request with custom options to handle IP + SNI
    const { statusCode, headers: responseHeaders, body: responseBuffer } = await new Promise((resolve, reject) => {
      const options = {
        hostname: TARGET_IP,
        port: TARGET_PORT,
        path: fullPath,
        method: event.httpMethod,
        headers: forwardHeaders,
        // Set SNI to domain name for proper TLS certificate validation
        servername: TARGET_DOMAIN,
        // Set timeout
        timeout: 25000,
      };
      
      const client = TARGET_PROTOCOL === 'https' ? https : http;
      const req = client.request(options, (res) => {
        const chunks = [];
        
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        res.on('end', () => {
          const responseBuffer = Buffer.concat(chunks);
          
          // Extract response headers (exclude hop-by-hop headers)
          const headers = {};
          Object.keys(res.headers).forEach(key => {
            if (!['transfer-encoding', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
              headers[key] = res.headers[key];
            }
          });
          
          resolve({
            statusCode: res.statusCode,
            headers: headers,
            body: responseBuffer
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      // Send request body if present
      if (requestBody) {
        req.write(requestBody);
      }
      
      req.end();
    });
    
    console.log(`Response status: ${statusCode}`);
    console.log('Response headers:', JSON.stringify(responseHeaders, null, 2));
    console.log('Response body size:', responseBuffer.length);
    
    // Return the proxied response
    return {
      statusCode: statusCode,
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
