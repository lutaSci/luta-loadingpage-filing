# LUTA Landing Page 文案与技术交接

> 2026-08-06 更新：China iOS 的新版体验入口已从隐藏测试参数改为普通官网默认可见；普通官网参数不再被当作服务端 Smart Link 身份，TestFlight 官方工具页固定直达 Apple。本文中 TestFlight、验收与风险章节已同步为当前规则。国际市场与 Smart Link 目录治理边界不变。

## 1. 交付基线

- 仓库：`lutaSci/luta-loadingpage-filing`
- 分支基线：`main`
- 精确 Commit：`fb0ff46407fcc8f11063f37b6bc2c08132f90d46`
- 基线提交时间：2026-08-03 03:19:00 UTC
- 交付日期：2026-08-03（Asia/Shanghai）
- 原则：未改写日文、韩文主体；仅同步产品语言说明、`TaBao` 大小写及必要的安装/状态文案。

## 2. 代码变更清单

### 用户指定的完整替换文件

- `src/content/marketingLanding.js`：简中、繁中全部获批文案；下载、状态、恢复文案。
- `src/content/marketing/en.js`：英文全文重写；产品语言说明；下载、状态、恢复文案。
- `src/lib/installCopy.js`：五语种安装页关键文案。
- `index.html`：根页面 SEO、Open Graph、Twitter Card、canonical、完整 hreflang 集群及绝对图片地址。

### 为使批准规则真正生效而同步修改的文件

- `src/content/marketing/ja.js`、`src/content/marketing/ko.js`：产品语言说明、`TaBao`、必要安装文案。
- `src/components/marketing/StoreActionGroup.jsx`：在下载区实际显示产品语言说明。
- `src/lib/marketingStoreActions.js`、`src/components/marketing/useStoreActionAdapter.js`：China iOS 默认显示新版体验入口；国际市场不显示；精确参数 `?testflight=1` 只恢复已展开的两步指引。
- `src/lib/installFlow.js`：正式 App Store 路径不可用而等待通知可用时，优先展示等待通知。
- `src/lib/marketingSeo.js`、`src/pages/MarketingLanding.jsx`：客户端导航后同步更新全部 metadata。
- `scripts/prerender-marketing.mjs`、`package.json`、`nginx.conf`：构建五份本地化 HTML，并由生产服务器直接返回；语言路由继续复用 Smart Link bearer-aware `no-store` 缓存策略。
- `public/robots.txt`、`public/sitemap.xml`：声明抓取边界并让根页与五个显式语言路由可被稳定发现。
- `tests/*.test.mjs`：覆盖文案契约、安装逻辑、TestFlight、SEO、canonical、hreflang 与生产路由。

## 3. 最终简体中文文案

### Metadata

- Title：`汝塔 LUTA｜佛教经典阅读与修学辅助工具`
- Description：`从佛教经典原文开始，在需要时获得 AI 辅助理解，并通过计划与记录建立可以持续的个人修学历程。`
- Keywords：`汝塔,LUTA,佛教经典,经典阅读,AI辅助理解,修学计划,个人修学`

### 导航

- 为什么选择汝塔
- 汝塔能做什么
- 我们的原则
- 下载汝塔

### Hero

- Eyebrow：`面向全球中文读者的佛教经典阅读与修学辅助工具`
- 标题：`从经典原文开始，建立自己的长期修学路径。`
- 正文：`阅读佛教经典原文，在需要时获得 AI 辅助理解，并通过计划、进度与记录，让每一次阅读、思考与实践逐渐连接成可回望、可继续的个人历程。`
- 移动端正文：`从经典原文开始，AI 辅助理解。记录每一次阅读、思考与实践。`
- Caption：`经典阅读 · 塔宝辅助 · 计划与记录`
- 三张界面标签：`今日慧语`、`经典阅读`、`塔宝辅助`

### 为什么选择汝塔

