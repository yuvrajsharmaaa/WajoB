# 🚀 WajoB Testing & Monitoring - Quick Start Guide

## Overview

This guide will help you quickly set up and run the comprehensive testing and monitoring infrastructure for WajoB.

---

## 📋 Prerequisites

### Software Requirements

```bash
# Node.js 20+
node --version  # Should be >= 20.0.0

# npm
npm --version

# Docker & Docker Compose
docker --version
docker-compose --version

# Git
git --version
```

### Optional Tools

```bash
# k6 (for load testing)
brew install k6  # macOS
# or
sudo apt install k6  # Ubuntu

# Playwright browsers
npx playwright install
```

---

## 🧪 Testing Setup

### 1. Smart Contract Tests

```bash
# Navigate to contract directory
cd contract

# Install dependencies
npm install

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- WajoB.e2e.spec.ts

# Watch mode for development
npm run test:watch
```

**Expected Output**:
```
 PASS  tests/WajoB.e2e.spec.ts
  WajoB E2E Integration Tests
    Complete Job Lifecycle
      ✓ should execute full job flow (1234ms)
      ✓ should measure gas usage for complete lifecycle (891ms)
    Error Scenarios and Edge Cases
      ✓ should handle insufficient gas gracefully (456ms)
      ✓ should prevent state corruption on partial execution (567ms)
    ...

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        45.678s
```

### 2. Backend Tests

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Set up test database
docker-compose up -d postgres redis

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:cov
```

**Expected Output**:
```
 PASS  src/modules/jobs/jobs.service.spec.ts
 PASS  src/modules/reputation/reputation.service.spec.ts
 PASS  src/modules/blockchain/indexer.service.spec.ts

Test Suites: 15 passed, 15 total
Tests:       127 passed, 127 total
Time:        23.456s
Coverage:    92.3%
```

### 3. Frontend Tests

```bash
# Navigate to root
cd /home/yuvrajs/Desktop/wagob

# Install dependencies
npm install

# Run tests
npm run test

# Run with coverage
npm run test:coverage

# Update snapshots if needed
npm run test -- -u
```

### 4. End-to-End Tests

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Run E2E tests
npx playwright test

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/e2e/wagob.spec.ts

# Debug mode
npx playwright test --debug

# Generate report
npx playwright show-report
```

**Expected Output**:
```
Running 20 tests using 1 worker

  ✓  tests/e2e/wagob.spec.ts:29:5 › should connect TON wallet successfully (3.2s)
  ✓  tests/e2e/wagob.spec.ts:45:5 › should create a new job posting (5.1s)
  ✓  tests/e2e/wagob.spec.ts:78:5 › should complete full job acceptance and escrow funding (8.3s)
  ...

  20 passed (2.3m)

To open last HTML report run:
  npx playwright show-report
```

---

## 📊 Monitoring Setup

### 1. Install Monitoring Stack (Docker)

```bash
# Create monitoring directory
mkdir -p monitoring-stack
cd monitoring-stack

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Elasticsearch
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - monitoring

  # Logstash
  logstash:
    image: docker.elastic.co/logstash/logstash:8.10.0
    ports:
      - "5044:5044"
      - "9600:9600"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch
    networks:
      - monitoring

  # Kibana
  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - monitoring

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - monitoring

  # Grafana
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    depends_on:
      - prometheus
    networks:
      - monitoring

volumes:
  elasticsearch-data:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
    driver: bridge
EOF

# Create Prometheus config
mkdir -p prometheus
cat > prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'wagob-backend'
    static_configs:
      - targets: ['host.docker.internal:3001']
    metrics_path: '/metrics'

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
EOF

# Create Logstash pipeline
mkdir -p logstash/pipeline
cat > logstash/pipeline/logstash.conf << 'EOF'
input {
  tcp {
    port => 5044
    codec => json
  }
}

filter {
  if [level] == "error" {
    mutate { add_tag => ["error"] }
  }
  
  grok {
    match => { "message" => "%{GREEDYDATA:parsed_message}" }
  }
  
  date {
    match => [ "timestamp", "ISO8601" ]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "wagob-logs-%{+YYYY.MM.dd}"
  }
  
  stdout { codec => rubydebug }
}
EOF

# Start monitoring stack
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Expected Output**:
```
NAME                IMAGE                                        STATUS
elasticsearch       docker.elastic.co/elasticsearch:8.10.0       Up 30 seconds (healthy)
logstash            docker.elastic.co/logstash:8.10.0            Up 30 seconds
kibana              docker.elastic.co/kibana:8.10.0              Up 30 seconds
prometheus          prom/prometheus:latest                       Up 30 seconds
grafana             grafana/grafana:latest                       Up 30 seconds
```

### 2. Access Monitoring Dashboards

```bash
# Wait for services to be ready (2-3 minutes)
sleep 180

