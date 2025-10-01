# Use Node.js 20 LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (include devDeps for Prisma build)
RUN npm install --production=false

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS for production
RUN npm run build

# Remove devDependencies for smaller image
RUN npm prune --production

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "start:prod"]