- 标题：`经典并不难找。难的是理解，并持续读下去。`
- 正文：`找到一部经典只是开始。真正的挑战，是理解原文、建立稳定节奏，并把零散的阅读、思考与实践积累为一段可以继续的个人历程。`
- 移动端：`从阅读经典、辅助理解，到建立节奏并留下记录，汝塔让每一步彼此连接。`
- 路径：`阅读经典` → `建立节奏` → `沉淀历程`

### 阅读经典

- 标题：`理解经典，从原文开始。`
- 正文：`阅读经典原文；需要时，再查看背景、义理脉络与术语解释，让辅助理解始终回到经文本身。`
- 经典原文为本：`先读原文，再作延伸，保留经文的完整语境。`
- AI 仅作辅助：`帮助梳理背景、概念与上下文，不替代经典原文、传统注疏或个人判断。`
- 专注阅读体验：`工具只在需要时出现，让注意力留在经文上。`

### 修学计划

- 标题：`建立节奏，让长期修学落到每天。`
- 正文：`将想长期坚持的阅读与实践拆解为清晰计划，通过目标、进度和每日任务，建立适合自己的修学节奏。`
- 移动端：`通过计划、目标与进度，把长期意愿变成今天可以完成的行动。`
- 今日任务清晰：`把阅读与实践拆解为今天可以完成的行动。`
- 进度持续可见：`知道已经完成了什么，也知道下一步从哪里开始。`
- 路径由您决定：`工具帮助规划与记录，不替代个人的修学选择。`

### 个人历程

- 标题：`记录每一次阅读、思考与实践。`
- 正文：`保存读过的内容、当下的思考与持续实践，把零散片段连接成一段可回望、可继续的个人修学历程。`
- 移动端：`把零散片段连接成一段可回望、可继续的个人修学历程。`
- 阅读留下记录：`每一次进入经典，都成为个人历程的一部分。`
- 思考逐渐累积：`保存当下的理解，日后回看自己的变化。`
- 计划连接记录：`让今天的行动与长期历程彼此连接。`

### 原则

- 标题：`技术退后一步，让经典与人留在中心。`
- 尊重传统：`以经典原文为基础，尊重传统文本、注疏与解释脉络。`
- AI 仅作辅助：`帮助理解内容与语境，不替代经典原文、传统注疏、个人判断或老师指导。`
- 支持长期探索：`通过阅读、计划与记录，支持稳定而持续的个人修学历程。`

### 最终 CTA

- 标题：`从一段经典开始。`
- 正文：`让阅读、理解、计划与记录，逐渐连接成一段可以长期继续的个人历程。`

### 下载与状态

- 区域标签：`选择适合此设备的下载方式`
- App Store：`前往 App Store 下载` / `前往 App Store 查看并安装正式版本`
- 地区等待：`所在地区开放后通知我` / `所在地区开放后，我们将通过邮件通知您`
- Google Play：`前往 Google Play 下载` / `通过 Google Play 安装官方版本`
- Android：`下载经校验的官方 Android 安装包` / `核对版本与文件信息后下载`
- 新版体验：`体验新版汝塔` / `内测版，需要完成 2 步`
- 第 1 步：`安装苹果官方工具` / `支持 iOS 16 及以上；安装完成不要点“打开”，请直接返回本页面`
- 第 2 步：`安装新版汝塔` / `返回本页面点击这里，再按提示完成安装`
- 兑换码恢复：`看到“输入兑换码”？不用填写。返回浏览器，点击“第 2 步 · 安装新版汝塔”即可。`
- 等待说明：`邮箱仅用于所在地区的 iOS 开放通知。点击按钮后，请完成表单提交；未提交的表单不会登记邮箱。`
- 不可用标题：`此链接暂时不可用`
- 恢复说明：`无需担心，您的操作没有问题。我们不会将您带到不可用的商店；您仍可查看官网当前可用的下载方式。`

## 4. 最终繁体中文原则

