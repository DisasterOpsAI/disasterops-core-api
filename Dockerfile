# Stage 1: Build
FROM node:21-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN corepack enable && pnpm install
COPY . .

# Stage 2: Run
FROM node:21-alpine
WORKDIR /app
COPY --from=builder /app/src ./src
COPY package*.json ./
RUN corepack enable && pnpm install --production
CMD ["node", "src/app.js"]
