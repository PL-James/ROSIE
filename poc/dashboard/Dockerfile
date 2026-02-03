# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from dashboard directory
COPY dashboard/package*.json ./
RUN npm install

# Copy dashboard source code
COPY dashboard/ ./

# Build with production API URL
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy loading page for initial startup (now accessible from build context root)
COPY loading.html /usr/share/nginx/html/loading.html

# Copy nginx config for SPA routing with loading page support
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index loading.html index.html; \
    location = / { \
        try_files /loading.html =404; \
    } \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /v1 { \
        proxy_pass http://sor-api:3000; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
    location /health { \
        proxy_pass http://sor-api:3000; \
        proxy_http_version 1.1; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