繁中逐段与简中完全同步，不保留旧版本差异；核心文案为：

- Title：`汝塔 LUTA｜佛教經典閱讀與修學輔助工具`
- Hero：`從經典原文開始，建立自己的長期修學路徑。`
- Caption：`經典閱讀 · 塔寶輔助 · 計畫與記錄`
- Eyebrow：`面向全球中文讀者的佛教經典閱讀與修學輔助工具`
- CTA：`從一段經典開始。`
- 全页人称统一为`您`。
- 权利标点修正为`保留所有權利。`
- 公司法定名称及 ICP 备案号保持原始简体，不作本地化。

完整繁中逐字段值以 `src/content/marketingLanding.js` 中 `zh-tw` 对象为唯一执行真源。

## 5. Final English Copy

### Metadata

- Title: `LUTA | Read Chinese Buddhist Scriptures with AI Support`
- Description: `Read Chinese Buddhist scriptures, use AI-assisted explanations when needed, and keep your reading, reflections, and personal study connected over time.`
- Keywords: `LUTA,Chinese Buddhist scriptures,Buddhist reading app,AI-assisted scripture reading,reading and study plan,reading progress`

### Navigation

- Why LUTA
- What LUTA does
- Our principles
- Download LUTA

### Hero

- Eyebrow: `A Chinese-language companion for reading and studying Buddhist scriptures`
- Title: `Read Buddhist scriptures. Find a reading pace you can sustain.`
- Lead: `Begin with the scripture itself. Use AI-assisted explanations when needed, and keep your reading, reflections, and personal study connected over time.`
- Mobile lead: `Begin with the scripture itself. Use AI when needed. Keep track of your journey.`
- Caption: `Scripture reading · TaBao support · Plans and records`

### Why LUTA

- Title: `The scriptures are easy to find. Understanding them—and returning to them—is harder.`
- Description: `Finding a scripture is only the beginning. The real challenge is to understand the text, find a steady reading pace, and carry each reading forward as part of a longer journey.`
- Mobile: `From reading and understanding to finding your pace and keeping a record, LUTA helps each step stay connected.`
- Journey: `Read the scripture` → `Find your reading pace` → `Keep a record`

### Scripture reading

- Title: `Understanding begins with the text.`
- Description: `Read the scripture itself, then turn to background, key ideas, and terminology when needed—without losing sight of the passage and its wider context.`
- The text comes first: `Read the passage before exploring further, and keep it within its full context.`
- AI remains an aid: `Use it to clarify language, context, and key ideas—not to replace scripture, traditional commentaries, personal judgment, or guidance from teachers.`
- A focused reading experience: `Tools appear only when needed, leaving your attention with the text.`

### Reading and study plan

- Title: `Find a reading pace you can sustain.`
- Description: `Turn long-term reading and study intentions into a clear plan with defined goals, visible progress, and manageable actions for today.`
- Mobile: `Turn long-term intentions into clear actions you can complete today.`
- A clear plan for today: `Break reading and reflection into manageable actions for the day.`
- Progress you can return to: `See what you have completed and where the next step begins.`
- Your path remains yours: `LUTA helps you plan and keep track; it does not choose your path for you.`

### Your journey

- Title: `Keep a record of what you read, reflect on, and practice.`
- Description: `Preserve what you have read, reflected on, and practiced, and connect separate moments into a personal journey you can revisit and continue.`
- Every reading leaves a record: `Each return to a scripture becomes part of a longer journey.`
- Reflections gather over time: `Preserve what you understand now and later see how it has changed.`
- Plans connect with progress: `Bring daily actions and long-term records together.`

### Principles

- Title: `Let technology step back, so the scriptures and the reader remain at the center.`
- Rooted in tradition: `Ground the experience in scripture and respect established texts, commentaries, and living traditions.`
- AI is an aid, not an authority: `It can clarify language and context, but it does not replace scripture, traditional commentaries, personal judgment, or teachers.`
- Made for long-term study: `Bring reading, planning, and reflection together in a journey you can sustain.`

