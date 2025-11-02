# Testing Guide

Comprehensive testing guide for the Netlify V2Ray reverse proxy.

---

## Quick Test Checklist

- [ ] Basic connectivity test
- [ ] HTTP GET request test
- [ ] HTTP POST request test
- [ ] Header forwarding test
- [ ] TLS/SSL verification
- [ ] Performance test
- [ ] Load test (optional)
- [ ] V2Ray client test

---

## 1. Basic Connectivity Test

### Test Landing Page
```bash
curl https://your-app.netlify.app/
```

**Expected output:**
- HTML page with "V2Ray Proxy Service"
- Status code: 200

### Test Proxy Endpoint
```bash
curl -v https://your-app.netlify.app/xhttp
```

**Expected output:**
- Forwarded to target server
- Status code depends on target server response
- Should not return 404

---

## 2. HTTP Methods Testing

### GET Request
```bash
curl -v -X GET https://your-app.netlify.app/xhttp
```

### POST Request
```bash
curl -v -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  https://your-app.netlify.app/xhttp
```

### PUT Request
```bash
curl -v -X PUT \
  -H "Content-Type: application/json" \
  -d '{"test": "update"}' \
  https://your-app.netlify.app/xhttp
```

### DELETE Request
```bash
curl -v -X DELETE https://your-app.netlify.app/xhttp
```

---

## 3. Header Forwarding Test

### Custom Headers
```bash
curl -v \
  -H "User-Agent: V2Ray/5.0" \
  -H "Accept: application/json" \
  -H "X-Custom-Header: test-value" \
  https://your-app.netlify.app/xhttp
```

**Verify in Netlify logs:**
```bash
netlify functions:log proxy
```

Headers should be forwarded to target server.

---

## 4. TLS/SSL Verification

### Check SSL Certificate
```bash
curl -v --head https://your-app.netlify.app/ 2>&1 | grep -i "ssl\|tls\|certificate"
```

### Detailed SSL Info
```bash
openssl s_client -connect your-app.netlify.app:443 -servername your-app.netlify.app
```

**Expected:**
- Valid SSL certificate from Netlify
- TLS 1.2 or 1.3
- Secure cipher suite

---

## 5. Path and Query Parameter Test

### Test with Path
```bash
curl -v https://your-app.netlify.app/xhttp/additional/path
```

### Test with Query Parameters
```bash
curl -v "https://your-app.netlify.app/xhttp?param1=value1&param2=value2"
```

### Combined Test
```bash
curl -v "https://your-app.netlify.app/xhttp/path?query=test"
```

---

## 6. Request Body Test

### JSON Body
```bash
curl -v -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from Netlify proxy", "timestamp": 1234567890}' \
  https://your-app.netlify.app/xhttp
```

### Form Data
```bash
curl -v -X POST \
  -F "field1=value1" \
  -F "field2=value2" \
  https://your-app.netlify.app/xhttp
```

### Binary Data
```bash
curl -v -X POST \
  --data-binary "@test-file.bin" \
  https://your-app.netlify.app/xhttp
```

---

## 7. Performance Testing

### Response Time
```bash
curl -o /dev/null -s -w "Time: %{time_total}s\nStatus: %{http_code}\n" \
  https://your-app.netlify.app/xhttp
```

### Multiple Requests
```bash
for i in {1..10}; do
  curl -o /dev/null -s -w "Request $i: %{time_total}s (Status: %{http_code})\n" \
    https://your-app.netlify.app/xhttp
done
```

### Average Response Time
```bash
#!/bin/bash
total=0
count=10

for i in $(seq 1 $count); do
  time=$(curl -o /dev/null -s -w "%{time_total}" https://your-app.netlify.app/xhttp)
  total=$(echo "$total + $time" | bc)
  echo "Request $i: ${time}s"
done

average=$(echo "scale=3; $total / $count" | bc)
echo "Average time: ${average}s"
```

---

## 8. Load Testing (Optional)

### Using Apache Bench
```bash
# Install ab
sudo apt-get install apache2-utils  # Ubuntu/Debian
brew install httpd                    # Mac

# Run test (100 requests, 10 concurrent)
ab -n 100 -c 10 https://your-app.netlify.app/xhttp
```

### Using wrk
```bash
# Install wrk
git clone https://github.com/wg/wrk.git
cd wrk
make
sudo mv wrk /usr/local/bin/

# Run test (30 seconds, 10 connections)
wrk -t10 -c10 -d30s https://your-app.netlify.app/xhttp
```

