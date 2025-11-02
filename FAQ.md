# Frequently Asked Questions (FAQ)

Common questions and answers about the V2Ray Netlify Reverse Proxy.

---

## General Questions

### Q: What is this project?
**A:** A Netlify-based reverse proxy that forwards V2Ray xhttp traffic to your real server, hiding its IP address behind Netlify's CDN.

### Q: Why would I use this?
**A:** To:
- Hide your real server IP from clients
- Protect against DDoS attacks
- Leverage Netlify's global CDN
- Add an extra layer of security

### Q: Is it free?
**A:** Yes! Netlify offers a free tier with:
- 125,000 function invocations/month
- 100 GB bandwidth
- Automatic HTTPS
- Global CDN

For heavy usage, Netlify Pro ($19/month) provides:
- 2 million invocations
- 400 GB bandwidth
- Longer function timeouts

### Q: Is it legal?
**A:** Yes, using a reverse proxy is legal. However:
- Use responsibly
- Follow Netlify's Terms of Service
- Respect local laws and regulations
- Don't use for illegal activities

---

## Technical Questions

### Q: How does it work?
**A:** 
```
Client → Netlify CDN → Serverless Function → Your V2Ray Server
```
The Netlify function acts as a middleman, forwarding all requests.

### Q: What protocols are supported?
**A:** 
- V2Ray VLESS protocol
- xhttp transport
- TLS encryption
- HTTPS only

### Q: Can I use other protocols?
**A:** With modifications, yes! Edit `functions/proxy.js` to support:
- VMess
- Trojan
- Shadowsocks
- Other HTTP-based protocols

### Q: Does it support WebSocket?
**A:** Partially. Netlify functions have timeout limits:
- Free: 10 seconds
- Pro: 26 seconds
Not ideal for long-lived WebSocket connections.

### Q: What about UDP?
**A:** No, Netlify functions only support HTTP/HTTPS (TCP).

---

## Setup Questions

### Q: What are the prerequisites?
**A:**
- Netlify account (free)
- Node.js installed
- A V2Ray server already running
- Basic command-line knowledge

### Q: How long does setup take?
**A:** 2-5 minutes if you follow QUICKSTART.md

### Q: Do I need a domain name?
**A:** No! You get a free `*.netlify.app` subdomain. Custom domains are optional.

### Q: Can I use my own domain?
**A:** Yes! Configure in Netlify:
1. Site settings → Domain management
2. Add custom domain
3. Configure DNS records
4. Update V2Ray client config

### Q: Can I change the target server?
**A:** Yes! Edit `functions/proxy.js`:
```javascript
const TARGET_SERVER = 'https://your-server.com';
```
Then redeploy.

---

## Performance Questions

### Q: Will it slow down my connection?
**A:** Yes, slightly. Expect 40-200ms additional latency due to:
- Extra network hop (Client → Netlify → Server)
- Function processing time
- Cold start delays

### Q: What is cold start?
**A:** First request to a function takes longer (200-500ms) as Netlify initializes it. Subsequent requests are faster.

### Q: How can I reduce latency?
**A:**
1. Keep functions warm with periodic pings
2. Enable V2Ray mux (connection pooling)
3. Use Netlify Pro for better performance
4. Choose Netlify region closest to you

### Q: Can I deploy to multiple regions?
**A:** Netlify automatically uses global edge locations. For more control, deploy multiple sites in different Netlify regions.

---

## Configuration Questions

### Q: What is the default path?
**A:** `/xhttp` - must match in:
- `netlify.toml` redirects
- `functions/proxy.js` code
- V2Ray client config

### Q: Can I change the path?
**A:** Yes! Update in three places:
1. `netlify.toml`: `from = "/your-path/*"`
2. `functions/proxy.js`: `let targetPath = '/your-path'`
3. V2Ray client: `"path": "/your-path"`

### Q: How do I get my UUID?
**A:** Ask your V2Ray server administrator, or if it's your server, check server config.

### Q: Can I use multiple UUIDs?
**A:** Yes! This is handled by your V2Ray server, not the proxy. The proxy just forwards requests.

### Q: Do I need to open ports?
**A:** No! Everything runs over HTTPS (port 443).

---

## Troubleshooting Questions

### Q: I get 404 errors, what's wrong?
**A:** Check:
1. Path matches everywhere (`/xhttp`)
2. Function deployed successfully
3. Redirects configured in `netlify.toml`

Run: `netlify functions:list` to verify function exists

