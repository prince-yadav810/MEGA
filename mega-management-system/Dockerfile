# ============================================
# MEGA Management System - Cloud Run Dockerfile
# Multi-stage build for optimized production image
# ============================================

# Stage 1: Build React Frontend
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm ci --legacy-peer-deps

# Copy client source code
COPY client/ ./

# Build React app for production
RUN npm run build

# ============================================
# Stage 2: Production Server
FROM node:20-alpine AS production

# Install dependencies for sharp (image processing)
RUN apk add --no-cache \
    vips-dev \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install production dependencies only
RUN npm ci --only=production --legacy-peer-deps

# Copy server source code
COPY server/ ./

# Copy built React app from client-builder stage
COPY --from=client-builder /app/client/build ./client/build

# Create uploads directory (will use /tmp in Cloud Run)
RUN mkdir -p /tmp/uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Cloud Run uses port 8080 by default
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