### Using hey
```bash
# Install hey
go install github.com/rakyll/hey@latest

# Run test (200 requests, 50 concurrent)
hey -n 200 -c 50 https://your-app.netlify.app/xhttp
```

---

## 9. Error Handling Tests

### Non-existent Path
```bash
curl -v https://your-app.netlify.app/nonexistent
```

**Expected:** 404 or redirect to home

### Invalid Method
```bash
curl -v -X INVALID https://your-app.netlify.app/xhttp
```

### Timeout Test
```bash
# Request with very short timeout
curl -v --max-time 1 https://your-app.netlify.app/xhttp
```

---

## 10. V2Ray Client Testing

### Setup Test Environment
```bash
# Install V2Ray (Linux)
bash <(curl -L https://raw.githubusercontent.com/v2fly/fhs-install-v2ray/master/install-release.sh)

# Or download from https://github.com/v2fly/v2ray-core/releases
```

### Test Configuration File
Create `/tmp/v2ray-test-config.json`:
```json
{
  "inbounds": [{
    "port": 10808,
    "protocol": "socks",
    "settings": {"auth": "noauth"}
  }],
  "outbounds": [{
    "protocol": "vless",
    "settings": {
      "vnext": [{
        "address": "your-app.netlify.app",
        "port": 443,
        "users": [{
          "id": "YOUR-UUID-HERE",
          "encryption": "none"
        }]
      }]
    },
    "streamSettings": {
      "network": "xhttp",
      "security": "tls",
      "tlsSettings": {
        "serverName": "your-app.netlify.app"
      },
      "xhttpSettings": {
        "path": "/xhttp",
        "host": "your-app.netlify.app"
      }
    }
  }]
}
```

### Run V2Ray with Test Config
```bash
v2ray run -config /tmp/v2ray-test-config.json
```

### Test Through V2Ray SOCKS Proxy
```bash
# Test connection
curl --proxy socks5://127.0.0.1:10808 https://www.google.com

# Check IP
curl --proxy socks5://127.0.0.1:10808 ifconfig.me

# Test speed
curl --proxy socks5://127.0.0.1:10808 -o /dev/null -s -w "Time: %{time_total}s\n" \
  https://speed.cloudflare.com/__down?bytes=10000000
```

---

## 11. Function Logs Testing

### View Recent Logs
```bash
netlify functions:log proxy
```

### Live Log Monitoring
```bash
netlify functions:log proxy --live
```

### Filter Logs
```bash
# View last 100 lines
netlify functions:log proxy | tail -n 100

# Search for errors
netlify functions:log proxy | grep -i error

# Search for specific status codes
netlify functions:log proxy | grep "status: 200"
```

---

## 12. Debug Mode Testing

### Enable Debug in Browser
```bash
# Add debug query parameter
curl -v "https://your-app.netlify.app/xhttp?debug=true"
```

### Check Function Response Headers
```bash
curl -v https://your-app.netlify.app/xhttp 2>&1 | grep -i "< "
```

Expected headers:
- `Content-Type`
- `Date`
- `Server: Netlify`

---

## 13. Network Inspection

### Using tcpdump (Linux)
```bash
# Monitor traffic to Netlify
sudo tcpdump -i any host your-app.netlify.app -vv
```

### Using Wireshark
1. Start capture on network interface
2. Filter: `tcp.port == 443 && tls`
3. Make request to proxy
4. Verify TLS handshake

---

## 14. Automated Testing Script

Create `test-proxy.sh`:
```bash
#!/bin/bash

PROXY_URL="https://your-app.netlify.app"
ENDPOINT="/xhttp"

echo "Starting Netlify Proxy Tests..."
echo "================================"

# Test 1: Landing page
echo -n "Test 1 - Landing page: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROXY_URL/")
if [ "$STATUS" -eq 200 ]; then
    echo "✓ PASS (Status: $STATUS)"
else
    echo "✗ FAIL (Status: $STATUS)"
fi

# Test 2: Proxy endpoint
echo -n "Test 2 - Proxy endpoint: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROXY_URL$ENDPOINT")
if [ "$STATUS" -ne 404 ]; then
    echo "✓ PASS (Status: $STATUS)"
else
    echo "✗ FAIL (Status: $STATUS)"
fi

# Test 3: POST request
echo -n "Test 3 - POST request: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -d "test=data" "$PROXY_URL$ENDPOINT")
if [ "$STATUS" -ne 404 ]; then
    echo "✓ PASS (Status: $STATUS)"
else
    echo "✗ FAIL (Status: $STATUS)"
fi

# Test 4: Custom headers
echo -n "Test 4 - Custom headers: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "User-Agent: Test" "$PROXY_URL$ENDPOINT")
if [ "$STATUS" -ne 404 ]; then
    echo "✓ PASS (Status: $STATUS)"
else
    echo "✗ FAIL (Status: $STATUS)"
fi

# Test 5: Response time
echo -n "Test 5 - Response time: "
TIME=$(curl -s -o /dev/null -w "%{time_total}" "$PROXY_URL$ENDPOINT")
echo "✓ PASS (${TIME}s)"

# Test 6: SSL certificate
echo -n "Test 6 - SSL certificate: "
if curl -s --head "$PROXY_URL/" > /dev/null 2>&1; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
fi

echo "================================"
echo "Tests completed!"
```