### Final CTA

- Title: `Begin with one passage.`
- Description: `Read, understand, plan, and keep a record—at a reading pace you can sustain.`

### Download and status

- Language notice: `LUTA is currently a Chinese-language app.`
- Section label: `Choose the official download option for this device`
- App Store: `Download from the App Store` / `View LUTA on the App Store and install the current release`
- Regional waitlist: `Notify me when LUTA is available in my region` / `Get an email when LUTA becomes available in your region`
- Android: `Download the verified Android package`
- Waitlist note: `Your email will be used only to notify you when iOS access opens in your region. Complete the form to register.`
- Unavailable title: `This link is temporarily unavailable`
- Recovery: `Your action was valid. We will not send you to an unavailable store; you can still view the official download options currently available on the LUTA website.`

## 6. 日文、韩文受控变更

### 产品语言说明

- 日文：`現在、LUTAのアプリ内容は中国語で提供されています。`
- 韩文：`현재 LUTA 앱의 콘텐츠는 중국어로 제공됩니다.`

### 品牌大小写

所有营销正文、标签、替代文字及相关技术说明中的旧大小写均统一为 `TaBao`。

### 安装文案

- 日文明确为端末/地域适配、正式 App Store 版本、地区等待通知及验证后的 Android 文件。
- 韩文明确为设备/地区适配、正式 App Store 版本、地区等待通知及验证后的 Android 文件。
- 日文、韩文主体定位、段落结构及修学表达未作未经批准的重写。

## 7. `installCopy.js` 最终关键口径

|语言|页面说明|大陆版本|国际版本|地区不可用|
|---|---|---|---|---|
|简中|选择适合此设备和地区的官方版本|中国大陆版|国际版|所在地区暂未开放 · 开放后通知我|
|繁中|選擇適合此裝置和地區的官方版本|中國大陸版|國際版|所在地區尚未開放 · 開放後通知我|
|English|Choose the official version for your device and region|Mainland China edition|International edition|Not available in your region yet · Notify me when it becomes available|
|日本語|端末と地域に適した公式版を選択してください|中国本土版|国際版|お住まいの地域では現在利用できません · 利用可能になったら通知|
|한국어|기기와 지역에 맞는 공식 버전을 선택하세요|중국 본토 버전|국제 버전|거주 지역에서는 아직 이용할 수 없습니다 · 이용 가능 알림 받기|

终止状态不再使用“不自然地解释没有打开不可用页面”的旧句式，而是直接说明当前方式不可用并要求选择其他官方方式。

## 8. 安装与地区逻辑

### 正式 App Store

- 普通 iOS 访问只显示正式 App Store。
- 中国大陆市场使用 `config.downloads.appStore`。
- 国际市场使用 `config.downloads.appStoreGlobal`。
- 语言路由只影响文案，不改变市场或商店分流。

### 地区未开放

- Smart Link 服务端目录必须按真实覆盖区域返回 `apple_app_store` 或 `waitlist`。
- 当国际 App Store 选项不可执行、而国际等待通知可执行时，前端强制优先显示等待通知。
- 文案必须包含地区限定，不得再使用无地区边界的旧版“尚未开放”表达。
- 普通静态落地页无法可靠读取用户 App Store 账户国家；不得用浏览器语言冒充 App Store 账户地区。真实地区不可用判断必须来自受控 Smart Link 目录或服务端区域配置。

### TestFlight

