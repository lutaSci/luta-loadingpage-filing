## ---------------------------------------
## Stage 1: Build with Node
## ---------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

ENV CI=true

# Install dependencies using lockfile for reproducibility
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build


## ---------------------------------------
## Stage 2: Serve with Nginx
## ---------------------------------------
FROM nginx:1.27-alpine

# Copy custom nginx config (SPA fallback, caching, gzip)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


