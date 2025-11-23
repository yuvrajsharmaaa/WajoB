# 🚀 Vercel Deployment Guide - Complete Setup

## Overview

This guide will walk you through deploying both the frontend and backend of WajoB to production.

## ✅ Prerequisites

- GitHub account
- Vercel account (free tier works!)
- Telegram Bot created with @BotFather
- TON wallet with testnet tokens (for contract deployment)

## 📋 Part 1: Prepare for Deployment

### 1. Update Contract Addresses (Already Done!)

The contracts have been deployed to TON testnet:
```javascript
jobRegistry: 'EQDfAs6HiTDdvi6XMsHJuBXncUCFRNz9V5nen09cQG_6ML3s'
escrow: 'EQCBHqzZepJvzgjNiXvXmrI1Ew8vTkAISNAevdVGsWEeehBG'
reputation: 'EQCSGYJ0zV-N96xNFN_x5KYleD6Nl0r6bkB_NdsQOZWvOAKg'
```

These are already configured in `src/config/contracts.js` ✅

### 2. Create Production Environment File

Create `.env.production` in the root folder:

```bash
# Frontend Production Environment
REACT_APP_API_URL=https://your-backend.vercel.app/api/v1
REACT_APP_WS_URL=wss://your-backend.vercel.app
REACT_APP_TON_NETWORK=testnet
```

**Note**: We'll update `your-backend.vercel.app` after deploying the backend.

## 🎯 Part 2: Deploy Backend to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. **Push Code to GitHub**
   ```bash
   cd /home/yuvrajs/Desktop/wagob
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin master
   ```

2. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
   - Click "Add New Project"
   - Import your GitHub repository "WajoB"
   
3. **Configure Backend Project**
   - Framework Preset: **Other**
   - Root Directory: **`backend`**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   
4. **Add Environment Variables**

   Click "Environment Variables" and add these:

   ```
   NODE_ENV=production
   PORT=3000
   API_PREFIX=api/v1
   
   # Database (Use Vercel Postgres or external service)
   DATABASE_URL=postgresql://user:password@host:5432/wagob_db
   
   # JWT
   JWT_SECRET=your_super_secret_production_jwt_key_CHANGE_THIS
   JWT_EXPIRATION=7d
   
   # TON Blockchain
   TON_NETWORK=testnet
   TON_TONCENTER_API_URL=https://testnet.toncenter.com/api/v2
   CONTRACT_JOB_REGISTRY=EQDfAs6HiTDdvi6XMsHJuBXncUCFRNz9V5nen09cQG_6ML3s
   CONTRACT_ESCROW=EQCBHqzZepJvzgjNiXvXmrI1Ew8vTkAISNAevdVGsWEeehBG
   CONTRACT_REPUTATION=EQCSGYJ0zV-N96xNFN_x5KYleD6Nl0r6bkB_NdsQOZWvOAKg
   
   # CORS (Will update after frontend deployment)
   CORS_ORIGIN=https://your-frontend.vercel.app
   
   # Telegram (Optional for now)
   TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
   ```

5. **Deploy!**
   - Click "Deploy"
   - Wait for deployment to complete (2-3 minutes)
   - Copy your backend URL: `https://wagob-backend.vercel.app`

### Option B: Using Vercel CLI

```bash
cd backend
npm install -g vercel
vercel login
vercel --prod
```

Follow the prompts and add environment variables when asked.

## 🎨 Part 3: Deploy Frontend to Vercel

### 1. Update .env.production

Now that you have the backend URL, update `.env.production`:

```bash
REACT_APP_API_URL=https://wagob-backend.vercel.app/api/v1
REACT_APP_WS_URL=wss://wagob-backend.vercel.app
REACT_APP_TON_NETWORK=testnet
```

### 2. Deploy Frontend

**Using Vercel Dashboard:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import the same GitHub repository
4. **Configure Frontend Project:**
   - Framework Preset: **Create React App**
   - Root Directory: **`.`** (root)
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

5. **Add Environment Variables:**
   ```
   REACT_APP_API_URL=https://wagob-backend.vercel.app/api/v1
   REACT_APP_WS_URL=wss://wagob-backend.vercel.app
   REACT_APP_TON_NETWORK=testnet
   ```

6. **Deploy!**
   - Click "Deploy"
   - Copy your frontend URL: `https://wagob.vercel.app`

## 🔄 Part 4: Update CORS in Backend

1. Go to your backend project in Vercel Dashboard
2. Go to Settings → Environment Variables
3. Update `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://wagob.vercel.app,https://telegram.org
   ```
4. Redeploy the backend

## 🤖 Part 5: Configure Telegram Bot

### 1. Create Mini App

