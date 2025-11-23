# 📡 API Reference

Complete REST API and WebSocket documentation for WajoB backend.

## Base URL

```
Production:  https://api.wagob.io/v1
Staging:     https://staging-api.wagob.io/v1
Development: http://localhost:3001/v1
```

## Authentication

All API requests (except public endpoints) require authentication via JWT token.

### Get Auth Token

**Endpoint:** `POST /auth/telegram`

```http
POST /v1/auth/telegram
Content-Type: application/json

{
  "initData": "query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397...",
  "walletAddress": "EQDf2tKn3...8vPB"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "telegramId": 279058397,
    "username": "johndoe",
    "walletAddress": "EQDf2tKn3...8vPB",
    "reputationScore": 4.5,
    "totalJobsCompleted": 15
  }
}
```

### Using the Token

Include in `Authorization` header:

```http
GET /v1/jobs
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Jobs API

### List Jobs

**Endpoint:** `GET /jobs`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `open`, `assigned`, `completed`, `cancelled` |
| `category` | string | No | Filter by category: `delivery`, `cleaning`, `tech`, etc. |
| `location` | string | No | Filter by location |
| `minWage` | number | No | Minimum wages in TON |
| `maxWage` | number | No | Maximum wages in TON |
| `cursor` | string | No | Pagination cursor from previous response |
| `limit` | number | No | Results per page (default: 20, max: 100) |

**Example Request:**
```http
GET /v1/jobs?status=open&category=delivery&limit=20
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": [
    {
      "id": "1",
      "blockchainId": "12345",
      "title": "Deliver groceries in downtown",
      "description": "Need someone to pick up and deliver groceries from Walmart to my apartment...",
      "category": "delivery",
      "location": "Downtown, City Center",
      "wages": "5.5",
      "status": "open",
      "employer": {
        "id": "123",
        "username": "johndoe",
        "reputationScore": 4.8
      },
      "applicationsCount": 3,
      "createdAt": "2025-11-23T10:30:00Z",
      "deadline": "2025-11-24T18:00:00Z"
    }
  ],
  "pagination": {
    "nextCursor": "eyJpZCI6MX0=",
    "hasMore": true,
    "limit": 20
  }
}
```

---

### Get Job Details

**Endpoint:** `GET /jobs/:id`

**Parameters:**
- `id` - Job ID (database ID or blockchain ID)

**Example Request:**
```http
GET /v1/jobs/1
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "1",
  "blockchainId": "12345",
  "title": "Deliver groceries in downtown",
  "description": "Need someone to pick up and deliver groceries from Walmart to my apartment. Should take about 1 hour. Must have vehicle.",
  "category": "delivery",
  "location": "Downtown, City Center",
  "wages": "5.5",
  "status": "open",
  "employer": {
    "id": "123",
    "username": "johndoe",
    "walletAddress": "EQDf2tKn3...8vPB",
    "reputationScore": 4.8,
    "totalJobsPosted": 25,
    "joinedAt": "2025-01-15T09:00:00Z"
  },
  "worker": null,
  "escrow": {
    "id": "45",
    "blockchainId": "67890",
    "amount": "5.5",
    "fee": "0.1375",
    "status": "funded",
    "deadline": "2025-11-24T18:00:00Z"
  },
  "applications": [
    {
      "id": "10",
      "worker": {
        "id": "456",
        "username": "worker1",
        "reputationScore": 4.5
      },
      "message": "I have a car and can deliver within 1 hour",
      "status": "pending",
      "appliedAt": "2025-11-23T11:00:00Z"
    }
  ],
  "createdAt": "2025-11-23T10:30:00Z",
  "updatedAt": "2025-11-23T11:00:00Z",
  "deadline": "2025-11-24T18:00:00Z"
}
```

---

### Create Job

**Endpoint:** `POST /jobs`

**Request Body:**
```json
{
  "title": "Deliver groceries in downtown",
  "description": "Need someone to pick up and deliver groceries...",
  "category": "delivery",
  "location": "Downtown, City Center",
  "wages": "5.5",
  "deadline": "2025-11-24T18:00:00Z"
}
```

**Validation Rules:**
- `title`: 5-200 characters
- `description`: 20-2000 characters
- `category`: Valid category from enum
- `wages`: Minimum 0.1 TON, maximum 10,000 TON
- `deadline`: Must be future date, max 30 days from now

**Response:**
```json
{
  "id": "1",
  "title": "Deliver groceries in downtown",
  "status": "draft",
  "message": "Job created. Please fund escrow to publish.",
  "nextStep": {
    "action": "fundEscrow",
    "amount": "5.5",
    "contractAddress": "EQC5d...7Gk"
  }
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": [
    "title must be longer than or equal to 5 characters",
    "wages must not be less than 0.1"
  ],
  "error": "Bad Request"
}
```

---

### Update Job

**Endpoint:** `PATCH /jobs/:id`

**Authorization:** Only job owner can update

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "cancelled"
}
```

