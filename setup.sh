#!/bin/bash

# WajoB - Complete Project Setup Script
# This script sets up the entire WajoB project: Frontend + Backend + Contracts

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${MAGENTA}╔════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                                                ║${NC}"
echo -e "${MAGENTA}║     🚀 WajoB - Complete Project Setup 🚀      ║${NC}"
echo -e "${MAGENTA}║                                                ║${NC}"
echo -e "${MAGENTA}║   TON Blockchain Job Marketplace Platform      ║${NC}"
echo -e "${MAGENTA}║                                                ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running in project root
if [ ! -d "backend" ] || [ ! -d "contract" ] || [ ! -d "src" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${CYAN}📋 Pre-flight Checks${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} $NODE_VERSION"
else
    echo -e "${RED}✗ Not found${NC}"
    echo "Please install Node.js >= 20.x from https://nodejs.org"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} v$NPM_VERSION"
else
    echo -e "${RED}✗ Not found${NC}"
    exit 1
fi

# Check Docker
echo -n "Checking Docker... "
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    echo -e "${GREEN}✓${NC} $DOCKER_VERSION"
    HAS_DOCKER=true
else
    echo -e "${YELLOW}⚠ Not found${NC} (optional)"
    HAS_DOCKER=false
fi

# Check Git
echo -n "Checking Git... "
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    echo -e "${GREEN}✓${NC} v$GIT_VERSION"
else
    echo -e "${YELLOW}⚠ Not found${NC} (optional)"
fi

echo ""
echo -e "${CYAN}📦 Installing Dependencies${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Frontend
echo -e "${BLUE}1/3${NC} Frontend (React)..."
npm install
echo -e "${GREEN}✓${NC} Frontend dependencies installed"
echo ""

# Backend
echo -e "${BLUE}2/3${NC} Backend (NestJS)..."
cd backend
npm install
cd ..
echo -e "${GREEN}✓${NC} Backend dependencies installed"
echo ""

# Contracts
echo -e "${BLUE}3/3${NC} Smart Contracts (TON)..."
cd contract
npm install
cd ..
echo -e "${GREEN}✓${NC} Contract dependencies installed"
echo ""

echo -e "${CYAN}⚙️  Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backend .env
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env..."
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓${NC} Created backend/.env"
    echo -e "${YELLOW}⚠ Please edit backend/.env and add:${NC}"
    echo "  - Telegram bot token (from @BotFather)"
    echo "  - Database credentials"
    echo "  - JWT secrets"
else
    echo -e "${YELLOW}⚠${NC} backend/.env already exists (skipping)"
fi
echo ""

# Contract environment
if [ ! -f contract/.env ]; then
    echo "Creating contract/.env..."
    echo "TONCENTER_API_KEY=" > contract/.env
    echo -e "${GREEN}✓${NC} Created contract/.env"
else
    echo -e "${YELLOW}⚠${NC} contract/.env already exists (skipping)"
fi
echo ""

if [ "$HAS_DOCKER" = true ]; then
    echo -e "${CYAN}🐳 Starting Docker Services${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    echo "Starting PostgreSQL and Redis..."
    cd backend
    docker-compose up -d postgres redis
    cd ..
    
    echo ""
    echo -n "Waiting for services to be ready"
    for i in {1..10}; do
        echo -n "."
        sleep 1
    done
    echo ""
    echo -e "${GREEN}✓${NC} Services started"
    echo ""
    
    echo "Database and Redis are running:"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    echo "  - PgAdmin: http://localhost:5050 (admin@wagob.com / admin)"
else
    echo -e "${YELLOW}⚠ Docker not available${NC}"
    echo "Please install PostgreSQL and Redis manually:"
    echo "  - PostgreSQL: https://www.postgresql.org/download/"
    echo "  - Redis: https://redis.io/download"
fi

echo ""
echo -e "${CYAN}📊 Project Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✓ Frontend dependencies installed"
echo "✓ Backend dependencies installed"
echo "✓ Contract dependencies installed"
echo "✓ Configuration files created"
if [ "$HAS_DOCKER" = true ]; then
    echo "✓ Database and Redis running"
fi

echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${CYAN}📝 Next Steps:${NC}"
echo ""

echo "1️⃣  Get Telegram Bot Token:"
echo "   • Open Telegram, search @BotFather"
echo "   • Send /newbot and follow instructions"
echo "   • Copy token to backend/.env"
echo ""

echo "2️⃣  Deploy Smart Contracts (Testnet):"
echo "   ${YELLOW}cd contract${NC}"
echo "   ${YELLOW}npx blueprint run deployDeployJobRegistry --testnet${NC}"
echo "   ${YELLOW}npx blueprint run deployDeployEscrow --testnet${NC}"
echo "   ${YELLOW}npx blueprint run deployDeployReputation --testnet${NC}"
echo ""

echo "3️⃣  Update Contract Addresses:"
echo "   • Copy deployed addresses to:"
echo "   • ${YELLOW}backend/.env${NC}"
echo "   • ${YELLOW}src/config/contracts.js${NC}"
echo ""

echo "4️⃣  Run Database Migrations:"
echo "   ${YELLOW}cd backend${NC}"
echo "   ${YELLOW}npm run migration:run${NC}"
echo ""

echo "5️⃣  Start Development Servers:"
echo "   ${YELLOW}# Terminal 1 - Frontend${NC}"
echo "   ${YELLOW}npm start${NC}"
echo ""
echo "   ${YELLOW}# Terminal 2 - Backend${NC}"
echo "   ${YELLOW}cd backend${NC}"
echo "   ${YELLOW}npm run start:dev${NC}"
echo ""

echo "6️⃣  Access Applications:"
echo "   • Frontend: ${CYAN}http://localhost:3000${NC}"
echo "   • Backend API: ${CYAN}http://localhost:3001${NC}"
echo "   • Swagger Docs: ${CYAN}http://localhost:3001/api/v1/docs${NC}"
if [ "$HAS_DOCKER" = true ]; then
    echo "   • PgAdmin: ${CYAN}http://localhost:5050${NC}"
fi
echo ""

echo -e "${CYAN}📚 Documentation:${NC}"
echo "   • Quick Start: ${YELLOW}QUICKSTART.md${NC}"
echo "   • Project Overview: ${YELLOW}PROJECT_OVERVIEW.md${NC}"
echo "   • Frontend: ${YELLOW}FRONTEND_COMPLETE.md${NC}"
echo "   • Backend: ${YELLOW}backend/README.md${NC}"
echo "   • API Reference: ${YELLOW}backend/API.md${NC}"
echo "   • Deployment: ${YELLOW}backend/DEPLOYMENT.md${NC}"
echo "   • Smart Contracts: ${YELLOW}contract/SMART_CONTRACTS.md${NC}"
echo ""

echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Happy Coding! 🚀${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
