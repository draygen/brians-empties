FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
WORKDIR /app/server
RUN npm install

WORKDIR /app/client
RUN npm install

# Copy source code
WORKDIR /app
COPY . .

# Build client
RUN cd client && npm run build

# Expose port
EXPOSE 3000

# Start server
WORKDIR /app/server
CMD ["npm", "start"]