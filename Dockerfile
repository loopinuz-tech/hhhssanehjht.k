# Asosiy platforma uchun Dockerfile
# Single-stage build for simplicity

FROM node:18-alpine

WORKDIR /app

# Install dependencies for node-gyp (if needed for some packages)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install serve for production
RUN npm install -g serve

# Expose port
EXPOSE 8080

# Set environment
ENV NODE_ENV=production

# Start the application - use the Node proxy server
CMD ["node", "server.js"]