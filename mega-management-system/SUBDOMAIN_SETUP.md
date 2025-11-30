# Subdomain Setup Guide for MEGA Management System

## Overview

This guide explains how to set up your MEGA Management System with a subdomain structure:

- **megaenterprise.in** → Landing page (marketing website)
- **app.megaenterprise.in** → Management application (this system)

This is a professional setup that separates your public-facing website from your internal management application.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     megaenterprise.in                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Landing Page (Static/WordPress)             │  │
│  │  - Company info                                       │  │
│  │  - Services                                           │  │
│  │  - Contact                                            │  │
│  │  - Link to app.megaenterprise.in                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  app.megaenterprise.in                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        MEGA Management System (This Application)      │  │
│  │  - User authentication                                │  │
│  │  - Dashboard                                          │  │
│  │  - Client management                                  │  │
│  │  - Quotations                                         │  │
│  │  - Tasks & Projects                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: DNS Configuration

### Option A: Both on Same Server (Cloud Run)

1. **Deploy the management app to Cloud Run**
   ```bash
   gcloud run deploy mega-management \
     --source . \
     --region asia-south1 \
     --allow-unauthenticated
   ```

2. **Get your Cloud Run URL**
   ```bash
   gcloud run services describe mega-management \
     --region asia-south1 \
     --format 'value(status.url)'
   ```

3. **Map the subdomain to Cloud Run**
   ```bash
   # Map app.megaenterprise.in to Cloud Run
   gcloud run domain-mappings create \
     --service mega-management \
     --domain app.megaenterprise.in \
     --region asia-south1
   ```

4. **Update DNS records** (in your domain registrar - GoDaddy, Namecheap, etc.)
   
   After running the above command, Google Cloud will provide DNS records to add:
   
   ```
   Type: CNAME
   Name: app
   Value: ghs.googlehosted.com
   TTL: 3600
   ```

5. **Wait for DNS propagation** (can take 5 minutes to 48 hours, typically 15-30 minutes)
   
   Check status:
   ```bash
   nslookup app.megaenterprise.in
   ```

6. **SSL Certificate** will be automatically provisioned by Google Cloud (takes 15-30 minutes)

### Option B: Different Hosting Providers

If your landing page is on different hosting (e.g., WordPress on Hostinger):

**For megaenterprise.in (Landing Page):**
- Point to your hosting provider's nameservers
- Configure as usual through your hosting control panel

**For app.megaenterprise.in (Management App):**
- Add DNS record in your domain registrar:
  ```
  Type: CNAME
  Name: app
  Value: ghs.googlehosted.com
  TTL: 3600
  ```

---

## Step 2: Configure Server CORS

The server has already been updated to allow both domains. Verify the configuration in `server/server.js`:

```javascript
const allowedOrigins = [
  'http://localhost:3000',                                    // Local development
  'https://mega-management-411708517030.asia-south1.run.app', // Direct Cloud Run URL
  'https://app.megaenterprise.in',                           // App subdomain
  'https://megaenterprise.in'                                 // Main domain (optional)
];
```

---

## Step 3: Update Environment Variables

### Development (.env file)
```env
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Production (Cloud Run Environment Variables)
```bash
gcloud run services update mega-management \
  --region asia-south1 \
  --update-env-vars "CLIENT_URL=https://app.megaenterprise.in"
```

Or set via Google Cloud Console:
- Go to Cloud Run → mega-management → Edit & Deploy New Revision
- Add/Update environment variable: `CLIENT_URL=https://app.megaenterprise.in`

---

## Step 4: Build and Deploy

### Local Development
No changes needed. Continue using:
```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm start
```

Access at: `http://localhost:3000`

### Production Deployment
```bash
# Deploy to Cloud Run
gcloud run deploy mega-management \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --update-env-vars "CLIENT_URL=https://app.megaenterprise.in"
```

---

## Step 5: Verify Setup

### 1. Check DNS Resolution
```bash
# Should return Google's IP addresses
nslookup app.megaenterprise.in

# Should show SSL certificate
curl -I https://app.megaenterprise.in
```

### 2. Check Application
- Visit: `https://app.megaenterprise.in`
- Should see login page
- Try logging in with test credentials

### 3. Check CORS
Open browser console and check for CORS errors:
- Should see no "blocked by CORS" errors
- API calls should succeed

### 4. Check Health Endpoint
```bash
curl https://app.megaenterprise.in/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "MEGA Management Server is running",
  "timestamp": "2024-...",
  "environment": "production"
}
```

---

## Common Issues & Troubleshooting

### Issue 1: "DNS record not found"
**Solution:** DNS propagation takes time. Wait 15-30 minutes and try again.

```bash
# Check DNS status
dig app.megaenterprise.in

# Or use online tools
# https://dnschecker.org
```

### Issue 2: "CORS blocked"
**Solution:** Verify CLIENT_URL is set correctly
```bash
# Check current environment variables
gcloud run services describe mega-management \
  --region asia-south1 \
  --format 'value(spec.template.spec.containers[0].env)'

# Update if needed
gcloud run services update mega-management \
  --region asia-south1 \
  --update-env-vars "CLIENT_URL=https://app.megaenterprise.in"
```

