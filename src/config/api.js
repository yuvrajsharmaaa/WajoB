/**
 * API Configuration for WajoB Backend
 * Connects to NestJS REST API for job listings, escrow status, and reputation data
 */

// Backend API base URL - configure via environment variable
export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Jobs
  jobs: {
    list: '/jobs',
    getById: (id) => `/jobs/${id}`,
    create: '/jobs',
    update: (id) => `/jobs/${id}`,
    accept: (id) => `/jobs/${id}/accept`,
    complete: (id) => `/jobs/${id}/complete`,
    cancel: (id) => `/jobs/${id}/cancel`,
    stats: '/jobs/stats',
  },
  
  // Escrow
  escrow: {
    list: '/escrow',
    getById: (id) => `/escrow/${id}`,
    getByJob: (jobId) => `/escrow/job/${jobId}`,
    fund: (id) => `/escrow/${id}/fund`,
    release: (id) => `/escrow/${id}/release`,
    dispute: (id) => `/escrow/${id}/dispute`,
    resolve: (id) => `/escrow/${id}/resolve`,
  },
  
  // Reputation
  reputation: {
    getByAddress: (address) => `/reputation/${address}`,
    submit: '/reputation/submit',
    getByJob: (jobId) => `/reputation/job/${jobId}`,
    leaderboard: '/reputation/leaderboard',
  },
  
  // Users
  users: {
    profile: (address) => `/users/${address}`,
    jobs: (address) => `/users/${address}/jobs`,
    ratings: (address) => `/users/${address}/ratings`,
  },
  
  // Blockchain
  blockchain: {
    sync: '/blockchain/sync',
    status: '/blockchain/status',
    transaction: (hash) => `/blockchain/tx/${hash}`,
  },
  
  // WebSocket
  websocket: {
    url: process.env.REACT_APP_WS_URL || 'ws://localhost:3000',
  },
};

// Query keys for React Query
export const QUERY_KEYS = {
  jobs: {
    all: ['jobs'],
    list: (filters) => ['jobs', 'list', filters],
    detail: (id) => ['jobs', 'detail', id],
    stats: ['jobs', 'stats'],
  },
  escrow: {
    all: ['escrow'],
    list: (filters) => ['escrow', 'list', filters],
    detail: (id) => ['escrow', 'detail', id],
    byJob: (jobId) => ['escrow', 'job', jobId],
  },
  reputation: {
    all: ['reputation'],
    byAddress: (address) => ['reputation', address],
    byJob: (jobId) => ['reputation', 'job', jobId],
    leaderboard: ['reputation', 'leaderboard'],
  },
  users: {
    profile: (address) => ['users', 'profile', address],
    jobs: (address) => ['users', 'jobs', address],
    ratings: (address) => ['users', 'ratings', address],
  },
  blockchain: {
    status: ['blockchain', 'status'],
    transaction: (hash) => ['blockchain', 'tx', hash],
  },
};

// Cache configuration
export const CACHE_CONFIG = {
  staleTime: {
    jobs: 30000, // 30 seconds
    escrow: 10000, // 10 seconds (more real-time)
    reputation: 60000, // 1 minute
    blockchain: 5000, // 5 seconds
  },
  cacheTime: {
    default: 300000, // 5 minutes
  },
  refetchInterval: {
    jobs: false, // Manual refresh only
    escrow: 15000, // Refetch every 15 seconds
    blockchain: 10000, // Refetch every 10 seconds
  },
};