# Open dashboards
# Kibana (Logs)
open http://localhost:5601

# Grafana (Metrics)
open http://localhost:3001
# Default credentials: admin / admin

# Prometheus (Raw Metrics)
open http://localhost:9090

# Elasticsearch (API)
curl http://localhost:9200
```

### 3. Configure Backend Monitoring

```bash
cd backend

# Install monitoring dependencies
npm install @sentry/node @sentry/profiling-node \
  prom-client winston-elasticsearch

# Set environment variables
cat >> .env << 'EOF'

# Monitoring
SENTRY_DSN=your-sentry-dsn-here
ELASTICSEARCH_URL=http://localhost:9200
PROMETHEUS_PORT=9091
TELEGRAM_OPS_CHAT_ID=your-ops-chat-id

# Contract addresses for monitoring
JOB_REGISTRY_ADDRESS=EQDfAs6HiTDdvi6XMsHJuBXncUCFRNz9V5nen09cQG_6ML3s
ESCROW_ADDRESS=EQCBHqzZepJvzgjNiXvXmrI1Ew8vTkAISNAevdVGsWEeehBG
REPUTATION_ADDRESS=EQCSGYJ0zV-N96xNFN_x5KYleD6Nl0r6bkB_NdsQOZWvOAKg
EOF

# Start backend with monitoring
npm run start:dev
```

**Verify Monitoring**:
```bash
# Check health endpoint
curl http://localhost:3001/health

# Check metrics endpoint
curl http://localhost:3001/metrics

# Expected output:
# wagob_jobs_created_total{category="Development"} 5
# wagob_transactions_total{contract="JobRegistry",status="success"} 12
# wagob_api_latency_seconds_bucket{method="GET",route="/jobs",status="200"} 0.234
```

### 4. Configure Frontend Monitoring

```bash
# Install Sentry
npm install @sentry/react @sentry/tracing

# Set environment variables
cat >> .env << 'EOF'
REACT_APP_SENTRY_DSN=your-sentry-dsn-here
REACT_APP_GA_ID=your-google-analytics-id
EOF

# Rebuild
npm run build
```

---

## 🔍 Verify Installation

### Health Check Script

```bash
# Create health check script
cat > check-health.sh << 'EOF'
#!/bin/bash

echo "🔍 WajoB Health Check"
echo "===================="

# Check monitoring services
echo ""
echo "📊 Monitoring Services:"
echo -n "  Elasticsearch: "
curl -s http://localhost:9200 > /dev/null && echo "✅" || echo "❌"

echo -n "  Kibana: "
curl -s http://localhost:5601 > /dev/null && echo "✅" || echo "❌"

echo -n "  Prometheus: "
curl -s http://localhost:9090 > /dev/null && echo "✅" || echo "❌"

echo -n "  Grafana: "
curl -s http://localhost:3001 > /dev/null && echo "✅" || echo "❌"

# Check backend
echo ""
echo "🖥️  Backend Services:"
echo -n "  API Health: "
curl -s http://localhost:3001/health > /dev/null && echo "✅" || echo "❌"

echo -n "  Metrics: "
curl -s http://localhost:3001/metrics > /dev/null && echo "✅" || echo "❌"

