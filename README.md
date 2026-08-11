# 🚀 AppLanding - 现代化应用落地页开发框架

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄     ▄▄▄▄▄▄▄ ▄▄    ▄ ▄▄▄▄▄▄  ▄▄▄▄▄▄▄ ▄▄    ▄  ║
║   █       █       █       █   █   █       █  █  █ █      ██       █  █  █ █ ║
║   █   ▄   █    ▄  █    ▄  █   █   █   ▄   █   █▄█ █  ▄    █   ▄   █   █▄█ █ ║
║   █  █▄█  █   █▄█ █   █▄█ █   █   █  █▄█  █       █ █ █   █  █ █  █       █ ║
║   █       █    ▄▄▄█    ▄▄▄█   █▄▄▄█       █  ▄    █ █▄█   █  █▄█  █  ▄    █ ║
║   █   ▄   █   █   █   █   █       █   ▄   █ █ █   █       █       █ █ █   █ ║
║   █▄▄█ █▄▄█▄▄▄█   █▄▄▄█   █▄▄▄▄▄▄▄█▄▄█ █▄▄█▄█  █▄▄█▄▄▄▄▄▄█▄▄▄▄▄▄▄█▄█  █▄▄█ ║
║                                                                               ║
║   🎯 专业级应用落地页开发框架 | 极致性能 | 现代化设计 | 开箱即用            ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.11-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Caddy](https://img.shields.io/badge/Caddy-1F88C0?style=for-the-badge&logo=caddy&logoColor=white)](https://caddyserver.com/)

## 📖 项目简介

**AppLanding** 是一个高性能、现代化的应用落地页开发框架，专为移动应用推广而设计。基于 React + Vite 构建，集成了丰富的视觉效果和交互动画，提供开箱即用的解决方案。

### 🎨 核心特性

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  🎪 视觉效果          🌐 多语言支持          📱 响应式设计                   │
│  ├─ 3D丝绸背景        ├─ 动态语言切换        ├─ 移动端优先                   │
│  ├─ 粒子系统          ├─ 上下文状态管理      ├─ 断点适配                     │
│  ├─ 弹幕效果          └─ 本地化内容          └─ 触摸优化                     │
│  └─ 点赞动画                                                               │
│                                                                             │
│  🚀 性能优化          🔧 开发体验          📦 部署方案                       │
│  ├─ 懒加载组件        ├─ 热模块替换        ├─ Docker + Nginx                │
│  ├─ 代码分割          ├─ ESLint规范        ├─ Caddy HTTPS 入口               │
│  ├─ 资源压缩          ├─ 路径别名          └─ 健康检查与 smoke gate          │
│  └─ Tree Shaking     └─ 开发服务器                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔗 相关链接

- [项目主页](https://github.com/liseami/applanding-open)
- [在线演示](https://koudai.chunxiang.space)
- [问题反馈](https://github.com/liseami/applanding-open/issues)


## 🛠️ 技术栈

### 核心框架
- **React 19.1.0** - 最新版本的React，支持并发特性
- **Vite 7.0.0** - 下一代前端构建工具，极速开发体验
- **React Router 7.6.3** - 现代化路由解决方案

### 样式与动画
- **Tailwind CSS 4.1.11** - 原子化CSS框架
- **Framer Motion 12.19.2** - 高性能动画库
- **GSAP 3.13.0** - 专业级动画引擎
- **Three.js 0.177.0** - 3D图形渲染

### UI组件
- **Radix UI** - 无样式的可访问UI组件
- **Lucide React** - 现代化图标库
- **Class Variance Authority** - 样式变体管理

## 🚀 快速开始

### 环境要求
```bash
# Node.js 版本要求
node >= 18.0.0
npm >= 8.0.0
```

### 安装与启动
```bash
# 1. 克隆项目
git clone git@github.com:lutaSci/luta-loadingpage-filing.git
cd luta-loadingpage-filing

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 构建生产版本
npm run build

# 5. 预览生产版本
npm run preview
```

## 🏗️ 项目结构

```
applanding-open/
├── 📁 src/
│   ├── 📁 components/          # 🎨 UI组件库
│   │   ├── DanmakuEffect.jsx   # 弹幕效果组件
│   │   ├── LikeEffect.jsx      # 点赞动画组件
│   │   ├── ParticleSystem.jsx  # 粒子系统
│   │   ├── Silk.jsx            # 3D丝绸背景
│   │   ├── LanguageSwitch.jsx  # 语言切换器
│   │   ├── MainContent.jsx     # 主要内容区
│   │   ├── Footer.jsx          # 页脚组件
│   │   └── 📁 ui/              # 基础UI组件
│   │       ├── button.jsx      # 按钮组件
│   │       ├── card.jsx        # 卡片组件
│   │       └── badge.jsx       # 徽章组件
│   ├── 📁 contexts/            # 🔄 React上下文
│   │   └── LanguageContext.jsx # 语言上下文
│   ├── 📁 design/              # 🎨 设计系统
│   │   ├── colors.js           # 颜色规范
│   │   └── designSystem.js     # 设计令牌
│   ├── 📁 config/              # ⚙️ 配置文件
│   │   └── index.js            # 应用配置
│   ├── 📁 content/             # 📄 内容文件
│   │   ├── privacy.md          # 隐私政策
│   │   └── terms.md            # 使用条款
│   ├── 📁 pages/               # 📱 页面组件
│   │   ├── Contact.jsx         # 联系页面
│   │   ├── Privacy.jsx         # 隐私页面
│   │   └── Terms.jsx           # 条款页面
│   ├── 📁 lib/                 # 🔧 工具函数
│   │   └── utils.js            # 通用工具
│   └── 📁 assets/              # 🖼️ 静态资源
│       └── *.png               # 图片资源
├── 📁 public/                  # 🌐 公共资源
│   ├── _redirects              # 重定向规则
│   └── *.png                   # 公共图片
└── 📄 配置文件
    ├── vite.config.js          # Vite配置
    ├── tailwind.config.js      # Tailwind配置
    ├── package.json            # 项目依赖
    └── eslint.config.js        # 代码规范
```

## ⚙️ 配置指南

### 应用配置
编辑 `src/config/index.js` 文件来自定义您的应用：

```javascript
export const config = {
    app: {
        name: '您的应用名称',
        version: '1.0.0',
        description: '应用描述'
    },
    downloads: {
        ios: 'App Store链接',
        android: 'Google Play或APK链接'
    },
    social: {
        twitter: 'Twitter链接',
        github: 'GitHub链接',
        email: '联系邮箱'
    }
}
```

### 设计系统
通过 `src/design/colors.js` 和 `src/design/designSystem.js` 自定义主题：

```javascript
// colors.js - 颜色规范
export const Colors = {
    primary: {
        50: '#f0f9ff',
        500: '#3b82f6',
        900: '#1e3a8a'
    },
    // ... 更多颜色定义
}
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

`download.lutaai.com` 的期望生产站点块单独记录在 [`ops/caddy/download.lutaai.com.caddy`](ops/caddy/download.lutaai.com.caddy)。中国 Android 新版本只使用版本 + SHA 不可变路径；该前缀通过 HTTPS 直连 `luta-public` OSS endpoint，同时保留已绑定的 `Host: static.lutaai.co`。受控出站接口签发`/dl/{traffic_purpose}/{download_id}/{artifact_size}/releases/android/china/{version+build}/{sha256}.apk`；Caddy在回源前移除受控前缀，并仅把用途、不透明`download_id`、`artifact_id`、预期大小、Range、粗粒度机器人标记、版本构建、HTTP状态、响应字节和耗时写入0600滚动日志。请求URI、IP、User-Agent原文和其他请求头不得进入该日志。不要把该回源改成 `https://static.lutaai.co`：它会再次经过Cloudflare，并可能把上传前的OSS `NoSuchKey`缓存为长期404。历史路径继续回源`luta-app`。

`admin.lutaai.com` 的期望生产站点块记录在 [`ops/caddy/admin.lutaai.com.caddy`](ops/caddy/admin.lutaai.com.caddy)：HTML 与 SPA fallback 必须 `no-store`，带 hash 的静态资源保持一年 immutable。这样浏览器每次导航都会取得当前入口文件，同时历史 bundle 在兼容窗口内仍可完成迁移。

生产 `/home/caddy/Caddyfile` 是 Docker 单文件 bind mount。若通过原子替换改变宿主机 inode，运行中的容器仍可能读取旧 inode；此时不能只执行 reload。应先验证候选配置，再重建 `caddy` 单个容器使挂载持久生效，并立即 smoke 官网、旧 APK URL 和新的不可变 APK URL。

生产绑定前必须确认`/var/log/caddy`由宿主机持久目录挂载，且宿主机目录仅管理员可读。部署后以不存在的合成`download_id`请求真实不可变对象的Range小段，验证日志只含上述字段；随后恢复部署前Caddyfile并重建单个Caddy容器完成回滚演练，再重新应用候选。不得用完整APK下载制造交付量，不得把smoke计入经营数据。

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

## 🎯 开发指南

### 组件开发规范

#### 1. 组件结构
```jsx
// 标准组件模板
import { memo, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │                                                             │
 * │   🎨 ComponentName - 组件描述                               │
 * │                                                             │
 * │   功能：详细描述组件功能和用途                               │
 * │   依赖：列出主要依赖项                                       │
 * │   性能：说明性能优化措施                                     │
 * │                                                             │
 * ╰─────────────────────────────────────────────────────────────╯
 */

const ComponentName = memo(({ 
  prop1, 
  prop2 = 'defaultValue',
  ...restProps 
}) => {
  // 🔄 状态管理
  const [state, setState] = useState(initialValue)
  
  // 🎯 计算属性
  const computedValue = useMemo(() => {
    return expensiveComputation(prop1, prop2)
  }, [prop1, prop2])
  
  // 🎪 事件处理
  const handleEvent = useCallback(() => {
    // 事件处理逻辑
  }, [])
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      {...restProps}
    >
      {/* 组件内容 */}
    </motion.div>
  )
})

ComponentName.displayName = 'ComponentName'
export default ComponentName
```

#### 2. 性能优化原则
- 使用 `memo` 包装组件避免不必要的重渲染
- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 缓存函数引用
- 合理使用 `lazy` 和 `Suspense` 进行代码分割

#### 3. 样式规范
```jsx
// 使用 Tailwind 的最佳实践
const buttonVariants = {
  default: "bg-blue-500 hover:bg-blue-600 text-white",
  outline: "border-2 border-blue-500 text-blue-500 hover:bg-blue-50",
  ghost: "text-blue-500 hover:bg-blue-50"
}

// 使用 className 组合
const className = cn(
  "base-classes",
  buttonVariants[variant],
  size === 'large' && "px-8 py-4 text-lg",
  disabled && "opacity-50 cursor-not-allowed",
  props.className
)
```

### 动画开发指南

#### 1. Framer Motion 最佳实践
```jsx
// 预定义动画变体
const animations = {
  container: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  item: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.4, ease: "easeOut" }
  }
}

// 使用动画变体
<motion.div variants={animations.container}>
  <motion.div variants={animations.item} />
</motion.div>
```

#### 2. GSAP 集成
```jsx
// GSAP 时间线动画
const tl = useRef()

useEffect(() => {
  tl.current = gsap.timeline()
    .fromTo('.element', 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
    )
    .to('.element', 
      { scale: 1.1, duration: 0.3, ease: "power2.inOut" }, 
      "-=0.2"
    )
  
  return () => tl.current.kill()
}, [])
```

## 🔧 开发工具

### 代码规范
```bash
# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 类型检查（如果使用TypeScript）
npm run type-check
```

### 调试工具
```bash
# 开发服务器（带调试信息）
npm run dev -- --debug

# 构建分析
npm run build -- --analyze

# 性能分析
npm run preview -- --host
```

## 📊 性能监控

### 关键指标
- **FCP (First Contentful Paint)**: < 1.5s
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### 监控工具
```bash
# Lighthouse 性能测试
npx lighthouse http://localhost:3000 --view

# Bundle 分析
npx vite-bundle-analyzer dist
```

## 🤝 贡献指南

### 开发流程
1. Fork 项目到您的 GitHub 账号
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

### 提交规范
```bash
# 提交类型
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式化
refactor: 重构代码
test: 添加测试
chore: 构建或工具更改

# 提交格式
git commit -m "feat: 添加3D背景效果组件"
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件


---

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   🎉 感谢您选择 AppLanding！                                                 ║
║                                                                               ║
║   如果这个项目对您有帮助，请给我们一个 ⭐️                                    ║
║   您的支持是我们持续改进的动力！                                              ║
║                                                                               ║
║   📧 联系我们：liseami@qq.com                                                ║
║   🐦 关注我们：@liseami1                                                     ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```
