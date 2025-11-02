# Quick Start Guide

Get your V2Ray Netlify proxy running in 5 minutes!

---

## Prerequisites

- Netlify account (free tier works)
- Node.js installed
- Your V2Ray server details

---

## Step 1: Deploy to Netlify (Choose One Method)

### Method A: One-Click Deploy (Easiest)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Toton-dhibar/Vc)

Click the button above and follow the prompts.

### Method B: Via CLI (Recommended)

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Clone and navigate
git clone https://github.com/Toton-dhibar/Vc.git
cd Vc

# 3. Login to Netlify
netlify login

# 4. Initialize and deploy
netlify init
netlify deploy --prod
```

### Method C: Via GitHub

1. Fork this repository
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Import from Git"
4. Select your forked repository
5. Click "Deploy"

---

## Step 2: Get Your Netlify URL

After deployment, you'll get a URL like:
```
https://your-site-name.netlify.app
```

**Save this URL!** You'll need it for your V2Ray client.

---

## Step 3: Configure Your Target Server (Optional)

If your V2Ray server is NOT `ra.sdupdates.news`, edit `functions/proxy.js`:

```javascript
// Change this line
const TARGET_SERVER = 'https://ra.sdupdates.news';

// To your server
const TARGET_SERVER = 'https://your-server.com';
```

Then redeploy:
```bash
git add functions/proxy.js
git commit -m "Update target server"
git push
# Or: netlify deploy --prod
```

---

## Step 4: Configure V2Ray Client

### Quick Config Template

Replace these values:
- `YOUR-NETLIFY-DOMAIN` → your actual Netlify domain
- `YOUR-UUID` → your V2Ray UUID

```json
{
  "outbounds": [{
    "protocol": "vless",
    "settings": {
      "vnext": [{
        "address": "YOUR-NETLIFY-DOMAIN.netlify.app",
        "port": 443,
        "users": [{
          "id": "YOUR-UUID",
          "encryption": "none"
        }]
      }]
    },
    "streamSettings": {
      "network": "xhttp",
      "security": "tls",
      "tlsSettings": {
        "serverName": "YOUR-NETLIFY-DOMAIN.netlify.app"
      },
      "xhttpSettings": {
        "path": "/xhttp",
        "host": "YOUR-NETLIFY-DOMAIN.netlify.app"
      }
    }
  }]
}
```

### For V2RayN (Windows)

Import this link (replace YOUR-UUID and YOUR-DOMAIN):
```
vless://YOUR-UUID@YOUR-DOMAIN.netlify.app:443?encryption=none&security=tls&sni=YOUR-DOMAIN.netlify.app&type=xhttp&host=YOUR-DOMAIN.netlify.app&path=/xhttp#Netlify-Proxy
```

### For V2RayNG (Android)

1. Open V2RayNG
2. Tap "+" → "Import config from clipboard"
3. Paste the link above
4. Connect

---

## Step 5: Test Your Connection

### Test 1: Basic Connectivity
```bash
curl https://YOUR-DOMAIN.netlify.app/
```
Should return HTML page.

### Test 2: Proxy Endpoint
```bash
curl https://YOUR-DOMAIN.netlify.app/xhttp
```
Should connect to your V2Ray server.

### Test 3: Through V2Ray Client
```bash
# After connecting V2Ray client
curl --proxy socks5://127.0.0.1:1080 https://www.google.com
curl --proxy socks5://127.0.0.1:1080 ifconfig.me
```

---

## Troubleshooting

### Problem: 404 Error
**Solution:** Check that `/xhttp` path matches in both:
- `netlify.toml` redirects
- `functions/proxy.js` code
- Your V2Ray client config

### Problem: Connection Failed
**Solution:**
1. Verify your V2Ray server is online
2. Check target server URL in `functions/proxy.js`
3. Test direct connection to server first

### Problem: Slow Speed
**Solution:**
1. This is normal - proxy adds some latency
2. Try connecting from different locations
3. Check Netlify function logs for timeouts

---

## Next Steps

✅ **You're done!** Your proxy is working.

**Recommended:**
- ⭐ Star this repository
- 📖 Read [README.md](README.md) for full details
- 🧪 Check [TESTING.md](TESTING.md) for comprehensive tests
- 📚 Review [V2RAY_CONFIG_EXAMPLES.md](V2RAY_CONFIG_EXAMPLES.md) for more configs

---

## Important Limits

**Netlify Free Tier:**
- ⏱️ 10 seconds max function execution time
- 📦 125,000 requests/month
- 💾 6 MB max request/response size

**Upgrade to Pro if needed:**
- ⏱️ 26 seconds execution time
- 📦 2 million requests/month

---

## Common Commands

```bash
# View logs
netlify functions:log proxy

# Check status
netlify status

# Redeploy
netlify deploy --prod

# Open admin panel
netlify open

# Open site
netlify open:site
```

---

## Support

- 📝 [Full Documentation](README.md)
- 🚀 [Deployment Guide](DEPLOYMENT.md)
- 🧪 [Testing Guide](TESTING.md)
- 💬 [Open an Issue](https://github.com/Toton-dhibar/Vc/issues)

---

## Security Tips

✅ **Do:**
- Use HTTPS only
- Keep your UUID secret
- Monitor usage regularly
- Update V2Ray client regularly

❌ **Don't:**
- Share your UUID
- Use `allowInsecure: true`
- Commit secrets to Git
- Expose admin credentials

---

**🎉 Enjoy your V2Ray Netlify proxy!**
