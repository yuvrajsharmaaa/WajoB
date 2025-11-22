#!/bin/bash

# WajoB Backend - Local Development Setup Script

set -e

echo "🚀 WajoB Backend - Development Setup"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Found $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found"
    echo "Please install Node.js >= 20.x from https://nodejs.org"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} Found npm $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check Docker
echo -n "Checking Docker... "
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    echo -e "${GREEN}✓${NC} Found Docker $DOCKER_VERSION"
    DOCKER_AVAILABLE=true
else
    echo -e "${YELLOW}⚠${NC} Docker not found (optional)"
    DOCKER_AVAILABLE=false
fi

echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env if not exists
if [ ! -f .env ]; then
    echo ""
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✓${NC} Created .env file"
    echo -e "${YELLOW}⚠${NC} Please edit .env and add your configuration"
fi

# Start services with Docker
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo ""
    echo "🐳 Starting Docker services (PostgreSQL & Redis)..."
    docker-compose up -d postgres redis
    
    echo ""
    echo "⏳ Waiting for services to be ready..."
    sleep 5
    
    # Check if services are healthy
    if docker-compose ps | grep -q "healthy"; then
        echo -e "${GREEN}✓${NC} Services are ready"
    else
        echo -e "${YELLOW}⚠${NC} Services may still be starting..."
    fi
    
    echo ""
    echo "📊 Database Migration..."
    echo "Run: npm run migration:run"
else
    echo ""
    echo -e "${YELLOW}⚠${NC} Docker not available. Please install PostgreSQL and Redis manually:"
    echo "  - PostgreSQL: https://www.postgresql.org/download/"
    echo "  - Redis: https://redis.io/download"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env file with your configuration"
echo "  2. Get Telegram bot token from @BotFather"
echo "  3. Deploy TON smart contracts (see /contract directory)"
echo "  4. Update contract addresses in .env"
echo "  5. Run migrations: npm run migration:run"
echo "  6. Start development server: npm run start:dev"
echo ""
echo "📚 Documentation: http://localhost:3001/api/v1/docs"
echo ""
