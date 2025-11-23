# ==================================
# WajoB Backend - Multi-Stage Dockerfile
# ==================================
#
# Security Note:
# This Dockerfile uses node:20.18.0-bookworm-slim which includes
# apt-get upgrade to patch known vulnerabilities. The Docker scanner
# may still report some CVEs that are:
# 1. Already patched in this version
# 2. Not exploitable in our containerized environment
# 3. Awaiting upstream fixes in Debian base image
#
# We actively monitor and update to the latest LTS Node.js version
# and apply all available security patches.
# ==================================

# ==================================
# STAGE 1: Build
# ==================================
FROM node:20.18.0-bookworm-slim AS builder

WORKDIR /app

# Security: Update packages to patch vulnerabilities and install dumb-init
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends dumb-init && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build application
RUN npm run build

# ==================================
# STAGE 2: Development
# ==================================
FROM node:20.18.0-bookworm-slim AS development

WORKDIR /app

# Security: Update packages
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends dumb-init && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and config
COPY . .

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start in development mode
CMD ["npm", "run", "start:dev"]

# ==================================
# STAGE 3: Production
# ==================================
FROM node:20.18.0-bookworm-slim AS production

WORKDIR /app

# Security: Update packages to patch vulnerabilities
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends dumb-init && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]
