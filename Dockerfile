# Build stage
FROM node:20-slim AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build
# Build Cloud Run entrypoint that starts the server
RUN npx esbuild server/serve.ts --platform=node --bundle --packages=external --format=esm --outfile=dist/serve.js

# Runtime stage
FROM node:20-slim
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy built artifacts and production dependencies
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev

EXPOSE 8080

# Start the server
CMD ["node", "dist/serve.js"]