**Updatable Fields:**
- `title`, `description`, `location`: Any time before worker assigned
- `status`: Valid status transitions only
- `deadline`: Can extend, not reduce

**Response:**
```json
{
  "id": "1",
  "title": "Updated title",
  "status": "cancelled",
  "updatedAt": "2025-11-23T12:00:00Z"
}
```

---

### Apply to Job

**Endpoint:** `POST /jobs/:id/apply`

**Request Body:**
```json
{
  "message": "I have relevant experience and can start immediately"
}
```

**Response:**
```json
{
  "applicationId": "10",
  "jobId": "1",
  "workerId": "456",
  "status": "pending",
  "message": "Application submitted successfully",
  "appliedAt": "2025-11-23T11:00:00Z"
}
```

**Error Responses:**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | `already_applied` | Worker already applied to this job |
| 400 | `own_job` | Cannot apply to own job |
| 404 | `job_not_found` | Job does not exist |
| 409 | `job_filled` | Job already assigned to worker |

---

### Accept Application

**Endpoint:** `POST /jobs/:jobId/applications/:applicationId/accept`

**Authorization:** Only job employer

**Response:**
```json
{
  "applicationId": "10",
  "status": "accepted",
  "job": {
    "id": "1",
    "status": "assigned",
    "worker": {
      "id": "456",
      "username": "worker1"
    }
  },
  "message": "Worker assigned successfully"
}
```

---

### Mark Job Complete

**Endpoint:** `POST /jobs/:id/complete`

**Authorization:** Assigned worker only

**Response:**
```json
{
  "id": "1",
  "status": "completed",
  "completedAt": "2025-11-23T15:00:00Z",
  "nextStep": {
    "action": "awaitingEmployerConfirmation",
    "message": "Waiting for employer to release payment"
  }
}
```

---

## Escrow API

### Create Escrow

**Endpoint:** `POST /escrow`

**Request Body:**
```json
{
  "jobId": "1",
  "amount": "5.5",
  "workerId": "456",
  "deadline": "2025-11-24T18:00:00Z"
}
```

**Response:**
```json
{
  "id": "45",
  "jobId": "1",
  "amount": "5.5",
  "fee": "0.1375",
  "totalRequired": "5.6375",
  "status": "created",
  "contractAddress": "EQC5d...7Gk",
  "fundingInstructions": {
    "recipient": "EQC5d...7Gk",
    "amount": "5.6375",
    "memo": "Job #1 escrow"
  }
}
```

---

### Fund Escrow

**Endpoint:** `POST /escrow/:id/fund`

**Request Body:**
```json
{
  "txHash": "abc123...def456"
}
```

**Response:**
```json
{
  "id": "45",
  "status": "funded",
  "fundedAt": "2025-11-23T10:35:00Z",
  "txHash": "abc123...def456",
  "job": {
    "id": "1",
    "status": "open"
  }
}
```

---

### Release Payment

**Endpoint:** `POST /escrow/:id/release`

**Authorization:** Job employer only

**Request Body:**
```json
{
  "txHash": "def456...ghi789",
  "rating": {
    "score": 5,
    "comment": "Excellent work, very professional"
  }
}
```

**Response:**
```json
{
  "id": "45",
  "status": "released",
  "releasedAt": "2025-11-23T15:30:00Z",
  "txHash": "def456...ghi789",
  "payment": {
    "worker": "5.3625",
    "platform": "0.1375"
  }
}
```

---

### Dispute Escrow

**Endpoint:** `POST /escrow/:id/dispute`

**Request Body:**
```json
{
  "reason": "Worker did not complete job as described",
  "evidence": [
    "https://imgur.com/abc123.jpg",
    "https://imgur.com/def456.jpg"
  ],
  "description": "Detailed description of the issue..."
}
```

**Response:**
```json
{
  "disputeId": "78",
  "escrowId": "45",
  "status": "under_review",
  "createdAt": "2025-11-23T16:00:00Z",
  "estimatedResolution": "2025-11-25T16:00:00Z"
}
```

