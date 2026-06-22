# Stage 1: Compile React and Vite static assets
FROM node:20-alpine as builder

WORKDIR /app

# Enable npm lockfile caching optimizations
COPY package*.json ./
RUN npm ci

# Copy sources and trigger build sequence
COPY . .
RUN npm run build

# Stage 2: Serve compiled static structures using non-root Nginx
FROM nginxinc/nginx-unprivileged:alpine

# Copy built bundle from builder layer to unprivileged Nginx public folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose unprivileged high-register web ports
EXPOSE 8080 8443

# The custom nginx.conf will be mounted into /etc/nginx/conf.d/default.conf 
# during orchestration, or we can use default starting endpoints.
CMD ["nginx", "-g", "daemon off;"]
