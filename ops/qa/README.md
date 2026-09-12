# QA 官网与 legacy 分享部署

状态：工程候选，未创建 DNS、部署或完成真机验收。负责人：huiminzhou；TASK-102 / QA-102-005。

## 已确认的范围

2026-09-12 用户明确“按上述范围进入最小实现与 PR 阶段”：使用普通部署配置隔离 `qa.lutaai.com` 落地页与 `qa-go.lutaai.com` legacy 分享入口。保留 `registration_plan_v2` 奖励和 legacy website-first 分享语义；不增加账号豁免，不改邀请文案、登录、奖励、Reader 或 Production。不启用 `qa-link`、自动带码或分享 v2。

依据：官网基线 `91a5ed85e203fdaca2816e1fc440e84c08df202b` 的固定 go/link host、Nginx 生产代理和 PostHog 默认；QA 当前分享配置指向正式域，不能证明完整隔离。共享合同见 [邀请 API 合同](https://github.com/lutaSci/luta-docs/blob/6e26ba8d2424/docs/domains/growth-attribution/product/invite-friends-api-contract-2026-07-28.md)。这里只修环境缺口，不声称已发生生产数据污染。

## 构建与验证

生产继续使用原 `docker-compose.yml` / `deploy.sh`，默认行为不变。QA 使用独立 `docker-compose.qa.yml`，不是生产 compose 的覆盖文件。同一个 `VITE_DEPLOYMENT_ENV` 同时选择前端配置及 Nginx；缺失 QA API/分享配置、尝试启用未发布的自动承接或分析上报时，构建失败。QA 的 `/api/*`、`/share/*` 明确 404，不承接生产兼容代理；CSP 只允许连接 QA API 与本站。

```sh
npm ci
npm run lint
npm run test:attribution
npm run build
VITE_DEPLOYMENT_ENV=qa VITE_LUTA_API_BASE=https://qa-api.lutaai.com VITE_ATTRIBUTION_CONTINUE_BASE=https://qa-go.lutaai.com VITE_POSTHOG_ENABLED=false npm run build
QA_WEBSITE_VERSION=<已审查提交> QA_NETWORK=luta-commercial-qa-private docker compose -f docker-compose.qa.yml build website
```

QA 不初始化 PostHog；现有 GA/Meta 正式域门禁保留。服务端 QA 业务/点击记录照常，不改指标口径。QA 静态资源仍可能包含未执行的生产默认常量，因此“原始 JS 零生产域字面量”不是验收标准；应核对有效配置、实际请求及 CSP。未执行的正式默认常量不能被当作已发生外发。

## 部署前必须另行确认

这些是后续操作清单，不是本 PR 的执行记录或授权：

1. 两域 DNS 指向 QA 主机，核对无已有同名服务；检查资源、TLS、当前 QA 镜像与回退点。
2. 后端配套采用 `luta-api` 的 `docker-commercial-qa-share.yml`、`caddy/Caddyfile.qa-share`；官网连接现有 `luta-commercial-qa-private` 网络，别名 `qa-website`，不发布宿主机端口、不连接 Production 网络。
3. 在后端原 root-owned `runtime.env` 合并 `QA_SHARE_CORS_ORIGINS`（保留现有 QA 调用方，追加精确 `https://qa.lutaai.com`）；一次确认后设置 `LUTA_QA_SHARE_ENABLED=true`。常规 QA 发版会保留这个部署覆盖，不是逐用例临时豁免。
4. 先启动已审查官网镜像，再应用后端覆盖；可能短时重建 QA API/IAP/Caddy，须明示影响并 double check。不要在本 PR 合并后自动部署生产官网。
5. 核验健康、TLS、CORS、Nginx/Caddy 实际路由、公开 rules 与配置、无正式分析请求，然后另在具体测试批次生成/打开 QA 分享链接。`/r`、`/me`、`/share-link` 可能写入，不能当只读。

Store 目录不是实装证明；实际 Play 内测资格、包版本/指纹、注册承接仍单独验证。不得卸载或清理现有手机账号/书籍/聊天来制造未安装用例。QA 目录中 APK/其他渠道是否完全就绪不由本阶段承诺。

## 回退

记录官网/API 镜像、启用前配置及 CORS。回退时恢复对应 QA 镜像/配置，设置分享部署开关 false 后重建受影响服务；停止本次官网服务但不删除卷或 QA 网络。配置回退不会撤销已产生的点击、关系、奖励，必须保留账本与测试内容；不能用 `down -v`、清库或撤销普通账号收尾。回退到不含此补丁的 API 版本时，会失去两域路由，应先协调停用分享入口，不宣称仍可验收。