---

## Users API

### Get Current User

**Endpoint:** `GET /users/me`

**Response:**
```json
{
  "id": "123",
  "telegramId": 279058397,
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "walletAddress": "EQDf2tKn3...8vPB",
  "reputationScore": 4.8,
  "totalJobsCompleted": 15,
  "totalJobsPosted": 25,
  "totalEarnings": "125.50",
  "joinedAt": "2025-01-15T09:00:00Z",
  "lastActive": "2025-11-23T12:00:00Z"
}
```

---

### Get User Profile

**Endpoint:** `GET /users/:id`

**Response:**
```json
{
  "id": "456",
  "username": "worker1",
  "walletAddress": "EQBx...3Yz",
  "reputationScore": 4.5,
  "totalJobsCompleted": 48,
  "joinedAt": "2025-03-10T14:00:00Z",
  "badges": [
    {
      "name": "Top Rated",
      "icon": "⭐",
      "earnedAt": "2025-10-01T00:00:00Z"
    },
    {
      "name": "Fast Responder",
      "icon": "⚡",
      "earnedAt": "2025-08-15T00:00:00Z"
    }
  ],
  "recentRatings": [
    {
      "score": 5,
      "comment": "Excellent work!",
      "ratedBy": "johndoe",
      "createdAt": "2025-11-20T10:00:00Z"
    }
  ]
}
```

---

### Update Profile

**Endpoint:** `PATCH /users/me`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Experienced delivery driver with 5 years experience",
  "location": "New York, NY",
  "skills": ["driving", "delivery", "time-management"]
}
```

**Response:**
```json
{
  "id": "123",
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Experienced delivery driver...",
  "updatedAt": "2025-11-23T12:00:00Z"
}
```

---

## Reputation API

### Submit Rating

**Endpoint:** `POST /reputation/rate`

**Authorization:** Must have completed job with ratee

**Request Body:**
```json
{
  "jobId": "1",
  "rateeId": "456",
  "score": 5,
  "comment": "Excellent work, very professional and on time"
}
```

**Validation:**
- `score`: 1-5 (integer)
- `comment`: 10-500 characters (optional)
- Can only rate once per job
- Job must be completed

**Response:**
```json
{
  "ratingId": "89",
  "jobId": "1",
  "rateeId": "456",
  "score": 5,
  "comment": "Excellent work...",
  "txHash": "ghi789...jkl012",
  "createdAt": "2025-11-23T15:35:00Z",
  "updatedReputation": {
    "userId": "456",
    "score": 4.6,
    "totalRatings": 49,
    "trend": "improving"
  }
}
```

---

### Get User Reputation

**Endpoint:** `GET /reputation/:userId`

**Response:**
```json
{
  "userId": "456",
  "score": 4.6,
  "totalRatings": 49,
  "totalJobs": 48,
  "trend": "improving",
  "breakdown": {
    "5stars": 35,
    "4stars": 10,
    "3stars": 3,
    "2stars": 1,
    "1star": 0
  },
  "recentRatings": [
    {
      "id": "89",
      "score": 5,
      "comment": "Excellent work...",
      "ratedBy": {
        "id": "123",
        "username": "johndoe"
      },
      "job": {
        "id": "1",
        "title": "Deliver groceries..."
      },
      "createdAt": "2025-11-23T15:35:00Z"
    }
  ]
}
```

---

### Get User Ratings

**Endpoint:** `GET /reputation/:userId/ratings`

**Query Parameters:**
- `cursor`: Pagination cursor
- `limit`: Results per page (default: 20)
- `minScore`: Filter by minimum score (1-5)

**Response:**
```json
{
  "data": [
    {
      "id": "89",
      "score": 5,
      "comment": "Excellent work...",
      "rater": {
        "id": "123",
        "username": "johndoe",
        "reputationScore": 4.8
      },
      "job": {
        "id": "1",
        "title": "Deliver groceries..."
      },
      "createdAt": "2025-11-23T15:35:00Z"
    }
  ],
  "pagination": {
    "nextCursor": "eyJpZCI6ODl9",
    "hasMore": true,
    "limit": 20
  }
}
```

---

## Statistics API

### Get Global Statistics

**Endpoint:** `GET /statistics/global`

**Response:**
```json
{
  "jobs": {
    "total": 15234,
    "open": 1523,
    "completed": 12456,
    "cancelled": 1255
  },
  "users": {
    "total": 5678,
    "activeToday": 234,
    "activeThisWeek": 1234
  },
  "volume": {
    "totalValue": "125678.50",
    "totalEarnings": "122789.25",
    "platformFees": "2889.25"
  },
  "averages": {
    "jobWage": "8.25",
    "completionTime": "4.5",
    "responseTime": "0.5"
  }
}
```

---

## WebSocket API

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('wss://api.wagob.io', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  transports: ['websocket', 'polling']
});
```

