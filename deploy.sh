#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Set to an empty string to skip the public Caddy smoke check, for example on
# an isolated staging host. Production should keep the HTTPS default.
PUBLIC_SMOKE_BASE_URL="${PUBLIC_SMOKE_BASE_URL-https://lutaai.com}"
PUBLIC_SMOKE_BASE_URL="${PUBLIC_SMOKE_BASE_URL%/}"
LUTA_API_BASE_URL="${LUTA_API_BASE_URL-https://api.lutaai.com}"
LUTA_API_BASE_URL="${LUTA_API_BASE_URL%/}"
CORS_SMOKE_ORIGIN="${CORS_SMOKE_ORIGIN-${PUBLIC_SMOKE_BASE_URL:-https://lutaai.com}}"
ADMIN_CORS_SMOKE_ORIGIN="${ADMIN_CORS_SMOKE_ORIGIN:-https://admin.lutaai.com}"
CADDY_NETWORK_NAME="${CADDY_NETWORK_NAME:-caddy_default}"

if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  echo "[error] 发布目录存在未提交或未跟踪文件；请从干净的 release commit 发布"
  exit 1
fi

echo "[info] release commit：$(git rev-parse HEAD)"

if ! docker compose version >/dev/null 2>&1; then
  echo "[error] docker compose 不可用，请安装 Docker Desktop 或 Compose v2"
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "[error] curl 不可用，无法执行发布后 smoke check"
  exit 1
fi

if ! docker network inspect "$CADDY_NETWORK_NAME" >/dev/null 2>&1; then
  echo "[error] Caddy 共享网络不存在：${CADDY_NETWORK_NAME}"
  exit 1
fi

