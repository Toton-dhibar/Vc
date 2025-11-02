# Architecture Overview

Understanding how the V2Ray Netlify reverse proxy works.

---

## System Architecture

```
┌─────────────────┐
│   V2Ray Client  │
│   (Your Device) │
└────────┬────────┘
         │ VLESS + xhttp + TLS
         │ Port 443
         ▼
┌─────────────────────────────┐
│   Netlify CDN Network       │
│                             │
│  ┌──────────────────────┐  │
│  │ your-app.netlify.app │  │
│  │                      │  │
│  │  ┌────────────────┐ │  │
│  │  │ Netlify Edge   │ │  │
│  │  │ (Global CDN)   │ │  │
│  │  └────────┬───────┘ │  │
│  │           │          │  │
│  │  ┌────────▼───────┐ │  │
│  │  │ Netlify        │ │  │
│  │  │ Function       │ │  │
│  │  │ (proxy.js)     │ │  │
│  │  └────────┬───────┘ │  │
│  └───────────┼─────────┘  │
└──────────────┼─────────────┘
               │ HTTPS
               │ Port 443
               ▼
┌─────────────────────────────┐
│   Real V2Ray Server         │
│   ra.sdupdates.news         │
│                             │
│  ┌──────────────────────┐  │
│  │ V2Ray Core           │  │
│  │ Protocol: VLESS      │  │
│  │ Network: xhttp       │  │
│  │ Path: /xhttp         │  │
│  │ Port: 443 (TLS)      │  │
│  └──────────────────────┘  │
└─────────────────────────────┘
```

---

## Request Flow

### 1. Client Initiates Connection

```
V2Ray Client → Netlify CDN
- Protocol: VLESS over xhttp
- URL: https://your-app.netlify.app/xhttp
- Method: GET/POST
- Headers: Standard HTTP headers + V2Ray specific
- Body: Encrypted V2Ray payload
```

### 2. Netlify Edge Processing

```
Netlify CDN receives request:
1. SSL/TLS termination
2. Routing based on netlify.toml rules
3. Redirect /xhttp/* → /.netlify/functions/proxy
4. Function invocation
```

### 3. Netlify Function (proxy.js)

```javascript
exports.handler = async (event, context) => {
  // 1. Parse incoming request
  const method = event.httpMethod;      // GET, POST, etc.
  const path = '/xhttp';                // Target path
  const headers = event.headers;        // Client headers
  const body = event.body;              // Request payload
  
  // 2. Build target URL
  const targetUrl = `https://ra.sdupdates.news/xhttp`;
  
  // 3. Forward request to real server
  const response = await fetch(targetUrl, {
    method: method,
    headers: forwardHeaders,
    body: body
  });
  
  // 4. Return response to client
  return {
    statusCode: response.status,
    headers: response.headers,
    body: response.body
  };
}
```

### 4. Forward to Real Server

```
Netlify Function → Real V2Ray Server
- Protocol: HTTPS
- URL: https://ra.sdupdates.news/xhttp
- Method: Same as client request
- Headers: Forwarded from client
- Body: Forwarded from client
```

### 5. Real Server Response

```
V2Ray Server processes request:
1. Receives proxied request
2. Authenticates V2Ray protocol
3. Processes V2Ray payload
4. Returns encrypted response
```

### 6. Response Flow Back

```
Real Server → Netlify Function → Netlify CDN → Client
- All data is passed through unchanged
- Headers preserved
- Binary data handled correctly
- Status codes forwarded
```

---

## Component Details

### Netlify Components

#### 1. `netlify.toml` (Configuration)
```toml
[build]
  functions = "functions"    # Where functions are located
  publish = "public"         # Static files directory

[[redirects]]
  from = "/xhttp/*"          # Incoming path
  to = "/.netlify/functions/proxy"  # Function to call
  status = 200               # HTTP status (not redirect)
  force = true               # Override other rules
