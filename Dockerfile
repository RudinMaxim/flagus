# Stage 1: install dependencies and build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package manifests and install deps
COPY package.json tsconfig.json ./
RUN npm ci

# Copy all source files and build
COPY . .
RUN npm run build

# Stage 2: production image
FROM node:18-alpine AS runner

# Create app directory
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy only production deps and built artifacts
COPY package.json ./
RUN npm ci --only=production
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/views ./src/views

# Optional: copy static assets if you have a public folder
# COPY --from=builder /usr/src/app/public ./public

# Expose application port
EXPOSE 3000

# Launch the app
CMD ["node", "dist/index.js"]