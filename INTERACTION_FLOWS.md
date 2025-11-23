# 🔄 WajoB - End-to-End Interaction Flows

## Overview

This document defines detailed interaction flows for the WajoB Telegram Mini App integrated with TON blockchain smart contracts. Each flow includes sequence diagrams, API contracts, message schemas, and error handling patterns.

## Architecture Components

```
┌─────────────────────┐
│  Telegram Mini App  │  (React Frontend)
│  (User Interface)   │
└──────────┬──────────┘
           │
           ├──TON Connect───► TON Wallet (Transaction Signing)
           │
           ├──REST API──────► NestJS Backend
           │                  └─► PostgreSQL (Off-chain Data)
           │                  └─► Redis (Caching + Queues)
           │                  └─► Blockchain Indexer
           │
           └──Telegram Bot──► Push Notifications

┌─────────────────────┐
│  TON Blockchain     │
│  ├─► JobRegistry    │
│  ├─► Escrow         │
│  └─► Reputation     │
└─────────────────────┘
```

---

## Flow 1: Job Posting

### Sequence Diagram

```
User          Mini App       TON Connect    JobRegistry    Backend       Telegram Bot
 │                │               │              │            │                │
 │ 1. Open App   │               │              │            │                │
 │──────────────►│               │              │            │                │
 │               │ 2. Connect Wallet            │            │                │
 │               │──────────────►│              │            │                │
 │               │◄──────────────│              │            │                │
 │               │ (wallet connected)           │            │                │
 │               │               │              │            │                │
 │ 3. Fill Job Form             │              │            │                │
 │──────────────►│               │              │            │                │
 │               │ 4. Save metadata (off-chain) │            │                │
 │               │───────────────────────────────────────────►│                │
 │               │◄──────────────────────────────────────────│                │
 │               │ (jobData with temp ID)       │            │                │
 │               │               │              │            │                │
 │               │ 5. Prepare TX (create_job)   │            │                │
 │               │──────────────►│              │            │                │
 │               │               │ 6. User signs TX          │                │
 │               │               │──────────────►│            │                │
 │               │               │◄──────────────│            │                │
 │               │               │ 7. Submit TX  │            │                │
 │               │               │──────────────►│            │                │
 │               │◄──────────────│              │            │                │
 │               │ (TX hash)     │              │            │                │
 │               │               │              │            │                │
 │               │ 8. Update UI (pending)       │            │                │
 │◄──────────────│               │              │            │                │
 │ (Job posting...) │            │              │            │                │
 │               │               │              │ 9. Index TX│                │
 │               │               │              │◄───────────│                │
 │               │               │              │ 10. Confirm│                │
 │               │◄──────────────────────────────────────────│                │
 │               │ (blockchain ID)              │            │                │
 │               │               │              │            │ 11. Send notification
 │               │               │              │            │───────────────►│
 │◄──────────────────────────────────────────────────────────────────────────│
 │ "✅ Job posted! ID: 12345"   │              │            │                │
```

### API Contracts

#### 1. Save Job Metadata (Off-chain)
```typescript
POST /api/v1/jobs

Request:
{
  "title": "Security Guard Needed",
  "description": "Night shift security for warehouse",
  "location": "Mumbai, Andheri West",
  "wages": "800",  // TON amount
  "duration": "8",  // hours
  "category": "Security",
  "employerId": "uuid-employer",
  "startDate": "2025-11-24T18:00:00Z",
  "requirements": ["Experience: 2 years", "Age: 25-45"]
}

Response (201):
{
  "id": "temp-uuid-12345",
  "status": "draft",
  "createdAt": "2025-11-23T10:00:00Z",
  "...rest of job data"
}
```