### Issue 3: "SSL certificate pending"
**Solution:** SSL provisioning takes 15-30 minutes after DNS is configured.

```bash
# Check domain mapping status
gcloud run domain-mappings describe \
  --domain app.megaenterprise.in \
  --region asia-south1
```

### Issue 4: "Mixed content warnings"
**Solution:** Ensure all API calls use HTTPS in production.

The `api.js` file already handles this:
```javascript
const API_URL = process.env.NODE_ENV === 'production'
  ? '/api'  // Relative URL (uses same domain as frontend)
  : (process.env.REACT_APP_API_URL || 'http://localhost:5001/api');
```

---

## Landing Page Setup (megaenterprise.in)

For the main domain landing page, you have several options:

### Option 1: Static HTML/CSS
Create a simple landing page with:
- Company information
- Services overview
- Contact details
- **"Login to Dashboard"** button → `https://app.megaenterprise.in`

### Option 2: WordPress/Other CMS
Host your landing page on WordPress, Wix, or similar:
- Point main domain to hosting provider
- Keep `app` subdomain pointing to Cloud Run

### Option 3: Cloud Run with Separate Build
Deploy a separate landing page to Cloud Run:
```bash
# Deploy landing page
gcloud run deploy landing-page \
  --source ./landing-page \
  --region asia-south1

# Map to main domain
gcloud run domain-mappings create \
  --service landing-page \
  --domain megaenterprise.in \
  --region asia-south1
```

---

## Security Considerations

### 1. HTTPS Only
Always use HTTPS in production. Cloud Run provides free SSL certificates.

### 2. CORS Configuration
Only allow trusted origins in `allowedOrigins` array.

### 3. Authentication
Ensure JWT tokens are properly validated on every request.

### 4. Environment Variables
Never commit `.env` files. Use Google Secret Manager for sensitive data:

```bash
# Create secret
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-

# Grant access to Cloud Run
gcloud secrets add-iam-policy-binding jwt-secret \
  --member=serviceAccount:YOUR-SERVICE-ACCOUNT \
  --role=roles/secretmanager.secretAccessor
```

---

## Monitoring & Maintenance

### Check Application Logs
```bash
gcloud run services logs read mega-management \
  --region asia-south1 \
  --limit 50
```

### Monitor Domain Mapping
```bash
gcloud run domain-mappings list --region asia-south1
```

### Update Application
```bash
# Deploy new version
gcloud run deploy mega-management \
  --source . \
  --region asia-south1
```

---

## Testing Checklist

- [ ] DNS resolves correctly for app.megaenterprise.in
- [ ] SSL certificate is active (green padlock in browser)
- [ ] Login page loads without errors
- [ ] Can login with valid credentials
- [ ] API calls work (check Network tab in DevTools)
- [ ] No CORS errors in console
- [ ] Dashboard loads after login
- [ ] All features work (clients, quotations, tasks, etc.)
- [ ] WhatsApp integration works (if configured)
- [ ] File uploads work (Cloudinary)
- [ ] Real-time notifications work (Socket.IO)

---

## Cost Considerations

### Cloud Run Pricing (Mumbai Region - asia-south1)

**Free Tier (per month):**
- 2 million requests
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds

**After Free Tier:**
- Requests: ₹0.30 per million
- Memory: ₹1.80 per GB-second
- CPU: ₹4.80 per vCPU-second

**Expected Cost for Small Team (5-10 users):**
- ₹0-500/month (mostly within free tier)

**Domain Costs:**
- Domain registration: ₹800-1,500/year (from registrar)
- DNS: Free (Cloud Run includes free DNS)
- SSL: Free (Cloud Run includes free SSL)

---

## Support & Resources

- **Google Cloud Run Docs:** https://cloud.google.com/run/docs
- **Domain Mapping Guide:** https://cloud.google.com/run/docs/mapping-custom-domains
- **DNS Configuration Help:** Contact your domain registrar (GoDaddy, Namecheap, etc.)
- **Application Issues:** Check application logs and CORS configuration

---

## Quick Reference Commands

```bash
# Deploy application
gcloud run deploy mega-management --source . --region asia-south1

# Map domain
gcloud run domain-mappings create --service mega-management --domain app.megaenterprise.in --region asia-south1

# Update environment variables
gcloud run services update mega-management --region asia-south1 --update-env-vars "CLIENT_URL=https://app.megaenterprise.in"

# Check logs
gcloud run services logs read mega-management --region asia-south1 --limit 50

# Check domain status
gcloud run domain-mappings describe --domain app.megaenterprise.in --region asia-south1

# Test health
curl https://app.megaenterprise.in/api/health
```

---

## Need Help?

If you encounter issues:

1. **Check DNS:** Use dnschecker.org to verify DNS propagation
2. **Check Logs:** Use `gcloud run services logs read` to see errors
3. **Check CORS:** Verify CLIENT_URL environment variable
4. **Check SSL:** SSL can take 15-30 minutes to provision
5. **Test Locally:** Ensure app works locally before deploying

---

**Last Updated:** November 2024

