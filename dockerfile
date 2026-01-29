# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install deps
RUN npm install

# Copy source
COPY . .

# Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Build NestJS
RUN npm run build

# -------------------------

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copy only needed files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
