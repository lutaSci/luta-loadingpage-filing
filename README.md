# LUTA Loading Page

汝塔官网与安装入口，服务 `lutaai.com`、Smart Link 落地、简繁中文营销页面、搜索/社交元数据以及中国 Android 下载交付入口。

## 当前能力

- `lutaai.com` 官网与 `zh-CN` / `zh-TW` 预渲染营销页面
- `/install` Smart Link 安装旅程与失败恢复
- Open Graph、Twitter Card、canonical、hreflang、sitemap 与 robots 合同
- Docker + Nginx 应用容器，经共享 Caddy 网络对外服务
- 中国 Android 不可变 APK 路径及最小化交付日志读取链

## 相关入口

- 官网：<https://lutaai.com>
- 代码仓：<https://github.com/lutaSci/luta-loadingpage-filing>
- 社交分享图规范与来源：[docs/social-preview-asset.md](docs/social-preview-asset.md)

## 技术栈

React 19、Vite 7、React Router 7、Tailwind CSS 4、Nginx、Docker 与 Caddy。精确版本以 `package-lock.json` 和镜像构建文件为准。

## 本地开发

```bash
git clone git@github.com:lutaSci/luta-loadingpage-filing.git
cd luta-loadingpage-filing
npm ci
npm run dev
```

完整校验：

```bash
npm run test:attribution
npm run build
npm run lint
```

## 主要目录

```text
src/components/marketing/  官网营销页面组件
src/content/marketing/     简繁中文营销内容
src/lib/                   Smart Link、安装、SEO 与分析合同
public/                    公共静态资源和 crawler discovery 文件
scripts/                   营销页面预渲染
ops/                       Caddy 与 APK 交付运维资产
tests/                     Node 与 Python 合同测试
```

## 🌐 生产部署：Docker + 共享网络 Caddy

Cloudflare Pages 不是当前生产发布链路。生产拓扑固定为：

```text
用户浏览器
  ├─ https://lutaai.com/*
  │    → Caddy 容器 :443
  │    → caddy_default 私有 Docker 网络
  │    → Docker 容器 applanding / Nginx :80
  └─ https://api.lutaai.com/api/*
       → 浏览器直连 Luta API
```

官网自身不依赖同源 `/api` 代理。`VITE_LUTA_API_BASE` 默认且生产应为 `https://api.lutaai.com`；非 localhost 的 HTTP API 配置会被拒绝并回退到该默认值。因此同一份构建在 Docker 和静态 preview 中都能请求 Smart Link install-context。

根首页按已有语言偏好兼容切换：简体中文与繁体中文使用新版 Marketing Landing，英文、日文和韩文继续使用原五语言首页，直到对应 Marketing 文案与设计完成独立审批。`/global/zh-cn` 与 `/global/zh-tw` 仍保留为可直接访问的明确内容路由；路径只表达语言，不覆盖市场判定。

官网不提供宽泛的同源 `/api/*` 网关。Admin 新版本直接请求 `https://api.lutaai.com/api`；为覆盖此前已缓存的旧 bundle，官网临时保留且只保留 `/api/v1/admin/*` 兼容代理。该路由响应带 `X-Luta-Compatibility: admin-api-legacy` 与 `Cache-Control: no-store`，计划在 2026-08-05 后且连续 7 天零命中时移除。新业务与后台新版本不得依赖该兼容通道。

### 发布前提

- 使用已评审、已提交的 release commit，不从 dirty worktree 发布。
- 宿主机已安装 Docker Compose v2 和 `curl`。
- Caddy 容器正在管理 `lutaai.com` / `lutaai.co` 的 DNS、TLS 和 80/443。
- 外部网络 `caddy_default` 已存在；Caddy 通过容器名 `applanding:80` 转发官网流量。
- `127.0.0.1:8000` 只用于宿主机 smoke check，不对公网直接暴露。
- `https://api.lutaai.com` 允许官网和 `https://admin.lutaai.com` 的 CORS 请求，且后端已先于网页发布。

### 发布命令

```bash
# 默认在更新容器后检查 https://lutaai.com
./deploy.sh

# 隔离的 staging 主机可显式跳过公网 Caddy 检查；生产不应使用
PUBLIC_SMOKE_BASE_URL='' ./deploy.sh
```

