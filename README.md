<p align="center">
  <img src="public/favicon.ico" alt="Vapor Logo" width="80" />
</p>

<h1 align="center">Vapor</h1>

<p align="center">
  <strong>端到端加密的阅后即焚秘密分享工具</strong><br>
  <em>End-to-end encrypted burn-after-read secret sharing</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#security">Security</a> •
  <a href="#api">API</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%20Router-v7-blue" alt="React Router" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
  <img src="https://img.shields.io/badge/Bun-Compatible-black" alt="Bun" />
</p>

---

## Overview | 简介

**Vapor** is a zero-knowledge secret sharing platform that allows you to share encrypted messages that automatically self-destruct after being read. All encryption happens client-side - the server never sees your plaintext.

**Vapor** 是一个零知识秘密分享平台，让你可以分享加密消息，这些消息在被阅读后会自动销毁。所有加密都在客户端进行 —— 服务器永远不会看到你的明文。

## Features | 功能特性

- 🔒 **End-to-End Encryption** - AES-256-GCM encryption with PBKDF2 key derivation
  端到端加密 - 使用 PBKDF2 密钥派生的 AES-256-GCM 加密
- 🔥 **Burn After Reading** - Messages auto-delete after being viewed
  阅后即焚 - 消息在被查看后自动删除
- ⏱️ **Time-to-Live (TTL)** - Set expiration from 5 minutes to 7 days
  生存时间 - 可设置 5 分钟到 7 天的过期时间
- 🔐 **Password Protection** - Optional password for extra security
  密码保护 - 可选密码提供额外安全保障
- 📱 **QR Code Sharing** - Easy sharing via QR codes
  二维码分享 - 通过二维码轻松分享
- ✍️ **Markdown Editor** - Rich text editing with Vditor
  Markdown 编辑器 - 使用 Vditor 进行富文本编辑
- 🌙 **Steampunk Dark Theme** - Beautiful dark mode UI
  蒸汽朋克暗黑主题 - 精美的暗黑模式界面
- 📱 **Mobile Responsive** - Works great on all devices
  移动端适配 - 在所有设备上都有良好体验
- 🚀 **SSR Ready** - Server-side rendering with React Router v7
  SSR 支持 - 使用 React Router v7 进行服务端渲染

## Demo | 演示

> Add your demo screenshots here

```
┌─────────────────────────────────────────────────────────────┐
│  Create Page (/)                                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [Markdown Editor Area]                                  ││
│  │                                                         ││
│  │  TTL: [5 min ▼]  Password: [••••••]  Burn: [✓]         ││
│  │                                                         ││
│  │  [Create Secret]  [Generate QR Code]                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  View Page (/view?id=xxx)                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  🔐 Enter password to decrypt                           ││
│  │  [••••••••] [Decrypt]                                   ││
│  │                                                         ││
│  │  [Decrypted Content]                                    ││
│  │  ⚠️ This message will be deleted after viewing          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack | 技术栈

| Category | Technology |
|----------|------------|
| **Framework** | React Router v7 (SSR) |
| **Language** | TypeScript 5.9 |
| **Styling** | TailwindCSS v4, shadcn/ui |
| **Crypto** | Web Crypto API (AES-256-GCM, PBKDF2) |
| **Editor** | Vditor (Markdown) |
| **Icons** | Lucide React |
| **Build** | Vite 7, Bun |
| **Runtime** | Node.js 20+ |

## Quick Start | 快速开始

### Prerequisites | 前置条件

- [Bun](https://bun.sh/) >= 1.0 (recommended)
- Or Node.js >= 20 with npm/pnpm/yarn

### Installation | 安装

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/vapor.git
cd vapor

# Install dependencies
bun install

# Start development server
bun run dev
```

The application will be available at `http://localhost:5173`.

应用将在 `http://localhost:5173` 上可用。

### Available Scripts | 可用脚本

```bash
# Development with hot reload
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Type checking
bun run typecheck
```

## Deployment | 部署

