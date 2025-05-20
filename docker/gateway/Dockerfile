FROM node:18-alpine AS builder

WORKDIR /app

# Copy the entire project
COPY . .

# Install all dependencies
RUN npm install --legacy-peer-deps

# Build the gateway application
RUN npx nest build gateway

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production --legacy-peer-deps

# Copy the entire dist directory
COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

# Use the correct path to the main.js file
CMD ["node", "dist/apps/gateway/apps/gateway/src/main.js"]