`deploy.sh` 会：

1. 检查 Compose、curl 和 `caddy_default` 共享网络，并验证 Compose 配置。
2. 执行 `docker compose up -d --build app`，不先 `down` 整个服务。
3. 等待容器 `/healthz` 进入 `healthy`。
4. 验证本机 `/healthz`、根首页 `marketing-v1` 标记和 `/install` SPA 入口。
5. 验证 Caddy 公网 `/healthz`、根首页 `marketing-v1` 标记和 `/install`。
6. 直连 Smart Link install-context，验证安全恢复 JSON 和官网 CORS header。
7. 验证 Admin origin 对规范 API 的预检，并验证限时 `/api/v1/admin/*` 兼容路由返回 API JSON 401，而不是 SPA HTML。

脚本不会修改或 reload 共享 Caddy 容器。如果 `Caddyfile` 有变更，应按服务器配置管理流程同步后，先验证再 reload：

```bash
docker exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

`download.lutaai.com` 的期望生产站点块单独记录在 [`ops/caddy/download.lutaai.com.caddy`](ops/caddy/download.lutaai.com.caddy)。中国 Android 新版本只使用版本 + SHA 不可变路径；该前缀通过 HTTPS 直连 `luta-public` OSS endpoint，同时保留已绑定的 `Host: static.lutaai.co`。受控出站接口签发`/dl/{traffic_purpose}/{download_id}/{artifact_size}/releases/android/china/{version+build}/{sha256}.apk`；Caddy 在回源前移除受控前缀，并仅把用途、不透明`download_id`、`artifact_id`、预期大小、粗粒度机器人标记、版本、构建、HTTP 状态、实际响应`Content-Range`和实际写出字节写入专用滚动日志。请求 URI、IP、User-Agent 原文、请求 Range、完整响应头和其他请求头不得进入该日志。不要把该回源改成 `https://static.lutaai.co`：它会再次经过 Cloudflare，并可能把上传前的 OSS `NoSuchKey` 缓存为长期 404。历史路径继续回源 `luta-app`。

`admin.lutaai.com` 的期望生产站点块记录在 [`ops/caddy/admin.lutaai.com.caddy`](ops/caddy/admin.lutaai.com.caddy)：HTML 与 SPA fallback 必须 `no-store`，带 hash 的静态资源保持一年 immutable。这样浏览器每次导航都会取得当前入口文件，同时历史 bundle 在兼容窗口内仍可完成迁移。

生产 `/home/caddy/Caddyfile` 是 Docker 单文件 bind mount。若通过原子替换改变宿主机 inode，运行中的容器仍可能读取旧 inode；此时不能只执行 reload。应先验证候选配置，再重建 `caddy` 单个容器使挂载持久生效，并立即 smoke 官网、旧 APK URL 和新的不可变 APK URL。

生产当前固定使用 Caddy 2.8.4。该版本的 file writer 不支持`mode`子指令，实际创建的 active/rotated log 为`0600`；宿主机持久目录应保持`root:root 0700`。组织读取链使用 [`ops/apk_delivery/apk_delivery_reader.py`](ops/apk_delivery/apk_delivery_reader.py) 作为 root-owned 最小投影器：它只发送合同白名单字段；每条完整 JSONL 另发送匿名 file hash、字节起止位和“是否包含投影事件”布尔值，让 API 独立持久化原始水位并验证完整连续性。普通无资格记录因此可以合法桥接两个合格事实，但缺字节、重叠、部分资格 envelope、内容冲突和批次断链仍失败关闭。该协议必须先部署 API migration/code，再部署 reader；不得用放宽 offset 比较或跳 state 代替。读取链不向 Web 主机放置数据库凭据。轮转必须设置 `roll_uncompressed`，以便保留可重放的 JSONL 字节水位；`roll_keep_for=840h`保留 35 天，`roll_keep=-1`禁用数量上限，同时必须监控磁盘容量。服务单元只从 `/etc/luta/apk-delivery-reader.env` 读取独立 ingest key 与 source ID；该文件、运行 state、binding 和原始日志均不得提交 Git。API binding 未激活或读取链未完成验收前，日报仍必须报告`unknown`。部署后必须用`traffic_purpose=smoke`签发的真实 token 请求不可变对象的 Range 小段，验证日志只有上述字段且`response_content_range`来自实际响应；随后恢复部署前 Caddyfile并重建单个 Caddy 容器完成回滚演练，再重新应用候选。不得用 production token 制造验收量，不得把 smoke 计入经营数据。

