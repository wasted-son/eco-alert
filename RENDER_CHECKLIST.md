# 🚀 EcoAlert Deployment Checklist — Render

Complete these steps to deploy EcoAlert on Render:

## Pre-Deployment ✓

- [ ] Code pushed to GitHub
- [ ] All files committed: `git status` shows clean
- [ ] Local tests pass: `npm start` runs without errors
- [ ] `.env` file is in `.gitignore` (not committed)

## Prepare Credentials

- [ ] **Supabase**
  - [ ] Create project at https://supabase.com
  - [ ] Copy project URL
  - [ ] Copy service role key
  - [ ] Run schema: Copy `supabase_schema.sql` to SQL editor

- [ ] **OpenWeatherMap**
  - [ ] Register at https://openweathermap.org/api
  - [ ] Copy API key from "My API Keys"

- [ ] **Admin Access**
  - [ ] Generate strong password: `openssl rand -hex 16`
  - [ ] Generate JWT secret: `openssl rand -base64 48`

## Deploy to Render

### Quick Deploy (5 minutes)

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect GitHub → Select `eco-alert`
4. Settings:
   - Runtime: **Node**
   - Build: `npm install`
   - Start: `npm start`
5. Click "Advanced" → Add environment variables:
   ```
   NODE_ENV = production
   SUPABASE_URL = (from Supabase)
   SUPABASE_SERVICE_KEY = (from Supabase)
   OPENWEATHER_KEY = (from OpenWeatherMap)
   ADMIN_PASSWORD = (generated password)
   JWT_SECRET = (generated secret)
   ALLOWED_ORIGIN = https://eco-alert-xxxx.onrender.com
   ```
   ⚠️ Replace `eco-alert-xxxx` with your actual service name
6. Click "Create Web Service"
7. Wait for deployment (2-3 minutes)

### Deploy with Infrastructure as Code

1. Run: `git push origin main`
2. Go to https://render.com/dashboard
3. Click "New +" → "Web Service"
4. Select GitHub repo
5. Click "Use Render yaml" at bottom
6. Click "Create Web Service"
7. Add environment variables (same as above)

## Post-Deployment

- [ ] Test health: `curl https://your-app.onrender.com/health`
- [ ] Test API: `curl https://your-app.onrender.com/api/reports`
- [ ] Open frontend: Visit `https://your-app.onrender.com`
- [ ] Try submitting a report
- [ ] Admin login with your password
- [ ] Check Render logs for errors

## Common Issues

| Issue | Solution |
|-------|----------|
| Service crashes | Check logs, ensure all env vars set |
| 503 errors | Verify Supabase credentials |
| No data saved | Check Supabase table schema exists |
| CORS errors | Verify `ALLOWED_ORIGIN` is correct |
| Slow startup | Normal on free tier (cold starts) |

## Next Steps

- [ ] Share URL with community members
- [ ] Set up GitHub branch protection
- [ ] Enable Supabase backups
- [ ] Monitor Render dashboard for errors
- [ ] Upgrade to paid plan if needed

## Need Help?

- Full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Render docs: https://render.com/docs
- Supabase docs: https://supabase.com/docs

---

**Deployed?** Share your live link! 🌍
