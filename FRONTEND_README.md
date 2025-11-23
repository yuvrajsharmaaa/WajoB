# WajoB Frontend - Telegram Mini App

A React-based Telegram Mini App for the WajoB daily-wage job marketplace platform built on the TON blockchain.

## 🚀 Features

- ✅ **TON Connect Integration** - Seamless wallet connection and transaction signing
- ✅ **Telegram Mini App SDK** - Native Telegram integration with user context
- ✅ **Real-time Updates** - WebSocket integration for live job and escrow updates
- ✅ **Backend API Integration** - Full REST API integration with caching via React Query
- ✅ **Responsive UI** - Optimized for mobile-first Telegram experience
- ✅ **Smart Contract Integration** - Direct blockchain interactions for jobs, escrow, and reputation
- ✅ **Error Handling** - Comprehensive error boundaries and user feedback
- ✅ **Type-Safe** - TypeScript support throughout the codebase

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- Backend API running (see `/backend` directory)
- Smart contracts deployed to TON testnet/mainnet (see `/contract` directory)
- Telegram Bot configured with Mini App

## 🛠️ Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update the values:

```env
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_WS_URL=ws://localhost:3000
REACT_APP_TON_NETWORK=testnet
```

### 3. Update Contract Addresses

After deploying smart contracts, update `/src/config/contracts.js`:

```javascript
export const CONTRACTS = {
  testnet: {
    jobRegistry: 'EQC...', // Your deployed contract address
    escrow: 'EQC...',
    reputation: 'EQC...',
  },
};
```

## 🏃 Running the App

### Development Mode

```bash
npm start
```

App will open at `http://localhost:3000`

### Production Build

```bash
npm run build
```

Build output in `/build` directory.

## 🌐 Deploying to Vercel

### Option 1: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables:
   - `REACT_APP_API_URL`
   - `REACT_APP_WS_URL`
   - `REACT_APP_TON_NETWORK`
6. Deploy!

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Environment Variables in Vercel

Go to Project Settings → Environment Variables and add:

```
REACT_APP_API_URL=https://your-backend.com/api/v1
REACT_APP_WS_URL=wss://your-backend.com
REACT_APP_TON_NETWORK=testnet
```

## 📱 Telegram Mini App Setup

### 1. Configure Bot with BotFather

```
/newapp
/setapptitle - WajoB Job Marketplace
/setappdescription - Daily-wage job marketplace on TON
/setappicon - Upload icon
/setappurl - https://your-vercel-app.vercel.app
```

### 2. Update tonconnect-manifest.json

Located in `/public/tonconnect-manifest.json`:

```json
{
  "url": "https://your-vercel-app.vercel.app",
  "name": "WajoB",
  "iconUrl": "https://your-vercel-app.vercel.app/icon.png"
}
```

### 3. Test in Telegram

Open your bot and use the `/start` command or menu button to launch the Mini App.

## 🏗️ Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Header.js
│   ├── JobCard.js
│   ├── JobPostingForm.js
│   ├── TransactionStatus.js
│   └── ErrorBoundary.js
├── config/             # Configuration files
│   ├── api.js         # API endpoints and query keys
│   └── contracts.js   # Smart contract addresses
├── contexts/          # React Context providers
│   └── TonConnectProvider.js
├── hooks/             # Custom React hooks
│   ├── useJobsAPI.js       # Job data fetching
│   ├── useEscrowAPI.js     # Escrow operations
│   ├── useReputationAPI.js # Reputation queries
│   ├── useTonWallet.js     # Wallet connection
│   ├── useTelegramWebApp.js # Telegram SDK
│   └── useWebSocket.js     # Real-time updates
├── pages/             # Page components
│   └── JobListings.js
├── services/          # API service layer
│   ├── jobService.js
│   ├── escrowService.js
│   └── reputationService.js
├── utils/             # Utility functions
│   └── api.js         # Axios client
└── App.js             # Main app component
```

## 🔧 Key Technologies

- **React 19** - UI framework
- **TON Connect UI React** - Wallet integration
- **Telegram Web Apps SDK** - Mini App features
- **React Query (TanStack Query)** - Data fetching and caching
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications
- **Tailwind CSS** - Styling

## 📡 API Integration

### Job Operations

```javascript
import { useJobs, useCreateJob } from './hooks/useJobsAPI';

function JobsPage() {
  const { data, isLoading } = useJobs({ status: 'POSTED' });
  const createJob = useCreateJob();
  
  // Create job
  createJob.mutate({
    title: 'Security Guard',
    wages: '100',
    duration: 8,
    // ...
  });
}
```

### Escrow Operations

```javascript
import { useEscrowByJob, useFundEscrow } from './hooks/useEscrowAPI';

function EscrowStatus({ jobId }) {
  const { data: escrow } = useEscrowByJob(jobId);
  const fundEscrow = useFundEscrow();
  
  // Fund escrow
  fundEscrow.mutate({
    escrowId: escrow.id,
    data: { amount: '100', txHash: '...' }
  });
}
```

### Reputation Queries

```javascript
import { useReputation, useSubmitRating } from './hooks/useReputationAPI';

function UserProfile({ address }) {
  const { data: reputation } = useReputation(address);
  const submitRating = useSubmitRating();
  
  // Submit rating
  submitRating.mutate({
    jobId: 1,
    targetAddress: '...',
    rating: 5,
    txHash: '...'
  });
}
```

## 🔐 Security Best Practices

1. **Environment Variables** - Never commit `.env.local`
2. **API Keys** - Use backend authentication, not frontend
3. **Transaction Signing** - Always verify transactions in wallet
4. **Input Validation** - Validate all user inputs
5. **Error Handling** - Never expose sensitive error details

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 📊 Performance Optimization

- **Code Splitting** - Lazy load components
- **Image Optimization** - Use WebP format
- **Caching** - React Query automatic caching
- **Bundle Analysis** - `npm run build` shows bundle size

## 🐛 Troubleshooting

### Wallet Connection Issues

- Ensure TON Connect manifest URL is correct
- Check wallet app is updated
- Verify network matches (testnet/mainnet)

### API Connection Errors

- Check backend is running
- Verify `REACT_APP_API_URL` is correct
- Check CORS configuration on backend

### Telegram Mini App Not Loading

- Verify `/public/tonconnect-manifest.json` is accessible
- Check bot configuration in BotFather
- Ensure HTTPS for production (Vercel handles this)

## 📝 Development Workflow

1. **Start Backend**: `cd backend && npm start`
2. **Start Frontend**: `npm start`
3. **Open Telegram**: Test in Telegram Web or mobile app
4. **Make Changes**: Hot reload enabled
5. **Deploy**: Push to GitHub → Auto-deploy to Vercel

## 🚀 Production Checklist

- [ ] Update contract addresses in `src/config/contracts.js`
- [ ] Set `REACT_APP_TON_NETWORK=mainnet`
- [ ] Update `REACT_APP_API_URL` to production backend
- [ ] Update TON Connect manifest URL
- [ ] Configure Vercel environment variables
- [ ] Test all features in production
- [ ] Monitor error logs and analytics

## 📚 Documentation

- [TON Connect React](https://github.com/ton-connect/sdk/tree/main/packages/ui-react)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [React Query](https://tanstack.com/query/latest)
- [Vercel Deployment](https://vercel.com/docs)

## 🤝 Contributing

See main project README for contribution guidelines.

## 📄 License

MIT License - see LICENSE file for details
