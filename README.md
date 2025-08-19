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
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)

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
│  ├─ 懒加载组件        ├─ 热模块替换        ├─ Cloudflare Pages              │
│  ├─ 代码分割          ├─ ESLint规范        ├─ 自动化部署                     │
│  ├─ 资源压缩          ├─ 路径别名          └─ CDN加速                       │
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
git clone https://github.com/your-username/applanding-open.git
cd applanding-open

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

## 🌐 Cloudflare Pages 部署指南

### 准备工作
1. 确保您的项目已推送到 Git 仓库（GitHub、GitLab等）
2. 注册 [Cloudflare](https://cloudflare.com) 账号
3. 进入 Cloudflare Dashboard

### 部署步骤

#### 1. 创建 Pages 项目
```bash
# 在 Cloudflare Dashboard 中
Pages → Create a project → Connect to Git
```

#### 2. 配置构建设置
```yaml
# 构建配置
Build command: npm run build
Build output directory: dist
Root directory: (留空)
Environment variables:
  NODE_VERSION: 18
```

#### 3. 高级配置
在项目根目录创建 `wrangler.toml` 文件：

```toml
# wrangler.toml
name = "applanding-open"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

#### 4. 自定义域名配置
```bash
# 在 Cloudflare Pages 项目中
Custom domains → Add custom domain
# 输入您的域名，如：app.yourdomain.com
```

#### 5. 环境变量设置
```bash
# 在 Pages 项目设置中
Settings → Environment variables
# 添加生产环境变量
```

### 部署优化

#### 性能优化
```javascript
// vite.config.js 生产优化
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'gsap'],
          three: ['three', '@react-three/fiber']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
```

#### 缓存配置
```javascript
// public/_headers 文件
/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/sw.js
  Cache-Control: public, max-age=0, must-revalidate
```

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
