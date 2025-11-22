# 🚀 Quick Start Guide - WajoB Frontend

## What's New (Frontend Features)

### ✨ New Components
1. **Job Posting Form** - Full 3-step wizard for creating jobs
2. **Transaction Modals** - User-friendly transaction confirmations
3. **Loading States** - Professional loading indicators
4. **Toast Notifications** - Success/error messages

### 🎣 New Hooks
1. `useJobRegistry` - Create jobs, update status, assign workers
2. `useEscrow` - Full escrow lifecycle management
3. `useReputation` - Submit ratings

### 📝 How to Use New Features

#### 1. Post a Job (Employer)

```bash
# Start the app
npm start
```

**Steps:**
1. Connect your TON wallet (click "Connect Wallet")
2. Click the green "+ Post Job" button
3. Fill in the form:
   - Title: "Night Security Guard"
   - Description: "Need experienced guard..."
   - Location: "Downtown Mumbai"
   - Wages: 50 (in TON)
   - Duration: 8 (hours)
   - Category: Select from dropdown
4. Click "Next" to review
5. Click "Post Job"
6. Approve transaction in your wallet
7. (Optional) Create & fund escrow for payment security

#### 2. Apply for a Job (Worker)

1. Browse available jobs
2. Click "Apply" on any job card
3. Approve the transaction
4. You're assigned to the job!

#### 3. Complete Job & Get Paid

**Employer confirms:**
```javascript
import { useEscrow } from '../hooks/useEscrow';

const { confirmCompletion } = useEscrow();
await confirmCompletion(escrowId);
```

**Worker confirms:**
```javascript
await confirmCompletion(escrowId);
```

Both confirmations trigger automatic payment release!

#### 4. Rate Each Other

```javascript
import { useReputation } from '../hooks/useReputation';

const { submitRating } = useReputation();

// Rate employer (by worker)
await submitRating({
  jobId: 123,
  targetUser: employerAddress,
  rating: 5 // 1-5 stars
});

// Rate worker (by employer)  
await submitRating({
  jobId: 123,
  targetUser: workerAddress,
  rating: 4
});
```

---

## 🧪 Testing Locally

### Start Development Server
```bash
cd /home/yuvrajs/Desktop/wagob
npm start
```

App opens at: http://localhost:3000

### Test Wallet Connection
1. Click "Connect Wallet" in header
2. Scan QR code with TON wallet (in testnet mode!)
3. See your address displayed

### Test Job Posting
1. Make sure wallet is connected
2. Click "+ Post Job"
3. Fill the form with test data
4. Complete all 3 steps
5. Approve transactions in wallet

**Note**: Smart contracts must be deployed first! See `TESTNET_SETUP.md`

---

## 🏗 Build for Production

### Option 1: Use Build Script
```bash
./scripts/build.sh
```

Shows:
- Build statistics
- File sizes
- What to do next

### Option 2: Manual Build
```bash
npm run build
```

Output in `/build` directory

### Test Production Build Locally
```bash
# Install serve if you don't have it
npm install -g serve

# Serve the build
npx serve -s build
```

Opens at: http://localhost:3000

---

## 🚀 Deploy to Production

### Vercel (Recommended)
```bash
# One command deployment
./scripts/deploy-vercel.sh
```

**OR manually:**
```bash
# Install Vercel CLI
npm install -g vercel

# Build
npm run build

# Deploy
vercel --prod
```

**After deployment:**
1. Note your Vercel URL (e.g., `wagob.vercel.app`)
2. Update `/public/tonconnect-manifest.json`:
   ```json
   {
     "url": "https://wagob.vercel.app"
   }
   ```
3. Update `src/contexts/TonConnectProvider.js`:
   ```javascript
   const manifestUrl = 'https://wagob.vercel.app/tonconnect-manifest.json';
   ```
4. Redeploy to apply changes

### Netlify
```bash
# One command deployment
./scripts/deploy-netlify.sh
```

**OR manually:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=build
```

### GitHub Pages
```bash
# Add to package.json
"homepage": "https://yourusername.github.io/wagob"

# Install gh-pages
npm install --save-dev gh-pages

# Add deploy script to package.json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}

# Deploy
npm run deploy
```

---

## 🤖 Set Up Telegram Bot

### 1. Create Bot
1. Open Telegram
2. Search for @BotFather
3. Send `/newbot`
4. Follow instructions
5. Save your bot token

### 2. Set Web App URL
Send to @BotFather:
```
/newapp
Select your bot
Enter app title: WajoB
Enter description: Daily-wage job marketplace
Upload photo (optional)
Enter Web App URL: https://your-vercel-app.vercel.app
```

### 3. Test in Telegram
1. Open your bot in Telegram
2. Bot should show a button to open Web App
3. Click button
4. Your React app opens in Telegram!

---

## 📱 Mobile Testing

### Test in Telegram Mobile App
1. Deploy to Vercel/Netlify
2. Create Telegram bot
3. Set Web App URL
4. Open bot on mobile
5. Test all features

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

All components are mobile-first!

---

## 🔍 Debugging

### Common Issues

#### "Wallet not connected"
**Solution:** Click "Connect Wallet" button first

#### "Contracts not deployed"
**Solution:** Deploy contracts using Blueprint:
```bash
cd contract
npx blueprint run deployDeployJobRegistry --testnet
npx blueprint run deployDeployEscrow --testnet
npx blueprint run deployDeployReputation --testnet
```
Then update addresses in `src/config/contracts.js`

#### Transaction fails
**Solutions:**
- Check wallet has sufficient TON
- Verify you're on testnet
- Check contract addresses are correct
- Try again (sometimes network is slow)

#### "Module not found" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 🎨 Customization

### Change Theme Colors
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      'ton-blue': '#0098EA', // Change this
    }
  }
}
```

### Add New Job Categories
Edit `src/components/JobPostingForm.js`:
```javascript
const categories = [
  'Security',
  'Watchman',
  'Gate Security',
  'Night Guard',
  'Your New Category' // Add here
];
```

### Modify Gas Fees
Edit hooks (e.g., `src/hooks/useJobRegistry.js`):
```javascript
amount: toNano('0.05').toString(), // Change gas amount
```

---

## 📊 Analytics (Optional)

### Add Google Analytics
```bash
npm install react-ga4
```

In `src/index.js`:
```javascript
import ReactGA from 'react-ga4';

ReactGA.initialize('G-YOUR-ID');
ReactGA.send("pageview");
```

---

## ✅ Pre-Deployment Checklist

Before going live:

- [ ] Smart contracts deployed to testnet
- [ ] Contract addresses updated in `src/config/contracts.js`
- [ ] App tested locally
- [ ] Wallet connection working
- [ ] Job posting working
- [ ] Transactions signing correctly
- [ ] Build script runs without errors
- [ ] `tonconnect-manifest.json` has correct URL
- [ ] Telegram bot created
- [ ] Web App URL set in bot
- [ ] Tested on mobile device
- [ ] All environment variables set

---

## 🆘 Support

### Documentation
- `FRONTEND_COMPLETE.md` - Full implementation details
- `TESTNET_SETUP.md` - Contract deployment guide
- `TESTNET_READY.md` - Configuration summary

### Links
- TON Docs: https://docs.ton.org
- TON Connect: https://docs.ton.org/develop/dapps/ton-connect
- Telegram Bots: https://core.telegram.org/bots/webapps

---

**Ready to go! 🚀**

Start with:
```bash
npm start
```

Then click "+ Post Job" to see the new features! 🎉