# Check contract monitoring
echo ""
echo "📜 Smart Contract Monitoring:"
HEALTH=$(curl -s http://localhost:3001/api/v1/monitoring/contracts/health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo "  Status: ✅ Healthy"
else
    echo "  Status: ⚠️  Check required"
fi

echo ""
echo "✅ Health check complete!"
EOF

chmod +x check-health.sh
./check-health.sh
```

**Expected Output**:
```
🔍 WajoB Health Check
====================

📊 Monitoring Services:
  Elasticsearch: ✅
  Kibana: ✅
  Prometheus: ✅
  Grafana: ✅

🖥️  Backend Services:
  API Health: ✅
  Metrics: ✅

📜 Smart Contract Monitoring:
  Status: ✅ Healthy

✅ Health check complete!
```

---

## 🚀 Running Tests in CI/CD

### GitHub Actions Workflow

The testing is already configured in `.github/workflows/test.yml`:

```bash
# Trigger workflow manually
gh workflow run test.yml

# View workflow status
gh run list

# View logs
gh run view
```

**Automatic Triggers**:
- Every push to `main` or `staging`
- Every pull request
- Scheduled daily at 2 AM UTC

---

## 📈 Monitoring Contract Health

### Manual Contract Check

```bash
# Check contract balances
curl http://localhost:3001/api/v1/monitoring/contracts/health | jq

# Expected output:
{
  "status": "healthy",
  "contracts": [
    {
      "name": "JobRegistry",
      "address": "EQDf...",
      "status": "healthy",
      "balance": "50000000000",
      "successRate": 0.98,
      "transactionCount24h": 145
    },
    ...
  ],
  "lastChecked": "2025-11-23T10:15:30Z"
}
```

### View Recent Alerts

```bash
# Get recent alerts
curl http://localhost:3001/api/v1/monitoring/alerts | jq

# Expected output:
[
  {
    "id": 1,
    "severity": "medium",
    "type": "gas",
    "message": "Gas usage spike detected in JobRegistry",
    "timestamp": "2025-11-23T09:45:00Z",
    "resolved": false
  },
  ...
]
```

---

## 🔧 Troubleshooting

### Tests Failing

```bash
# Clear caches
rm -rf node_modules package-lock.json
npm install

# Reset test database
docker-compose down -v
docker-compose up -d

# Run tests with verbose output
npm run test -- --verbose
```

### Monitoring Services Not Starting

```bash
# Check logs
docker-compose logs elasticsearch
docker-compose logs grafana

# Restart services
docker-compose restart

# Check disk space
df -h

# Check memory
free -m
```

### Backend Not Connecting to Monitoring

```bash
# Check environment variables
cat backend/.env | grep -E "(SENTRY|ELASTICSEARCH|PROMETHEUS)"

# Check network connectivity
curl http://localhost:9200
curl http://localhost:5601

# Restart backend
cd backend
npm run start:dev
```

---

## 📚 Quick Reference

### Testing Commands

```bash
# Contract tests
cd contract && npm run test

# Backend tests
cd backend && npm run test:e2e

# Frontend tests
npm run test

# E2E tests
npx playwright test
```

### Monitoring URLs

- **Kibana (Logs)**: http://localhost:5601
- **Grafana (Metrics)**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Backend Health**: http://localhost:3001/health
- **Backend Metrics**: http://localhost:3001/metrics

### Documentation

- **Testing Strategy**: `/TESTING_STRATEGY.md`
- **Monitoring Guide**: `/MONITORING.md`
- **Contract Versioning**: `/CONTRACT_VERSIONING.md`
- **Security Guide**: `/SECURITY.md`
- **Deployment Guide**: `/DEPLOYMENT.md`

---

## 🎯 Next Steps

1. **Run All Tests**: Verify everything works
   ```bash
   cd contract && npm run test
   cd ../backend && npm run test:e2e
   cd .. && npx playwright test
   ```

2. **Start Monitoring**: Launch monitoring stack
   ```bash
   cd monitoring-stack && docker-compose up -d
   ```

3. **Configure Alerts**: Set up Telegram bot
   ```bash
   # Add bot token and chat ID to backend/.env
   TELEGRAM_BOT_TOKEN=your_token
   TELEGRAM_OPS_CHAT_ID=your_chat_id
   ```

4. **Test Alerts**: Trigger a test alert
   ```bash
   curl -X POST http://localhost:3001/api/v1/monitoring/test-alert
   ```

5. **Review Dashboards**: Check Grafana and Kibana

---

## 💡 Tips

- **Run tests before every commit**
- **Monitor dashboards daily**
- **Review alerts promptly**
- **Keep documentation updated**
- **Conduct regular team reviews**

---

**🎉 Setup Complete! Your WajoB testing and monitoring infrastructure is ready!**

For detailed information, refer to the comprehensive guides:
- `TESTING_STRATEGY.md`
- `MONITORING.md`
- `CONTRACT_VERSIONING.md`