### Events

#### Subscribe to Job Updates

```javascript
// Subscribe to specific job
socket.emit('subscribe:job', '1');

// Listen for updates
socket.on('job:updated', (data) => {
  console.log('Job updated:', data);
  // { jobId: '1', title: '...', status: 'assigned', ... }
});

// Unsubscribe
socket.emit('unsubscribe:job', '1');
```

#### Subscribe to Status Updates

```javascript
// Subscribe to all open jobs
socket.emit('subscribe:status', 'open');

// Listen for new jobs
socket.on('job:created', (data) => {
  console.log('New job posted:', data);
});

// Listen for status changes
socket.on('job:status:changed', (data) => {
  console.log('Job status changed:', data);
  // { jobId: '1', oldStatus: 'open', newStatus: 'assigned', ... }
});
```

#### Subscribe to Category

```javascript
// Subscribe to delivery jobs
socket.emit('subscribe:category', 'delivery');

socket.on('job:created', (data) => {
  if (data.category === 'delivery') {
    console.log('New delivery job:', data);
  }
});
```

#### Escrow Events

```javascript
socket.on('escrow:funded', (data) => {
  console.log('Escrow funded:', data);
  // { escrowId: '45', jobId: '1', amount: '5.5', ... }
});

socket.on('escrow:released', (data) => {
  console.log('Payment released:', data);
  // { escrowId: '45', workerId: '456', amount: '5.3625', ... }
});
```

#### Application Events

```javascript
socket.on('application:new', (data) => {
  console.log('New application received:', data);
  // { jobId: '1', workerId: '456', message: '...' }
});

socket.on('application:accepted', (data) => {
  console.log('Application accepted:', data);
  // { applicationId: '10', jobId: '1', workerId: '456' }
});
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., already exists) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Temporary service disruption |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "wages",
      "message": "wages must not be less than 0.1",
      "value": "0.05"
    }
  ],
  "timestamp": "2025-11-23T12:00:00Z",
  "path": "/v1/jobs"
}
```

---

## Rate Limiting

**Limits:**
- **Authenticated requests**: 100 requests per minute
- **Public endpoints**: 20 requests per minute
- **WebSocket connections**: 5 connections per user

**Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700654400
```

**Error Response (429):**
```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later",
  "retryAfter": 60
}
```

---

## Pagination

All list endpoints support cursor-based pagination:

**Request:**
```http
GET /v1/jobs?limit=20&cursor=eyJpZCI6MjB9
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6NDB9",
    "prevCursor": "eyJpZCI6MH0",
    "hasMore": true,
    "limit": 20
  }
}
```

**Benefits:**
- Consistent performance regardless of page number
- No missed or duplicate items during pagination
- Works with real-time data updates

---

## Webhooks

Configure webhooks to receive event notifications:

**Endpoint:** `POST /webhooks`

**Request Body:**
```json
{
  "url": "https://yourapp.com/webhooks/wagob",
  "events": ["job.created", "escrow.released", "rating.submitted"],
  "secret": "your_webhook_secret"
}
```

**Webhook Payload:**
```json
{
  "event": "job.created",
  "timestamp": "2025-11-23T12:00:00Z",
  "data": {
    "id": "1",
    "title": "Deliver groceries...",
    "employer": { "id": "123", "username": "johndoe" },
    ...
  },
  "signature": "sha256=abc123..."
}
```

**Verify Signature:**
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

---

## Testing

### Postman Collection

Import our Postman collection: [Download](https://wagob.io/api/postman-collection.json)

### Example cURL Requests

**Get Jobs:**
```bash
curl -X GET "https://api.wagob.io/v1/jobs?status=open&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create Job:**
```bash
curl -X POST "https://api.wagob.io/v1/jobs" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Job",
    "description": "This is a test job posting",
    "category": "delivery",
    "wages": "5.0",
    "deadline": "2025-11-24T18:00:00Z"
  }'
```

---

*Last updated: November 23, 2025 • [Report API issue](https://github.com/yuvrajsharmaaa/WajoB/issues)*
