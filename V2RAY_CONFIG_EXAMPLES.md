# V2Ray Client Configuration Examples

This document provides complete V2Ray client configuration examples for using the Netlify proxy.

---

## Table of Contents
1. [Basic Configuration](#basic-configuration)
2. [Windows V2RayN](#windows-v2rayn)
3. [Android V2RayNG](#android-v2rayng)
4. [iOS Shadowrocket](#ios-shadowrocket)
5. [Linux/Mac V2Ray Core](#linuxmac-v2ray-core)
6. [Configuration Comparison](#configuration-comparison)

---

## Basic Configuration

### Original Setup (Direct Connection)
Connects directly to: `ra.sdupdates.news`

### Proxied Setup (Through Netlify)
Connects through: `your-app.netlify.app` → `ra.sdupdates.news`

**Benefits:**
- Hides real server IP
- Uses Netlify's CDN network
- Better DDoS protection

---

## Full V2Ray Core Configuration

### Direct Connection (Original)

```json
{
  "log": {
    "loglevel": "warning"
  },
  "inbounds": [
    {
      "port": 1080,
      "protocol": "socks",
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls"]
      },
      "settings": {
        "auth": "noauth",
        "udp": true
      }
    },
    {
      "port": 1081,
      "protocol": "http",
      "settings": {
        "timeout": 0
      }
    }
  ],
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
                "id": "YOUR-UUID-HERE",
                "encryption": "none",
                "level": 0
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
          "allowInsecure": false,
          "fingerprint": "chrome"
        },
        "xhttpSettings": {
          "path": "/xhttp",
          "host": "ra.sdupdates.news"
        }
      },
      "tag": "proxy"
    },
    {
      "protocol": "freedom",
      "settings": {},
      "tag": "direct"
    },
    {
      "protocol": "blackhole",
      "settings": {},
      "tag": "block"
    }
  ],
  "routing": {
    "rules": [
      {
        "type": "field",
        "ip": ["geoip:private"],
        "outboundTag": "direct"
      },
      {
        "type": "field",
        "domain": ["geosite:category-ads-all"],
        "outboundTag": "block"
      }
    ]
  }
}
```

### Through Netlify Proxy (Modified)

```json
{
  "log": {
    "loglevel": "warning"
  },
  "inbounds": [
    {
      "port": 1080,
      "protocol": "socks",
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls"]
      },
      "settings": {
        "auth": "noauth",
        "udp": true
      }
    },
    {
      "port": 1081,
      "protocol": "http",
      "settings": {
        "timeout": 0
      }
    }
  ],
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
                "id": "YOUR-UUID-HERE",
                "encryption": "none",
                "level": 0
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
          "allowInsecure": false,
          "fingerprint": "chrome"
        },
        "xhttpSettings": {
          "path": "/xhttp",
          "host": "your-app.netlify.app"
        }
      },
      "tag": "proxy"
    },
    {
      "protocol": "freedom",
      "settings": {},
      "tag": "direct"
    },
    {
      "protocol": "blackhole",
      "settings": {},
      "tag": "block"
    }
  ],
  "routing": {
    "rules": [
      {
        "type": "field",
        "ip": ["geoip:private"],
        "outboundTag": "direct"
      },
      {
        "type": "field",
        "domain": ["geosite:category-ads-all"],
        "outboundTag": "block"
      }
    ]
  }
}
```

---

## Windows V2RayN

### Import via Link (Recommended)

**Original Server:**
```
vless://YOUR-UUID@ra.sdupdates.news:443?encryption=none&security=tls&sni=ra.sdupdates.news&type=xhttp&host=ra.sdupdates.news&path=/xhttp#Original-Server
```

**Netlify Proxy:**
```
vless://YOUR-UUID@your-app.netlify.app:443?encryption=none&security=tls&sni=your-app.netlify.app&type=xhttp&host=your-app.netlify.app&path=/xhttp#Netlify-Proxy
```

### Manual Configuration Steps:

1. Open V2RayN
2. Click **"Servers"** → **"Add [VMess/VLESS] Server"**
3. Fill in details:
   - **Address:** `your-app.netlify.app`
   - **Port:** `443`
   - **UUID:** Your UUID
   - **Protocol:** VLESS
   - **Network:** xhttp
   - **Security:** TLS
   - **SNI:** `your-app.netlify.app`
   - **Path:** `/xhttp`
   - **Host:** `your-app.netlify.app`
4. Click **"OK"** and select the server
5. Test connection

---

## Android V2RayNG

### Import via QR Code

Generate QR code from the link:
```
vless://YOUR-UUID@your-app.netlify.app:443?encryption=none&security=tls&sni=your-app.netlify.app&type=xhttp&host=your-app.netlify.app&path=/xhttp#Netlify-Proxy
```

### Manual Setup:

1. Open V2RayNG
2. Tap **"+"** → **"Manual input [VLESS]"**
3. Configure:
   - **Remarks:** Netlify Proxy
   - **Address:** `your-app.netlify.app`
   - **Port:** `443`
   - **UUID:** YOUR-UUID-HERE
   - **Security:** TLS
   - **Network:** xhttp
   - **Path:** `/xhttp`
   - **Host:** `your-app.netlify.app`
   - **SNI:** `your-app.netlify.app`
4. Save and connect

---

## iOS Shadowrocket

### Import via Link

Tap on this link in Safari:
```
vless://YOUR-UUID@your-app.netlify.app:443?encryption=none&security=tls&sni=your-app.netlify.app&type=xhttp&host=your-app.netlify.app&path=/xhttp#Netlify
```

### Manual Configuration:

1. Open Shadowrocket
2. Tap **"+"** → **"Type"** → **"VLESS"**
3. Configure:
   - **Host:** `your-app.netlify.app`
   - **Port:** `443`
   - **UUID:** YOUR-UUID
   - **TLS:** ON
   - **Server Name:** `your-app.netlify.app`
   - **Transport:** xhttp
   - **Path:** `/xhttp`
   - **Host:** `your-app.netlify.app`
4. Save and enable

---

## Linux/Mac V2Ray Core

### Configuration File Location
```bash
# Linux
~/.config/v2ray/config.json
# or
/etc/v2ray/config.json

# Mac
~/Library/Application Support/v2ray/config.json
```

### Quick Setup Script

```bash
#!/bin/bash
# setup-v2ray-proxy.sh

V2RAY_CONFIG="/etc/v2ray/config.json"
NETLIFY_DOMAIN="your-app.netlify.app"
UUID="YOUR-UUID-HERE"

cat > "$V2RAY_CONFIG" <<EOF
{
  "inbounds": [
    {
      "port": 1080,
      "protocol": "socks",
      "settings": {
        "auth": "noauth",
        "udp": true
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "vless",
      "settings": {
        "vnext": [
          {
            "address": "$NETLIFY_DOMAIN",
            "port": 443,
            "users": [
              {
                "id": "$UUID",
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
          "serverName": "$NETLIFY_DOMAIN",
          "allowInsecure": false
        },
        "xhttpSettings": {
          "path": "/xhttp",
          "host": "$NETLIFY_DOMAIN"
        }
      }
    }
  ]
}
EOF

# Restart V2Ray
systemctl restart v2ray

echo "V2Ray configured to use Netlify proxy at $NETLIFY_DOMAIN"
```

Run:
```bash
chmod +x setup-v2ray-proxy.sh
sudo ./setup-v2ray-proxy.sh
```

---

## Configuration Comparison

| Parameter | Direct Connection | Netlify Proxy |
|-----------|------------------|---------------|
| **Address** | `ra.sdupdates.news` | `your-app.netlify.app` |
| **Port** | `443` | `443` |
| **UUID** | Same | Same |
| **Protocol** | VLESS | VLESS |
| **Network** | xhttp | xhttp |
| **Path** | `/xhttp` | `/xhttp` |
| **Security** | TLS | TLS |
| **SNI** | `ra.sdupdates.news` | `your-app.netlify.app` |
| **Host** | `ra.sdupdates.news` | `your-app.netlify.app` |

---

## Testing Your Configuration

### Check Connection
```bash
# Set proxy in terminal
export http_proxy=socks5://127.0.0.1:1080
export https_proxy=socks5://127.0.0.1:1080

# Test
curl -v https://www.google.com
curl ifconfig.me  # Should show Netlify/proxy IP
```

### Verify IP Masking
```bash
# Without proxy
curl ifconfig.me
# Output: Your real IP

# With proxy through Netlify
curl --proxy socks5://127.0.0.1:1080 ifconfig.me
# Output: Netlify server IP (not ra.sdupdates.news)
```

### V2Ray Client Logs
```bash
# Linux/Mac
tail -f /var/log/v2ray/access.log
tail -f /var/log/v2ray/error.log

# Or if using systemd
journalctl -u v2ray -f
```

---

## Troubleshooting

### Connection Fails
1. **Check Netlify deployment:** Visit `https://your-app.netlify.app/`
2. **Verify UUID:** Must match server configuration
3. **Check path:** Must be exactly `/xhttp`
4. **Verify TLS:** Ensure `allowInsecure: false`

### Slow Performance
1. **Test direct connection first:** Rule out server issues
2. **Check Netlify logs:** Look for timeout errors
3. **Geographic location:** Use Netlify region closest to you
4. **Function limits:** May hit 10-second timeout on slow connections

### Frequent Disconnections
1. **Netlify function timeout:** 10 seconds idle (free tier)
2. **Enable keepalive in V2Ray client**
3. **Consider Netlify Pro:** 26-second timeout
4. **Check connection pooling settings**

---

## Advanced Options

### Multiple Servers

```json
{
  "outbounds": [
    {
      "protocol": "vless",
      "settings": {
        "vnext": [
          {
            "address": "proxy1.netlify.app",
            "port": 443,
            "users": [{"id": "UUID1", "encryption": "none"}]
          }
        ]
      },
      "tag": "proxy1"
    },
    {
      "protocol": "vless",
      "settings": {
        "vnext": [
          {
            "address": "proxy2.netlify.app",
            "port": 443,
            "users": [{"id": "UUID2", "encryption": "none"}]
          }
        ]
      },
      "tag": "proxy2"
    }
  ],
  "routing": {
    "balancers": [
      {
        "tag": "balance",
        "selector": ["proxy1", "proxy2"]
      }
    ],
    "rules": [
      {
        "type": "field",
        "network": "tcp,udp",
        "balancerTag": "balance"
      }
    ]
  }
}
```

---

## Security Notes

1. **Always use TLS:** Don't set `allowInsecure: true`
2. **Keep UUID secret:** Don't share your configuration
3. **Use strong UUIDs:** Generate with `uuidgen` or similar
4. **Regular updates:** Keep V2Ray client updated
5. **Monitor usage:** Check Netlify logs for suspicious activity

---

## Support

- **V2Ray Documentation:** https://www.v2ray.com/
- **V2RayN GitHub:** https://github.com/2dust/v2rayN
- **V2RayNG GitHub:** https://github.com/2dust/v2rayNG
- **This Project Issues:** https://github.com/Toton-dhibar/Vc/issues
