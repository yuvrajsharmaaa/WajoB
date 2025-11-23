# 🏗️ Architecture Overview

Comprehensive technical architecture of the WajoB platform.

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Details](#component-details)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Security Architecture](#security-architecture)
7. [Scalability Design](#scalability-design)

---

## System Overview

WajoB is a **decentralized job marketplace** built as a Telegram Mini App, leveraging TON blockchain for secure escrow payments and reputation management.

### Core Principles

- 🔒 **Security First** - Blockchain-based escrow, audited smart contracts
- ⚡ **Performance** - Optimized for low latency and high throughput
- 📱 **Mobile Native** - Telegram-first user experience
- 🌐 **Decentralized** - No central authority over funds
- 🔧 **Maintainable** - Clean architecture, comprehensive testing

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Mobile     │  │   Desktop    │  │   Web App    │      │
│  │  (Telegram)  │  │  (Telegram)  │  │  (Browser)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                    Telegram Bot API                           │
│  ┌────────────────────────────────────────────────────┐      │
│  │              Telegram Mini App                      │      │
│  │         (React + TON Connect UI)                    │      │
│  └────────┬───────────────────────────┬─────────────────┘    │
└───────────┼───────────────────────────┼──────────────────────┘
            │                           │
    ┌───────▼───────┐          ┌────────▼────────┐
    │   Frontend    │          │  Telegram Bot   │
    │   (React)     │◄────────►│   (Node.js)     │
    └───────┬───────┘          └────────┬────────┘
            │                           │
            │        ┌──────────────────┘
            │        │
    ┌───────▼────────▼───────┐
    │   Backend API          │
    │   (NestJS)             │
    │                        │
    │  ┌──────────────────┐ │
    │  │  WebSocket       │ │
    │  │  Gateway         │ │
    │  └──────────────────┘ │
    └───┬─────────┬─────┬───┘
        │         │     │
┌───────▼──┐  ┌──▼─────▼────┐   ┌─────────────────┐
│PostgreSQL│  │   Redis     │   │  TON Blockchain │
│ Database │  │   Cache     │   │                 │
└──────────┘  └─────────────┘   │  ┌───────────┐ │
                                │  │JobRegistry│ │
                                │  ├───────────┤ │
                                │  │  Escrow   │ │
                                │  ├───────────┤ │
                                │  │Reputation │ │
                                │  └───────────┘ │
                                └─────────────────┘
```

---

## Architecture Diagram

### Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client Layer                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   React Frontend                            │ │
│  │                                                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │   TON    │  │WebSocket │  │  State   │  │   UI     │  │ │
│  │  │ Connect  │  │  Client  │  │Management│  │Components│  │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘  │ │
│  └───────┼─────────────┼─────────────┼────────────────────────┘ │
└──────────┼─────────────┼─────────────┼───────────────────────────┘
           │             │             │
           │             │             │ HTTPS/REST
           │             │ WebSocket   │
           │             │             │
┌──────────┼─────────────┼─────────────▼───────────────────────────┐
│          │             │        API Gateway                       │
│          │             │      (Load Balancer)                     │
│          │             │                                          │
│  ┌───────┴─────────────┴────────────────────────────────────┐   │
│  │                    NestJS Backend                         │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │              Module Layer                         │    │   │
│  │  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │    │   │
│  │  │  │ Jobs │  │Escrow│  │ User │  │ Auth │         │    │   │
│  │  │  │Module│  │Module│  │Module│  │Module│         │    │   │
│  │  │  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘         │    │   │
│  │  └─────┼─────────┼─────────┼─────────┼──────────────┘    │   │
│  │        │         │         │         │                    │   │
│  │  ┌─────▼─────────▼─────────▼─────────▼──────────────┐   │   │
│  │  │            Service Layer                          │   │   │
│  │  │  - Business Logic                                 │   │   │
│  │  │  - Transaction Management                         │   │   │
│  │  │  - Caching Strategy                               │   │   │
│  │  └─────┬─────────┬─────────┬─────────┬──────────────┘   │   │
│  │        │         │         │         │                    │   │
│  │  ┌─────▼─────────▼─────────▼─────────▼──────────────┐   │   │
│  │  │          Repository Layer                         │   │   │
│  │  │  - Data Access                                    │   │   │
│  │  │  - Query Optimization                             │   │   │
│  │  └─────┬─────────┬─────────┬─────────┬──────────────┘   │   │
│  └────────┼─────────┼─────────┼─────────┼───────────────────┘   │
└───────────┼─────────┼─────────┼─────────┼────────────────────────┘
            │         │         │         │
    ┌───────▼──┐  ┌───▼────┐  ┌─▼────────▼─┐  ┌──────────────────┐
    │PostgreSQL│  │ Redis  │  │BlockchainAPI│  │  TON Blockchain  │
    │  Primary │  │ Cache  │  │   Client    │  │                  │
    │          │  │        │  │             │◄─┤  Smart Contracts │
    │  Replica │  │L1/L2   │  │  TonWeb/    │  │  - JobRegistry   │
    │          │  │        │  │  TON SDK    │  │  - Escrow        │
    └──────────┘  └────────┘  └─────────────┘  │  - Reputation    │
                                                └──────────────────┘
```

---

## Component Details

### 1. Frontend (React)

**Location**: `/src`

**Responsibilities:**
- User interface rendering
- Wallet connection via TON Connect
- Transaction signing coordination
- Real-time updates via WebSocket
- State management
- Optimistic UI updates

**Key Technologies:**
- React 19.2.0
- @tonconnect/ui-react (wallet integration)
- Socket.io-client (real-time updates)
- React Router (navigation)
- Tailwind CSS (styling)

**Key Files:**
```
src/
├── components/          # Reusable UI components
│   ├── JobCard.js
│   ├── JobList.js
│   ├── TransactionStatus.js
│   └── ErrorBoundary.js
├── pages/              # Page-level components
│   ├── HomePage.js
│   ├── JobDetailsPage.js
│   └── ProfilePage.js
├── hooks/              # Custom React hooks
│   ├── useWebSocket.js
│   ├── useTonConnect.js
│   └── useJobs.js
├── contexts/           # React context providers
│   ├── AuthContext.js
│   └── WalletContext.js
└── utils/              # Helper functions
    ├── blockchain.js
    └── formatting.js
```

**Data Flow:**
```
User Action → Component → Hook → API Call → Backend
                 ↓
            Update State → Re-render UI
                 ↓
       WebSocket Update → Real-time Sync
```

---

### 2. Backend API (NestJS)

**Location**: `/backend`

**Responsibilities:**
- RESTful API endpoints
- Business logic execution
- Database operations
- Caching management
- Blockchain event monitoring
- WebSocket connection management
- Authentication & authorization

**Architecture Pattern**: **Layered Architecture**

```
Controllers (HTTP Handlers)
     ↓
Services (Business Logic)
     ↓
Repositories (Data Access)
     ↓
Database / Cache / Blockchain
```

**Key Modules:**

#### Jobs Module
```typescript
backend/src/modules/jobs/
├── jobs.controller.ts       # HTTP endpoints
├── jobs.service.ts          # Business logic
├── jobs.service.optimized.ts # With caching
├── jobs.gateway.ts          # WebSocket gateway
├── jobs.repository.ts       # Data access
└── dto/                     # Data transfer objects
    ├── create-job.dto.ts
    └── update-job.dto.ts
```

**Endpoints:**
- `GET /jobs` - List jobs (paginated)
- `POST /jobs` - Create job
- `GET /jobs/:id` - Get job details
- `PATCH /jobs/:id` - Update job
- `DELETE /jobs/:id` - Delete job
- `POST /jobs/:id/apply` - Apply to job

#### Escrow Module
```typescript
backend/src/modules/escrow/
├── escrow.controller.ts
├── escrow.service.ts
├── escrow.listener.ts       # Blockchain events
└── dto/
    ├── fund-escrow.dto.ts
    └── release-escrow.dto.ts
```

**Endpoints:**
- `POST /escrow` - Create escrow
- `POST /escrow/:id/fund` - Fund escrow
- `POST /escrow/:id/release` - Release payment
- `GET /escrow/:id` - Get escrow details

#### User/Auth Module
```typescript
backend/src/modules/users/
├── users.controller.ts
├── users.service.ts
├── auth.guard.ts            # JWT validation
└── telegram.strategy.ts     # Telegram auth
```

**Endpoints:**
- `POST /auth/telegram` - Telegram login
- `GET /users/me` - Current user profile
- `PATCH /users/me` - Update profile
- `GET /users/:id` - Public profile

#### Reputation Module
```typescript
backend/src/modules/reputation/
├── reputation.controller.ts
├── reputation.service.ts
└── dto/
    └── submit-rating.dto.ts
```

**Endpoints:**
- `POST /reputation/rate` - Submit rating
- `GET /reputation/:userId` - Get user reputation
- `GET /reputation/:userId/ratings` - Get ratings list

---

### 3. Smart Contracts (FunC)

**Location**: `/contract`

**Responsibilities:**
- Job registry (on-chain job IDs)
- Escrow management (lock/release funds)
- Reputation scoring (verified ratings)
- Dispute resolution
- Event emission

**Contracts:**

#### JobRegistry Contract
```func
contract/contracts/JobRegistry.fc
contract/contracts/JobRegistryOptimized.fc
```

**Functions:**
- `create_job()` - Register new job
- `update_status()` - Change job status
- `assign_worker()` - Assign worker to job
- `get_job()` - Retrieve job details
- `get_jobs_paginated()` - List jobs

**Storage:**
```func
storage {
  job_count: uint64
  jobs: dict<uint64, Job>
  employer_jobs: dict<address, uint64[]>
  worker_jobs: dict<address, uint64[]>
}

struct Job {
  id: uint64
  employer: address
  worker: address
  wages: coins
  status: uint3  // 0-5 (open, assigned, etc.)
  created_at: uint32
  metadata: cell
}
```

#### Escrow Contract
```func
contract/contracts/Escrow.fc
contract/contracts/EscrowOptimized.fc
```

**Functions:**
- `create_escrow()` - Initialize escrow
- `fund()` - Deposit funds
- `release_auto()` - Release to worker
- `refund()` - Return to employer
- `resolve_dispute()` - Manual resolution

**Storage:**
```func
storage {
  escrow_count: uint64
  escrows: dict<uint64, Escrow>
}

struct Escrow {
  id: uint64
  job_id: uint64
  employer: address
  worker: address
  amount: coins
  fee: coins
  state: uint3  // locked, released, refunded
  deadline: uint32
  flags: uint2
}
```

#### Reputation Contract
```func
contract/contracts/Reputation.fc
contract/contracts/ReputationOptimized.fc
```

**Functions:**
- `submit_rating()` - Add rating
- `batch_rating()` - Multiple ratings
- `get_reputation()` - Calculate score
- `get_trend()` - Reputation trend

**Storage:**
```func
storage {
  ratings: dict<user_hash, Rating[]>
  reputation_cache: dict<user_hash, ReputationScore>
}

struct Rating {
  rater_hash: uint256
  score: uint3  // 1-5 stars
  timestamp: uint32
  job_id: uint64
}

struct ReputationScore {
  average: uint16  // scaled by 1000
  total_jobs: uint32
  total_ratings: uint32
  trend: int2  // -1, 0, +1
}
```

---

### 4. Database (PostgreSQL)

**Schema Design:**

#### Jobs Table
```sql
CREATE TABLE jobs (
  id BIGSERIAL PRIMARY KEY,
  blockchain_id BIGINT UNIQUE,
  employer_id BIGINT REFERENCES users(id),
  worker_id BIGINT REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  location VARCHAR(200),
  wages DECIMAL(20, 9) NOT NULL,  -- TON amount
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deadline TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_employer (employer_id),
  INDEX idx_worker (worker_id),
  INDEX idx_blockchain (blockchain_id)
);
```

#### Users Table
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  wallet_address VARCHAR(100) UNIQUE,
  username VARCHAR(100),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  reputation_score DECIMAL(3, 2),  -- 0.00 - 5.00
  total_jobs_completed INT DEFAULT 0,
  total_earnings DECIMAL(20, 9) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_telegram (telegram_id),
  INDEX idx_wallet (wallet_address),
  INDEX idx_reputation (reputation_score DESC)
);
```

#### Escrows Table
```sql
CREATE TABLE escrows (
  id BIGSERIAL PRIMARY KEY,
  blockchain_id BIGINT UNIQUE,
  job_id BIGINT REFERENCES jobs(id),
  employer_id BIGINT REFERENCES users(id),
  worker_id BIGINT REFERENCES users(id),
  amount DECIMAL(20, 9) NOT NULL,
  fee DECIMAL(20, 9) NOT NULL,
  status VARCHAR(20) NOT NULL,  -- created, funded, locked, released, refunded
  tx_fund VARCHAR(100),
  tx_release VARCHAR(100),
  deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  funded_at TIMESTAMP,
  released_at TIMESTAMP,
  
  INDEX idx_job (job_id),
  INDEX idx_status (status),
  INDEX idx_blockchain (blockchain_id)
);
```

#### Ratings Table
```sql
CREATE TABLE ratings (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT REFERENCES jobs(id),
  rater_id BIGINT REFERENCES users(id),
  ratee_id BIGINT REFERENCES users(id),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  blockchain_tx VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_ratee (ratee_id, created_at DESC),
  INDEX idx_job (job_id),
  UNIQUE (job_id, rater_id)  -- One rating per job per rater
);
```

#### Applications Table
```sql
CREATE TABLE applications (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT REFERENCES jobs(id),
  worker_id BIGINT REFERENCES users(id),
  status VARCHAR(20) NOT NULL,  -- pending, accepted, rejected
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_job (job_id, status),
  INDEX idx_worker (worker_id, status),
  UNIQUE (job_id, worker_id)  -- One application per job per worker
);
```

---

### 5. Cache (Redis)

**Purpose**: Multi-level caching for performance optimization

**Cache Strategy:**

```typescript
// L1: In-memory (Node.js)
const inMemoryCache = new Map<string, any>();
const TTL_SHORT = 30_000; // 30 seconds

// L2: Redis
const redisCacheTTL = {
  hot: 60_000,      // 1 minute - frequently changing data
  warm: 300_000,    // 5 minutes - moderately changing
  cold: 1_800_000,  // 30 minutes - rarely changing
};
```

**Cached Data:**

| Data Type | Cache Key Pattern | TTL | Invalidation |
|-----------|-------------------|-----|--------------|
| Job list (open) | `jobs:status:open:page:{cursor}` | 1 min | On new job created |
| Job details | `jobs:id:{id}` | 5 min | On job updated |
| User profile | `users:id:{id}` | 10 min | On profile updated |
| Reputation | `reputation:user:{id}` | 30 min | On new rating |
| Statistics | `stats:global` | 5 min | On job status change |
| Top jobs | `jobs:top:10` | 30 sec | On new application |

**Cache Invalidation:**

```typescript
// Pattern-based invalidation
async invalidateJobCaches(jobId: string) {
  const patterns = [
    `jobs:id:${jobId}`,
    `jobs:status:*`,
    `jobs:top:*`,
    `stats:global`,
  ];
  
  for (const pattern of patterns) {
    await this.cacheManager.del(pattern);
  }
}
```

---

### 6. WebSocket Gateway

**Purpose**: Real-time bidirectional communication

**Architecture:**

```typescript
// Server-side (NestJS)
@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class JobsGateway {
  @WebSocketServer()
  server: Server;
  
  // Client subscribes to job updates
  @SubscribeMessage('subscribe:job')
  handleSubscribeJob(client: Socket, jobId: string) {
    client.join(`job:${jobId}`);
  }
  
  // Server emits job update to all subscribers
  emitJobUpdate(jobId: string, data: any) {
    this.server.to(`job:${jobId}`).emit('job:updated', data);
  }
}
```

**Event Types:**

| Event | Direction | Description |
|-------|-----------|-------------|
| `subscribe:job` | Client→Server | Subscribe to job updates |
| `subscribe:status` | Client→Server | Subscribe to jobs by status |
| `job:created` | Server→Client | New job posted |
| `job:updated` | Server→Client | Job details changed |
| `job:status:changed` | Server→Client | Job status changed |
| `escrow:funded` | Server→Client | Escrow funded |
| `escrow:released` | Server→Client | Payment released |
| `application:new` | Server→Client | New application received |

**Room Structure:**

```
job:{jobId}               - Specific job updates
status:{status}           - All jobs with status (open, assigned, etc.)
category:{category}       - All jobs in category
user:{userId}:apps        - User's application updates
employer:{userId}:jobs    - Employer's job updates
```

---

## Data Flow

### Job Creation Flow

```
┌─────────┐
│ Employer│
│  (User) │
└────┬────┘
     │ 1. Click "Post Job"
     ▼
┌─────────────┐
│   React     │
│  Component  │
└────┬────────┘
     │ 2. Fill form, submit
     ▼
┌─────────────┐
│  API POST   │
│ /jobs       │
└────┬────────┘
     │ 3. Create job record
     ▼
┌─────────────┐
│  Database   │
│  (INSERT)   │
└────┬────────┘
     │ 4. Job saved, return ID
     ▼
┌─────────────┐
│  Backend    │
│  Response   │
└────┬────────┘
     │ 5. Initiate blockchain tx
     ▼
┌─────────────┐
│  Frontend   │
│ TON Connect │
└────┬────────┘
     │ 6. User signs in wallet
     ▼
┌─────────────┐
│   Wallet    │
│   (Sign)    │
└────┬────────┘
     │ 7. Broadcast to blockchain
     ▼
┌─────────────┐
│     TON     │
│ Blockchain  │
└────┬────────┘
     │ 8. Smart contract processes
     ▼
┌─────────────┐
│JobRegistry  │
│  Contract   │
└────┬────────┘
     │ 9. Job registered, emit event
     ▼
┌─────────────┐
│  Backend    │
│ Event       │
│ Listener    │
└────┬────────┘
     │ 10. Update DB with blockchain ID
     ▼
┌─────────────┐
│  Database   │
│  (UPDATE)   │
└────┬────────┘
     │ 11. Invalidate caches
     ▼
┌─────────────┐
│   Redis     │
│  (DEL)      │
└────┬────────┘
     │ 12. Broadcast via WebSocket
     ▼
┌─────────────┐
│  WebSocket  │
│  Gateway    │
└────┬────────┘
     │ 13. Emit to all clients
     ▼
┌─────────────┐
│  All Users  │
│  (Update)   │
└─────────────┘
```

### Payment Flow

```
Job Completed
     │
     ▼
Employer clicks "Release Payment"
     │
     ▼
Frontend initiates release transaction
     │
     ▼
TON Connect requests wallet signature
     │
     ▼
User approves in wallet
     │
     ▼
Transaction broadcast to blockchain
     │
     ▼
Escrow contract validates
     │
     ├─ Check job completed ✅
     ├─ Verify employer is sender ✅
     └─ Deadline not passed ✅
     │
     ▼
Calculate amounts:
 - Worker receives: amount - fee
 - Platform receives: fee (2.5%)
     │
     ▼
Send payments
 ├─ Transfer to worker
 └─ Transfer to platform
     │
     ▼
Update escrow state to "released"
     │
     ▼
Emit event: escrow_released
     │
     ▼
Backend listener catches event
     │
     ▼
Update database
 ├─ Escrow status = released
 ├─ Job status = paid
 └─ User earnings += amount
     │
     ▼
Invalidate caches
     │
     ▼
WebSocket notification
 ├─ Notify worker: "Payment received!"
 └─ Notify employer: "Payment sent"
     │
     ▼
Frontend updates UI
 ├─ Show success message
 └─ Update balances
```

---

## Technology Stack

### Frontend
- **Framework**: React 19.2.0
- **Language**: JavaScript (ES2022)
- **Styling**: Tailwind CSS 3.4.1
- **Build**: Create React App
- **State**: React Context + Hooks
- **Routing**: React Router 6.x

**Key Libraries:**
- `@tonconnect/ui-react` - TON wallet integration
- `socket.io-client` - Real-time updates
- `axios` - HTTP client
- `react-query` - Data fetching (optional)

### Backend
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Runtime**: Node.js 18.x LTS
- **API**: RESTful + WebSocket
- **ORM**: TypeORM 0.3.x

**Key Libraries:**
- `@nestjs/websockets` - WebSocket support
- `@nestjs/platform-socket.io` - Socket.io integration
- `@nestjs/cache-manager` - Caching
- `cache-manager-redis-yet` - Redis cache store
- `@ton/ton` - TON blockchain client
- `class-validator` - DTO validation
- `passport-jwt` - Authentication

### Smart Contracts
- **Language**: FunC
- **Tools**: Blueprint, TON Sandbox
- **Testing**: Jest + TON Sandbox
- **Deployment**: Blueprint CLI

### Database
- **Primary**: PostgreSQL 15.x
- **Cache**: Redis 7.x
- **Search**: PostgreSQL full-text (GIN indexes)
- **Migration**: TypeORM migrations

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (production)
- **Reverse Proxy**: Nginx
- **Load Balancer**: Nginx / Cloud provider
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + Elasticsearch (ELK stack)

### Blockchain
- **Network**: TON Mainnet
- **Wallet Support**: TON Connect 2.0
- **Explorer**: tonscan.org
- **RPC**: TON HTTP API

---

## Security Architecture

### Authentication Flow

```
User opens app in Telegram
     │
     ▼
Telegram passes init data (signed)
     │
     ▼
Frontend sends to /auth/telegram
     │
     ▼
Backend validates signature
 ├─ Verify hash with bot token
 ├─ Check timestamp (<5 min old)
 └─ Validate user data
     │
     ▼
Create/update user in database
     │
     ▼
Generate JWT token
 - Payload: { userId, telegramId, walletAddress }
 - Expiry: 30 days
 - Secret: ENV variable
     │
     ▼
Return { token, user }
     │
     ▼
Frontend stores token
 - localStorage: token
 - Context: user data
     │
     ▼
All API requests include:
 - Header: Authorization: Bearer {token}
```

### Authorization Layers

**Layer 1: JWT Validation**
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@User() user) {
  return user;
}
```

**Layer 2: Ownership Check**
```typescript
@UseGuards(JwtAuthGuard, JobOwnerGuard)
@Patch('jobs/:id')
async updateJob(@Param('id') id, @Body() dto) {
  // Only job owner can update
}
```

**Layer 3: Blockchain Verification**
```typescript
// Verify wallet signature for critical actions
async verifyWalletSignature(
  message: string,
  signature: string,
  publicKey: string,
) {
  return nacl.sign.detached.verify(
    Buffer.from(message),
    Buffer.from(signature, 'hex'),
    Buffer.from(publicKey, 'hex'),
  );
}
```

### Smart Contract Security

**Access Control:**
```func
() check_employer(slice sender, int job_id) impure {
  var (employer, ...) = load_job(job_id);
  throw_unless(error::unauthorized, equal_slice_bits(sender, employer));
}
```

**Reentrancy Protection:**
```func
() release_payment(...) impure {
  // Update state BEFORE sending funds
  storage::escrow_state = state::released;
  save_storage();
  
  // Then send payments (can't re-enter)
  send_raw_message(payment_msg, mode::normal);
}
```

**Input Validation:**
```func
() validate_amount(int amount) impure {
  throw_unless(error::invalid_amount, amount > 0);
  throw_unless(error::amount_too_low, amount >= min_escrow_amount);
  throw_unless(error::amount_too_high, amount <= max_escrow_amount);
}
```

---

## Scalability Design

### Horizontal Scaling

**Backend API Servers:**
```yaml
# Kubernetes deployment
replicas: 3  # Can scale to 10+
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 2Gi

autoscaling:
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

**Database Scaling:**
```
┌─────────────┐
│  Primary    │ ◄─── Writes
│ (Master)    │
└──────┬──────┘
       │ Replication
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌──────────┐      ┌──────────┐      ┌──────────┐
│ Replica 1│      │ Replica 2│      │ Replica 3│ ◄─── Reads
│ (Read)   │      │ (Read)   │      │ (Read)   │
└──────────┘      └──────────┘      └──────────┘
```

**Redis Cluster:**
```
Master 1 (Shards 1-5333)
  └─ Replica 1a
  └─ Replica 1b

Master 2 (Shards 5334-10666)
  └─ Replica 2a
  └─ Replica 2b

Master 3 (Shards 10667-16384)
  └─ Replica 3a
  └─ Replica 3b
```

### Performance Optimizations

**Database:**
- Connection pooling (max 20 connections per instance)
- Query optimization with EXPLAIN ANALYZE
- Indexes on frequently queried columns
- Partial indexes for filtered queries
- Materialized views for complex aggregations

**Caching:**
- Multi-level (L1: memory, L2: Redis)
- Cache-aside pattern
- TTL-based expiration
- Pattern-based invalidation
- Cache warming on startup

**API:**
- Response compression (gzip)
- Request rate limiting (100 req/min per user)
- Pagination (cursor-based)
- Field selection (GraphQL-style)
- CDN for static assets

**WebSocket:**
- Connection pooling
- Message throttling (10/sec per user)
- Room-based subscriptions
- Horizontal scaling with Redis adapter

---

## Next Steps

- **[API Reference](./api-reference.md)** - Detailed endpoint documentation
- **[Smart Contracts](./smart-contracts.md)** - Contract specifications
- **[Getting Started](./getting-started.md)** - Set up development environment
- **[Testing Guide](./testing.md)** - Write and run tests

---

*Last updated: November 23, 2025 • [Suggest improvements](https://github.com/yuvrajsharmaaa/WajoB/issues)*
