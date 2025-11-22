# WajoB - Daily Wage Jobs on TON Blockchain

## Project Overview
WajoB is a Telegram Mini App that connects daily-wage building security workers with employers, using TON blockchain to enable trusted immutable job postings, escrow payments, on-chain reputation, and Toncoin-based microtransactions.

## Architecture

### Frontend (Telegram Mini App)
- **Framework**: React.js
- **Styling**: Tailwind CSS v3
- **Wallet Integration**: TON Connect UI React
- **Telegram Integration**: Telegram Web App SDK

### Blockchain (TON)
- **Smart Contracts**: Tolk (TON language)
- **Network**: TON Blockchain
- **Wallet**: TON Connect
- **Currency**: Toncoin (TON)

## Key Features

### 1. Immutable Job Listings
- Job posts stored on TON blockchain for transparency
- Permanent record of job details and terms
- Cannot be altered after posting

### 2. Escrow Payments
- Smart contracts hold funds securely
- Automatic release upon job completion approval
- Dispute resolution mechanism

### 3. On-Chain Reputation System
- Mutual ratings between employers and workers
- Stored permanently on blockchain
- Build trust through verified work history

### 4. Toncoin Integration
- Seamless wallet connection via TON Connect
- Direct payment in Toncoin
- Low transaction fees

### 5. Telegram Native Experience
- Embedded directly in Telegram
- No separate app installation needed
- Familiar interface for users

## User Roles

### Workers
- Browse available jobs
- Apply for positions
- Complete jobs and receive payment
- Build reputation through ratings

### Employers
- Post job listings
- Fund escrow for jobs
- Approve completed work
- Rate workers after job completion

## Project Structure

```
wagob/
├── contract/                  # Smart contracts
│   ├── contracts/
│   │   └── first_contract.tolk
│   ├── scripts/
│   │   └── deployFirstContract.ts
│   ├── tests/
│   │   └── FirstContract.spec.ts
│   └── wrappers/
│       ├── FirstContract.compile.ts
│       └── FirstContract.ts
├── src/                       # React frontend
│   ├── components/           # Reusable UI components
│   │   ├── Header.js
│   │   └── JobCard.js
│   ├── pages/                # Page components
│   │   └── JobListings.js
│   ├── hooks/                # Custom React hooks
│   │   ├── useTelegramWebApp.js
│   │   └── useTonWallet.js
│   ├── contexts/             # React contexts
│   │   └── TonConnectProvider.js
│   ├── utils/                # Utility functions
│   ├── App.js                # Main app component
│   └── index.js              # Entry point
└── public/
    ├── tonconnect-manifest.json
    └── index.html
```

## Tech Stack

### Dependencies
- `react` & `react-dom` - UI framework
- `@tonconnect/ui-react` - TON wallet connection
- `@twa-dev/sdk` - Telegram Web App SDK
- `@ton/ton`, `@ton/core`, `@ton/crypto` - TON blockchain libraries
- `tailwindcss` - Styling framework

### Dev Dependencies
- `react-scripts` - Build tooling
- `autoprefixer` & `postcss` - CSS processing

## Getting Started

### Prerequisites
- Node.js v16+
- npm or yarn
- Telegram account
- TON wallet

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Smart Contract Development

```bash
cd contract

# Install contract dependencies
npm install

# Run tests
npm test

# Deploy contract
npm run deploy
```

## Development Roadmap

### Phase 1: MVP (Current)
- [x] Project setup with React and TON libraries
- [x] Tailwind CSS integration
- [x] TON Connect wallet integration
- [x] Telegram Web App initialization
- [x] Basic UI components (Header, JobCard)
- [x] Job listings page
- [ ] Smart contract for job posting
- [ ] Smart contract for escrow payments

### Phase 2: Core Features
- [ ] Job posting functionality
- [ ] Worker application system
- [ ] Escrow payment smart contract
- [ ] Payment release mechanism
- [ ] Job status tracking

### Phase 3: Reputation System
- [ ] On-chain rating smart contract
- [ ] Rating submission UI
- [ ] Reputation display
- [ ] Verified worker badges

### Phase 4: Advanced Features
- [ ] Search and filtering
- [ ] Job categories
- [ ] Notification system
- [ ] Dispute resolution
- [ ] Analytics dashboard

### Phase 5: Polish & Launch
- [ ] UI/UX improvements
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation
- [ ] Beta testing
- [ ] Production deployment

## Smart Contract Architecture

### JobPosting Contract
- Stores job details on-chain
- Immutable after creation
- Linked to escrow contract

### EscrowPayment Contract
- Holds employer's payment
- Releases funds upon approval
- Handles refunds if needed
- Implements dispute resolution

### Reputation Contract
- Records ratings from both parties
- Calculates reputation scores
- Prevents duplicate ratings
- Stores rating history

## Security Considerations

1. **Smart Contract Security**
   - Thorough testing before deployment
   - Code audits
   - Formal verification where possible

2. **Payment Safety**
   - Escrow mechanism for all payments
   - Multi-signature for disputes
   - Time-locked refunds

3. **User Privacy**
   - Minimal data collection
   - On-chain data is public
   - Telegram user privacy respected

## Testing Strategy

### Frontend Testing
- Unit tests for components
- Integration tests for user flows
- E2E tests for critical paths

### Smart Contract Testing
- Unit tests for all functions
- Integration tests for contract interactions
- Test coverage > 90%
- Mainnet simulation tests

## Deployment

### Frontend Deployment
1. Build production bundle
2. Deploy to GitHub Pages or Vercel
3. Update Telegram bot with app URL
4. Configure TON Connect manifest

### Smart Contract Deployment
1. Test on TON testnet
2. Audit smart contracts
3. Deploy to TON mainnet
4. Verify contract source code

## Contributing
This is a solo project currently. Contributions welcome after initial release.

## License
TBD

## Contact
GitHub: [@yuvrajsharmaaa](https://github.com/yuvrajsharmaaa)

## Resources
- [TON Documentation](https://docs.ton.org/)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [TON Connect](https://docs.ton.org/develop/dapps/ton-connect)
- [React Documentation](https://react.dev/)