- China iOS 普通访问：正式 App Store 之外，默认显示`体验新版汝塔`入口；点击后展开两步安装指引。
- 国际市场：不显示 China TestFlight 入口，即使 URL 携带 `?testflight=1` 也必须隐藏并清理该状态参数。
- `?testflight=1` 不再决定入口是否可见，只表示两步指引已展开，供 App Store 往返或刷新后恢复上下文。
- `?testflight=0`、重复参数或其他值不自动展开；China iOS 的入口本身仍默认可见。
- 第 1 步使用 China App Store 的 Apple 官方 TestFlight 页面；第 2 步继续使用现有公开邀请与受控跳转。
- 用户语言先讲目标与动作，不要求先理解 TestFlight；“输入兑换码”必须明确解释为无需填写，并引导用户返回浏览器执行第 2 步。
- 直接营销页的国际市场仍只显示正式 App Store；国际测试应使用受控测试 Smart Link。
- Smart Link 目录只能在明确的 beta/test campaign 中返回 TestFlight 选项；普通目录不得下发。
- TestFlight URL 不出现在展示组件中，仍通过既有受控跳转与配置层处理。

## 9. SEO、Open Graph、Twitter 与路由

### 路由矩阵

|路由|`html lang`|Canonical|`og:locale`|
|---|---|---|---|
|`/global/zh-cn`|`zh-CN`|`https://lutaai.com/global/zh-cn`|`zh_CN`|
|`/global/zh-tw`|`zh-TW`|`https://lutaai.com/global/zh-tw`|`zh_TW`|
|`/global/en`|`en`|`https://lutaai.com/global/en`|`en_US`|
|`/global/ja`|`ja`|`https://lutaai.com/global/ja`|`ja_JP`|
|`/global/ko`|`ko`|`https://lutaai.com/global/ko`|`ko_KR`|
|`/`|首屏运行语言|`https://lutaai.com/`|根 HTML 默认 `zh_CN`|

### hreflang

每个页面必须完整、互相引用：

- `zh-CN` → `https://lutaai.com/global/zh-cn`
- `zh-TW` → `https://lutaai.com/global/zh-tw`
- `en` → `https://lutaai.com/global/en`
- `ja` → `https://lutaai.com/global/ja`
- `ko` → `https://lutaai.com/global/ko`
- `x-default` → `https://lutaai.com/`

### 社交分享

- `og:title`、`og:description`、`og:url`、`og:locale`、`og:image:alt` 按页面语言生成。
- `twitter:title`、`twitter:description`、`twitter:image:alt` 按页面语言生成。
- `og:image` 与 `twitter:image` 均为绝对地址：`https://lutaai.com/twitter_meta_img.png`。
- 图片已核验为 1200 × 630 PNG。
- `og:site_name` 固定为 `LUTA 汝塔`。

### 预渲染要求

- `npm run build` 必须连续执行 Vite 构建与 `scripts/prerender-marketing.mjs`。
- 构建产物必须包含：
  - `dist/global/zh-cn.html`
  - `dist/global/zh-tw.html`
  - `dist/global/en.html`
  - `dist/global/ja.html`
  - `dist/global/ko.html`
- Nginx 必须将 `/global/{locale}` 与 `/global/{locale}/` 映射到对应 HTML。
- 若改用 CDN、对象存储或其他 Web Server，必须复制该映射；不得全部回退到根 `index.html`。
- React 运行时更新 metadata 只用于客户端导航一致性，不能替代预渲染。

## 10. 技术验收标准

### 内容

- 简中 Hero 精确为`从经典原文开始，建立自己的长期修学路径。`
- 中文 Caption 精确为`经典阅读 · 塔宝辅助 · 计划与记录`。
- 英文 Hero lead 以`Begin with the scripture itself.`开头。
- 英文不使用可能被误解为梵文、巴利文或未译原典的旧术语指称汉译经文。
- 英文“修学计划”使用 `reading and study plan`；“阅读节奏”使用 `reading pace`。
- 全仓品牌大小写统一为 `TaBao`，不存在旧大小写。
- 英、日、韩下载区可见中文内容说明。
- 日、韩主体文案无额外重写。

### 安装

