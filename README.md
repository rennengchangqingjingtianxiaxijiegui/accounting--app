# 记账APP — 跨端记账工具

支持移动端APP和微信小程序。功能涵盖用户认证、多账本管理、收支记账、数据报表分析。

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端框架 | uni-app v3 (Vue3 + TypeScript + Vite) |
| UI 组件 | uView Plus 3.0 |
| 状态管理 | Pinia |
| 图表 | uCharts (Canvas 2D) |
| 后端框架 | Express 4 + TypeScript |
| ORM | Prisma |
| 数据库 | MySQL 8.0 |
| 认证 | JWT (access 15min + refresh 7d) + bcryptjs 12轮 |
| 校验 | Zod |
| 测试 | Jest + Supertest + Vitest |

## 项目结构

```
accounting-app/
├── client/                    # uni-app Vue3 TypeScript 前端
│   └── src/
│       ├── api/               # HTTP 请求模块
│       ├── components/        # 公共组件
│       ├── composables/       # 组合式函数
│       ├── pages/             # 页面（auth/user/book/record/report）
│       ├── store/             # Pinia 状态管理
│       ├── types/             # 前端类型定义
│       └── utils/             # 工具函数
├── server/                    # Express TypeScript 后端
│   ├── prisma/
│   │   ├── schema.prisma      # 数据模型（6张表）
│   │   └── seed.ts            # 默认分类数据
│   ├── src/
│   │   ├── controllers/       # 路由处理器
│   │   ├── services/          # 业务逻辑
│   │   ├── middleware/         # auth/bookAccess/validate/errorHandler
│   │   ├── routes/            # 路由定义 /api/v1/*
│   │   ├── validators/        # Zod Schema
│   │   ├── utils/             # jwt/password/response/errors
│   │   └── types/             # 后端类型定义
│   └── tests/
│       ├── unit/              # 单元测试（7个文件）
│       └── integration/       # 集成测试（3个文件）
└── shared/                    # 前后端共享
    ├── constants/             # 24个默认分类
    └── types/                 # 枚举定义
```

## 快速开始

### 环境要求

- Node.js 20+
- MySQL 8.0

### 后端

```bash
cd server
cp .env.example .env
# 编辑 .env 填入数据库连接、JWT密钥等
npm install
npx prisma migrate dev    # 创建数据库表
npx prisma db seed         # 插入默认分类
npm run dev                # 启动后端 http://localhost:3000
```

### 前端

```bash
cd client
npm install
npm run dev:h5             # H5 浏览器调试
npm run dev:mp-weixin      # 微信小程序编译
```

## 数据库

| 表 | 说明 | 关键字段 |
|----|------|---------|
| users | 用户 | phone, password_hash, wechat_openid |
| refresh_tokens | 刷新令牌 | token, user_id, expires_at |
| books | 账本 | name, type, created_by |
| book_members | 账本成员 | book_id, user_id, role(owner/admin/editor/viewer) |
| categories | 收支分类 | name, type(income/expense), icon, is_default |
| records | 收支记录 | book_id, category_id, type, amount(DECIMAL), record_date |

### 角色权限

| 操作 | owner | admin | editor | viewer |
|------|-------|-------|--------|--------|
| 编辑账本 | ✅ | ✅ | ❌ | ❌ |
| 删除账本 | ✅ | ❌ | ❌ | ❌ |
| 管理成员 | ✅ | ✅ | ❌ | ❌ |
| 记账CRUD | ✅ | ✅ | ✅ | ❌ |
| 查看/报表 | ✅ | ✅ | ✅ | ✅ |

## API 概览

Base URL: `/api/v1` — 统一响应格式：`{ code: 0, message: "ok", data: {} }`

| 模块 | 路径 | 说明 |
|------|------|------|
| 认证 | `POST /auth/register` | 手机号注册 |
| | `POST /auth/login` | 手机号+密码登录 |
| | `POST /auth/wechat-login` | 微信code登录 |
| | `POST /auth/refresh` | 刷新AccessToken |
| | `POST /auth/logout` | 注销RefreshToken |
| 用户 | `GET/PUT /user/profile` | 个人信息查询/修改 |
| | `PUT /user/password` | 修改密码 |
| 账本 | `GET/POST /books` | 账本列表/创建 |
| | `GET/PUT/DELETE /books/:id` | 账本详情/编辑/删除 |
| | `GET/POST /books/:id/members` | 成员列表/添加 |
| | `PUT/DELETE /books/:id/members/:mid` | 修改角色/移除成员 |
| 记账 | `GET /categories` | 分类列表 |
| | `GET/POST /books/:bid/records` | 记录列表/添加 |
| | `GET/PUT/DELETE /books/:bid/records/:id` | 记录详情/编辑/删除 |
| 报表 | `GET /books/:bid/reports/summary` | 收支汇总 |
| | `GET /books/:bid/reports/trend` | 趋势数据 |
| | `GET /books/:bid/reports/category` | 分类占比 |

## 常用命令

### 后端

```bash
npm run dev          # 开发模式（热重载）
npm run build        # TypeScript 编译
npm run start        # 生产模式
npm test             # 运行测试（113个）
npm run test:watch   # 监听模式
npm run db:studio    # Prisma Studio http://localhost:5555
npm run db:migrate   # 数据库迁移
npm run db:seed      # 种子数据
```

### 前端

```bash
npm run dev:h5            # H5 开发
npm run dev:mp-weixin     # 微信小程序开发
npm run build:h5          # H5 构建
npm run build:mp-weixin   # 微信小程序构建
npm test                  # 运行测试（11个）
```

## 架构原则

1. **分层架构**：Controller（薄）→ Service（业务）→ Prisma（数据）
2. **权限中间件**：`bookAccess(roles)` 工厂函数，路由声明式挂载
3. **金额精确**：DECIMAL(12,2) 存储 + 字符串传输 + 前端格式化
4. **Token轮换**：每次刷新删除旧Token，泄露可撤销
5. **软删除**：books/records 不物理删除，is_deleted 标记
6. **密码安全**：bcryptjs 12轮，常量时间比较，Zod强度校验

## 部署注意事项

1. 微信小程序需配置 `request` 合法域名（后端API地址）
2. 小程序服务器域名仅支持 HTTPS，需配置 SSL 证书
3. 生产环境 JWT Secret 长度 ≥ 32 字符
4. MySQL 字符集用 `utf8mb4`，支持 emoji
5. PM2 或 Docker 部署后端，建议 cluster 模式
6. 头像上传对接 OSS/COS，返回 CDN URL