#### 2. TON Connect Transaction Message
```typescript
// Frontend prepares transaction
const transaction = {
  validUntil: Date.now() + 5 * 60 * 1000, // 5 minutes
  messages: [
    {
      address: JOB_REGISTRY_ADDRESS,
      amount: "100000000", // 0.1 TON gas fee
      payload: beginCell()
        .storeUint(0x7362d09c, 32) // create_job op code
        .storeUint(tempJobId, 64)
        .storeRef(
          beginCell()
            .storeStringTail(title)
            .storeStringTail(description)
            .storeCoins(wages)
            .storeUint(duration, 32)
            .endCell()
        )
        .endCell()
        .toBoc()
        .toString('base64')
    }
  ]
};

// Send via TON Connect
await tonConnectUI.sendTransaction(transaction);
```

#### 3. Update Job with Blockchain ID
```typescript
PATCH /api/v1/jobs/:tempId/confirm

Request:
{
  "transactionHash": "0xabc123...",
  "blockchainId": 12345
}

Response (200):
{
  "id": "uuid-12345",
  "blockchainId": 12345,
  "status": "posted",
  "transactionHash": "0xabc123...",
  "...rest of job data"
}
```

### Message Schemas

#### Blockchain Event: Job Created
```typescript
// Detected by IndexerService
{
  "event": "job_created",
  "transactionHash": "0xabc123...",
  "blockNumber": 45678901,
  "contract": "EQDfAs6HiTDdvi6XMsHJuBXncUCFRNz9V5nen09cQG_6ML3s",
  "data": {
    "jobId": 12345,
    "employer": "EQA1B2C3...",
    "timestamp": 1700654321
  }
}
```

#### Telegram Notification
```typescript
{
  "telegramId": 123456789,
  "type": "JOB_POSTED",
  "title": "Job Posted Successfully",
  "message": "✅ Your job has been posted on the blockchain!\n\nJob ID: 12345\nTransaction: 0xabc123...",
  "data": {
    "jobId": 12345,
    "transactionHash": "0xabc123..."
  }
}
```

### Error Handling

```typescript
// Transaction Failed
{
  "error": "TRANSACTION_FAILED",
  "code": 4001,
  "message": "User rejected transaction",
  "action": "RETRY",
  "ui": "Show error toast, keep form data"
}

// Insufficient Funds
{
  "error": "INSUFFICIENT_FUNDS",
  "code": 4002,
  "message": "Insufficient TON balance for gas fees",
  "action": "TOP_UP",
  "ui": "Show balance warning, suggest adding funds"
}

// Backend Error
{
  "error": "SERVER_ERROR",
  "code": 500,
  "message": "Failed to save job metadata",
  "action": "RETRY",
  "ui": "Show retry button"
}
```

### Retry & Rollback Strategy

```typescript
// Frontend retry logic
async function postJob(jobData) {
  let tempId;
  
  try {
    // Step 1: Save metadata (idempotent with tempId)
    const { id } = await api.post('/jobs', jobData);
    tempId = id;
    
    // Step 2: Blockchain transaction
    const { boc } = await tonConnectUI.sendTransaction(txMessage);
    
    // Step 3: Confirm (retry with exponential backoff)
    await retryWithBackoff(() => 
      api.patch(`/jobs/${tempId}/confirm`, { 
        transactionHash: boc 
      })
    );
    
    return { success: true, jobId: tempId };
    
  } catch (error) {
    // Rollback: Delete draft job
    if (tempId) {
      await api.delete(`/jobs/${tempId}`);
    }
    throw error;
  }
}

// Exponential backoff helper
async function retryWithBackoff(fn, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // 1s, 2s, 4s, 8s, 16s
    }
  }
}
```

---

## Flow 2: Job Acceptance & Escrow Payment

### Sequence Diagram

