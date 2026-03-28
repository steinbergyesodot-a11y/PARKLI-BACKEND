# Deployment Guide

This guide covers deploying PARKLI backend to production.

## Pre-Deployment Checklist

- [ ] All sensitive credentials rotated and removed from git history
- [ ] `.env` file not committed to repository
- [ ] `.env.example` file created with all required variables
- [ ] TypeScript strict mode enabled (`tsconfig.json`)
- [ ] All error responses use `responseWrapper` format
- [ ] Authentication middleware added to protected endpoints
- [ ] Ownership validation on edit/delete operations
- [ ] Rate limiting configured for sensitive endpoints
- [ ] `.gitignore` includes `node_modules/`, `dist/`, `uploads/`, `.env`
- [ ] CORS origins updated for production domains
- [ ] Database backups configured
- [ ] Logging/Sentry DSN configured
- [ ] Stripe webhook verified and tested

## Environment Variables

Set these on your hosting platform (Render, Heroku, AWS, etc.):

```
NODE_ENV=production
PORT=3000
DATABASE_URI=mongodb+srv://...
JWT_SECRET_KEY=<secure-random-key>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GOOGLE_CLIENT_ID=...
MLB_API_KEY=...
LOGGER_TAIL_TOKEN=...
SENTRY_DSN=https://...
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-backend-domain.com
```

## Deployment Steps

### Option 1: Render (Recommended for this project)

1. **Create Render account** and connect GitHub repo
2. **Create New Web Service**:
   - Connect your PARKLI-BACKEND repo
   - Set runtime: `Node`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Set environment variables in Render dashboard
3. **Deploy**: Push to main branch or trigger manually

### Option 2: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create parkli-backend

# Add MongoDB add-on
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set JWT_SECRET_KEY=your_key
heroku config:set STRIPE_SECRET_KEY=your_key
# ... set all vars

# Deploy
git push heroku main
```

### Option 3: AWS/DigitalOcean (Self-hosted)

1. **Install Node.js 20.x** on server
2. **Clone repository**
```bash
git clone <repo> && cd PARKLI-BACKEND
npm install
npm run build
```

3. **Set environment variables**
```bash
# Create .env file with production values
nano .env
```

4. **Install PM2** (process manager)
```bash
npm install -g pm2
pm2 start dist/express/server.js --name parkli-backend
pm2 save
pm2 startup
```

5. **Set up reverse proxy** (Nginx):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

6. **Enable SSL** (Let's Encrypt)
```bash
sudo apt install certbot nginx-certbot
sudo certbot --nginx -d your-domain.com
```

## Post-Deployment Verification

### Health Checks
```bash
curl https://your-backend.com/isAlive
# Should return: "alive"
```

### Test API Endpoints
```bash
# Test public endpoint
curl https://your-backend.com/api/driveways

# Test protected endpoint (requires valid JWT)
curl -H "Authorization: Bearer <token>" https://your-backend.com/api/users/<userId>
```

### Verify Database Connection
- Check logs for "Connected DB: PARKLI"
- Query MongoDB to ensure data persists

### Test Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click your endpoint
3. Click "Send test event"
4. Verify webhook log shows successful delivery

## Monitoring in Production

### 1. Sentry (Error Tracking)
- Errors automatically captured and sent to Sentry
- View dashboard: https://sentry.io
- Set up alerts for critical errors

### 2. Logtail (Log Aggregation)
- Check logs in Logtail dashboard
- Set up alerts for anomalies

### 3. Database Monitoring
- Set up MongoDB alerts for connection issues
- Monitor disk space
- Regular backups

### 4. Uptime Monitoring
- Use UptimeRobot, Pingdom, or similar
- Monitor `/health` endpoint
- Alert on downtime

## Scaling Considerations

### Database
- Enable MongoDB sharding for high traffic
- Index frequently queried fields
- Monitor connection pool size

### Image Uploads
- Using Cloudinary (handled ✓)
- Verify storage limits
- Monitor bandwidth costs

### Payment Processing
- Use Stripe test keys for staging
- Monitor Stripe API rate limits
- Verify PCI compliance

### Rate Limiting
- Current: 5 login attempts per 10 minutes
- Adjust based on user behavior
- Add rate limiting to other endpoints if needed

## Troubleshooting

### Database Connection Error
- Check `DATABASE_URI` is correct
- Verify IP whitelist (MongoDB Atlas)
- Check network connectivity

### Stripe Webhook Not Firing
- Verify `STRIPE_WEBHOOK_SECRET` is from correct endpoint
- Check endpoint URL matches Render/deployment URL
- Check logs for webhook errors

### High Memory Usage
- Check for memory leaks with Node profiling
- Monitor long-running operations
- Restart process if needed

### CORS Issues
- Update `FRONTEND_URL` and `BACKEND_URL` in server.ts
- Verify origins match exactly (http vs https, www vs non-www)

## Rollback Plan

If critical issues found:
```bash
# Render: Use automatic rollback in dashboard
# Heroku: heroku releases:rollback
# Self-hosted: git revert <commit> && npm run build && pm2 restart parkli-backend
```

## Security in Production

- ✓ HTTPS enforced
- ✓ Helmet headers enabled
- ✓ CORS restricted to frontend domains
- ✓ Rate limiting on sensitive endpoints
- ✓ JWT tokens verified
- ✓ Passwords hashed with bcrypt
- ✓ Sentry captures errors securely
- ✓ Stripe uses API keys (not publishable keys)

## Maintenance

### Weekly
- Check Sentry for new errors
- Review logs for anomalies
- Monitor disk space & resources

### Monthly
- Update npm dependencies: `npm update`
- Review Stripe transactions
- Check database performance

### Quarterly
- Security audit of endpoints
- Load testing for scalability
- Review and update deploy process
