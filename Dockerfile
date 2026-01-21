# Dockerfile for Scientific Bench

# Build Stage
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY server.cjs ./
COPY server/ ./server/
COPY db.json ./

# Environment variables
ENV PORT=5000
ENV NODE_ENV=production
# IMPORTANT: Set SECRET_KEY in production!
# ENV SECRET_KEY=your-secure-random-key

EXPOSE 5000

CMD ["node", "server.cjs"]

