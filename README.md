# V2Ray Netlify Reverse Proxy

A complete Netlify-based reverse proxy solution for V2Ray xhttp protocol, allowing you to route V2Ray traffic through Netlify CDN to hide your real server IP address.

## 🎯 Purpose

This project forwards all incoming requests from your Netlify domain to your real V2Ray server:
- **From:** `https://[your-app].netlify.app/xhttp/*`
- **To:** `https://ra.sdupdates.news/xhttp/*`

All traffic is securely proxied through HTTPS, preserving headers, methods, and request bodies.

## 📁 Project Structure

```
.
├── netlify.toml              # Netlify configuration
├── functions/
│   └── proxy.js             # Proxy function handler
├── public/
│   └── index.html           # Landing page
├── package.json             # Node.js dependencies
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/)
- Git
- A V2Ray server running with xhttp protocol

### Method 1: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Clone this repository:**
   ```bash
   git clone https://github.com/Toton-dhibar/Vc.git
   cd Vc
   ```

3. **Login to Netlify:**
   ```bash
   netlify login
   ```

4. **Initialize and deploy:**
   ```bash
   netlify init
   # Follow the prompts to create a new site
   
   netlify deploy --prod
   ```

5. **Your proxy will be available at:**
   ```
   https://[your-site-name].netlify.app/xhttp
   ```

### Method 2: Deploy via GitHub

1. **Fork or push this repository to GitHub**

2. **Go to [Netlify](https://app.netlify.com/) and login**

3. **Click "Add new site" → "Import an existing project"**

4. **Connect your GitHub repository**

5. **Configure build settings:**
   - Build command: `npm run build` (or leave empty)
   - Publish directory: `public`
   - Functions directory: `functions`

6. **Deploy!**

## 🔧 Configuration

### Modify Target Server

To change the target V2Ray server, edit `functions/proxy.js`:

```javascript
const TARGET_SERVER = 'https://ra.sdupdates.news';
```

Replace with your actual V2Ray server domain.

### Custom Path

If your V2Ray server uses a different path than `/xhttp`, update both:

1. **In `netlify.toml`:**
   ```toml
   [[redirects]]
     from = "/your-custom-path/*"
     to = "/.netlify/functions/proxy"
     status = 200
   ```

2. **In `functions/proxy.js`:**
   ```javascript
   let targetPath = '/your-custom-path';
   ```

## 📱 V2Ray Client Configuration

### Original Configuration (Direct Connection)
```json
{
  "outbounds": [
    {
      "protocol": "vless",
      "settings": {
        "vnext": [
          {
            "address": "ra.sdupdates.news",
            "port": 443,
            "users": [
              {
                "id": "your-uuid-here",
                "encryption": "none"
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "xhttp",
        "security": "tls",
        "tlsSettings": {
          "serverName": "ra.sdupdates.news",
          "allowInsecure": false
        },
        "xhttpSettings": {
          "path": "/xhttp",
          "host": "ra.sdupdates.news"
        }
      }
    }
  ]
}
```

### Modified Configuration (Through Netlify Proxy)
```json
{
  "outbounds": [
    {
      "protocol": "vless",
      "settings": {
        "vnext": [
          {
            "address": "your-app.netlify.app",
            "port": 443,
            "users": [
              {
                "id": "your-uuid-here",
                "encryption": "none"
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "xhttp",
        "security": "tls",
        "tlsSettings": {
          "serverName": "your-app.netlify.app",
          "allowInsecure": false
        },
        "xhttpSettings": {
          "path": "/xhttp",
          "host": "your-app.netlify.app"
        }
      }
    }
  ]
}
```

**Key changes:**
- `address`: Change from `ra.sdupdates.news` to `your-app.netlify.app`
- `serverName`: Change to your Netlify domain
- `host`: Change to your Netlify domain
- Keep the same `path`, `port`, and `id`

## 🧪 Testing

### Test the proxy with curl:

```bash
# Basic connectivity test
curl -v https://your-app.netlify.app/xhttp

# Test with custom headers
curl -v -H "User-Agent: v2ray" https://your-app.netlify.app/xhttp

# Test POST request
curl -v -X POST -d "test data" https://your-app.netlify.app/xhttp
```

### Expected Response:
- The proxy should forward requests to your V2Ray server
- You should see HTTP status codes from the target server
- Headers should be preserved

## ⚠️ Netlify Function Limitations

### Important Limits to Consider:

1. **Execution Time Limits:**
   - **Free tier:** 10 seconds maximum execution time
   - **Pro tier:** 26 seconds maximum execution time
   - **Background functions:** Up to 15 minutes (requires Pro plan)

2. **Idle Timeout:**
   - Functions have a **10-second idle timeout**
   - If no data is sent/received for 10 seconds, the connection closes
   - Not suitable for long-lived persistent connections

3. **Request/Response Size:**
   - **Request body:** 6 MB maximum
   - **Response body:** 6 MB maximum

4. **Connection Behavior:**
   - Each request creates a **new connection** to the target server
   - No persistent connection pooling
   - Not ideal for WebSocket or long polling

5. **Invocation Limits:**
   - **Free tier:** 125,000 requests/month
   - **Pro tier:** 2 million requests/month

### Implications for V2Ray xhttp:

✅ **Good for:**
- Regular HTTP/HTTPS traffic
- Short-lived requests
- Masking server IP address
- CDN caching and distribution

⚠️ **Limitations:**
- Not suitable for very long-lived connections
- Each V2Ray request goes through a cold/warm function invocation
- May have slightly higher latency than direct connection
- Limited by Netlify's timeout settings

### Workarounds:

1. **Use connection pooling in V2Ray client** to minimize connection overhead
2. **Configure appropriate timeouts** in your V2Ray client
3. **Monitor Netlify function logs** for timeout issues
4. **Consider upgrading to Pro tier** if you hit free tier limits

## 📊 Monitoring

### View function logs:
```bash
netlify functions:log proxy
```

### Check deployment status:
```bash
netlify status
```

### Real-time function logs:
```bash
netlify functions:log --live
```

## 🔍 Troubleshooting

### Issue: Connection timeout
**Solution:** Ensure your V2Ray server is accessible and responding within 10 seconds.

### Issue: 502 Bad Gateway
**Solution:** Check if your target server (`ra.sdupdates.news`) is online and accepting connections.

### Issue: Headers not preserved
**Solution:** Review the `forwardHeaders` array in `functions/proxy.js` to ensure all necessary headers are included.

### Issue: Function timeout
**Solution:** 
- Upgrade to Netlify Pro for longer timeouts
- Optimize your V2Ray server response time
- Check network connectivity between Netlify and your server

## 🛡️ Security Considerations

1. **HTTPS Only:** All traffic is encrypted via TLS
2. **Header Filtering:** Only necessary headers are forwarded
3. **Error Handling:** Errors don't expose sensitive server information
4. **No Logging of Sensitive Data:** Proxy doesn't log request/response bodies

## 📝 Development

### Local testing:
```bash
# Install dependencies
npm install

# Run local dev server
netlify dev

# Test locally
curl http://localhost:8888/xhttp
```

### Deploy to preview:
```bash
netlify deploy
```

### Deploy to production:
```bash
netlify deploy --prod
```

## 🌐 Environment Variables

If you need to configure the target server via environment variable:

1. **Add in Netlify UI:** Site settings → Environment variables
   - Key: `TARGET_SERVER`
   - Value: `https://ra.sdupdates.news`

2. **Update `functions/proxy.js`:**
   ```javascript
   const TARGET_SERVER = process.env.TARGET_SERVER || 'https://ra.sdupdates.news';
   ```

## 📄 License

MIT

## 🤝 Contributing

Feel free to open issues or submit pull requests for improvements.

## ⚡ Performance Tips

1. **Use Netlify's Edge locations** for better geographic distribution
2. **Enable caching headers** if appropriate for your use case
3. **Monitor function execution time** and optimize accordingly
4. **Consider using Netlify Edge Functions** for even lower latency (requires code updates)

## 📚 Additional Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [V2Ray Documentation](https://www.v2ray.com/)
- [xhttp Protocol Specification](https://github.com/XTLS/Xray-core)

## 🔗 Links

- Repository: https://github.com/Toton-dhibar/Vc
- Netlify: https://app.netlify.com/
- Issues: https://github.com/Toton-dhibar/Vc/issues