Run:
```bash
chmod +x test-proxy.sh
./test-proxy.sh
```

---

## 15. Monitoring Dashboard

### Create Simple Monitor
```bash
#!/bin/bash
# monitor.sh

while true; do
    clear
    echo "Netlify Proxy Monitor"
    echo "====================="
    echo "Time: $(date)"
    echo ""
    
    # Check status
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://your-app.netlify.app/xhttp)
    echo "Status: $STATUS"
    
    # Check response time
    TIME=$(curl -s -o /dev/null -w "%{time_total}" https://your-app.netlify.app/xhttp)
    echo "Response time: ${TIME}s"
    
    # Recent errors
    echo ""
    echo "Recent errors:"
    netlify functions:log proxy | grep -i error | tail -n 5
    
    sleep 30
done
```

---

## Troubleshooting Guide

### Problem: curl returns 404
**Solution:** Check redirect rules in `netlify.toml`

### Problem: Slow response times
**Solution:** 
- Check target server response time
- Verify Netlify function logs
- Test direct connection to target

### Problem: Connection timeout
**Solution:**
- Increase curl timeout: `curl --max-time 30`
- Check Netlify function timeout limits
- Verify target server is accessible

### Problem: SSL errors
**Solution:**
- Update curl: `curl --version`
- Use `--insecure` flag for testing only
- Check certificate validity

---

## Test Results Interpretation

### Good Results
- Status codes: 200, 201, 204, 301, 302
- Response time: < 2 seconds
- No timeout errors
- Headers properly forwarded

### Warning Signs
- Status codes: 500, 502, 503
- Response time: > 5 seconds
- Frequent timeouts
- Missing headers

### Critical Issues
- Status code: 404 (proxy not configured)
- Connection refused
- SSL certificate errors
- Consistent timeouts

---

## Continuous Monitoring

### Setup Uptime Monitor
Use services like:
- UptimeRobot (free tier available)
- Pingdom
- StatusCake
- Better Uptime

### Example: Uptime Robot Setup
1. Sign up at https://uptimerobot.com/
2. Add new monitor:
   - Type: HTTPS
   - URL: `https://your-app.netlify.app/xhttp`
   - Interval: 5 minutes
3. Set up alerts (email, SMS, Slack)

---

## Performance Benchmarks

### Expected Performance
- Cold start: 200-500ms
- Warm request: 100-300ms
- Transfer time: Depends on data size
- Total time: < 2 seconds for small requests

### Factors Affecting Performance
- Geographic location
- Netlify function cold start
- Target server response time
- Request/response size
- Network conditions

---

## Support and Debugging

### Enable Verbose Logging
Modify `functions/proxy.js`:
```javascript
console.log('Request:', {
  method: event.httpMethod,
  path: event.path,
  headers: event.headers
});
```

### Common Test Commands
```bash
# Quick status check
curl -I https://your-app.netlify.app/xhttp

# Detailed request
curl -v https://your-app.netlify.app/xhttp

# Time breakdown
curl -w "@curl-format.txt" -o /dev/null -s https://your-app.netlify.app/xhttp

# Where curl-format.txt contains:
# time_namelookup: %{time_namelookup}s
# time_connect: %{time_connect}s
# time_appconnect: %{time_appconnect}s
# time_pretransfer: %{time_pretransfer}s
# time_redirect: %{time_redirect}s
# time_starttransfer: %{time_starttransfer}s
# time_total: %{time_total}s
```

---

## Next Steps

After successful testing:
1. Document your results
2. Configure V2Ray client
3. Test end-to-end connection
4. Set up monitoring
5. Create backup configurations

---

## Additional Resources

- [curl Documentation](https://curl.se/docs/)
- [Netlify Function Logs](https://docs.netlify.com/functions/logs/)
- [V2Ray Testing Guide](https://www.v2ray.com/en/welcome/workflow.html)
