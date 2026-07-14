## ---------------------------------------
## Stage 1: Build with Node
## ---------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

ENV CI=true

# Vite variables are compiled into the static bundle. Keep the production API
# explicit so Docker and static previews use the same HTTPS backend contract.
ARG VITE_LUTA_API_BASE=https://api.lutaai.com
ENV VITE_LUTA_API_BASE=${VITE_LUTA_API_BASE}

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

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=6 \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]