Message @BotFather on Telegram:

```
/newapp

# Select your bot or create new one
/newbot
Name: WajoB Job Marketplace
Username: wagob_bot

# Then create the mini app
/newapp
Bot: @wagob_bot
Title: WajoB
Description: Daily-wage job marketplace on TON blockchain
Photo: (upload 640x360 image)
Demo GIF: (optional)
Short name: wagob
Web App URL: https://wagob.vercel.app
```

### 2. Update TON Connect Manifest

Update `public/tonconnect-manifest.json`:

```json
{
  "url": "https://wagob.vercel.app",
  "name": "WajoB",
  "iconUrl": "https://wagob.vercel.app/logo192.png",
  "termsOfUseUrl": "https://wagob.vercel.app",
  "privacyPolicyUrl": "https://wagob.vercel.app"
}
```

Commit and push this change - Vercel will auto-deploy.

### 3. Set Bot Commands

```
/setcommands

start - Launch WajoB Mini App  
jobs - Browse available jobs
help - Get help and support
```

## 🧪 Part 6: Test Everything!

### 1. Test Backend

```bash
curl https://wagob-backend.vercel.app/api/v1/health
curl https://wagob-backend.vercel.app/api/v1/jobs
```

### 2. Test Frontend

1. Open `https://wagob.vercel.app` in browser
2. Should see the WajoB interface
3. Connect TON wallet
4. Browse jobs

### 3. Test in Telegram

1. Search for your bot: `@wagob_bot`
2. Click "Start"
3. Mini App should load
4. Test all features:
   - [ ] Wallet connection
   - [ ] Browse jobs
   - [ ] Create job
   - [ ] View job details

## 🔧 Alternative: Deploy Backend to Railway

If Vercel doesn't work well for the backend (it's optimized for serverless), use Railway:

1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Select `WajoB` repo
5. Configure:
   - Root Directory: `backend`
   - Build Command: `npm run build`
   - Start Command: `npm run start:prod`
6. Add PostgreSQL database (Railway provides this!)
7. Add environment variables (same as above)
8. Deploy!

Railway URL will be like: `https://wagob-backend-production.up.railway.app`

## 📊 Monitoring

### Vercel Analytics

1. Go to your project in Vercel
2. Click "Analytics" tab
3. View:
   - Page views
   - User locations
   - Performance metrics

### Error Tracking

Add Sentry (optional):

```bash
npm install @sentry/react @sentry/tracing
```

Configure in `src/index.js`:

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
});
```

## 🐛 Troubleshooting

### Frontend Build Fails

```bash
# Clean and rebuild
rm -rf node_modules build
npm install
npm run build
```

### Backend Not Responding

1. Check logs in Vercel dashboard
2. Verify environment variables
3. Check database connection
4. Review CORS settings

### Telegram Mini App Not Loading

1. Verify manifest.json is accessible
2. Check HTTPS is enabled (Vercel does this automatically)
3. Clear Telegram cache
4. Try different device/client

### Wallet Won't Connect

1. Check TON Connect manifest URL
2. Verify network setting (testnet vs mainnet)
3. Try different wallet app
4. Check browser console for errors

## 🎉 Success Checklist

- [ ] Backend deployed and responding
- [ ] Frontend deployed and loading
- [ ] Telegram bot configured
- [ ] Mini App opens in Telegram
- [ ] Wallet connects successfully
- [ ] Jobs load from backend
- [ ] Can create new job
- [ ] Can view job details
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Contract addresses updated

## 📚 Next Steps

After successful deployment:

1. **Test thoroughly** - Try all features in production
2. **Monitor errors** - Check Vercel logs daily
3. **Gather feedback** - Share with test users
4. **Iterate** - Fix bugs and add features
5. **Scale** - Optimize performance as users grow
6. **Mainnet** - Deploy to TON mainnet after extensive testing

## 🔐 Security Checklist

- [ ] All secrets in environment variables (not code)
- [ ] HTTPS enabled (Vercel does this)
- [ ] CORS configured restrictively
- [ ] JWT secret is strong and unique
- [ ] Database credentials are secure
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

## 💡 Pro Tips

1. **Auto-Deploy**: Enable auto-deploy in Vercel for `master` branch
2. **Preview Deploys**: Vercel creates preview URLs for all branches
3. **Custom Domain**: Add custom domain in Vercel dashboard (optional)
4. **Environment Branches**: Use different env vars for staging/production
5. **Monitoring**: Set up uptime monitoring (UptimeRobot, etc.)

---

**Need Help?**

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- TON Docs: https://docs.ton.org
- Telegram Mini Apps: https://core.telegram.org/bots/webapps

**Good luck with your deployment! 🚀**
