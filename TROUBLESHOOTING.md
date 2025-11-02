# Troubleshooting Guide

Common issues and solutions for the V2Ray Netlify reverse proxy.

---

## Table of Contents
1. [Deployment Issues](#deployment-issues)
2. [Connection Problems](#connection-problems)
3. [Performance Issues](#performance-issues)
4. [Configuration Errors](#configuration-errors)
5. [Netlify Function Issues](#netlify-function-issues)
6. [V2Ray Client Issues](#v2ray-client-issues)

---

## Deployment Issues

### Issue: "Build failed" on Netlify

**Symptoms:**
- Deployment fails in Netlify
- Build logs show errors

**Solutions:**

1. **Check Node.js version:**
   ```bash
   # Add to package.json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

2. **Verify file structure:**
   ```bash
   # Required files must exist
   ls -la netlify.toml
   ls -la functions/proxy.js
   ls -la package.json
   ```

3. **Clear build cache:**
   - Netlify UI → Site settings → Build & deploy → Clear cache and retry

---

### Issue: "Functions directory not found"

**Symptoms:**
- Functions don't appear in Netlify UI
- 404 on function endpoints

**Solutions:**

1. **Check netlify.toml:**
   ```toml
   [build]
     functions = "functions"
   ```

2. **Verify folder exists:**
   ```bash
   ls -la functions/
   # Should show proxy.js
   ```

3. **Redeploy:**
   ```bash
   netlify deploy --prod
   ```

---

### Issue: Git push fails

**Symptoms:**
- `git push` returns errors
- "Permission denied" errors

**Solutions:**

1. **Check remote URL:**
   ```bash
   git remote -v
   # Should point to your repository
   ```

2. **Use Netlify CLI instead:**
   ```bash
   netlify deploy --prod
   ```

---

## Connection Problems

### Issue: "404 Not Found" on /xhttp

**Symptoms:**
```bash
curl https://your-app.netlify.app/xhttp
# Returns: 404
```

**Solutions:**

1. **Check redirects in netlify.toml:**
   ```toml
   [[redirects]]
     from = "/xhttp/*"
     to = "/.netlify/functions/proxy"
     status = 200
     force = true
   ```

2. **Test function directly:**
   ```bash
   curl https://your-app.netlify.app/.netlify/functions/proxy
   ```

3. **Check function deployment:**
   ```bash
   netlify functions:list
   # Should show "proxy"
   ```

4. **View function logs:**
   ```bash
   netlify functions:log proxy
   ```

---

### Issue: "Connection timeout"

**Symptoms:**
- Requests hang for 10+ seconds
- Eventually timeout with no response

**Solutions:**

1. **Test target server directly:**
   ```bash
   curl -v https://ra.sdupdates.news/xhttp
   # Should respond quickly
   ```

2. **Check Netlify function logs:**
   ```bash
   netlify functions:log proxy
   # Look for timeout errors
   ```

3. **Verify target server is accessible:**
   ```bash
   ping ra.sdupdates.news
   nslookup ra.sdupdates.news
   ```

4. **Try from different location:**
   - Netlify functions run in different regions
   - Target server might block certain regions

---

### Issue: "502 Bad Gateway"

**Symptoms:**
```
HTTP 502 Bad Gateway
```

**Solutions:**

1. **Target server is down:**
   ```bash
   # Test target server
   curl https://ra.sdupdates.news/xhttp
   ```

2. **DNS issues:**
   ```bash
   nslookup ra.sdupdates.news
   # Should return valid IP
   ```

3. **Check proxy code:**
   ```bash
   # View functions/proxy.js
   cat functions/proxy.js | grep TARGET_SERVER
   # Should be: https://ra.sdupdates.news
   ```

4. **Enable detailed logging:**
   Edit `functions/proxy.js` to add more logs:
   ```javascript
   console.log('Attempting connection to:', targetUrl);
   console.log('Response received:', response.status);
   ```

---

### Issue: "SSL certificate error"

**Symptoms:**
- SSL/TLS handshake fails
- Certificate verification errors

**Solutions:**

1. **Check certificate validity:**
   ```bash
   openssl s_client -connect your-app.netlify.app:443 -servername your-app.netlify.app
   ```

2. **Wait for certificate provisioning:**
   - New Netlify sites take 1-2 minutes to get SSL
   - Check: Site settings → Domain management → HTTPS

3. **For testing only (not recommended):**
   ```bash
   curl --insecure https://your-app.netlify.app/xhttp
   ```

---

## Performance Issues

### Issue: Slow response times

**Symptoms:**
- Requests take 3+ seconds
- Noticeable lag compared to direct connection

**Solutions:**

1. **Check baseline performance:**
   ```bash
   # Test target server directly
   time curl https://ra.sdupdates.news/xhttp
   
   # Test through proxy
   time curl https://your-app.netlify.app/xhttp
   ```

2. **Function cold starts:**
   - First request is slower (cold start)
   - Subsequent requests are faster
   - Solution: Keep functions warm with periodic pings

3. **Geographic distance:**
   - Netlify functions run in specific regions
   - Check: https://www.netlifystatus.com/
   - Consider target server location

4. **Optimize proxy code:**
   - Remove unnecessary header processing
   - Minimize logging in production

---

### Issue: Frequent disconnections

**Symptoms:**
- V2Ray client disconnects often
- Connection drops after 10 seconds

**Solutions:**

1. **Netlify timeout limits:**
   - Free tier: 10 seconds max
   - Pro tier: 26 seconds max
   - Consider upgrading: https://www.netlify.com/pricing/

2. **Configure keepalive:**
   Edit V2Ray config:
   ```json
   "xhttpSettings": {
     "path": "/xhttp",
     "host": "YOUR-DOMAIN.netlify.app",
     "keepAliveInterval": 30
   }
   ```

3. **Use connection pooling:**
   ```json
   "mux": {
     "enabled": true,
     "concurrency": 8
   }
   ```

---

### Issue: High latency

**Symptoms:**
- Ping times > 500ms
- Slow page loads

**Solutions:**

1. **Test latency components:**
   ```bash
   # To Netlify
   ping your-app.netlify.app
   
   # To target server
   ping ra.sdupdates.news
   ```

2. **Use CDN features:**
   - Netlify automatically uses edge locations
   - No configuration needed

3. **Optimize V2Ray settings:**
   ```json
   "mux": {
     "enabled": true,
     "concurrency": 16
   }
   ```

---

## Configuration Errors

### Issue: Wrong target server

**Symptoms:**
- Connects to wrong server
- Unexpected responses

**Solutions:**

1. **Check TARGET_SERVER in proxy.js:**
   ```javascript
   const TARGET_SERVER = 'https://ra.sdupdates.news';
   ```

2. **Verify path configuration:**
   ```javascript
   let targetPath = '/xhttp';
   ```

3. **Redeploy after changes:**
   ```bash
   git add functions/proxy.js
   git commit -m "Fix target server"
   git push
   ```

---

### Issue: Path mismatch

**Symptoms:**
- 404 errors
- Wrong endpoint

**Solutions:**

1. **Match paths everywhere:**
   - `netlify.toml`: `from = "/xhttp/*"`
   - `functions/proxy.js`: `let targetPath = '/xhttp'`
   - V2Ray client: `"path": "/xhttp"`

2. **Test path routing:**
   ```bash
   curl https://your-app.netlify.app/xhttp
   curl https://your-app.netlify.app/xhttp/test
   ```

---

### Issue: Headers not forwarded

**Symptoms:**
- Authentication fails
- Custom headers missing

**Solutions:**

1. **Check header forwarding in proxy.js:**
   ```javascript
   const headersToForward = [
     'accept',
     'content-type',
     'user-agent',
     // Add your custom headers here
   ];
   ```

2. **Test header forwarding:**
   ```bash
   curl -v -H "X-Custom: test" https://your-app.netlify.app/xhttp
   ```

3. **View logs to verify:**
   ```bash
   netlify functions:log proxy
   ```

---

## Netlify Function Issues

### Issue: Function timeout

**Symptoms:**
```
Function execution timed out
```

**Solutions:**

1. **Check timeout limits:**
   - Free: 10 seconds
   - Pro: 26 seconds
   - Background: 15 minutes (Pro only)

2. **Optimize function code:**
   - Remove unnecessary processing
   - Reduce logging
   - Stream responses if possible

3. **Upgrade plan if needed:**
   https://www.netlify.com/pricing/

---

### Issue: Function memory limit

**Symptoms:**
```
Function exceeded memory limit
```

**Solutions:**

1. **Check request/response size:**
   - Max 6 MB per request/response
   - Split large transfers if needed

2. **Optimize buffer usage:**
   ```javascript
   // Stream instead of buffering
   const responseBody = await response.arrayBuffer();
   ```

---

### Issue: Rate limiting

**Symptoms:**
- 429 Too Many Requests
- Intermittent failures

**Solutions:**

1. **Check usage limits:**
   - Free: 125,000 requests/month
   - Pro: 2,000,000 requests/month

2. **View usage stats:**
   - Netlify UI → Site overview → Usage

3. **Implement caching if possible:**
   ```toml
   [[headers]]
     for = "/xhttp"
     [headers.values]
       Cache-Control = "public, max-age=60"
   ```

---

## V2Ray Client Issues

### Issue: "Failed to connect to server"

**Symptoms:**
- V2Ray client can't connect
- Connection timeout in client logs

**Solutions:**

1. **Verify configuration:**
   ```json
   {
     "address": "your-app.netlify.app",  // NOT ra.sdupdates.news
     "port": 443,
     "serverName": "your-app.netlify.app"  // Must match address
   }
   ```

2. **Check UUID:**
   ```bash
   # Must be valid UUID format
   # Example: 12345678-1234-1234-1234-123456789abc
   ```

3. **Test with curl first:**
   ```bash
   curl https://your-app.netlify.app/xhttp
   ```

---

### Issue: "TLS handshake failed"

**Symptoms:**
- TLS errors in V2Ray logs
- Certificate verification failed

**Solutions:**

1. **Check SNI configuration:**
   ```json
   "tlsSettings": {
     "serverName": "your-app.netlify.app",  // Must match domain
     "allowInsecure": false  // Keep false for security
   }
   ```

2. **Verify fingerprint:**
   ```json
   "tlsSettings": {
     "fingerprint": "chrome"  // or "firefox", "safari"
   }
   ```

---

### Issue: Client works but no internet

**Symptoms:**
- V2Ray connects successfully
- But can't access websites

**Solutions:**

1. **Check routing rules:**
   ```json
   "routing": {
     "rules": [
       {
         "type": "field",
         "network": "tcp,udp",
         "outboundTag": "proxy"  // Must match outbound tag
       }
     ]
   }
   ```

2. **Test SOCKS proxy:**
   ```bash
   curl --proxy socks5://127.0.0.1:1080 https://www.google.com
   ```

3. **Check DNS:**
   ```json
   "dns": {
     "servers": [
       "1.1.1.1",
       "8.8.8.8"
     ]
   }
   ```

---

## Debugging Commands

### Check Netlify deployment
```bash
netlify status
netlify functions:list
netlify deploy:list
```

### View logs
```bash
# Live logs
netlify functions:log proxy --live

# Recent logs
netlify functions:log proxy

# Filter errors
netlify functions:log proxy | grep -i error
```

### Test endpoints
```bash
# Basic test
curl -v https://your-app.netlify.app/xhttp

# With headers
curl -v -H "User-Agent: V2Ray" https://your-app.netlify.app/xhttp

# POST test
curl -v -X POST -d "test=data" https://your-app.netlify.app/xhttp
```

### V2Ray debugging
```bash
# Test config syntax
v2ray test -config config.json

# Run with verbose logging
v2ray run -config config.json

# Check logs
tail -f /var/log/v2ray/error.log
journalctl -u v2ray -f
```

---

## Getting Help

If you're still having issues:

1. **Check logs first:**
   ```bash
   netlify functions:log proxy --live
   ```

2. **Create minimal test case:**
   ```bash
   curl -v https://your-app.netlify.app/xhttp
   ```

3. **Open an issue:**
   - Go to: https://github.com/Toton-dhibar/Vc/issues
   - Include:
     - Error message
     - Netlify domain (if not sensitive)
     - Steps to reproduce
     - Relevant logs

4. **Useful information to include:**
   - Node.js version: `node --version`
   - Netlify CLI version: `netlify --version`
   - V2Ray version: `v2ray version`
   - Operating system

---

## Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `404 Not Found` | Path not configured | Check redirects in netlify.toml |
| `502 Bad Gateway` | Target server unreachable | Verify target server is online |
| `504 Gateway Timeout` | Request took too long | Check Netlify function timeout limits |
| `Function invocation failed` | Code error | Check function logs |
| `SSL handshake failed` | TLS configuration issue | Verify SNI and serverName match |
| `Connection refused` | Network blocked | Check firewall/network settings |

---

## Prevention Tips

✅ **Best practices:**
- Test configuration before deploying
- Monitor function logs regularly
- Keep V2Ray client updated
- Use version control for configs
- Document your setup

❌ **Avoid:**
- Hardcoding sensitive data
- Using `allowInsecure: true`
- Ignoring timeout errors
- Skipping tests after changes
- Committing secrets to Git

---

## Additional Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Netlify Status Page](https://www.netlifystatus.com/)
- [V2Ray Documentation](https://www.v2ray.com/)
- [This Project's README](README.md)
- [GitHub Issues](https://github.com/Toton-dhibar/Vc/issues)
