# EcoAlert Deployment Guide — Render

This guide walks you through deploying EcoAlert on [Render](https://render.com).

## Prerequisites

- GitHub account with the eco-alert repository
- Render account (free tier available at https://render.com)
- Supabase account with database configured
- OpenWeatherMap API key

## Step 1: Prepare Environment Variables

You'll need these environment variables for production:

| Variable | Where to Get | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → Service role secret | Long JWT string |
| `OPENWEATHER_KEY` | OpenWeatherMap → My API Keys | Alphanumeric string |
| `ADMIN_PASSWORD` | Create your own | Strong password (e.g., 32+ chars) |
| `JWT_SECRET` | Create your own | Random 64+ character string |
| `ALLOWED_ORIGIN` | Your Render URL | `https://your-app.onrender.com` |

### Generate Secure Secrets

```bash
# Generate a strong JWT secret
openssl rand -base64 48

# Generate an admin password
openssl rand -hex 16
```

## Step 2: Deploy to Render

### Option A: Using render.yaml (Infrastructure as Code)

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Setup for Render deployment"
   git push origin main
   ```

2. **Create a new Render app:**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Select "Build and deploy from a Git repository"
   - Connect your GitHub account and select `eco-alert`

3. **Select deployment method:**
   - Choose "Use Render yaml" at the bottom
   - Click "Create Web Service"

4. **Configure environment variables:**
   - In the dashboard, go to your service
   - Click "Environment" tab
   - Add all variables from Step 1:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_KEY`
     - `OPENWEATHER_KEY`
     - `ADMIN_PASSWORD`
     - `JWT_SECRET`
     - `ALLOWED_ORIGIN` (use your Render domain: `https://eco-alert-xxxx.onrender.com`)

5. **Deploy:**
   - Render will automatically detect render.yaml and deploy
   - Watch the deployment logs

### Option B: Manual Configuration

1. **Go to https://dashboard.render.com** and create a new Web Service

2. **Connect to GitHub:**
   - Select "Build and deploy from a Git repository"
   - Choose the `eco-alert` repository

3. **Configure settings:**
   - **Name:** `eco-alert` (or your preferred name)
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or paid for better performance)

4. **Add environment variables:**
   - Click "Advanced" → "Add Environment Variable"
   - Add each variable:
     ```
     NODE_ENV=production
     PORT=3000
     SUPABASE_URL=<your_supabase_url>
     SUPABASE_SERVICE_KEY=<your_service_key>
     OPENWEATHER_KEY=<your_api_key>
     ADMIN_PASSWORD=<your_admin_password>
     JWT_SECRET=<your_jwt_secret>
     ALLOWED_ORIGIN=https://eco-alert-xxxx.onrender.com
     ```

5. **Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy automatically

## Step 3: Verify Deployment

Once deployed, test your application:

```bash
# Test health check
curl https://your-app.onrender.com/health

# Test API
curl https://your-app.onrender.com/api/reports

# Open frontend
https://your-app.onrender.com
```

## Step 4: Configure Frontend API URL (if needed)

If you hardcoded `localhost:3000` in the frontend, update [public/config.js](../public/config.js):

```javascript
const CONFIG = {
  // Change this from localhost to your Render URL
  API_BASE: 'https://eco-alert-xxxx.onrender.com',
  // ... rest of config
};
```

Then redeploy with:
```bash
git add public/config.js
git commit -m "Update API URL for production"
git push origin main
```

## Troubleshooting

### Service crashes on startup
- Check build logs: Click service → "Logs"
- Common issue: Missing environment variables
- Solution: Add all required env vars from Step 1

### API returns 503 errors
- Likely Supabase not configured
- Check if `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Test locally: `npm start` should show configuration status

### CORS errors
- Check `ALLOWED_ORIGIN` matches your Render URL exactly
- Example: `https://eco-alert-abc123.onrender.com` (no trailing slash)

### Reports not saving
- If using free tier, data saves to memory and is lost on restarts
- For persistence, ensure Supabase credentials are correct
- Check Supabase database has `reports` table with correct schema

## Free Tier Limits

Render's free tier includes:
- ✅ 750 free compute hours/month
- ✅ Automatic deploys on git push
- ✅ Automatic pauses after 15 min of inactivity
- ⚠️  Cold starts (~30 seconds when waking up)
- ⚠️  Limited to 0.5GB RAM

For production, consider upgrading to a paid instance.

## Next Steps

1. **Auto-deploy on push:** Enabled by default
2. **Enable HTTPS:** Render provides free SSL certificates
3. **Set up monitoring:** Render dashboard shows logs and metrics
4. **Enable Supabase backups:** Configure in Supabase dashboard

## Support

- Render docs: https://render.com/docs
- Common issues: https://render.com/docs/troubleshooting
- GitHub issues: Report problems in the repo

---

**Your app is now live!** 🎉

Share the URL with community members to start reporting environmental issues.