- China iPhone 普通页面同时保留正式 App Store 主按钮与`体验新版汝塔`入口；国际市场只显示正式 App Store。
- China iPhone 点击新版入口后显示两步指引、iOS 16 前置条件和“输入兑换码”恢复说明。
- 单一精确 `?testflight=1` 在刷新后恢复展开状态；重复或错误参数不自动展开；国际市场始终不显示该入口。
- 正式 App Store 与新版体验入口并存是当前有意设计；等待通知仍不得与可用正式 App Store 同时作为直接选项。
- `route_market`、UTM 和浏览器生成的 `clk_web_*` 只能用于官网推荐与网站分析，不得进入仅接受已落库 `lclk_*` 的 legacy `/continue` 合同。
- 第 1 步 Apple TestFlight 官方工具页是安装前置资源，必须直接打开 Apple，不得经过 Smart Link；普通官网的第 2 步在没有 canonical Smart Link 上下文时使用公开邀请 fallback。
- 真正的 Smart Link 首页继续使用服务端 context、catalog、`option_id` 与受控 `/out`，本修复不得把 stateful 入口降级成静态目标 URL。
- Smart Link 返回不可用国际 App Store + 可用 waitlist 时，只选择 waitlist 作为国际直接选项。
- Android、HarmonyOS、WeChat、HarmonyOS NEXT 既有安全分流不回退。
- 所有商店 URL 仍由配置层/受控跳转拥有，展示组件无硬编码 URL。

### SEO

- 直接请求五个显式语言路由，在不执行 JavaScript 时即可读到正确 title、description、canonical、OG、Twitter、lang。
- Canonical 为自引用，不得全部指向根页面。
- 每页恰有一个 canonical、一个 `og:url`、一个 `og:locale`、一个 title。
- 每页具备六条完整 hreflang。
- 社交图片使用 HTTPS 绝对地址，HTTP 200，尺寸 1200 × 630。
- 带尾斜杠与不带尾斜杠的语言路由返回同一预渲染内容；canonical 统一为不带尾斜杠版本。
- `robots.txt` 指向正式 sitemap，并禁止抓取 `/install`；sitemap 包含根页与五个显式语言路由。
- 语言路由携带 `state`、`legacy_slug` 或 `click_id` 时必须返回 `no-store, max-age=0`，不得因 SEO 预渲染放宽 bearer 缓存边界。

### 构建与质量

- `npm ci` 成功。
- `npm run test:attribution`：127/127 通过（2026-08-06 China iOS 入口与 Smart Link 合同修复后的计数）。
- 本次涉及的源码、脚本与测试定向 ESLint：0 error、0 warning。
- `npm run build` 成功并生成五份预渲染 HTML。
- `git diff --check` 无空白错误。
- 真实浏览器抽查通过：390 × 844 的 China 路由默认显示新版入口，展开、刷新恢复、兑换码提示、弹窗 Esc 与焦点恢复正常；国际路由不显示入口并清理展开参数；控制台 0 error、无错误遮罩。1280 × 720 的既有营销基线保持通过。

## 11. 回归测试清单

### 浏览器与响应式

- iPhone Safari：简中、繁中、英、日、韩；China 普通链接、展开后的 `?testflight=1` 恢复与国际隐藏规则。
- Android Chrome：Google Play、APK、微信外部浏览器指引。
- HarmonyOS 与 HarmonyOS NEXT：兼容路径与 fail-closed 恢复路径。
- Desktop Chrome/Safari/Firefox：iOS/Android Tab、键盘方向键、Home/End、焦点环。
- 390 × 844、768 × 1024、1280 × 720、1440 × 900；检查新增语言提示不溢出、不遮挡 CTA。

### 安装状态矩阵

- `cn + ios + App Store ready`
- `global + ios + App Store ready`
- `global + ios + App Store unavailable + waitlist ready`
- `cn + ios + 默认可见但未展开`
- `cn + ios + testflight=1 已展开并刷新恢复`
- `global + ios + testflight=1 仍隐藏并清理参数`
- `android + Google Play`
- `android + verified APK`
- `Android in WeChat`
- `HarmonyOS NEXT`
- Smart Link loading、ready、degraded、no options、failed、returned-from-handoff。

