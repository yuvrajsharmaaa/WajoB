# WajoB - Daily Wage Jobs on TON Blockchain 🚀

A Telegram Mini App connecting daily-wage building security workers with employers using TON blockchain for trusted job postings, escrow payments, and on-chain reputation.

![TON](https://img.shields.io/badge/TON-Blockchain-0098EA)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB)
![NestJS](https://img.shields.io/badge/NestJS-10.3.0-E0234E)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38B2AC)
![Telegram](https://img.shields.io/badge/Telegram-Mini_App-0088cc)

## 🎯 Project Vision

WajoB empowers daily-wage workers in the security sector by:
- **Eliminating trust barriers** through blockchain-backed job postings
- **Securing payments** via smart contract escrow
- **Building verifiable reputation** on-chain
- **Enabling direct Toncoin payments** with minimal friction

## ✨ Features

### For Workers 👷
- Browse verified job listings on TON blockchain
- Apply for jobs with one tap in Telegram
- Receive guaranteed payment after job completion
- Build on-chain reputation through employer ratings
- Get instant push notifications for job updates

### For Employers 🏢
- Post jobs immutably on blockchain
- Automatic escrow payment handling
- Approve completed work securely
- Access verified worker reputation data
- Real-time notifications for job applications

## 🛠 Tech Stack

### Frontend
- **React 19.2.0** - Modern UI framework
- **Tailwind CSS 3.x** - Utility-first styling
- **TON Connect** - Seamless wallet integration
- **Telegram Web App SDK** - Native Telegram integration

### Backend
- **NestJS 10.3.0** - Enterprise-grade Node.js framework
- **PostgreSQL 16** - Transactional data storage
- **Redis 7** - Caching and message queue
- **TypeORM 0.3.19** - Database ORM with migrations
- **Bull 4.12.0** - Async job processing

### Blockchain
- **TON Blockchain** - Fast, scalable network
- **FunC Smart Contracts** - Secure on-chain logic
- **@ton/ton SDK** - Blockchain indexing and interaction

### DevOps
- **Docker** - Containerization
- **Kubernetes** - Production orchestration
- **Swagger** - API documentation

## � Project Structure

```
wagob/
├── frontend/                 # React Telegram Mini App
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Main app pages
│   │   ├── hooks/           # Custom React hooks (wallet, contracts)
│   │   ├── contexts/        # React context providers
│   │   └── utils/           # Helper functions
│   └── public/              # Static assets
│
├── backend/                 # NestJS Microservices
│   ├── src/
│   │   ├── modules/
│   │   │   ├── blockchain/  # TON indexing service
│   │   │   ├── telegram/    # Bot & notifications
│   │   │   ├── jobs/        # Job management API
│   │   │   ├── escrow/      # Escrow management API
│   │   │   ├── reputation/  # Reputation API
│   │   │   └── auth/        # JWT authentication
│   │   ├── entities/        # TypeORM database models
│   │   └── config/          # App configuration
│   └── docker-compose.yml   # Local development setup
│
└── contract/                # TON Smart Contracts
    ├── contracts/           # FunC contract source
    ├── wrappers/            # TypeScript contract wrappers
    ├── tests/               # Contract test suites
    └── scripts/             # Deployment scripts
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Docker** and Docker Compose (for backend)
- **Git**
- **Telegram account**

### 1️⃣ Automated Setup (Recommended)

Run the automated setup script from the project root:

```bash
# Clone repository
git clone <your-repo-url>
cd wagob

# Make setup script executable and run
chmod +x setup.sh
./setup.sh
```

This script will:
- ✅ Check all dependencies (Node, Docker, Git)
- ✅ Install frontend, backend, and contract packages
- ✅ Create `.env` files from templates
- ✅ Start Docker services (PostgreSQL, Redis)
- ✅ Provide next steps guidance

### 2️⃣ Manual Setup

#### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
# App will open at http://localhost:3000
```

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run database migrations
npm run migration:run

# Start backend in development mode
npm run start:dev
# Backend API at http://localhost:3001
# Swagger docs at http://localhost:3001/api/v1/docs
```

#### Smart Contracts Setup

```bash
cd contract

# Install dependencies
npm install

# Compile contracts
npx blueprint build

# Run tests
npm test

# Deploy to testnet (requires TON wallet)
npx blueprint run deployDeployJobRegistry --testnet
npx blueprint run deployDeployEscrow --testnet
npx blueprint run deployDeployReputation --testnet
```

### 3️⃣ Configure Environment Variables

#### Backend (`backend/.env`)
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=wagob
DATABASE_PASSWORD=wagob_password
DATABASE_NAME=wagob

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/v1/telegram/webhook

# TON Blockchain
TON_NETWORK=testnet
TON_API_URL=https://testnet.toncenter.com/api/v2/jsonRPC

# Contract Addresses (update after deployment)
JOB_REGISTRY_ADDRESS=EQC...
ESCROW_CONTRACT_ADDRESS=EQC...
REPUTATION_CONTRACT_ADDRESS=EQC...

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRATION=7d
```

#### Frontend (`src/config/contracts.js`)
Update contract addresses after deployment:
```javascript
export const CONTRACTS = {
  JOB_REGISTRY: 'EQC...', // From deployment output
  ESCROW: 'EQC...',
  REPUTATION: 'EQC...',
};
```

### 4️⃣ Get Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow instructions
3. Copy the bot token to `backend/.env`
4. Set up Telegram Mini App:
   - Send `/newapp` to @BotFather
   - Choose your bot
   - Set Web App URL (your Vercel/Netlify deployment)

## 📚 Documentation

### 📖 User Documentation
Perfect for users getting started with WajoB:

- **[Quick Start Guide](./docs/tutorials/quickstart.md)** - 5-minute onboarding tutorial
- **[Getting Started](./docs/user-guides/getting-started.md)** - Complete user guide
- **[Wallet Setup](./docs/user-guides/wallet-setup.md)** - TON wallet configuration
- **[Troubleshooting](./docs/user-guides/troubleshooting.md)** - Common issues and solutions
- **[FAQ](./docs/tutorials/faq.md)** - Frequently asked questions

### 👨‍💻 Developer Documentation
For developers contributing to or integrating with WajoB:

- **[Architecture Overview](./docs/developer/architecture.md)** - System design and components
- **[API Reference](./docs/developer/api-reference.md)** - Complete REST and WebSocket API
- **[Contributing Guide](./docs/developer/contributing.md)** - How to contribute
- **[Smart Contracts](./contract/CONTRACTS_README.md)** - Contract documentation
- **[Backend API Details](./backend/API.md)** - Additional backend API info

### 🚀 Operations Documentation
For DevOps and system administrators:

- **[Production Deployment](./docs/operations/deployment.md)** - Complete deployment guide
- **[Backend Deployment](./backend/DEPLOYMENT.md)** - Backend-specific deployment
- **[Monitoring & Alerts](./MONITORING.md)** - System monitoring setup

### 📋 Project Documentation
Additional project information:

- **[Project Overview](./PROJECT_OVERVIEW.md)** - Complete project architecture
- **[Implementation Status](./IMPLEMENTATION_COMPLETE.md)** - Development progress
- **[Testing Strategy](./TESTING_STRATEGY.md)** - Testing approach

### 🌐 Online Documentation
Full documentation site built with MkDocs:

```bash
# Install MkDocs
pip install mkdocs-material

# Serve documentation locally
cd docs
mkdocs serve

# Build static site
mkdocs build
```

Visit the docs at: **http://localhost:8000**

## 🧪 Testing

### Frontend Tests
```bash
npm test
npm run test:coverage
```

### Backend Tests
```bash
cd backend
npm test              # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage report
```

### Smart Contract Tests
```bash
cd contract
npm test
```

## 🏗️ Building for Production

### Frontend Build
```bash
npm run build
# Creates optimized production build in `build/` folder
```

### Backend Build
```bash
cd backend
npm run build
# Creates compiled output in `dist/` folder
```

### Docker Production Build
```bash
cd backend
docker build -t wagob-backend:latest .
docker run -p 3001:3001 --env-file .env wagob-backend:latest
```

## 🚀 Deployment

### Frontend Deployment

#### Vercel (Recommended)
```bash
npm install -g vercel
vercel deploy
```

#### Netlify
```bash
npm run build
netlify deploy --prod --dir=build
```

### Backend Deployment

#### Using Docker Compose
```bash
cd backend
docker-compose up -d
```

#### Using Kubernetes
```bash
cd backend
kubectl apply -f k8s/deployment.yml
```

#### Platform-Specific Guides
- **Railway**: See [backend/DEPLOYMENT.md#railway](./backend/DEPLOYMENT.md#railway)
- **AWS ECS**: See [backend/DEPLOYMENT.md#aws](./backend/DEPLOYMENT.md#aws)
- **Google Cloud Run**: See [backend/DEPLOYMENT.md#gcp](./backend/DEPLOYMENT.md#gcp)
- **Azure Container Apps**: See [backend/DEPLOYMENT.md#azure](./backend/DEPLOYMENT.md#azure)
- **DigitalOcean App Platform**: See [backend/DEPLOYMENT.md#digitalocean](./backend/DEPLOYMENT.md#digitalocean)

### Smart Contract Deployment

Contracts are already deployed to TON testnet. To deploy to mainnet:

```bash
cd contract
npx blueprint run deployDeployJobRegistry --mainnet
npx blueprint run deployDeployEscrow --mainnet
npx blueprint run deployDeployReputation --mainnet
```

## 🔗 API Endpoints

The backend provides the following REST API:

- **Jobs**: `POST /api/v1/jobs`, `GET /api/v1/jobs`, `GET /api/v1/jobs/:id`
- **Escrow**: `POST /api/v1/escrow`, `GET /api/v1/escrow/:id`, `PUT /api/v1/escrow/:id/confirm`
- **Reputation**: `POST /api/v1/reputation`, `GET /api/v1/reputation/user/:userId`
- **Users**: `GET /api/v1/users/profile`, `PUT /api/v1/users/profile`
- **Auth**: `POST /api/v1/auth/login`

Interactive API documentation available at: `http://localhost:3001/api/v1/docs` (Swagger UI)

## 🤖 Telegram Bot Commands

- `/start` - Register account and link TON wallet
- `/help` - Display help information
- `/profile` - View your stats and reputation
- `/jobs` - Browse available jobs

## 🔐 Security Features

- ✅ **JWT Authentication** with refresh tokens
- ✅ **Input Validation** using class-validator
- ✅ **Environment Validation** with Joi schemas
- ✅ **Security Headers** via Helmet middleware
- ✅ **Rate Limiting** (100 requests/minute default)
- ✅ **CORS** with whitelisted origins
- ✅ **SQL Injection Protection** via TypeORM parameterized queries
- ✅ **Non-root Docker Container** for production

## 📊 Architecture

### Data Flow

1. **User Posts Job** (Telegram Mini App)
   - Frontend → Backend API → Smart Contract → TON Blockchain
   
2. **Blockchain Indexer** (Background Service)
   - TON Blockchain → Backend Indexer (cron every 10s) → PostgreSQL
   
3. **Push Notification** (Worker Applied)
   - Database Event → Bull Queue → Telegram Service → User's Telegram

### Key Components

- **Frontend**: React app embedded in Telegram
- **Backend API**: NestJS REST endpoints
- **Blockchain Indexer**: Syncs TON → PostgreSQL every 10 seconds
- **Telegram Bot**: Commands + Push notifications
- **Smart Contracts**: Job Registry, Escrow, Reputation (FunC)
- **Database**: PostgreSQL with optimized indexes
- **Cache/Queue**: Redis for caching + Bull queue for async jobs

## 🛣️ Roadmap

### Phase 1: MVP ✅ (Completed)
- [x] Frontend Telegram Mini App
- [x] TON wallet integration
- [x] Smart contracts (Job Registry, Escrow, Reputation)
- [x] Backend microservices
- [x] Blockchain indexer
- [x] Telegram bot with notifications
- [x] Documentation

### Phase 2: Testnet Launch 🚧 (In Progress)
- [ ] Deploy all components to testnet
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Bug fixes and optimization

### Phase 3: Production Launch 📅 (Planned)
- [ ] Mainnet deployment
- [ ] Marketing campaign
- [ ] User onboarding
- [ ] Community building

### Phase 4: Feature Expansion 💡 (Future)
- [ ] Multi-language support
- [ ] Job categories expansion
- [ ] Advanced reputation algorithm
- [ ] Dispute resolution system
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Your Name** - Full Stack Developer

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/wagob/issues)
- **Telegram**: [@your_support_bot](https://t.me/your_support_bot)
- **Email**: support@wagob.app

## 🙏 Acknowledgments

- TON Foundation for blockchain infrastructure
- Telegram for Mini App platform
- NestJS community for excellent framework
- Blueprint for smart contract tooling

---

**Built with ❤️ for daily-wage workers worldwide**
