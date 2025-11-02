# Deployment Guide

## Step-by-Step Deployment Instructions

### Prerequisites Checklist
- [ ] Node.js installed (v18+)
- [ ] Git installed
- [ ] Netlify account created
- [ ] V2Ray server running with xhttp protocol

---

## Option 1: Deploy via Netlify CLI (Recommended)

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

Verify installation:
```bash
netlify --version
```

### Step 2: Clone the Repository
```bash
git clone https://github.com/Toton-dhibar/Vc.git
cd Vc
```

### Step 3: Login to Netlify
```bash
netlify login
```
This will open a browser window to authenticate.

### Step 4: Initialize the Site
```bash
netlify init
```

Follow the prompts:
1. **Create & configure a new site**
2. **Choose your team** (or use personal account)
3. **Site name:** Enter a unique name (e.g., `my-v2ray-proxy`)
4. **Build command:** Leave empty or use `npm run build`
5. **Publish directory:** `public`
6. **Functions directory:** `functions`

### Step 5: Deploy to Production
```bash
netlify deploy --prod
```

### Step 6: Get Your URL
```bash
netlify status
```

Look for the "Website URL" - this is your proxy domain.

---

## Option 2: Deploy via GitHub

### Step 1: Push to GitHub
```bash
# If you haven't already
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Connect to Netlify

1. Go to [https://app.netlify.com/](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and authorize
4. Select the **Vc** repository

### Step 3: Configure Build Settings

**Build settings:**
- **Branch to deploy:** `main` (or your branch name)
- **Build command:** Leave empty or `npm run build`
- **Publish directory:** `public`
- **Functions directory:** `functions`

### Step 4: Deploy

Click **"Deploy site"**

Wait 30-60 seconds for deployment to complete.

### Step 5: Get Your URL

Your site will be available at:
```
https://[random-name].netlify.app
```

You can customize this in **Site settings** → **Domain management**

---

## Option 3: Deploy via Netlify Drop

### Step 1: Prepare Deployment Package
```bash
# Ensure you have all files
ls -la

# Expected files:
# - netlify.toml
# - functions/proxy.js
# - public/index.html
# - package.json
```

### Step 2: Create Deployment Folder
```bash
# Create a clean folder
mkdir netlify-deploy
cp -r functions public netlify.toml package.json netlify-deploy/
cd netlify-deploy
```

### Step 3: Deploy via Web UI

1. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop the entire `netlify-deploy` folder
3. Wait for upload and deployment

---

## Post-Deployment Configuration

### 1. Custom Domain (Optional)
```bash
netlify domains:add yourdomain.com
```

Or in Netlify UI:
- Site settings → Domain management → Add custom domain

### 2. Configure Environment Variables
```bash
netlify env:set TARGET_SERVER "https://ra.sdupdates.news"
```

Or in Netlify UI:
- Site settings → Environment variables → Add variable

### 3. Enable HTTPS (Automatic)
Netlify automatically provisions SSL certificates. Wait 1-2 minutes.

---

## Verification Steps

### 1. Check Deployment Status
```bash
netlify status
```

Expected output:
```
Website URL: https://your-site.netlify.app
Admin URL:   https://app.netlify.com/sites/your-site
...
```

### 2. Test Basic Connectivity
```bash
curl -v https://your-site.netlify.app/
```

Should return the HTML landing page.

### 3. Test Proxy Endpoint
```bash
curl -v https://your-site.netlify.app/xhttp
```

Should attempt to connect to your V2Ray server.

### 4. Test with Headers
```bash
curl -v -H "User-Agent: v2ray-core/5.0" \
     -H "Accept: */*" \
     https://your-site.netlify.app/xhttp
```

### 5. Check Function Logs
```bash
netlify functions:log proxy
```

---

## Update Deployment

### Update Code
```bash
# Make changes to code
git add .
git commit -m "Update proxy configuration"
git push

# If using CLI deployment
netlify deploy --prod
```

### Rollback Deployment
```bash
# View previous deploys
netlify deploy:list

# Restore a specific deploy
netlify deploy:restore [deploy-id]
```

---

## Troubleshooting Deployment

### Issue: Build fails
**Check:**
- Ensure `package.json` exists
- Verify Node.js version compatibility
- Check build logs: `netlify deploy:log`

### Issue: Functions not found
**Solution:**
- Verify `functions` folder exists
- Check `netlify.toml` has correct path
- Ensure `functions/proxy.js` exists

### Issue: 404 errors
**Solution:**
- Check redirect rules in `netlify.toml`
- Verify function name matches redirect target
- Clear Netlify cache and redeploy

### Issue: Environment variables not working
**Solution:**
- Set via CLI: `netlify env:set VAR_NAME "value"`
- Or set in Netlify UI: Site settings → Environment variables
- Redeploy after setting variables

---

## CI/CD Setup (Optional)

### Auto-deploy on Git Push

**GitHub Actions Example:**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Netlify
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        with:
          args: deploy --prod
```

**Setup:**
1. Get auth token: `netlify login` → Get token from web UI
2. Get site ID: `netlify status`
3. Add secrets to GitHub repository settings
4. Push to trigger deployment

---

## Monitoring

### View Function Logs
```bash
# View recent logs
netlify functions:log proxy

# Live logs
netlify functions:log --live

# Filter by date
netlify functions:log proxy --from "2024-01-01"
```

### Analytics
View in Netlify UI:
- Site overview → Analytics
- Functions → Usage statistics

---

## Cost Estimation

### Free Tier
- 125,000 function invocations/month
- 100 GB bandwidth
- 300 build minutes

### Pro Tier ($19/month)
- 2 million function invocations
- 400 GB bandwidth
- 1000 build minutes
- Longer function timeout (26s vs 10s)

---

## Security Checklist

- [ ] HTTPS enabled (automatic)
- [ ] Environment variables for sensitive config
- [ ] Function logs don't expose secrets
- [ ] Target server uses HTTPS
- [ ] Regular security updates

---

## Support

- **Netlify Support:** https://answers.netlify.com/
- **Documentation:** https://docs.netlify.com/
- **Status Page:** https://www.netlifystatus.com/

---

## Quick Reference Commands

```bash
# Login
netlify login

# Initialize site
netlify init

# Deploy to preview
netlify deploy

# Deploy to production
netlify deploy --prod

# Check status
netlify status

# View logs
netlify functions:log proxy

# Set environment variable
netlify env:set KEY "value"

# Open admin panel
netlify open

# Open site
netlify open:site
```