### SEO/分享

- 用 `curl` 或查看源代码核对五个显式语言路由，不能只看浏览器 DOM。
- Google Rich Results/URL Inspection：核对最终 HTML 与 canonical。
- Facebook Sharing Debugger、LinkedIn Post Inspector、X Card Validator 或等效工具：逐一抓取五个路由。
- 搜索引擎站点地图若存在，必须包含五个 canonical URL，不得包含参数化 TestFlight URL。

## 12. 风险与上线前置条件

1. **App Store 地区识别**：浏览器无法读取用户 Apple ID 商店国家。服务端目录必须维护实际上架覆盖；否则“地区不可用”只能在用户进入 App Store 后才暴露。
2. **TestFlight 容量与邀请治理**：China 普通官网现已公开入口；公开邀请满员、暂停或失效时会形成直接死路。发布负责人必须监控邀请可用性并在异常时通过版本回滚或配置更新关闭入口。Smart Link 目录仍必须把 TestFlight 限定为测试 campaign。
3. **静态托管兼容**：本交付依赖 Nginx 将显式路由映射到 `dist/global/*.html`。若部署平台忽略 `nginx.conf`，SEO 会退回根 SPA HTML。
4. **根路由语言**：`/` 是 `x-default`，运行时按偏好语言切换；严肃的语言 SEO 投放应始终使用显式 `/global/{locale}`。
5. **日韩语言质量**：按要求未重写主体；原审查指出的日韩宗教化与母语自然度风险仍存在，后续应由母语佛教内容编辑单独复核。
6. **Meta keywords**：已保留现有字段以兼容代码契约，但主流搜索引擎基本不依赖它；不得将其视为 SEO 成效来源。
7. **既有全仓 lint 债务**：全仓 `npm run lint` 仍被基线中的 6 个既有错误与 4 个警告阻断，位于 `GlitchText.jsx`、`ParticleSystem.jsx`、`Silk.jsx`、`SplitText.jsx`、`Toast.jsx`、`ui/badge.jsx`、`ui/button.jsx`；本次改动文件定向 lint 已全部通过。
8. **依赖风险**：`npm ci` 报告 3 个 high severity advisories；本次未改依赖版本或 lockfile。应另建依赖治理任务评估，禁止在本次文案交付中直接执行破坏性 `npm audit fix --force`。
9. **Bundle 体积**：生产构建保留既有大 chunk 警告（最大约 863 kB，gzip 约 234 kB）；非本次文案变更引入，后续可独立做代码分割。
10. **真实设备剩余验证**：2026-08-06 已完成生产构建与 390 × 844 浏览器视口验证，但当前自动化浏览器不是 iPhone Safari，未替代真实中国区 Apple ID、TestFlight 安装、邀请接受和新版 App 首次打开的端到端验收。

## 13. 研发执行顺序

1. 以指定 Commit 建分支并应用本交付全部文件，不要只复制三份文案文件。
2. 执行 `npm ci`、全量测试、定向 lint、生产构建；其中必须包含 `route_market=cn&testflight=1`、普通 UTM、浏览器 `clk_web_*` 与 canonical `lclk_*` 的合同回归。
3. 核验五份 `dist/global/*.html` metadata。
4. 在与生产一致的 Nginx/CDN 规则下做路由 smoke test。
5. 用真实 iPhone/Android/HarmonyOS 完成安装矩阵。
6. 用社交抓取器重新抓取五个语言 URL。
7. 确认 China 官网公开邀请可用且未满员；同时确认 Smart Link 后台正式目录不含 TestFlight，地区未开放目录含可执行 waitlist。
8. 通过后发布；发布后监测 App Store 点击、waitlist 展示、错误恢复与错误下载率。