```
Worker        Mini App       Backend       JobRegistry    Escrow       Telegram Bot
 │                │             │              │            │                │
 │ 1. Browse Jobs │             │              │            │                │
 │──────────────►│             │              │            │                │
 │               │ 2. Load jobs (cached)       │            │                │
 │               │────────────►│              │            │                │
 │               │◄────────────│              │            │                │
 │               │ (job list)  │              │            │                │
 │               │             │              │            │                │
 │ 3. Apply for Job            │              │            │                │
 │──────────────►│             │              │            │                │
 │               │ 4. Update job (assign worker)           │                │
 │               │────────────►│              │            │                │
 │               │             │ 5. TX: assign_worker      │                │
 │               │             │─────────────►│            │                │
 │               │             │◄─────────────│            │                │
 │               │◄────────────│              │            │                │
 │               │             │              │            │ 6. Notify both │
 │◄──────────────────────────────────────────────────────────────────────────
 │ "✅ Assigned to job #12345" │              │            │                │
 │               │             │              │            │                │
 │               │             │              │            │                │
Employer      Mini App       Backend       Escrow       Worker      Telegram Bot
 │                │             │             │            │                │
 │ 7. Fund Escrow │             │             │            │                │
 │──────────────►│             │             │            │                │
 │               │ 8. Create escrow (backend) │            │                │
 │               │────────────►│             │            │                │
 │               │◄────────────│             │            │                │
 │               │             │             │            │                │
 │               │ 9. TX: fund_escrow         │            │                │
 │               │─────────────────────────────────────►│            │                │
 │               │◄────────────────────────────────────│            │                │
 │               │             │             │            │                │
 │               │             │ 10. Index escrow funding │                │
 │               │             │◄────────────│            │                │
 │               │             │             │            │ 11. Notify    │
 │               │             │             │            │───────────────►│
 │◄──────────────────────────────────────────────────────────────────────────
 │ "💰 Escrow funded: 800 TON"│             │            │                │
 │               │             │             │            │                │
 │               │             │             │            │◄───────────────│
 │               │             │             │            │ "✅ Payment secured"
```

### API Contracts

#### 1. Apply for Job
```typescript
POST /api/v1/jobs/:jobId/apply

Request:
{
  "workerId": "worker-uuid",
  "message": "I have 3 years experience...",
  "walletAddress": "EQXYZ..."
}

Response (200):
{
  "jobId": "uuid-123",
  "workerId": "worker-uuid",
  "status": "in_progress",
  "message": "Application submitted. Waiting for blockchain confirmation."
}
```

#### 2. Create Escrow
```typescript
POST /api/v1/escrow

Request:
{
  "jobId": "uuid-123",
  "employerId": "employer-uuid",
  "workerId": "worker-uuid",
  "amount": "800"
}

Response (201):
{
  "id": "escrow-uuid",
  "jobId": "uuid-123",
  "status": "created",
  "amount": "800",
  "blockchainId": null  // Will be set after TX confirmation
}
```

#### 3. Fund Escrow Transaction
```typescript
// Frontend prepares transaction
const fundEscrowTx = {
  validUntil: Date.now() + 5 * 60 * 1000,
  messages: [
    {
      address: ESCROW_ADDRESS,
      amount: toNano(amount + gas), // 800 + 0.1 TON
      payload: beginCell()
        .storeUint(0x2fcb26a8, 32) // fund_escrow op code
        .storeUint(jobId, 64)
        .storeAddress(workerAddress)
        .endCell()
        .toBoc()
        .toString('base64')
    }
  ]
};

await tonConnectUI.sendTransaction(fundEscrowTx);
```

#### 4. Get Escrow Status
```typescript
GET /api/v1/escrow/job/:jobId

Response (200):
{
  "id": "escrow-uuid",
  "jobId": "uuid-123",
  "status": "funded",  // created | funded | locked | completed
  "amount": "800",
  "fundedAt": "2025-11-23T12:00:00Z",
  "employer": { "id": "...", "walletAddress": "EQ..." },
  "worker": { "id": "...", "walletAddress": "EQ..." }
}
```

### Message Schemas