### Option 1: Docker (Recommended) | Docker 部署（推荐）

```bash
# Build the image
docker build -t vapor .

# Run the container
docker run -p 3000:3000 vapor
```

The application will be available at `http://localhost:3000`.

应用将在 `http://localhost:3000` 上可用。

#### Docker Compose | Docker Compose 部署

```yaml
version: '3.8'
services:
  vapor:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

```bash
docker-compose up -d
```

### Option 2: Manual Deployment | 手动部署

```bash
# Install dependencies
bun install

# Build for production
bun run build

# Start the server
bun run start
```

### Option 3: Platform Deployment | 平台部署

#### Vercel

```bash
# Install Vercel CLI
bun i -g vercel

# Deploy
vercel
```

#### Fly.io

```bash
# Install flyctl
# macOS: brew install flyctl
# Linux: curl -L https://fly.io/install.sh | sh

# Login and deploy
fly auth login
fly launch
```

#### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

#### Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Supported Platforms | 支持的平台

- Docker / Docker Compose
- Vercel
- Fly.io
- Railway
- Render
- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform

## Security | 安全性

### Zero-Knowledge Architecture | 零知识架构

```
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│   Client     │          │   Server     │          │   Client     │
│  (Creator)   │          │              │          │   (Viewer)   │
└──────┬───────┘          └──────┬───────┘          └──────┬───────┘
       │                         │                         │
       │  1. Generate Key        │                         │
       │  (client-side)          │                         │
       ├────────────────────────►│                         │
       │                         │                         │
       │  2. Encrypt Content     │                         │
       │  (AES-256-GCM)          │                         │
       │                         │                         │
       │  3. Send Ciphertext     │                         │
       ├────────────────────────►│                         │
       │                         │  4. Store Ciphertext    │
       │                         │  (never plaintext!)     │
       │                         │                         │
       │  5. Share URL           │                         │
       │  (contains key fragment)│                         │
       │                         │                         │
       │                         │  6. Request Ciphertext  │
       │                         │◄────────────────────────┤
       │                         │                         │
       │                         │  7. Return Ciphertext   │
       │                         ├────────────────────────►│
       │                         │                         │
       │                         │  8. Decrypt Client-side │
       │                         │  (password + salt)      │
       │                         │                         │
