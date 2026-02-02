FROM node:20-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Create data directory
RUN mkdir -p /data

ENV DATABASE_PATH=/data/rosie.db
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
