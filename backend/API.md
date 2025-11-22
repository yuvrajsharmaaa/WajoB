# 🌐 WajoB Backend API Documentation

## Base URL

- **Development**: `http://localhost:3001/api/v1`
- **Production**: `https://api.wagob.com/api/v1`
- **Interactive Docs**: `http://localhost:3001/api/v1/docs`

## Authentication

All protected endpoints require JWT token in header:

```http
Authorization: Bearer <your_jwt_token>
```

### Get Token

```http
POST /auth/login
Content-Type: application/json

{
  "telegramId": 123456789,
  "walletAddress": "EQD..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 👤 Users API

### List All Users

```http
GET /users
```

**Response:**
```json
[
  {
    "id": "uuid-here",
    "telegramId": 123456789,
    "telegramUsername": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "walletAddress": "EQD...",
    "role": "worker",
    "reputationScore": 4.5,
    "totalRatings": 10,
    "jobsCompleted": 15,
    "jobsPosted": 5,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get User Profile

```http
GET /users/:id
```

### Create User

```http
POST /users
Content-Type: application/json

{
  "telegramId": 123456789,
  "telegramUsername": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "walletAddress": "EQD...",
  "role": "worker"
}
```

### Update User

```http
PUT /users/:id
Content-Type: application/json

{
  "bio": "Experienced security guard with 10 years experience",
  "phoneNumber": "+1234567890"
}
```

---

## 💼 Jobs API

### List All Jobs

```http
GET /jobs?status=posted&category=security&limit=20&offset=0
```

**Query Parameters:**
- `status`: `posted`, `assigned`, `in_progress`, `completed`, `cancelled`, `disputed`
- `category`: `security`, `watchman`, `gate_security`, `night_guard`, `patrol`, `other`
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": "uuid-here",
    "blockchainId": 1,
    "title": "Night Security Guard Needed",
    "description": "Need experienced guard for warehouse",
    "location": "Downtown Mumbai",
    "wages": "50.0",
    "duration": 8,
    "category": "night_guard",
    "status": "posted",
    "employer": {
      "id": "uuid",
      "firstName": "Employer",
      "reputationScore": 4.8
    },
    "worker": null,
    "escrow": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Job Details

```http
GET /jobs/:id
```

### Create Job

```http
POST /jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Night Security Guard Needed",
  "description": "Need experienced guard for warehouse security",
  "location": "Downtown Mumbai",
  "wages": 50.0,
  "duration": 8,
  "category": "night_guard",
  "employerId": "uuid-employer-id",
  "blockchainId": 123,
  "transactionHash": "abc123..."
}
```

### Update Job Status

```http
PUT /jobs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "assigned",
  "workerId": "uuid-worker-id"
}
```

---

## 💰 Escrow API

### List All Escrows

```http
GET /escrow?status=funded&limit=20
```

**Query Parameters:**
- `status`: `created`, `funded`, `locked`, `completed`, `refunded`, `disputed`, `resolved`
- `limit`: Number of results
- `offset`: Pagination offset

**Response:**
```json
[
  {
    "id": "uuid-here",
    "blockchainId": 1,
    "jobId": "job-uuid",
    "amount": "50.0",
    "status": "funded",
    "employerConfirmed": false,
    "workerConfirmed": false,
    "isDisputed": false,
    "job": {
      "id": "uuid",
      "title": "Night Guard",
      "status": "assigned"
    },
    "employer": {
      "id": "uuid",
      "firstName": "Employer"
    },
    "worker": {
      "id": "uuid",
      "firstName": "Worker"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Escrow Details

```http
GET /escrow/:id
```

### Create Escrow

```http
POST /escrow
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobId": "job-uuid",
  "employerId": "employer-uuid",
  "workerId": "worker-uuid",
  "amount": 50.0,
  "blockchainId": 123,
  "transactionHash": "abc123..."
}
```

### Update Escrow

```http
PUT /escrow/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "locked",
  "employerConfirmed": true
}
```

---

## ⭐ Reputation API

### List All Ratings

```http
GET /reputation?limit=50
```

**Response:**
```json
[
  {
    "id": "uuid-here",
    "blockchainId": 1,
    "jobId": "job-uuid",
    "rating": 5,
    "comment": "Excellent work, very professional!",
    "rater": {
      "id": "uuid",
      "firstName": "Employer"
    },
    "ratee": {
      "id": "uuid",
      "firstName": "Worker"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get User Reputation History

```http
GET /reputation/user/:userId
```

### Submit Rating

```http
POST /reputation
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobId": "job-uuid",
  "raterId": "rater-uuid",
  "rateeId": "ratee-uuid",
  "rating": 5,
  "comment": "Great work!",
  "blockchainId": 123,
  "transactionHash": "abc123..."
}
```

---

## 🤖 Telegram Webhook

### Receive Telegram Updates

```http
POST /telegram/webhook
Content-Type: application/json

{
  "update_id": 123456,
  "message": {
    "message_id": 1,
    "from": {
      "id": 123456789,
      "first_name": "John",
      "username": "johndoe"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    },
    "date": 1234567890,
    "text": "/start"
  }
}
```

**Note**: This endpoint is called automatically by Telegram. No manual calls needed.

---

## 🔄 Blockchain Sync

### Manual Sync Trigger

```http
POST /blockchain/sync
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Blockchain sync triggered"
}
```

### Get Indexer Status

```http
GET /blockchain/status
```

**Response:**
```json
{
  "isIndexing": false,
  "lastIndexedBlock": 12345,
  "network": "testnet"
}
```

---

## 📊 Health Check

### Server Health

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "redis": "connected",
  "blockchain": "synced"
}
```

---

## 🚨 Error Responses

### Standard Error Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "walletAddress",
      "message": "walletAddress must be a valid TON address"
    }
  ]
}
```

### Common Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## 🔔 Notification Events

The backend automatically sends Telegram notifications for:

### Job Events
- `job_posted` - New job created
- `job_assigned` - Worker assigned to job
- `job_completed` - Job marked as complete
- `job_cancelled` - Job cancelled

### Escrow Events
- `escrow_created` - Escrow initialized
- `escrow_funded` - Employer deposited funds
- `escrow_locked` - Worker accepted job
- `escrow_released` - Payment released
- `payment_received` - Worker received payment

### Reputation Events
- `reputation_received` - New rating received

### Dispute Events
- `dispute_raised` - Dispute created
- `dispute_resolved` - Dispute resolved

---

## 📝 Example Integration (Frontend)

### JavaScript/TypeScript

```typescript
const API_BASE = 'http://localhost:3001/api/v1';

// 1. Login
async function login(telegramId: number, walletAddress: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegramId, walletAddress }),
  });
  
  const { access_token } = await response.json();
  localStorage.setItem('token', access_token);
  return access_token;
}

// 2. Get Jobs
async function getJobs(status = 'posted') {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE}/jobs?status=${status}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
}

// 3. Create Job
async function createJob(jobData: any) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(jobData),
  });
  
  return await response.json();
}

// 4. Submit Rating
async function submitRating(ratingData: any) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE}/reputation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(ratingData),
  });
  
  return await response.json();
}
```

---

## 🔗 Related Documentation

- [Backend README](./README.md) - Setup and deployment
- [Smart Contracts](../contract/README.md) - TON contract documentation
- [Frontend Docs](../FRONTEND_COMPLETE.md) - React app integration

---

**Questions?** Open an issue or contact support@wagob.com
