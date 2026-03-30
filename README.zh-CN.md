<p align="center">
  <img src="public/icon/icon.svg" width="80" height="80" alt="Reddit AI Assistant">
</p>

<h1 align="center">Reddit AI Assistant</h1>

<p align="center">
  <strong>AI 驱动的 Reddit 帖子和评论摘要</strong>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
  <img src="https://img.shields.io/badge/Chrome-MV3-yellow" alt="Chrome">
  <img src="https://img.shields.io/badge/Firefox-MV2-实验性-orange" alt="Firefox">
</p>

---

## 功能介绍

为任何 Reddit 帖子或评论区添加一键 AI 摘要。点击 **Summarize Post** 提取关键要点、背景和问题。点击 **Summarize Comments** 查看主要主题、共识、争议和整体情绪。

摘要以流式方式实时呈现，渲染为整洁的 Markdown 格式——无需等待完整响应。

**你的 API Key，你的服务商，零后端。** 所有请求直接从浏览器发送到你配置的端点，不经过任何第三方服务器。

<!-- TODO: 添加截图：亮色模式下的帖子摘要 -->

## 特性

- **一键摘要** — 单击即可生成帖子或评论区的摘要
- **结构化输出** — 帖子摘要包含关键要点 / 背景 / 问题；评论摘要包含主题 / 共识 / 争议 / 情绪
- **实时流式输出** — 摘要逐字流式呈现，即时可见
- **深色模式** — 自动跟随 Reddit 主题（亮色或深色）
- **首次使用引导** — 首次安装时自动显示设置引导
- **复制按钮** — 一键复制完整摘要文本
- **可折叠面板** — 点击标题栏折叠/展开摘要
- **自带 API Key** — 支持 OpenAI、通过代理的 Anthropic、本地模型（LM Studio、Ollama）或任何兼容端点
- **模型自动发现** — 一键获取端点可用模型列表
- **自定义提示词** — 完全可编辑的提示词模板，附带合理默认值
- **Chrome + Firefox** — 支持 Chrome/Edge（Manifest V3）；Firefox（Manifest V2）可用但尚未充分测试

<!-- TODO: 添加截图：评论摘要、深色模式、弹窗、引导页 -->

## 安装

### Chrome Web Store

*即将上线*

### 从源码安装

```bash
git clone https://github.com/BlingDan/Reddit-AI-Assistant.git
cd reddit-ai-assistant
npm install
npm run build
```

在 Chrome 中加载：

1. 打开 `chrome://extensions`
2. 开启 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择 `.output/chrome-mv3` 目录

### Firefox（实验性）

> **注意：** Firefox 支持尚未充分测试，可能存在问题。欢迎反馈和 PR！

```bash
npm run build:firefox
```

在 Firefox 中加载：

1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击 **临时载入附加组件**
3. 选择 `.output/firefox-mv2/manifest.json`

## 配置

### 快速设置（弹窗）

点击工具栏中的扩展图标，打开状态面板：

- **Model** — 从自动发现的模型列表中选择，或手动输入
- **Endpoint** — 你的 API 端点 URL
- **Save** — 本地保存设置

### 完整设置（选项页）

右键点击扩展图标 → **选项**，或从弹窗中点击 **Full Settings**：

| 设置项 | 默认值 | 说明 |
|---|---|---|
| API Endpoint | `https://api.openai.com/v1/chat/completions` | 任何 OpenAI 兼容端点 |
| API Key | *(空)* | 本地存储，不会发送给第三方 |
| Model | `gpt-4o-mini` | 使用的模型名称 |
| Post Prompt | *(内置)* | 可自定义的帖子摘要提示词 |
| Comment Prompt | *(内置)* | 可自定义的评论摘要提示词 |

在自定义提示词中使用 `{content}` 作为提取文本的占位符。

## 隐私与权限

**零数据收集。** 无分析、无追踪、无遥测。

- 你的 API Key 仅存储在本地的 `chrome.storage.local` 中
- 所有 API 调用直接从浏览器发送到你配置的端点
- 不经过任何第三方服务器

| 权限 | 用途 |
|---|---|
| `storage` | 本地保存 API 设置和提示词模板 |
| `activeTab` | 访问当前 Reddit 标签页内容以生成摘要 |
| `*://*.reddit.com/*` | 仅在 Reddit 页面注入内容脚本 |

无宽泛的主机权限，无远程代码。

## 开发

### 快速开始

```bash
npm install
npx wxt          # Chrome 开发模式
npx wxt --browser firefox  # Firefox 开发模式
```

WXT 会输出一个 URL，在浏览器中加载未打包的扩展，支持热重载。

### 架构

```
src/
├── entrypoints/          # WXT 入口点
│   ├── background.ts     # Service Worker（消息路由、API 调用）
│   ├── content.ts        # 内容脚本（注入到 reddit.com）
│   ├── popup/            # 状态面板（Vue 3）
│   └── options/          # 设置页面（Vue 3 SPA）
├── background/           # 后台 Service Worker 逻辑
│   ├── router.ts         # 类型化消息路由
│   ├── ai-client.ts      # 流式 OpenAI 兼容客户端
│   ├── prompt-builder.ts # 模板 + 系统提示词构建器
│   └── config.ts         # chrome.storage 设置管理
├── content/              # 内容脚本逻辑
│   ├── dom-adapter.ts    # Reddit DOM 选择器抽象
│   └── ui-injector.ts    # 按钮、面板、引导、深色模式
├── options/views/        # 设置页面组件
│   ├── ApiSettings.vue
│   ├── PromptTemplates.vue
│   └── About.vue
└── shared/               # 共享类型和常量
    ├── types.ts
    └── constants.ts
```

**三层架构：**

1. **内容脚本** — 注入到 reddit.com。检测帖子、注入按钮、提取内容、渲染流式响应。处理深色模式和首次引导。

2. **后台 Service Worker** — 处理所有 API 通信。路由消息、构建提示词、通过 `chrome.runtime.Port` 流式传输响应。

3. **选项页 + 弹窗** — Vue 3 SPA。弹窗是状态面板（连接状态、快速设置）。选项页有完整设置（API、提示词、关于）。

### 添加新功能

```ts
// 1. 在 src/features/your-feature/messages.ts 中定义消息类型
// 2. 在 entrypoints/background.ts 中注册处理函数：
registerHandler('YOUR_TYPE', async (request, sendResponse) => { ... });
// 3. 在 content/ui-injector.ts 中添加 UI 触发器
```

## 灵感来源

本项目灵感来源于 [linuxdo-scripts](https://github.com/anghunk/linuxdo-scripts)。LinuxDo Scripts 是一个功能丰富的浏览器扩展，专为提升 LinuxDo 论坛的使用体验而设计。它集成了从基础界面优化到高级 AI 辅助的多项实用功能，让您的论坛浏览和互动体验更加流畅高效。

## 许可证

[MIT](LICENSE)