若 PR #19 之前的 site-scoped named logger 已把普通访问写入专用日志，不得直接删除这些行、放宽 API offset 连续性或手工把 reader state 跳到文件末尾。先停止 reader timer 与 Caddy writer，对 [`recover_unqualified_access_logs.py`](ops/apk_delivery/recover_unqualified_access_logs.py) 执行只读计划；确认只出现“完整资格 envelope”与“完整无资格 envelope”两类记录后，再用 `--apply` 将未读合格记录逐字节压入新的 root-only transport file。原文件和 state 备份进入同级 `0700` rollback 目录，并继续受 35 日保留与磁盘监控约束。恢复后的 reader 必须从新文件 offset 0 成功 ingest，且普通请求不得再增加专用日志；任何部分资格 envelope、JSON 损坏、写入增长或 API 拒绝都必须失败关闭并恢复原文件/state。

APK 路由验收除真实对象 200 外，还要用同一个不存在路径连续请求两次：两次响应都应来自 `AliyunOSS`、OSS Request ID 应不同、响应不得出现 `CF-Cache-Status: HIT`。这项测试用于证明 404 没有重新进入 CDN 负缓存。

### 构建参数

| 变量 | 默认值 | 作用 |
|---|---|---|
| `VITE_LUTA_API_BASE` | `https://api.lutaai.com` | 编译进静态资源的 Luta API origin；只允许 HTTPS，localhost 开发例外 |
| `PUBLIC_SMOKE_BASE_URL` | `https://lutaai.com` | 发布后公网 smoke 域名；生产保持默认 |
| `LUTA_API_BASE_URL` | `https://api.lutaai.com` | 发布脚本验证的 API origin |
| `CORS_SMOKE_ORIGIN` | `PUBLIC_SMOKE_BASE_URL` | API 必须明确允许的官网 origin |
| `ADMIN_CORS_SMOKE_ORIGIN` | `https://admin.lutaai.com` | API 必须明确允许的 Admin origin |
| `CADDY_NETWORK_NAME` | `caddy_default` | 官网容器与 Caddy 共享的外部 Docker 网络 |

### 手动验收

```bash
curl --fail https://lutaai.com/healthz
curl --fail https://lutaai.com/install
curl --include https://lutaai.com/api/v1/admin/auth/me
curl --fail 'https://api.lutaai.com/api/v1/public/attribution/install-context?state=invalid-smoke-state'
curl --include --request OPTIONS \
  --header 'Origin: https://admin.lutaai.com' \
  --header 'Access-Control-Request-Method: POST' \
  --header 'Access-Control-Request-Headers: content-type' \
  https://api.lutaai.com/api/v1/admin/auth/login
```

Admin 兼容请求必须返回带 `X-Luta-Compatibility: admin-api-legacy` 的 JSON 401，不得返回官网 SPA HTML。install-context 请求可以返回受控的 invalid-state 业务结果，但不得出现 DNS、TLS、CORS、Nginx HTML 或原始服务器错误页。最后一个预检请求必须返回 `Access-Control-Allow-Origin: https://admin.lutaai.com`。

## 开发与提交

- 只使用 `package.json` 中存在的脚本；提交前运行 `npm run test:attribution`、`npm run build` 和 `npm run lint`。
- 从最新 `origin/main` 创建短生命周期功能分支，通过 Pull Request 交付；生产发布使用已评审、已合并的精确提交。
- 不在源码中提交构建产物、嵌套 Git 目录、凭据或本地运行状态。
- WebGL 兼容首页按路由懒加载；当前构建上限为 880 kB raw，超过时必须重新审查拆包或退役路线，不能继续抬高阈值。

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

本项目最初基于 [`liseami/applanding-open`](https://github.com/liseami/applanding-open) 的 MIT 版本演进；上游版权与许可声明保留在 [LICENSE](LICENSE) 中。该上游链接只用于来源归属，不是当前 LUTA 产品、发布或问题反馈入口。