#### Worker Assignment Event
```typescript
{
  "event": "worker_assigned",
  "transactionHash": "0xdef456...",
  "data": {
    "jobId": 12345,
    "workerAddress": "EQXYZ...",
    "timestamp": 1700654400
  }
}
```

#### Escrow Funding Event
```typescript
{
  "event": "escrow_funded",
  "transactionHash": "0xghi789...",
  "data": {
    "jobId": 12345,
    "amount": "800000000000", // nanoton
    "employerAddress": "EQABC...",
    "workerAddress": "EQXYZ...",
    "timestamp": 1700654500
  }
}
```

### Error Handling

```typescript
// Worker Already Assigned
{
  "error": "WORKER_ALREADY_ASSIGNED",
  "code": 4003,
  "message": "This job already has a worker assigned",
  "ui": "Show error, redirect to job list"
}

// Escrow Already Funded
{
  "error": "ESCROW_ALREADY_FUNDED",
  "code": 4004,
  "message": "Escrow for this job is already funded",
  "ui": "Refresh escrow status, show current state"
}

// Amount Mismatch
{
  "error": "AMOUNT_MISMATCH",
  "code": 4005,
  "message": "Transaction amount doesn't match job wages",
  "expected": "800",
  "received": "750",
  "ui": "Show error, suggest correct amount"
}
```

---

## Flow 3: Wallet Connection & Transaction Signing

### Sequence Diagram

```
User         Mini App      TON Connect    TON Wallet     Backend
 │               │              │             │            │
 │ 1. Click "Connect"          │             │            │
 │──────────────►│              │             │            │
 │               │ 2. Request connection      │            │
 │               │─────────────►│             │            │
 │               │              │ 3. Show QR/Deep link    │
 │               │              │────────────►│            │
 │               │              │             │ 4. User approves
 │               │              │◄────────────│            │
 │               │◄─────────────│             │            │
 │               │ (wallet info)│             │            │
 │               │              │             │            │
 │               │ 5. Save wallet address     │            │
 │               │────────────────────────────────────────►│
 │               │◄───────────────────────────────────────│
 │◄──────────────│              │             │            │
 │ (Connected: EQ...) │         │             │            │
 │               │              │             │            │
 │ 6. Sign TX   │              │             │            │
 │──────────────►│              │             │            │
 │               │ 7. Prepare TX message      │            │
 │               │─────────────►│             │            │
 │               │              │ 8. Request signature     │
 │               │              │────────────►│            │
 │               │              │             │ 9. Show TX details
 │               │              │             │    User confirms
 │               │              │◄────────────│            │
 │               │◄─────────────│             │            │
 │               │ (signed BOC) │             │            │
 │               │              │             │            │
 │               │ 10. Broadcast TX           │            │
 │               │─────────────►│             │            │
 │               │◄─────────────│             │            │
 │               │ (TX hash)    │             │            │
 │               │              │             │            │
 │               │ 11. Monitor TX status      │            │
 │               │────────────────────────────────────────►│
 │               │◄───────────────────────────────────────│
 │               │ (status updates)           │            │
 │               │              │             │            │
 │◄──────────────│              │             │            │
 │ "✅ Transaction confirmed"  │             │            │
```

### API Contracts

#### 1. Link Wallet to Telegram
```typescript
POST /api/v1/auth/link-wallet

Request:
{
  "telegramId": 123456789,
  "walletAddress": "EQABC123...",
  "publicKey": "0xpubkey...",
  "proof": {
    "timestamp": 1700654321,
    "domain": "wagob.com",
    "signature": "0xsig..."
  }
}

Response (200):
{
  "userId": "uuid-456",
  "walletAddress": "EQABC123...",
  "telegramId": 123456789,
  "linked": true,
  "token": "jwt-token..."
}
```