if [[ -n "$PUBLIC_SMOKE_BASE_URL" && ! "$PUBLIC_SMOKE_BASE_URL" =~ ^https:// ]]; then
  echo "[error] PUBLIC_SMOKE_BASE_URL 必须是 HTTPS URL，或显式设为空以跳过公网检查"
  exit 1
fi

if [[ ! "$LUTA_API_BASE_URL" =~ ^https:// \
  || ! "$CORS_SMOKE_ORIGIN" =~ ^https:// \
  || ! "$ADMIN_CORS_SMOKE_ORIGIN" =~ ^https:// ]]; then
  echo "[error] LUTA_API_BASE_URL、CORS_SMOKE_ORIGIN 和 ADMIN_CORS_SMOKE_ORIGIN 必须是 HTTPS URL"
  exit 1
fi

echo "[step] 验证 Docker Compose 配置..."
docker compose config --quiet

echo "[step] 构建并更新 luta-web（不主动停掉现有容器）..."
docker compose up -d --build app

container_id="$(docker compose ps -q app)"
if [[ -z "$container_id" ]]; then
  echo "[error] luta-web 容器未创建"
  docker compose logs --tail=100 app || true
  exit 1
fi

echo "[step] 等待容器健康检查..."
health_status="starting"
for _ in $(seq 1 30); do
  health_status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container_id")"
  if [[ "$health_status" == "healthy" ]]; then
    break
  fi
  if [[ "$health_status" == "unhealthy" || "$health_status" == "missing" ]]; then
    break
  fi
  sleep 2
done

if [[ "$health_status" != "healthy" ]]; then
  echo "[error] luta-web 健康检查失败：${health_status}"
  docker compose logs --tail=100 app || true
  exit 1
fi

if ! docker inspect --format '{{json .NetworkSettings.Networks}}' "$container_id" \
  | grep -q "\"${CADDY_NETWORK_NAME}\""; then
  echo "[error] luta-web 未接入 Caddy 共享网络：${CADDY_NETWORK_NAME}"
  exit 1
fi

echo "[step] 执行本机 Nginx smoke check..."
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:8000/healthz >/dev/null
if ! curl --fail --silent --show-error --max-time 10 http://127.0.0.1:8000/ \
  | grep 'name="luta-homepage-experience" content="marketing-v1"' >/dev/null; then
  echo "[error] / 未返回新版官网构建标记"
  exit 1
fi
if ! curl --fail --silent --show-error --max-time 10 http://127.0.0.1:8000/install \
  | grep 'id="root"' >/dev/null; then
  echo "[error] /install 未返回预期的 SPA 入口"
  exit 1
fi

if [[ -n "$PUBLIC_SMOKE_BASE_URL" ]]; then
  echo "[step] 执行公网 Caddy smoke check：${PUBLIC_SMOKE_BASE_URL}"
  curl --fail --silent --show-error --max-time 15 "${PUBLIC_SMOKE_BASE_URL}/healthz" >/dev/null
  if ! curl --fail --silent --show-error --max-time 15 "${PUBLIC_SMOKE_BASE_URL}/" \
    | grep 'name="luta-homepage-experience" content="marketing-v1"' >/dev/null; then
    echo "[error] 公网 / 未返回新版官网构建标记"
    exit 1
  fi
  if ! curl --fail --silent --show-error --max-time 15 "${PUBLIC_SMOKE_BASE_URL}/install" \
    | grep 'id="root"' >/dev/null; then
    echo "[error] 公网 /install 未返回预期的 SPA 入口"
    exit 1
  fi

  echo "[step] 验证限时 Admin 旧缓存兼容路由..."
  legacy_admin_body="$(mktemp)"
  legacy_admin_headers="$(mktemp)"
  trap 'rm -f "$legacy_admin_body" "$legacy_admin_headers"' EXIT
  legacy_admin_status="$(curl --silent --show-error --max-time 15 \
    --dump-header "$legacy_admin_headers" \
    --output "$legacy_admin_body" --write-out '%{http_code}' \
    "${PUBLIC_SMOKE_BASE_URL}/api/v1/admin/auth/me")"
  legacy_admin_content_type="$(awk '
    tolower($0) ~ /^content-type:/ {
      sub(/^[^:]*:[[:space:]]*/, "")
      sub(/\r$/, "")
      print
      exit
    }
  ' "$legacy_admin_headers")"
  if [[ "$legacy_admin_status" != "401" \
    || "$legacy_admin_content_type" != application/json* ]] \
    || grep -Fq '<div id="root"></div>' "$legacy_admin_body"; then
    echo "[error] 限时 Admin 兼容路由未返回预期的 API JSON 401：${legacy_admin_status}|${legacy_admin_content_type}"
    exit 1
  fi
  rm -f "$legacy_admin_body" "$legacy_admin_headers"
  trap - EXIT
fi

echo "[step] 验证 Luta API 与官网 CORS..."
api_smoke_url="${LUTA_API_BASE_URL}/api/v1/public/attribution/install-context?state=release-smoke-invalid"
api_headers="$(curl --fail --silent --show-error --max-time 15 \
  --header "Origin: ${CORS_SMOKE_ORIGIN}" \
  --dump-header - --output /dev/null \
  "$api_smoke_url")"
cors_allow_origin="$(awk '
  tolower($0) ~ /^access-control-allow-origin:/ {
    sub(/^[^:]*:[[:space:]]*/, "")
    sub(/\r$/, "")
    print
    exit
  }
' <<<"$api_headers")"
if [[ "$cors_allow_origin" != "*" && "$cors_allow_origin" != "$CORS_SMOKE_ORIGIN" ]]; then
  echo "[error] Luta API 未返回允许 ${CORS_SMOKE_ORIGIN} 的 CORS header"
  exit 1
fi

api_body="$(curl --fail --silent --show-error --max-time 15 \
  --header "Origin: ${CORS_SMOKE_ORIGIN}" \
  "$api_smoke_url")"
if ! grep -Eq '"options"[[:space:]]*:[[:space:]]*\[\]' <<<"$api_body" \
  || ! grep -Eq '"decision_reason"[[:space:]]*:' <<<"$api_body"; then
  echo "[error] Smart Link install-context 未返回受控的安全恢复结果"
  exit 1
fi

echo "[step] 验证 Admin 对规范 API 的 CORS 预检..."
admin_preflight_url="${LUTA_API_BASE_URL}/api/v1/admin/auth/login"
admin_preflight_headers="$(curl --fail --silent --show-error --max-time 15 \
  --request OPTIONS \
  --header "Origin: ${ADMIN_CORS_SMOKE_ORIGIN}" \
  --header 'Access-Control-Request-Method: POST' \
  --header 'Access-Control-Request-Headers: content-type' \
  --dump-header - --output /dev/null \
  "$admin_preflight_url")"
admin_cors_allow_origin="$(awk '
  tolower($0) ~ /^access-control-allow-origin:/ {
    sub(/^[^:]*:[[:space:]]*/, "")
    sub(/\r$/, "")
    print
    exit
  }
' <<<"$admin_preflight_headers")"
if [[ "$admin_cors_allow_origin" != "$ADMIN_CORS_SMOKE_ORIGIN" ]]; then
  echo "[error] Luta API 未返回允许 ${ADMIN_CORS_SMOKE_ORIGIN} 的 CORS header"
  exit 1
fi

echo "[ok] luta-web 已更新，官网构建标记、容器健康、限时 Admin 兼容路由与 smoke check 均通过"
echo "[next] 必须再用真实浏览器验证 / 的新版 DOM、语言分流、CTA 与 console"
echo "[info] TLS 和域名路由宿主机 Caddy 管理；本脚本不会修改或 reload Caddy"