### Q: Connection times out after 10 seconds
**A:** Netlify free tier limit. Solutions:
1. Upgrade to Pro (26 seconds)
2. Optimize server response time
3. Use for shorter requests only

### Q: Function logs show errors
**A:** View detailed logs:
```bash
netlify functions:log proxy --live
```
Common issues:
- Target server unreachable
- DNS resolution failed
- SSL certificate problems

### Q: V2Ray client can't connect
**A:** Verify:
1. Netlify domain correct
2. UUID matches server
3. Path is `/xhttp`
4. TLS enabled
5. Port is 443

Test with curl first:
```bash
curl https://your-app.netlify.app/xhttp
```

### Q: Slow speeds?
**A:** Possible causes:
1. Target server is slow
2. Geographic distance
3. Function cold starts
4. Network congestion

Test direct connection to rule out server issues.

---

## Security Questions

### Q: Is it secure?
**A:** Yes, if configured correctly:
- All traffic encrypted via TLS
- UUID authentication required
- No plaintext data exposed

### Q: Can Netlify see my traffic?
**A:** Netlify sees:
- Encrypted V2Ray protocol data (can't decrypt)
- Connection metadata (IPs, timestamps)
- Cannot see actual web traffic content

### Q: Should I use `allowInsecure: true`?
**A:** NO! This disables certificate validation and is dangerous. Always keep `allowInsecure: false`.

### Q: How do I rotate credentials?
**A:** 
1. Get new UUID from server
2. Update V2Ray client config
3. Test connection
4. Update other clients
No proxy changes needed!

### Q: What if my UUID leaks?
**A:**
1. Immediately change UUID on server
2. Update all clients
3. Check server logs for unauthorized access
4. Consider IP whitelisting if available

---

## Cost Questions

### Q: How much does it cost?
**A:** 
**Free tier:** $0/month
- 125K invocations
- 100 GB bandwidth
- Good for light use

**Pro tier:** $19/month
- 2M invocations
- 400 GB bandwidth
- Better performance

### Q: How many requests can I make?
**A:** Free tier: ~4,000 per day (125K/month)

Each V2Ray request counts as one invocation. Typical usage:
- Light browsing: 1,000-5,000/day
- Heavy use: 10,000-50,000/day

### Q: Will I exceed free tier?
**A:** Depends on usage. Monitor at:
Netlify UI → Site overview → Usage

Set up alerts to notify when approaching limits.

### Q: What happens if I exceed limits?
**A:** Netlify will notify you and may temporarily disable functions. Upgrade to Pro to continue.

---

## Comparison Questions

### Q: Why not use Cloudflare Workers?
**A:** Both work! Cloudflare Workers:
- Similar concept
- Different platform
- Different pricing
- May have different limits

Choose based on your preference.

### Q: Why not use a VPN?
**A:** Different use cases:
- **VPN:** Device-level, all traffic
- **V2Ray Proxy:** App-level, selective routing
- **This project:** Adds IP masking to V2Ray

### Q: Why not use direct V2Ray?
**A:** Direct connection exposes your server IP. This proxy:
- Hides server IP
- Adds DDoS protection
- Uses CDN benefits
- Small latency cost

### Q: Netlify vs traditional proxy server?
**A:**
**Netlify:**
- Serverless (no server management)
- Auto-scaling
- Global CDN
- Free tier
- Usage-based limits

**Traditional:**
- Full control
- No usage limits
- Requires server management
- Fixed costs

---

## Advanced Questions

### Q: Can I customize the function code?
**A:** Yes! Edit `functions/proxy.js`. You can:
- Add custom headers
- Implement caching
- Add logging
- Filter requests
- Transform data

### Q: Can I add authentication?
**A:** Yes, but V2Ray already has UUID authentication. Additional auth at function level is possible but may complicate setup.

### Q: Can I use environment variables?
**A:** Yes!
```bash
netlify env:set KEY "value"
```

Then in code:
```javascript
const value = process.env.KEY;
```

### Q: Can I cache responses?
**A:** Carefully! V2Ray traffic should NOT be cached. But you could cache other endpoints if you add them.

### Q: Can I monitor function performance?
**A:** Yes, several ways:
1. Netlify UI analytics
2. Function logs
3. External monitoring (UptimeRobot, etc.)
4. Custom logging in code

### Q: Can I use multiple target servers?
**A:** Yes! Modify `functions/proxy.js` to:
- Load balance between servers
- Failover to backup servers
- Route based on path/headers

### Q: Can I deploy to other platforms?
**A:** The concept works on any serverless platform with modifications:
- Vercel Functions
- AWS Lambda
- Google Cloud Functions
- Azure Functions

---

## Usage Questions

### Q: Can I use for streaming?
**A:** Yes, but with limitations:
- 10-second timeout on free tier
- Not ideal for long streams
- Better for short video clips

### Q: Can I use for gaming?
**A:** Not recommended due to:
- Additional latency (40-200ms)
- Timeout limits
- Best for web browsing and API calls

### Q: Can I use for torrenting?
**A:** Not recommended:
- Against most VPN/proxy policies
- High bandwidth usage
- May violate Netlify ToS
- Better alternatives available

### Q: Can I share with friends?
**A:** Your choice, but consider:
- Shared usage counts against your limits
- You're responsible for all traffic
- May need Pro tier for more usage
- Recommend they deploy their own

---

## Maintenance Questions

### Q: How do I update the proxy?
**A:**
1. Edit files locally
2. Test changes
3. Deploy: `netlify deploy --prod`

### Q: How often should I update?
**A:** 
- Check for security updates monthly
- Update V2Ray client regularly
- Monitor Netlify for platform updates

### Q: Do I need to maintain the server?
**A:** No server maintenance! Netlify handles:
- Infrastructure
- Scaling
- Updates
- Security patches

You only maintain:
- Your V2Ray server
- Function code (optional)
- Client configurations

### Q: How do I back up my config?
**A:**
```bash
# Backup files
git push origin main

# Or manual backup
tar -czf backup.tar.gz netlify.toml functions/ package.json

# Backup V2Ray client config separately
```

---

## Compatibility Questions

### Q: What V2Ray clients work?
**A:** All standard V2Ray clients:
- v2rayN (Windows)
- v2rayNG (Android)
- Shadowrocket (iOS)
- V2Ray core (Linux/Mac)
- Qv2ray (Desktop)

### Q: Does it work with Xray?
**A:** Yes! Xray is compatible with V2Ray protocol. Use same configuration.

### Q: What operating systems are supported?
**A:** All! The proxy runs on Netlify (cloud), clients work on:
- Windows
- macOS
- Linux
- Android
- iOS

### Q: Does it work in China?
**A:** Depends on:
- Your V2Ray server location
- Current blocking status
- Netlify accessibility
No guarantees; use at your own discretion.

---

## Documentation Questions

### Q: Where do I start?
**A:** 
1. **Quick start:** QUICKSTART.md
2. **Detailed:** README.md
3. **Configuration:** V2RAY_CONFIG_EXAMPLES.md
4. **Problems:** TROUBLESHOOTING.md

### Q: I found a bug, what should I do?
**A:**
1. Check TROUBLESHOOTING.md
2. Search existing GitHub issues
3. Open new issue with details:
   - Error message
   - Steps to reproduce
   - Your environment
   - Logs (sanitized)

### Q: Can I contribute?
**A:** Yes! This is open source (MIT License):
- Report bugs
- Suggest features
- Fix documentation
- Submit pull requests
- Share improvements

### Q: Where can I get help?
**A:**
1. Read documentation
2. Check FAQ (this file)
3. GitHub issues
4. V2Ray community forums
5. Netlify support (for platform issues)

---

## Miscellaneous

### Q: Can I use for commercial purposes?
**A:** Yes, under MIT License. But:
- Respect Netlify ToS
- Consider Pro tier for commercial use
- Provide support to your users
- Give attribution (optional but appreciated)

### Q: Is this production-ready?
**A:** Yes! The code includes:
- Error handling
- Logging
- Binary data support
- Security considerations

But always:
- Test thoroughly
- Monitor usage
- Have backup plans
- Read all documentation

### Q: What's the catch?
**A:** No catch! It's genuinely free (for basic usage) but:
- Usage limits on free tier
- Added latency
- Timeout constraints
- Platform dependency

### Q: Will Netlify ban me for this?
**A:** As long as you:
- Follow their ToS
- Don't abuse the service
- Stay within usage limits
- Don't host illegal content

You should be fine.

### Q: Can I sell this as a service?
**A:** Yes, MIT License allows it. But:
- Provide value-add (support, customization)
- Don't just resell without changes
- Give attribution
- Understand your responsibilities

---

## Still Have Questions?

1. **Search the docs:** Most questions are answered in the comprehensive guides
2. **GitHub Issues:** https://github.com/Toton-dhibar/Vc/issues
3. **V2Ray Community:** For V2Ray-specific questions
4. **Netlify Support:** For platform-specific issues

---

**Last Updated:** 2024  
**More FAQs:** See individual guide files for specific topics