#### 2. Transaction Status Tracking
```typescript
GET /api/v1/transactions/:hash/status

Response (200):
{
  "hash": "0xabc123...",
  "status": "confirmed",  // pending | confirmed | failed
  "blockNumber": 45678901,
  "confirmations": 3,
  "gasUsed": "0.05",
  "timestamp": "2025-11-23T10:05:00Z",
  "error": null
}
```

#### 3. Get Transaction History
```typescript
GET /api/v1/users/:userId/transactions?limit=20&offset=0

Response (200):
{
  "transactions": [
    {
      "hash": "0xabc123...",
      "type": "create_job",
      "status": "confirmed",
      "amount": "0.1",
      "timestamp": "2025-11-23T10:00:00Z",
      "relatedEntity": {
        "type": "job",
        "id": "uuid-123",
        "title": "Security Guard Needed"
      }
    },
    // ... more transactions
  ],
  "total": 45,
  "hasMore": true
}
```

### Message Schemas

#### TON Connect Connection Payload
```typescript
{
  "manifestUrl": "https://wagob.com/tonconnect-manifest.json",
  "items": [
    {
      "name": "ton_addr"
    },
    {
      "name": "ton_proof",
      "payload": "wagob-auth-payload-1700654321"
    }
  ]
}
```

#### Transaction Broadcast Result
```typescript
{
  "hash": "0xabc123...",
  "status": "pending",
  "message": {
    "address": "EQDfAs6...",
    "amount": "100000000",
    "payload": "te6cc...",
    "stateInit": null
  },
  "estimatedConfirmation": 30000  // milliseconds
}
```

### Error Handling

```typescript
// User Rejected Connection
{
  "error": "CONNECTION_REJECTED",
  "code": 4100,
  "message": "User rejected wallet connection",
  "ui": "Show info: Connection required to use app"
}

// User Rejected Transaction
{
  "error": "TRANSACTION_REJECTED",
  "code": 4101,
  "message": "User rejected transaction signature",
  "ui": "Show info: Transaction cancelled"
}

// Invalid Signature
{
  "error": "INVALID_SIGNATURE",
  "code": 4102,
  "message": "Transaction signature verification failed",
  "ui": "Ask user to reconnect wallet"
}

// Transaction Timeout
{
  "error": "TRANSACTION_TIMEOUT",
  "code": 4103,
  "message": "Transaction not confirmed within 5 minutes",
  "ui": "Show retry option or check status manually"
}
```

### Transaction Lifecycle States

```typescript
enum TransactionStatus {
  PREPARING = 'preparing',     // Building TX message
  SIGNING = 'signing',          // Waiting for user signature
  BROADCASTING = 'broadcasting', // Sending to network
  PENDING = 'pending',          // In mempool
  CONFIRMING = 'confirming',    // In block, waiting for confirmations
  CONFIRMED = 'confirmed',      // 3+ confirmations
  FAILED = 'failed'             // Error occurred
}

// Frontend state machine
class TransactionStateMachine {
  async execute(transaction) {
    try {
      this.setState(TransactionStatus.PREPARING);
      const message = await this.prepareMessage(transaction);
      
      this.setState(TransactionStatus.SIGNING);
      const signedBoc = await tonConnectUI.sendTransaction(message);
      
      this.setState(TransactionStatus.BROADCASTING);
      const result = await this.broadcastTransaction(signedBoc);
      
      this.setState(TransactionStatus.PENDING);
      await this.waitForConfirmation(result.hash);
      
      this.setState(TransactionStatus.CONFIRMED);
      return result;
      
    } catch (error) {
      this.setState(TransactionStatus.FAILED);
      throw error;
    }
  }
  
  async waitForConfirmation(hash, maxWait = 300000) { // 5 minutes
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const status = await api.get(`/transactions/${hash}/status`);
      
      if (status.confirmations >= 3) {
        return status;
      }
      
      if (status.status === 'failed') {
        throw new Error(status.error);
      }
      
      this.setState(TransactionStatus.CONFIRMING, {
        confirmations: status.confirmations
      });
      
      await sleep(5000); // Check every 5 seconds
    }
    
    throw new Error('TRANSACTION_TIMEOUT');
  }
}
```

