## ---------------------------------------
## Stage 1: Build with Node
## ---------------------------------------
ARG VITE_DEPLOYMENT_ENV=production
FROM node:20-alpine AS builder

WORKDIR /app

ENV CI=true

# Vite variables are compiled into the static bundle. Keep the production API
# explicit so Docker and static previews use the same HTTPS backend contract.
ARG VITE_LUTA_API_BASE=https://api.lutaai.com
ARG VITE_DEPLOYMENT_ENV
ARG VITE_ATTRIBUTION_CONTINUE_BASE=https://go.lutaai.com
ARG VITE_POSTHOG_ENABLED=true
ARG VITE_SMART_LINK_HOMEPAGE_SURFACE=false
ARG VITE_GLOBAL_MOBILE_HANDOFF=false
ARG VITE_META_PIXEL_ENABLED=false
ARG VITE_META_PIXEL_ID=
ENV VITE_LUTA_API_BASE=${VITE_LUTA_API_BASE}
ENV VITE_DEPLOYMENT_ENV=${VITE_DEPLOYMENT_ENV}
ENV VITE_ATTRIBUTION_CONTINUE_BASE=${VITE_ATTRIBUTION_CONTINUE_BASE}
ENV VITE_POSTHOG_ENABLED=${VITE_POSTHOG_ENABLED}
ENV VITE_SMART_LINK_HOMEPAGE_SURFACE=${VITE_SMART_LINK_HOMEPAGE_SURFACE}
ENV VITE_GLOBAL_MOBILE_HANDOFF=${VITE_GLOBAL_MOBILE_HANDOFF}
ENV VITE_META_PIXEL_ENABLED=${VITE_META_PIXEL_ENABLED}
ENV VITE_META_PIXEL_ID=${VITE_META_PIXEL_ID}

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
ARG VITE_DEPLOYMENT_ENV
COPY nginx.conf /tmp/nginx-production.conf
COPY ops/qa/nginx.conf /tmp/nginx-qa.conf
# The same profile selects JS and edge configuration; QA cannot accidentally
# retain the production proxy by omitting a second independent build argument.
RUN cp /tmp/nginx-${VITE_DEPLOYMENT_ENV}.conf /etc/nginx/conf.d/default.conf && nginx -t

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=6 \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
