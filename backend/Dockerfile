FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create volume for logs
VOLUME /app/logs

# Expose application port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production

# Use PM2 to run the application
CMD ["pm2-runtime", "ecosystem.config.js"]