---

## Flow 4: Reputation Submission & Retrieval

### Sequence Diagram

```
User         Mini App       Backend       Reputation     Telegram Bot
 │               │             │              │                │
 │ 1. Complete Job            │              │                │
 │◄──────────────────────────────────────────────────────────│
 │ "✅ Job completed! Please rate"           │                │
 │               │             │              │                │
 │ 2. Open rating form        │              │                │
 │──────────────►│             │              │                │
 │               │ 3. Get job details         │                │
 │               │────────────►│              │                │
 │               │◄────────────│              │                │
 │               │             │              │                │
 │ 4. Submit rating (1-5 stars, comment)      │                │
 │──────────────►│             │              │                │
 │               │ 5. Save rating (backend)   │                │
 │               │────────────►│              │                │
 │               │◄────────────│              │                │
 │               │             │              │                │
 │               │ 6. TX: submit_rating       │                │
 │               │─────────────────────────────────────►│                │
 │               │◄────────────────────────────────────│                │
 │               │             │              │                │
 │               │             │ 7. Index reputation event    │
 │               │             │◄─────────────│                │
 │               │             │              │                │
 │               │             │ 8. Update user score         │
 │               │             │              │                │
 │               │             │              │ 9. Notify     │
 │               │             │              │───────────────►│
 │               │             │              │◄───────────────│
 │               │             │              │                │
Ratee        Mini App       Backend       Redis Cache
 │               │             │              │
 │◄──────────────────────────────────────────────────────────│
 │ "⭐ New rating: 4.5/5"     │              │
 │               │             │              │
 │ 10. View reputation        │              │
 │──────────────►│             │              │
 │               │ 11. Get reputation (cached)│
 │               │────────────►│──────────────►│
 │               │             │◄─────────────│
 │               │◄────────────│              │
 │◄──────────────│             │              │
 │ (reputation profile)        │              │
```

### API Contracts

#### 1. Submit Rating
```typescript
POST /api/v1/reputation

Request:
{
  "jobId": "uuid-123",
  "raterId": "rater-uuid",
  "rateeId": "ratee-uuid",
  "rating": 4,  // 1-5
  "comment": "Excellent work ethic and punctuality!"
}

Response (201):
{
  "id": "reputation-uuid",
  "jobId": "uuid-123",
  "rating": 4,
  "comment": "Excellent work ethic...",
  "blockchainId": null,  // Set after confirmation
  "createdAt": "2025-11-23T15:00:00Z"
}
```

#### 2. Submit Rating to Blockchain
```typescript
// Frontend prepares transaction
const submitRatingTx = {
  validUntil: Date.now() + 5 * 60 * 1000,
  messages: [
    {
      address: REPUTATION_ADDRESS,
      amount: "50000000", // 0.05 TON gas
      payload: beginCell()
        .storeUint(0x9e6f2a84, 32) // submit_rating op code
        .storeUint(jobId, 64)
        .storeUint(rating, 8)  // 1-5
        .storeAddress(rateeAddress)
        .endCell()
        .toBoc()
        .toString('base64')
    }
  ]
};

await tonConnectUI.sendTransaction(submitRatingTx);
```

#### 3. Get User Reputation
```typescript
GET /api/v1/reputation/user/:userId

Response (200):
{
  "userId": "uuid-456",
  "averageScore": 4.5,
  "totalRatings": 23,
  "ratings": [
    {
      "id": "rep-uuid-1",
      "rating": 5,
      "comment": "Outstanding work!",
      "rater": {
        "id": "rater-uuid",
        "firstName": "Rajesh",
        "reputationScore": 4.8
      },
      "job": {
        "id": "job-uuid",
        "title": "Security Guard",
        "completedAt": "2025-11-20T18:00:00Z"
      },
      "createdAt": "2025-11-20T18:30:00Z"
    },
    // ... more ratings
  ],
  "distribution": {
    "5": 15,  // 15 five-star ratings
    "4": 6,
    "3": 2,
    "2": 0,
    "1": 0
  }
}
```

