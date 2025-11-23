#!/bin/bash
# Seed backend with test data

API_URL="http://localhost:3001/api/v1"

echo "🌱 Seeding WajoB backend with test data..."
echo ""

# Create Job 1
echo "📋 Creating job 1: Night Security Guard..."
curl -X POST "${API_URL}/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Night Security Guard",
    "description": "Looking for a reliable security guard for night shift (10 PM - 6 AM). Must be alert and responsible.",
    "wages": "50",
    "duration": 8,
    "category": "Security",
    "location": "Mumbai, India",
    "employerAddress": "EQDfAs6HiTDdvi6XMsHJuBXncUCFRNz9V5nen09cQG_6ML3s",
    "txHash": "mock-tx-hash-1"
  }'
echo ""
echo ""

# Create Job 2
echo "📋 Creating job 2: Building Watchman..."
curl -X POST "${API_URL}/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Building Watchman",
    "description": "Need a watchman for residential building. Day shift from 8 AM to 6 PM.",
    "wages": "45",
    "duration": 10,
    "category": "Watchman",
    "location": "Delhi, India",
    "employerAddress": "EQCBHqzZepJvzgjNiXvXmrI1Ew8vTkAISNAevdVGsWEeehBG",
    "txHash": "mock-tx-hash-2"
  }'
echo ""
echo ""

# Create Job 3
echo "📋 Creating job 3: Gate Security..."
curl -X POST "${API_URL}/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Gate Security",
    "description": "Security guard needed for main gate of commercial complex. 12-hour shift.",
    "wages": "60",
    "duration": 12,
    "category": "Security",
    "location": "Bangalore, India",
    "employerAddress": "EQDfAs6HiTDdvi6XMsHJuBXncUCFRNz9V5nen09cQG_6ML3s",
    "txHash": "mock-tx-hash-3"
  }'
echo ""
echo ""

# Create Job 4
echo "📋 Creating job 4: Warehouse Security..."
curl -X POST "${API_URL}/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Warehouse Security",
    "description": "Security personnel needed for warehouse night shift. Experience preferred.",
    "wages": "55",
    "duration": 10,
    "category": "Security",
    "location": "Pune, India",
    "employerAddress": "EQCBHqzZepJvzgjNiXvXmrI1Ew8vTkAISNAevdVGsWEeehBG",
    "txHash": "mock-tx-hash-4"
  }'
echo ""
echo ""

# Create Job 5
echo "📋 Creating job 5: Residential Security..."
curl -X POST "${API_URL}/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Residential Security",
    "description": "Looking for security guard for gated community. 24/7 shift rotation.",
    "wages": "65",
    "duration": 12,
    "category": "Security",
    "location": "Hyderabad, India",
    "employerAddress": "EQDfAs6HiTDdvi6XMsHJuBXncUCFRNz9V5nen09cQG_6ML3s",
    "txHash": "mock-tx-hash-5"
  }'
echo ""
echo ""

echo "✅ Backend seeded successfully!"
echo ""
echo "🔍 Checking created jobs..."
curl "${API_URL}/jobs" | python3 -m json.tool
echo ""