```

**Purpose:**
- Configure build settings
- Define routing rules
- Set redirect behavior

#### 2. `functions/proxy.js` (Serverless Function)
```javascript
// Main proxy handler
exports.handler = async (event, context) => {
  // Request processing logic
}
```

**Responsibilities:**
- Parse incoming requests
- Forward headers correctly
- Proxy body data (binary safe)
- Handle errors
- Return responses

**Limitations:**
- Max execution: 10s (free) / 26s (pro)
- Max payload: 6 MB
- No persistent connections
- Cold start latency: 50-200ms

#### 3. `public/index.html` (Landing Page)
- Simple static HTML
- Provides basic info
- Not used by V2Ray traffic

---

### V2Ray Components

#### 1. Client Configuration
```json
{
  "address": "your-app.netlify.app",     // Netlify domain
  "port": 443,                           // HTTPS
  "protocol": "vless",                   // V2Ray protocol
  "network": "xhttp",                    // Transport
  "path": "/xhttp"                       // Path
}
```

#### 2. Server Configuration
- Runs on `ra.sdupdates.news:443`
- Listens on `/xhttp` path
- Handles VLESS protocol
- Authenticates via UUID

---

## Security Architecture

### Encryption Layers

```
┌─────────────────────────────────────┐
│ Application Layer                   │
│ V2Ray Protocol Encryption           │ ← UUID-based auth
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ Transport Layer                     │
│ TLS 1.3 Encryption                  │ ← Netlify ↔ Client
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ Network Layer                       │
│ TCP/IP                              │
└─────────────────────────────────────┘
```

### Trust Boundaries

1. **Client ↔ Netlify:**
   - TLS encrypted
   - Certificate validated
   - SNI: your-app.netlify.app

2. **Netlify ↔ Real Server:**
   - TLS encrypted
   - Certificate validated
   - SNI: ra.sdupdates.news

3. **End-to-End:**
   - V2Ray protocol encryption
   - UUID authentication
   - No plaintext data

---

## Data Flow Diagram

### Outbound Request (Client → Internet)

```
┌─────────┐
│ Browser │ HTTP Request
└────┬────┘
     │
     ▼
┌─────────────┐
│ V2Ray Client│ Encapsulate in VLESS
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ Local Proxy  │ SOCKS5/HTTP: 127.0.0.1:1080
└──────┬───────┘
       │
       ▼ xhttp over TLS
┌───────────────────┐
│ Netlify CDN       │
│ your-app.netlify  │
└────────┬──────────┘
         │
         ▼ HTTPS
┌─────────────────┐
│ Netlify Function│ Forward request
└────────┬────────┘
         │
         ▼ HTTPS
┌─────────────────────┐
│ Real V2Ray Server   │
│ ra.sdupdates.news   │
└─────────┬───────────┘
          │
          ▼ Decapsulate VLESS
┌───────────────┐
│ Internet      │ Original HTTP request
└───────────────┘
```

### Inbound Response (Internet → Client)

```
┌───────────────┐
│ Internet      │ HTTP Response
└───────┬───────┘
        │
        ▼
┌─────────────────────┐
│ Real V2Ray Server   │ Encapsulate in VLESS
└─────────┬───────────┘
          │
          ▼ HTTPS
┌─────────────────┐
│ Netlify Function│ Forward response
└────────┬────────┘
         │
         ▼ HTTPS
┌───────────────────┐
│ Netlify CDN       │
└────────┬──────────┘
         │
         ▼ xhttp over TLS
┌──────────────┐
│ V2Ray Client │ Decapsulate VLESS
└──────┬───────┘
       │
       ▼
┌─────────────┐
│ Local Proxy │ Return to app
└──────┬──────┘
       │
       ▼
┌─────────┐
│ Browser │ Display response
└─────────┘
```

---

## Latency Analysis

### Direct Connection (Without Proxy)
```
Client → Real Server: 50-150ms
Total: 50-150ms
```

### Through Netlify Proxy
```
Client → Netlify CDN:    20-100ms  (Geographic proximity)
Netlify CDN → Function:  10-50ms   (Internal network)
Function → Real Server:  50-150ms  (Server location)
Processing Time:         10-50ms   (Function execution)
────────────────────────────────
Total:                   90-350ms
```

**Added Latency:** 40-200ms
**Acceptable for:** Web browsing, API calls
**Not ideal for:** Gaming, real-time video

---

## Scalability

### Netlify Limits (Free Tier)

| Resource | Limit | Impact |
|----------|-------|--------|
| Invocations | 125K/month | ~4K/day |
| Execution time | 10 seconds | Kills long requests |
| Bandwidth | 100 GB | ~3.3 GB/day |
| Concurrent | Variable | Auto-scales |

### Scaling Strategies

1. **Upgrade to Pro:**
   - 2M invocations/month
   - 26s execution time
   - 400 GB bandwidth

2. **Multiple Proxies:**
   - Deploy to different Netlify sites
   - Load balance in V2Ray config
   - Geographical distribution

3. **Optimize Function:**
   - Reduce cold starts
   - Minimize processing
   - Efficient header handling

---

## Failure Modes

### 1. Netlify Function Timeout
```
Result: Connection drops after 10s
Mitigation: Upgrade to Pro, optimize code
Recovery: Automatic retry by V2Ray
```

### 2. Real Server Down
```
Result: 502 Bad Gateway
Mitigation: Health checks, fallback servers
Recovery: V2Ray tries next server
```

### 3. Rate Limit Exceeded
```
Result: 429 Too Many Requests
Mitigation: Upgrade plan, use multiple sites
Recovery: Exponential backoff
```

### 4. Cold Start Latency
```
Result: First request slow (200-500ms)
Mitigation: Keep-alive pings, pre-warming
Recovery: N/A (expected behavior)
```

---

## Monitoring Points

### Key Metrics to Track

1. **Function Performance:**
   - Execution time
   - Cold vs warm starts
   - Error rate
   - Invocation count

2. **Network:**
   - Latency
   - Throughput
   - Connection success rate
   - Geographic distribution

3. **Usage:**
   - Daily invocations
   - Bandwidth consumed
   - Peak load times
   - Cost projection

### Monitoring Tools

```bash
# Netlify CLI
netlify functions:log proxy
netlify status