#### 4. Get On-Chain Reputation (Direct Query)
```typescript
GET /api/v1/reputation/blockchain/:walletAddress

Response (200):
{
  "walletAddress": "EQABC123...",
  "onChainScore": 4.5,
  "totalOnChainRatings": 20,
  "lastUpdated": "2025-11-23T15:00:00Z",
  "contractAddress": "EQCSGYJ0...",
  "isVerified": true
}
```

### Message Schemas

#### Reputation Submission Event
```typescript
{
  "event": "reputation_submitted",
  "transactionHash": "0xjkl012...",
  "data": {
    "jobId": 12345,
    "rating": 4,
    "raterAddress": "EQABC...",
    "rateeAddress": "EQXYZ...",
    "timestamp": 1700670000
  }
}
```

#### User Score Update Notification
```typescript
{
  "telegramId": 987654321,
  "type": "REPUTATION_RECEIVED",
  "title": "New Rating Received",
  "message": "⭐ You received a new rating!\n\nRating: ⭐⭐⭐⭐ (4/5)\nJob ID: 12345\n\nNew average: 4.50/5",
  "data": {
    "jobId": 12345,
    "rating": 4,
    "averageScore": 4.5,
    "totalRatings": 23
  }
}
```

### Caching Strategy

```typescript
// ReputationService with Redis caching
class ReputationService {
  private readonly CACHE_TTL = 600000; // 10 minutes
  
  async getUserReputation(userId: string) {
    const cacheKey = `reputation:user:${userId}`;
    
    // Try cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;
    
    // Query database
    const ratings = await this.reputationRepository.find({
      where: { rateeId: userId },
      relations: ['rater', 'job'],
      order: { createdAt: 'DESC' },
    });
    
    const averageScore = this.calculateAverage(ratings);
    const distribution = this.calculateDistribution(ratings);
    
    const result = {
      userId,
      averageScore,
      totalRatings: ratings.length,
      ratings,
      distribution,
    };
    
    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    
    return result;
  }
  
  async invalidateUserCache(userId: string) {
    await this.cacheManager.del(`reputation:user:${userId}`);
    await this.cacheManager.del(`reputation:score:${userId}`);
  }
}
```

### Error Handling

```typescript
// Duplicate Rating
{
  "error": "DUPLICATE_RATING",
  "code": 4200,
  "message": "You have already rated this job",
  "ui": "Show existing rating, allow editing"
}

// Invalid Rating Value
{
  "error": "INVALID_RATING",
  "code": 4201,
  "message": "Rating must be between 1 and 5",
  "ui": "Highlight rating input, show validation"
}

// Job Not Completed
{
  "error": "JOB_NOT_COMPLETED",
  "code": 4202,
  "message": "Can only rate completed jobs",
  "ui": "Show job status, disable rating button"
}
```

---

## Technical Specifications

### Asynchronous Message Passing

```typescript
// TON Actor Model Implementation
class ContractInteraction {
  /**
   * All contract calls use asynchronous message passing
   * aligned with TON's actor model
   */
  async sendMessage(contract: string, message: Cell) {
    // Prepare external message
    const externalMessage = beginCell()
      .storeUint(0b10, 2) // ext_in_msg_info$10
      .storeUint(0, 2)    // src:MsgAddressExt
      .storeAddress(Address.parse(contract)) // dest
      .storeCoins(0)      // import_fee:Grams
      .storeBit(0)        // no state_init
      .storeBit(1)        // body as reference
      .storeRef(message)
      .endCell();
    
    // Send via lite client
    await this.tonClient.sendBoc(externalMessage.toBoc());
    
    // Return immediately (async)
    return {
      status: 'sent',
      message: 'Transaction submitted to network'
    };
  }
}
```

