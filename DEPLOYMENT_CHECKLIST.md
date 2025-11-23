# WajoB Deployment Checklist

Complete step-by-step guide to deploying WajoB to production.

## 📋 Pre-Deployment Checklist

### 1. Smart Contracts ✅

- [ ] **Deploy to TON Testnet**
  ```bash
  cd contract
  npx blueprint build --all
  npx blueprint run deployDeployJobRegistry --testnet
  npx blueprint run deployDeployEscrow --testnet
  npx blueprint run deployDeployReputation --testnet
  ```

- [ ] **Save Contract Addresses**
  - Copy deployed addresses from terminal output
  - Update `src/config/contracts.js` with testnet addresses
  - Test contract interactions in testnet

- [ ] **Verify Contracts on Testnet**
  - JobRegistry: [https://testnet.tonscan.org/address/YOUR_ADDRESS](https://testnet.tonscan.org)
  - Escrow: [https://testnet.tonscan.org/address/YOUR_ADDRESS](https://testnet.tonscan.org)
  - Reputation: [https://testnet.tonscan.org/address/YOUR_ADDRESS](https://testnet.tonscan.org)

- [ ] **Run Contract Tests**
  ```bash
  npm test
  # Ensure all tests pass: 0 errors
  ```

### 2. Backend API ✅

- [ ] **Environment Configuration**
  ```bash
  cd backend
  cp .env.example .env
  ```
  
  Update `.env`:
  ```env
  NODE_ENV=production
  PORT=3000
  DATABASE_URL=postgresql://user:password@host:5432/wagob
  
  # TON Blockchain
  TON_NETWORK=testnet
  TON_API_KEY=your_toncenter_api_key
  CONTRACT_JOB_REGISTRY=EQC...
  CONTRACT_ESCROW=EQC...
  CONTRACT_REPUTATION=EQC...
  
  # JWT
  JWT_SECRET=your_secure_random_secret
  JWT_EXPIRATION=7d
  
  # CORS
  CORS_ORIGINS=https://your-vercel-app.vercel.app
  ```

- [ ] **Database Setup**
  ```bash
  # Run migrations
  npm run migration:run
  
  # Verify database connection
  npm run db:check
  ```

- [ ] **Deploy Backend to Cloud**
  
  **Option A: Railway**
  1. Push code to GitHub
  2. Go to [Railway Dashboard](https://railway.app)
  3. New Project → Deploy from GitHub
  4. Add PostgreSQL database
  5. Set environment variables
  6. Deploy!
  
  **Option B: Render**
  1. Go to [Render Dashboard](https://render.com)
  2. New Web Service → Connect GitHub
  3. Add PostgreSQL database
  4. Configure environment variables
  5. Deploy!
  
  **Option C: DigitalOcean App Platform**
  1. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
  2. Create App → GitHub repository
  3. Add managed database
  4. Configure environment
  5. Deploy!

- [ ] **Test Backend Endpoints**
  ```bash
  curl https://your-backend.com/api/v1/health
  curl https://your-backend.com/api/v1/jobs
  ```

### 3. Frontend Deployment ✅

- [ ] **Update Environment Variables**
  
  Create `.env.production`:
  ```env
  REACT_APP_API_URL=https://your-backend.com/api/v1
  REACT_APP_WS_URL=wss://your-backend.com
  REACT_APP_TON_NETWORK=testnet
  ```

- [ ] **Update Contract Addresses**
  
  Edit `src/config/contracts.js`:
  ```javascript
  export const CONTRACTS = {
    testnet: {
      jobRegistry: 'EQC...', // Your deployed address
      escrow: 'EQC...',      // Your deployed address
      reputation: 'EQC...',  // Your deployed address
    },
  };
  ```

- [ ] **Build for Production**
  ```bash
  npm run build
  # Verify build output in /build directory
  ```

- [ ] **Deploy to Vercel**
  
  **Option 1: Vercel CLI**
  ```bash
  npm install -g vercel
  vercel login
  vercel --prod
  ```
  
  **Option 2: GitHub Integration (Recommended)**
  1. Push code to GitHub
  2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
  3. New Project → Import from GitHub
  4. Configure build settings:
     - Framework: Create React App
     - Build Command: `npm run build`
     - Output Directory: `build`
  5. Add environment variables:
     - `REACT_APP_API_URL`
     - `REACT_APP_WS_URL`
     - `REACT_APP_TON_NETWORK`
  6. Deploy!

- [ ] **Configure Custom Domain (Optional)**
  - Add domain in Vercel dashboard
  - Update DNS records
  - Enable HTTPS (automatic with Vercel)

### 4. Telegram Bot Setup ✅

- [ ] **Create Bot with BotFather**
  ```
  /newbot
  Name: WajoB Job Marketplace
  Username: wagob_bot (or your choice)
  ```
  
  Save the bot token securely!

- [ ] **Configure Mini App**
  ```
  /newapp
  
  # Select your bot
  # Fill in details:
  Title: WajoB
  Description: Daily-wage job marketplace on TON blockchain
  Short name: wagob
  Photo: Upload icon (512x512 PNG)
  GIF: Upload demo (optional)
  Web App URL: https://your-vercel-app.vercel.app
  ```

- [ ] **Update TON Connect Manifest**
  
  Edit `public/tonconnect-manifest.json`:
  ```json
  {
    "url": "https://your-vercel-app.vercel.app",
    "name": "WajoB",
    "iconUrl": "https://your-vercel-app.vercel.app/icon-192x192.png",
    "termsOfUseUrl": "https://your-vercel-app.vercel.app/terms",
    "privacyPolicyUrl": "https://your-vercel-app.vercel.app/privacy"
  }
  ```
  
  Redeploy frontend after updating manifest.

- [ ] **Configure Bot Commands**
  ```
  /setcommands
  
  start - Launch WajoB Mini App
  help - Get help and support
  jobs - Browse available jobs
  profile - View your profile
  ```

- [ ] **Test Bot**
  1. Search for your bot in Telegram
  2. Click "Start"
  3. Verify Mini App loads
  4. Test wallet connection
  5. Test job listings
  6. Test job creation

### 5. Testing in Production ✅

- [ ] **Wallet Connection**
  - [ ] Connect TON wallet (Tonkeeper, OpenMask, etc.)
  - [ ] Verify wallet address displayed
  - [ ] Disconnect and reconnect

- [ ] **Job Operations**
  - [ ] Create new job
  - [ ] View job details
  - [ ] Accept job (as worker)
  - [ ] Complete job (as employer)
  - [ ] Cancel job

- [ ] **Escrow Operations**
  - [ ] Fund escrow
  - [ ] Check escrow status
  - [ ] Release funds
  - [ ] Dispute handling

- [ ] **Reputation System**
  - [ ] Submit rating
  - [ ] View user reputation
  - [ ] Check leaderboard

- [ ] **Real-time Updates**
  - [ ] WebSocket connection
  - [ ] Live job status updates
  - [ ] Escrow status updates

- [ ] **Error Handling**
  - [ ] Network errors
  - [ ] Invalid transactions
  - [ ] API errors
  - [ ] Wallet errors

### 6. Monitoring & Analytics ✅

- [ ] **Vercel Analytics**
  - Enable in Vercel dashboard
  - Monitor page views
  - Track performance metrics

- [ ] **Backend Monitoring**
  - [ ] Error logging (Sentry, LogRocket)
  - [ ] Performance monitoring (New Relic, DataDog)
  - [ ] Database monitoring

- [ ] **Blockchain Monitoring**
  - [ ] Contract transaction alerts
  - [ ] Gas fee monitoring
  - [ ] Contract balance alerts

### 7. Security Checklist ✅

- [ ] **Environment Variables**
  - [ ] No secrets in code
  - [ ] All sensitive data in environment variables
  - [ ] Different secrets for dev/production

- [ ] **API Security**
  - [ ] CORS configured correctly
  - [ ] Rate limiting enabled
  - [ ] Input validation on all endpoints
  - [ ] JWT authentication working

- [ ] **Frontend Security**
  - [ ] HTTPS enabled (Vercel does this automatically)
  - [ ] Security headers configured (in `vercel.json`)
  - [ ] No sensitive data in localStorage
  - [ ] XSS protection enabled

- [ ] **Smart Contract Security**
  - [ ] Audited (recommended for mainnet)
  - [ ] Access controls verified
  - [ ] Emergency stop mechanism tested
  - [ ] Gas optimization reviewed

### 8. Documentation ✅

- [ ] **User Documentation**
  - [ ] How to connect wallet
  - [ ] How to post a job
  - [ ] How to accept a job
  - [ ] How to handle disputes

- [ ] **Developer Documentation**
  - [ ] API documentation
  - [ ] Smart contract documentation
  - [ ] Setup instructions
  - [ ] Deployment guide

- [ ] **Legal Documentation**
  - [ ] Terms of Service
  - [ ] Privacy Policy
  - [ ] User Agreement

### 9. Mainnet Deployment (Future) 🔮

⚠️ **Only proceed after extensive testnet testing!**

- [ ] **Smart Contracts to Mainnet**
  ```bash
  # Build and deploy to mainnet
  npx blueprint run deployDeployJobRegistry --mainnet
  npx blueprint run deployDeployEscrow --mainnet
  npx blueprint run deployDeployReputation --mainnet
  ```

- [ ] **Update Configuration**
  - [ ] Update `REACT_APP_TON_NETWORK=mainnet`
  - [ ] Update contract addresses in `src/config/contracts.js`
  - [ ] Update backend environment to mainnet

- [ ] **Fund Contracts**
  - [ ] Transfer TON to contract addresses for gas fees
  - [ ] Monitor contract balances

- [ ] **Gradual Rollout**
  - [ ] Beta testing with limited users
  - [ ] Monitor for issues
  - [ ] Scale gradually

## 🚀 Launch Day Checklist

**T-1 Day:**
- [ ] Final testnet testing
- [ ] Backup all databases
- [ ] Prepare rollback plan
- [ ] Alert monitoring systems ready

**Launch:**
- [ ] Deploy contracts to testnet/mainnet
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Update bot configuration
- [ ] Announce to users

**T+1 Hour:**
- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Verify all features working
- [ ] Response team ready

**T+24 Hours:**
- [ ] Review analytics
- [ ] Address critical issues
- [ ] Collect user feedback
- [ ] Plan improvements

## 📞 Support & Maintenance

### Daily Tasks
- Monitor error logs
- Check transaction success rate
- Review user feedback
- Database backup verification

### Weekly Tasks
- Security updates
- Performance optimization
- Feature requests review
- Analytics review

### Monthly Tasks
- Security audit
- Cost optimization
- User growth analysis
- Feature planning

## 🐛 Troubleshooting

### Common Issues

**1. Wallet Not Connecting**
- Check TON Connect manifest URL is accessible
- Verify network matches (testnet/mainnet)
- Clear browser cache
- Try different wallet

**2. API Errors**
- Verify backend is running
- Check environment variables
- Review CORS configuration
- Check database connection

**3. Transaction Failures**
- Verify contract addresses
- Check wallet has sufficient TON
- Ensure correct network
- Review transaction payload

**4. Mini App Not Loading**
- Check Telegram bot configuration
- Verify manifest.json is accessible
- Ensure HTTPS is enabled
- Test in different Telegram clients

## 📚 Resources

- [TON Documentation](https://docs.ton.org)
- [TON Connect SDK](https://github.com/ton-connect/sdk)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Vercel Deployment](https://vercel.com/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [React Query](https://tanstack.com/query/latest)

---

**Remember:** Test thoroughly on testnet before deploying to mainnet!