```

### Encryption Details | 加密详情

| Component | Algorithm | Parameters |
|-----------|-----------|------------|
| **Encryption** | AES-256-GCM | 256-bit key, 96-bit IV |
| **Key Derivation** | PBKDF2-SHA256 | 310,000 iterations |
| **Key Proof** | SHA-256 | Timing-safe comparison |
| **Salt** | Random | 16 bytes |
| **IV** | Random | 12 bytes |

### Security Features | 安全特性

- ✅ **Client-side encryption** - Server never sees plaintext
  客户端加密 - 服务器永不接触明文
- ✅ **Authenticated encryption** - AES-GCM provides integrity
  认证加密 - AES-GCM 提供完整性保证
- ✅ **Brute-force resistant** - High KDF iterations
  抗暴力破解 - 高 KDF 迭代次数
- ✅ **Timing-safe comparison** - Prevents timing attacks
  时间安全比较 - 防止时序攻击
- ✅ **Rate limiting** - Prevents DoS attacks
  速率限制 - 防止 DoS 攻击
- ✅ **Auto-cleanup** - Expired notes are deleted
  自动清理 - 过期笔记自动删除

### Security Recommendations | 安全建议

1. **For production**, replace in-memory storage with a database (Redis/PostgreSQL)
   生产环境建议使用数据库（Redis/PostgreSQL）替换内存存储

2. **Use HTTPS** in production - encryption happens client-side, but HTTPS protects the transport
   生产环境务必使用 HTTPS

3. **Consider adding** a Content Security Policy (CSP) header
   建议添加内容安全策略（CSP）头

4. **Set appropriate** rate limits for your use case
   根据使用场景设置适当的速率限制

## API | 接口文档

### POST `/api/notes`

Create a new encrypted note.

**Request Body:**

```json
{
  "action": "create",
  "ciphertext": "base64-encoded-ciphertext",
  "salt": "base64-encoded-salt",
  "iv": "base64-encoded-iv",
  "keyProof": "base64-encoded-proof",
  "ttl": 3600,
  "hasPassword": true
}
```

**Response:**

```json
{
  "success": true,
  "noteId": "abc123",
  "keyProof": "base64-encoded-proof"
}
```

### POST `/api/notes` (Read)

Read an encrypted note.

**Request Body:**

```json
{
  "action": "read",
  "noteId": "abc123",
  "keyProof": "base64-encoded-proof"
}
```

**Response:**

```json
{
  "success": true,
  "ciphertext": "base64-encoded-ciphertext",
  "salt": "base64-encoded-salt",
  "iv": "base64-encoded-iv",
  "hasPassword": true,
  "burn": true
}
```

### POST `/api/notes` (Burn)

Burn (delete) a note after reading.

**Request Body:**

```json
{
  "action": "burn",
  "noteId": "abc123"
}
```

**Response:**

```json
{
  "success": true
}
```

### GET `/api/notes?id=xxx`

Check if a note exists.

**Response:**

```json
{
  "exists": true,
  "hasPassword": true
}
```

### Rate Limits | 速率限制

| Action | Limit |
|--------|-------|
| Loader | 120 requests/minute |
| Create | 20 requests/minute |
| Read | 60 requests/minute |

## Project Structure | 项目结构

```
vapor/
├── app/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── vditor-editor.tsx
│   │   ├── steampunk-card.tsx
│   │   └── vapor-bg.tsx
│   ├── lib/
│   │   ├── crypto.ts        # Encryption utilities
│   │   ├── store.server.ts  # Server-side storage
│   │   └── utils.ts         # Helper functions
│   ├── routes/
│   │   ├── home.tsx         # Create page
│   │   ├── view.tsx         # View page
│   │   └── api.notes.ts     # API endpoint
│   ├── root.tsx             # Root layout
│   └── app.css              # Global styles
├── public/                  # Static assets
├── scripts/
│   └── sync-vditor-assets.mjs
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Configuration | 配置

### Environment Variables | 环境变量

Currently, Vapor uses in-memory storage with no required environment variables. For production deployment with persistent storage, you may want to add:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |

### Customization | 自定义

#### KDF Iterations

Edit `app/lib/crypto.ts` to adjust PBKDF2 iterations:

```typescript
const DEFAULT_KDF_ITERATIONS = 310000; // OWASP 2023 recommendation
const LEGACY_KDF_ITERATIONS = 100000;  // For backwards compatibility
```

#### TTL Options

Edit `app/routes/home.tsx` to customize TTL options:

```typescript
const TTL_OPTIONS = [
  { value: 300, label: '5 分钟' },      // 5 minutes
  { value: 3600, label: '1 小时' },     // 1 hour
  { value: 86400, label: '1 天' },      // 1 day
  { value: 604800, label: '7 天' },     // 7 days
];
```

## Contributing | 贡献指南

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

欢迎贡献代码！请查看我们的[贡献指南](CONTRIBUTING.md)了解详情。

### Development Setup | 开发环境设置

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/vapor.git
cd vapor

# Install dependencies
bun install

# Start development server
bun run dev

# Run type check
bun run typecheck
```

### Commit Convention | 提交规范

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## Roadmap | 路线图

- [ ] Add database support (Redis/PostgreSQL)
- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Internationalization (i18n)
- [ ] PWA support
- [ ] File attachment support
- [ ] Custom theme support

## License | 许可证

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件。

## Acknowledgments | 致谢

- [React Router](https://reactrouter.com/) - Full-stack React framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Vditor](https://b3log.org/vditor/) - Markdown editor
- [Lucide](https://lucide.dev/) - Beautiful icons

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/YOUR_USERNAME">Your Name</a>
</p>

<p align="center">
  If you find this project useful, please consider giving it a ⭐️!
</p>