### Webhook & Callback Configuration

```typescript
// Backend: Telegram Webhook Setup
@Controller('telegram')
export class TelegramController {
  @Post('webhook')
  async handleWebhook(@Body() update: TelegramUpdate) {
    // Process Telegram updates asynchronously
    await this.telegramService.processUpdate(update);
    return { ok: true };
  }
}

// Blockchain Event Webhooks (Future Enhancement)
@Controller('blockchain')
export class BlockchainWebhookController {
  @Post('events')
  async handleBlockchainEvent(@Body() event: BlockchainEvent) {
    // Process blockchain events from external indexer
    await this.indexerService.processEvent(event);
    return { ok: true };
  }
}
```

### Retry Mechanisms

```typescript
// Frontend: Exponential Backoff with Jitter
class RetryHandler {
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries: number;
      baseDelay: number;
      maxDelay: number;
    } = {
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 30000
    }
  ): Promise<T> {
    let lastError;
    
    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === options.maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const exponentialDelay = Math.min(
          options.baseDelay * Math.pow(2, attempt),
          options.maxDelay
        );
        
        // Add jitter (±25%)
        const jitter = exponentialDelay * (0.75 + Math.random() * 0.5);
        
        console.log(`Retry ${attempt + 1}/${options.maxRetries} after ${jitter}ms`);
        await sleep(jitter);
      }
    }
    
    throw lastError;
  }
}

// Backend: Bull Queue Retry Configuration
BullModule.forRoot({
  redis: { host: 'localhost', port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
})
```

### Rollback Strategies

```typescript
// Saga Pattern for Multi-Step Transactions
class JobPostingSaga {
  async execute(jobData: JobData): Promise<SagaResult> {
    const compensations: (() => Promise<void>)[] = [];
    
    try {
      // Step 1: Create DB record
      const dbJob = await this.jobRepository.save(jobData);
      compensations.push(() => this.jobRepository.delete(dbJob.id));
      
      // Step 2: Upload to IPFS (if storing large data)
      const ipfsHash = await this.ipfs.upload(jobData.details);
      compensations.push(() => this.ipfs.unpin(ipfsHash));
      
      // Step 3: Submit to blockchain
      const txHash = await this.blockchain.createJob({
        ...jobData,
        metadataHash: ipfsHash
      });
      
      // Wait for confirmation
      await this.blockchain.waitForConfirmation(txHash, 60000);
      
      return { success: true, jobId: dbJob.id, txHash };
      
    } catch (error) {
      // Execute compensations in reverse order
      console.error('Saga failed, executing rollback...');
      
      for (const compensation of compensations.reverse()) {
        try {
          await compensation();
        } catch (rollbackError) {
          console.error('Rollback step failed:', rollbackError);
        }
      }
      
      throw error;
    }
  }
}
```

---

## Summary

This document provides complete interaction flows for:

1. **Job Posting**: Multi-step process with off-chain metadata storage and on-chain immutable posting
2. **Job Acceptance & Escrow**: Worker assignment and secure payment locking mechanism
3. **Wallet Connection**: TON Connect integration with proof-of-ownership and transaction signing
4. **Reputation System**: On-chain rating submission with off-chain caching for performance

All flows include:
- ✅ Detailed sequence diagrams
- ✅ Complete API contracts with request/response schemas
- ✅ TON blockchain message structures
- ✅ Error handling strategies
- ✅ Retry and rollback mechanisms
- ✅ Asynchronous message passing patterns
- ✅ Webhook/callback configurations

The system is designed for:
- **Reliability**: Automatic retries with exponential backoff
- **Data Integrity**: Saga pattern for multi-step transactions
- **Performance**: Redis caching for frequent queries
- **User Experience**: Real-time updates via Telegram notifications
- **Security**: Transaction signing in user's wallet, no private key exposure
