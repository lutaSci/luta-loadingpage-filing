#!/usr/bin/env bash
set -euo pipefail

if [[ "${ACME_EMAIL:-}" == "" ]]; then
  echo "[info] ACME_EMAIL 未设置，将使用 Caddy 默认账户（建议设置可接收通知的邮箱）。"
  echo "[hint] 示例：export ACME_EMAIL=ops@lutaai.co"
else
  echo "[info] 使用 ACME_EMAIL=${ACME_EMAIL}"
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "[error] docker compose 不可用，请安装 Docker Desktop 或 Compose v2"
  exit 1
fi

echo "[step] 停止可能在运行的服务..."
docker compose down || true

echo "[step] 构建并后台启动服务..."
docker compose up -d --build

echo "[ok] 启动完成。首次签发证书可能需数十秒。"
echo "[next] 访问：https://lutaai.co 与 https://lutaai.com"
echo "[tip] 查看日志：docker logs -f caddy | cat"

docker compose up -d --build