# External monitors
- UptimeRobot
- Pingdom
- Custom health check scripts
```

---

## Optimization Opportunities

### 1. Code Optimization
- Remove unnecessary logging in production
- Stream large responses
- Efficient header parsing
- Minimize memory usage

### 2. Configuration Tuning
- Enable V2Ray mux for connection pooling
- Adjust keepalive intervals
- Optimize routing rules
- DNS caching

### 3. Infrastructure
- Use Netlify Edge Functions (lower latency)
- Multiple geographic deployments
- CDN optimization
- Custom domains with lower TTL

---

## Security Considerations

### What's Protected

✅ **Real server IP hidden**
- DNS resolves to Netlify, not your server
- Direct attacks blocked

✅ **DDoS mitigation**
- Netlify's infrastructure absorbs attacks
- Rate limiting built-in

✅ **TLS everywhere**
- Client ↔ Netlify: TLS 1.3
- Netlify ↔ Server: TLS 1.3
- Certificate validation enabled

### Potential Risks

⚠️ **Function code exposure**
- Code is in public repository
- Mitigation: Use environment variables for secrets

⚠️ **Traffic analysis**
- Netlify sees encrypted traffic patterns
- Mitigation: Inherent to proxy design

⚠️ **UUID compromise**
- If leaked, unauthorized access possible
- Mitigation: Keep UUID secret, rotate regularly

---

## Comparison with Alternatives

### vs Direct Connection
- **Pros:** IP masking, DDoS protection
- **Cons:** Higher latency, usage limits
- **Use case:** When IP hiding is priority

### vs Cloudflare Workers
- **Pros:** Similar concept, global edge
- **Cons:** Different platform, pricing
- **Use case:** Alternative platform

### vs VPN
- **Pros:** Lighter weight, application-level
- **Cons:** Less features, per-connection
- **Use case:** Specific app proxying

### vs CDN Directly
- **Pros:** Built for static content
- **Cons:** No dynamic proxying
- **Use case:** Static assets only

---

## Future Enhancements

### Potential Improvements

1. **Edge Functions:**
   - Lower latency
   - Better performance
   - Code changes required

2. **Multiple Backends:**
   - Load balancing
   - Failover support
   - Geographic routing

3. **Caching Layer:**
   - Cache responses (where appropriate)
   - Reduce backend load
   - Faster repeated requests

4. **Monitoring Dashboard:**
   - Real-time metrics
   - Alert system
   - Usage analytics

---

## Technical Specifications

### Supported HTTP Methods
- GET
- POST
- PUT
- DELETE
- PATCH
- HEAD
- OPTIONS

### Supported Content Types
- application/json
- application/octet-stream
- text/plain
- text/html
- multipart/form-data
- All standard MIME types

### Header Handling
- **Forwarded:** User-Agent, Accept, Content-Type, Custom headers
- **Modified:** Host (changed to target)
- **Stripped:** Connection, Transfer-Encoding (internal)

### Binary Data
- Base64 encoding for transport
- Automatic detection
- No size modification

---

## References

- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [V2Ray Protocol](https://www.v2ray.com/)
- [xhttp Transport](https://github.com/XTLS/Xray-core)
- [TLS 1.3 Specification](https://datatracker.ietf.org/doc/html/rfc8446)

---

**Last Updated:** 2024
**Maintained by:** V2Ray Netlify Proxy Contributors
