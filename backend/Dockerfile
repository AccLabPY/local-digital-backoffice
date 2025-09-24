FROM node:16-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose API port
EXPOSE 3001

# Start the application
CMD ["node", "src/server.js"]
