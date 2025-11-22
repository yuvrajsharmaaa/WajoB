# WajoB Backend - Microservices Architecture

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![TON](https://img.shields.io/badge/TON-0098EA?style=for-the-badge&logo=ton&logoColor=white)

Backend microservices for **WajoB** - A TON blockchain-powered daily-wage job marketplace integrated with Telegram Mini App.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      TELEGRAM MINI APP (Frontend)                │
│                     React + TON Connect + TWA SDK                │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API / WebSockets
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NESTJS API GATEWAY                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Jobs   │ │  Escrow  │ │Reputation│ │   Auth   │           │
│  │Controller│ │Controller│ │Controller│ │Controller│           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                  │
│  ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐           │
│  │  Jobs    │ │  Escrow  │ │Reputation│ │   Auth   │           │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
         ┌────────────┴─────────────┬─────────────┐
         ▼                          ▼             ▼
┌─────────────────┐     ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │     │      Redis      │  │  Telegram Bot   │
│  (Primary DB)   │     │ (Cache + Queue) │  │   (Webhooks)    │
└─────────────────┘     └─────────────────┘  └─────────────────┘
         ▲                          ▲             ▲
         │                          │             │
         │      ┌───────────────────┴─────────────┘
         │      │
┌────────▼──────▼──────────────────────────────────────────────┐
│              BLOCKCHAIN INDEXER SERVICE                       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Cron Jobs (Every 10s)                               │    │
│  │  - Query TON Contracts (JobRegistry, Escrow, Rep)    │    │
│  │  - Parse Transactions                                │    │
│  │  - Sync to PostgreSQL                                │    │
│  │  - Trigger Notifications                             │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   TON BLOCKCHAIN    │
                  │   (Testnet/Mainnet) │
                  │  - JobRegistry.fc   │
                  │  - Escrow.fc        │
                  │  - Reputation.fc    │
                  └─────────────────────┘
```

## ✨ Features

### 🔗 Blockchain Integration
- **TON Indexer Service**: Periodic blockchain querying (every 10s)
- **Smart Contract Interaction**: JobRegistry, Escrow, Reputation contracts
- **Transaction Parsing**: Automatic event processing
- **Off-chain Database Sync**: Real-time blockchain → PostgreSQL synchronization

### 📱 Telegram Bot
- **Webhook Support**: Production-ready webhook handler
- **Polling Mode**: Development-friendly polling
- **Push Notifications**: Real-time job updates, payment alerts
- **User Session Management**: Telegram ID ↔ Wallet address linking
- **Bot Commands**: `/start`, `/help`, `/profile`, `/jobs`

### 💾 Database & Caching
- **PostgreSQL**: Transactional data (jobs, escrows, users, reputations)
- **Redis**: High-performance caching + Bull queue for async jobs
- **TypeORM**: Type-safe database operations with migrations
- **Optimized Schemas**: Proper indexes for performance

### 🔐 Security
- **JWT Authentication**: Secure API access
- **Input Validation**: Class-validator for all DTOs
- **Helmet**: HTTP security headers
- **CORS**: Configurable cross-origin policies
- **Rate Limiting**: Prevent abuse (100 req/min default)

### 📊 API Documentation
- **Swagger/OpenAPI**: Interactive API docs at `/api/v1/docs`
- **Auto-generated**: From decorators
- **Try it out**: Test endpoints directly

### 🚀 Async Processing
- **Bull Queue**: Message queue for notifications, blockchain sync
- **Worker Patterns**: Scalable background job processing
- **Redis-backed**: Reliable job persistence

## 📁 Project Structure

```
backend/
├── src/
│   ├── main.ts                      # Application entry point
│   ├── app.module.ts                # Root module
│   ├── config/
│   │   ├── typeorm.config.ts        # Database configuration
│   │   └── validation.schema.ts     # Environment validation
│   ├── entities/
│   │   ├── jobs/
│   │   │   └── job.entity.ts        # Job entity (PostgreSQL)
│   │   ├── escrow/
│   │   │   └── escrow.entity.ts     # Escrow entity
│   │   ├── reputation/
│   │   │   └── reputation.entity.ts # Reputation entity
│   │   ├── users/
│   │   │   └── user.entity.ts       # User entity
│   │   └── notifications/
│   │       └── notification.entity.ts
│   └── modules/
│       ├── auth/                    # JWT authentication
│       │   ├── auth.module.ts
│       │   ├── auth.service.ts
│       │   ├── auth.controller.ts
│       │   └── strategies/
│       │       └── jwt.strategy.ts
│       ├── jobs/                    # Job management
│       │   ├── jobs.module.ts
│       │   ├── jobs.service.ts
│       │   └── jobs.controller.ts
│       ├── escrow/                  # Escrow management
│       │   ├── escrow.module.ts
│       │   ├── escrow.service.ts
│       │   └── escrow.controller.ts
│       ├── reputation/              # Reputation system
│       │   ├── reputation.module.ts
│       │   ├── reputation.service.ts
│       │   └── reputation.controller.ts
│       ├── users/                   # User management
│       │   ├── users.module.ts
│       │   ├── users.service.ts
│       │   └── users.controller.ts
│       ├── telegram/                # Telegram bot
│       │   ├── telegram.module.ts
│       │   ├── telegram.service.ts
│       │   ├── telegram.controller.ts
│       │   └── notification.processor.ts
│       └── blockchain/              # TON indexer
│           ├── blockchain.module.ts
│           ├── indexer.service.ts   # Periodic blockchain sync
│           └── ton-client.service.ts # TON API wrapper
├── .env.example                     # Environment template
├── docker-compose.yml               # Docker orchestration
├── Dockerfile                       # Multi-stage Docker build
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
└── nest-cli.json                    # NestJS CLI config
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >= 20.x
- **PostgreSQL**: >= 16.x
- **Redis**: >= 7.x
- **Docker** (optional but recommended)

### Installation

#### Option 1: Docker (Recommended)

```bash
# 1. Clone and navigate to backend
cd backend

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env file
nano .env  # Add your Telegram bot token, DB credentials, etc.

# 4. Start all services
docker-compose up -d

# 5. View logs
docker-compose logs -f backend

# 6. Run migrations
docker-compose exec backend npm run migration:run
```

**Services started:**
- Backend API: http://localhost:3001
- Swagger Docs: http://localhost:3001/api/v1/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- PgAdmin: http://localhost:5050 (admin@wagob.com / admin)
- Redis Commander: http://localhost:8081

#### Option 2: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL and Redis
# Using Docker:
docker-compose up postgres redis -d

# Or install manually on your system

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Run migrations
npm run migration:run

# 5. Start development server
npm run start:dev

# Server runs at http://localhost:3001
```

### Environment Configuration

Edit `.env` file:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=wagob_user
DB_PASSWORD=your_secure_password
DB_DATABASE=wagob_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Telegram Bot (Get from @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# TON Blockchain
TON_NETWORK=testnet
CONTRACT_JOB_REGISTRY=EQD...  # After deployment
CONTRACT_ESCROW=EQD...
CONTRACT_REPUTATION=EQD...

# JWT
JWT_SECRET=your_random_secret_key_here
```

## 📡 API Endpoints

### Authentication
```
POST   /api/v1/auth/login              # Telegram + Wallet auth
```

### Jobs
```
GET    /api/v1/jobs                    # List all jobs
GET    /api/v1/jobs/:id                # Get job details
POST   /api/v1/jobs                    # Create job
PUT    /api/v1/jobs/:id                # Update job
```

### Escrow
```
GET    /api/v1/escrow                  # List all escrows
GET    /api/v1/escrow/:id              # Get escrow details
POST   /api/v1/escrow                  # Create escrow
PUT    /api/v1/escrow/:id              # Update escrow
```

### Reputation
```
GET    /api/v1/reputation              # List all ratings
GET    /api/v1/reputation/:id          # Get rating
GET    /api/v1/reputation/user/:userId # Get user ratings
POST   /api/v1/reputation              # Submit rating
```

### Users
```
GET    /api/v1/users                   # List users
GET    /api/v1/users/:id               # Get user profile
POST   /api/v1/users                   # Create user
PUT    /api/v1/users/:id               # Update user
```

### Telegram
```
POST   /api/v1/telegram/webhook        # Telegram webhook
```

**Full documentation**: http://localhost:3001/api/v1/docs

## 🔄 Blockchain Indexer

The indexer service automatically syncs blockchain data:

### How it Works

1. **Cron Job**: Runs every 10 seconds
2. **Contract Queries**: Fetches transactions from TON contracts
3. **Transaction Parsing**: Extracts operation codes and data
4. **Database Sync**: Updates PostgreSQL
5. **Notifications**: Triggers Telegram alerts

### Supported Operations

**JobRegistry** (`0x7362d09c`, `0x5fcc3d14`, `0x235caf52`):
- Job creation
- Status updates
- Worker assignments

**Escrow** (`0x8f4a33db`, `0x2fcb26a8`, `0x5de7c0ab`, `0x6a8d4f12`, `0x7b3e5c91`):
- Escrow creation
- Funding
- Locking
- Completion
- Dispute

**Reputation** (`0x9e6f2a84`):
- Rating submissions

### Manual Sync

```bash
# Trigger manual blockchain sync
curl -X POST http://localhost:3001/api/v1/blockchain/sync
```

## 🤖 Telegram Bot Setup

### 1. Create Bot

1. Open Telegram, search `@BotFather`
2. Send `/newbot`
3. Follow instructions
4. Copy bot token to `.env`

### 2. Set Webhook (Production)

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-api.com/api/v1/telegram/webhook"}'
```

### 3. Test Bot

1. Search your bot in Telegram
2. Send `/start`
3. Click "Open WajoB" button
4. Connect wallet

### Bot Commands

- `/start` - Register and open app
- `/help` - Show help message
- `/profile` - View your profile
- `/jobs` - Browse jobs

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Deployment

### Docker Production

```bash
# Build production image
docker build -t wagob-backend:latest --target production .

# Run container
docker run -d \
  --name wagob-backend \
  -p 3001:3001 \
  --env-file .env.production \
  wagob-backend:latest
```

### Cloud Platforms

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

#### AWS / GCP / Azure
- Use provided `Dockerfile`
- Configure environment variables
- Set up PostgreSQL (RDS/Cloud SQL)
- Set up Redis (ElastiCache/Memorystore)
- Deploy container

### Environment Variables

Production `.env.production`:
```bash
NODE_ENV=production
DB_SYNCHRONIZE=false  # Never true in production!
DB_LOGGING=false
TELEGRAM_WEBHOOK_URL=https://your-api.com/api/v1/telegram/webhook
```

## 🔍 Monitoring

### Health Check

```bash
curl http://localhost:3001/api/v1/health
```

### Logs

```bash
# Docker logs
docker-compose logs -f backend

# Application logs
tail -f logs/app.log
```

### Bull Queue Dashboard

Access at: http://localhost:3001/api/v1/bull-board
- Username: admin
- Password: admin123 (change in `.env`)

## 🛠️ Development

### Database Migrations

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### Add New Module

```bash
nest g module modules/feature-name
nest g service modules/feature-name
nest g controller modules/feature-name
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file

## 🆘 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check credentials in .env
# Test connection
psql -h localhost -U wagob_user -d wagob_db
```

### Redis Connection Failed
```bash
# Check Redis is running
docker-compose ps redis

# Test connection
redis-cli ping
```

### Telegram Bot Not Responding
- Verify bot token in `.env`
- Check webhook URL is accessible
- Review logs: `docker-compose logs telegram`

### Blockchain Indexer Not Syncing
- Verify contract addresses in `.env`
- Check TON network status
- Review logs: `docker-compose logs backend | grep Indexer`

## 📞 Support

- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Telegram: @WajoBSupport
- Email: support@wagob.com

---

**Built with ❤️ by the WajoB Team**
