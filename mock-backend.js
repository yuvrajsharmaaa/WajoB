/**
 * Mock Backend Server for WajoB Frontend Testing
 * Run with: node mock-backend.js
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
let jobs = [
  {
    id: 1,
    title: 'Night Security Guard',
    description: 'Looking for a reliable security guard for night shift (10 PM - 6 AM). Must be alert and responsible.',
    wages: '50',
    duration: 8,
    category: 'Security',
    location: 'Mumbai, India',
    status: 'POSTED',
    employerAddress: 'EQDfAs6HiTDdvi6XMsHJuBXncUCFRNz9V5nen09cQG_6ML3s',
    workerAddress: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Building Watchman',
    description: 'Need a watchman for residential building. Day shift from 8 AM to 6 PM.',
    wages: '45',
    duration: 10,
    category: 'Watchman',
    location: 'Delhi, India',
    status: 'ASSIGNED',
    employerAddress: 'EQCBHqzZepJvzgjNiXvXmrI1Ew8vTkAISNAevdVGsWEeehBG',
    workerAddress: 'EQCSGYJ0zV-N96xNFN_x5KYleD6Nl0r6bkB_NdsQOZWvOAKg',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Gate Security',
    description: 'Security guard needed for main gate of commercial complex. 12-hour shift.',
    wages: '60',
    duration: 12,
    category: 'Security',
    location: 'Bangalore, India',
    status: 'COMPLETED',
    employerAddress: 'EQDfAs6HiTDdvi6XMsHJuBXncUCFRNz9V5nen09cQG_6ML3s',
    workerAddress: 'EQCSGYJ0zV-N96xNFN_x5KYleD6Nl0r6bkB_NdsQOZWvOAKg',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let escrows = [
  {
    id: 1,
    jobId: 1,
    amount: '50',
    status: 'FUNDED',
    employerAddress: 'EQDfAs6HiTDdvi6XMsHJuBXncUCFRNz9V5nen09cQG_6ML3s',
    workerAddress: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    jobId: 2,
    amount: '45',
    status: 'FUNDED',
    employerAddress: 'EQCBHqzZepJvzgjNiXvXmrI1Ew8vTkAISNAevdVGsWEeehBG',
    workerAddress: 'EQCSGYJ0zV-N96xNFN_x5KYleD6Nl0r6bkB_NdsQOZWvOAKg',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

let ratings = [
  {
    id: 1,
    jobId: 3,
    fromAddress: 'EQDfAs6HiTDdvi6XMsHJuBXncUCFRNz9V5nen09cQG_6ML3s',
    targetAddress: 'EQCSGYJ0zV-N96xNFN_x5KYleD6Nl0r6bkB_NdsQOZWvOAKg',
    rating: 5,
    comment: 'Excellent work! Very professional and punctual.',
    txHash: 'mock-tx-hash-1',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// API Routes

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Jobs endpoints
app.get('/api/v1/jobs', (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  let filteredJobs = status && status !== 'All' ? jobs.filter(j => j.status === status) : jobs;
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);
  
  res.json({
    jobs: paginatedJobs,
    total: filteredJobs.length,
    page: parseInt(page),
    totalPages: Math.ceil(filteredJobs.length / limit),
  });
});

app.get('/api/v1/jobs/stats', (req, res) => {
  res.json({
    total: jobs.length,
    posted: jobs.filter(j => j.status === 'POSTED').length,
    assigned: jobs.filter(j => j.status === 'ASSIGNED').length,
    completed: jobs.filter(j => j.status === 'COMPLETED').length,
    cancelled: jobs.filter(j => j.status === 'CANCELLED').length,
  });
});

app.get('/api/v1/jobs/:id', (req, res) => {
  const job = jobs.find(j => j.id === parseInt(req.params.id));
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  res.json(job);
});

app.post('/api/v1/jobs', (req, res) => {
  const newJob = {
    id: jobs.length + 1,
    ...req.body,
    status: 'POSTED',
    workerAddress: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobs.push(newJob);
  res.status(201).json(newJob);
});

app.post('/api/v1/jobs/:id/accept', (req, res) => {
  const job = jobs.find(j => j.id === parseInt(req.params.id));
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  job.status = 'ASSIGNED';
  job.workerAddress = req.body.workerAddress;
  job.updatedAt = new Date().toISOString();
  res.json(job);
});

app.post('/api/v1/jobs/:id/complete', (req, res) => {
  const job = jobs.find(j => j.id === parseInt(req.params.id));
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  job.status = 'COMPLETED';
  job.updatedAt = new Date().toISOString();
  res.json(job);
});

app.post('/api/v1/jobs/:id/cancel', (req, res) => {
  const job = jobs.find(j => j.id === parseInt(req.params.id));
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  job.status = 'CANCELLED';
  job.updatedAt = new Date().toISOString();
  res.json(job);
});

// Escrow endpoints
app.get('/api/v1/escrow/job/:jobId', (req, res) => {
  const escrow = escrows.find(e => e.jobId === parseInt(req.params.jobId));
  if (!escrow) {
    return res.status(404).json({ message: 'Escrow not found' });
  }
  res.json(escrow);
});

app.get('/api/v1/escrow/:id', (req, res) => {
  const escrow = escrows.find(e => e.id === parseInt(req.params.id));
  if (!escrow) {
    return res.status(404).json({ message: 'Escrow not found' });
  }
  res.json(escrow);
});

app.post('/api/v1/escrow/:id/fund', (req, res) => {
  const escrow = escrows.find(e => e.id === parseInt(req.params.id));
  if (!escrow) {
    return res.status(404).json({ message: 'Escrow not found' });
  }
  escrow.status = 'FUNDED';
  res.json(escrow);
});

app.post('/api/v1/escrow/:id/release', (req, res) => {
  const escrow = escrows.find(e => e.id === parseInt(req.params.id));
  if (!escrow) {
    return res.status(404).json({ message: 'Escrow not found' });
  }
  escrow.status = 'RELEASED';
  res.json(escrow);
});

// Reputation endpoints
app.get('/api/v1/reputation/:address', (req, res) => {
  const userRatings = ratings.filter(r => r.targetAddress === req.params.address);
  const avgRating = userRatings.length > 0
    ? userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length
    : 0;
  
  res.json({
    address: req.params.address,
    averageRating: avgRating,
    totalRatings: userRatings.length,
    completedJobs: jobs.filter(j => 
      j.workerAddress === req.params.address && j.status === 'COMPLETED'
    ).length,
  });
});

app.get('/api/v1/reputation/job/:jobId/ratings', (req, res) => {
  const jobRatings = ratings.filter(r => r.jobId === parseInt(req.params.jobId));
  res.json(jobRatings);
});

app.post('/api/v1/reputation/ratings', (req, res) => {
  const newRating = {
    id: ratings.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  ratings.push(newRating);
  res.status(201).json(newRating);
});

app.get('/api/v1/reputation/leaderboard', (req, res) => {
  // Mock leaderboard data
  res.json([
    {
      address: 'EQCSGYJ0zV-N96xNFN_x5KYleD6Nl0r6bkB_NdsQOZWvOAKg',
      averageRating: 4.8,
      totalRatings: 15,
      completedJobs: 20,
    },
  ]);
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Mock Backend Server Running!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/v1/health`);
  console.log(`📋 Jobs: http://localhost:${PORT}/api/v1/jobs`);
  console.log(`\n✅ Ready to test frontend!\n`);
});
