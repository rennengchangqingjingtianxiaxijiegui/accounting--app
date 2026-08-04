# 记账APP — 项目文档

## 项目简介

跨端记账工具，支持移动端APP和微信小程序。功能涵盖用户认证、多账本管理、收支记账、数据报表分析。

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端框架 | uni-app v3 (Vue3 + TypeScript + Vite) |
| UI 组件 | uView Plus 3.0 |
| 状态管理 | Pinia |
| 图表 | uCharts (Canvas 2D) |
| 路由 | pages.json (uni-app 内置) |
| HTTP | Axios (uni-app 适配) |
| 后端框架 | Express 4 + TypeScript |
| ORM | Prisma |
| 数据库 | MySQL 8.0 |
| 认证 | JWT (access 15min + refresh 7d) + bcryptjs 12轮 |
| 校验 | Zod |
| 测试 | Jest + Supertest |

## 项目结构

```
accounting-app/
├── client/                    # uni-app Vue3 TypeScript 前端
│   └── src/
│       ├── api/               # HTTP 请求模块（request拦截器 + 各业务API）
│       ├── components/        # 公共组件（NavBar/CategoryPicker/LineChart等）
│       ├── composables/       # 组合式函数（useAuth/useBook/useRecord/usePagination）
│       ├── pages/             # 页面
│       │   ├── auth/          # 登录/注册
│       │   ├── user/          # 个人资料/修改密码
│       │   ├── book/          # 账本列表/创建/成员管理
│       │   ├── record/        # 记账首页/添加/编辑/详情
│       │   └── report/        # 报表首页/趋势图/分类饼图
│       ├── store/             # Pinia（auth/book/category）
│       ├── types/             # 前端类型定义
│       └── utils/             # storage/validator/format
├── server/                    # Express TypeScript 后端
│   ├── prisma/
│   │   ├── schema.prisma      # 数据模型（6张表）
│   │   └── seed.ts            # 默认分类数据
│   └── src/
│       ├── controllers/       # 路由处理器
│       ├── services/          # 业务逻辑
│       ├── middleware/        # auth/bookAccess/validate/errorHandler
│       ├── routes/            # 路由定义 /api/v1/*
│       ├── validators/        # Zod Schema
│       ├── utils/             # jwt/password/wechat/response/errors
│       └── types/             # 后端类型定义
└── shared/                    # 前后端共享
    ├── constants/categories.ts  # 24个默认分类
    └── types/enums.ts           # 枚举定义
```

## 本地开发

### 环境要求

- Node.js 20+
- MySQL 8.0
- HBuilderX（uni-app 开发工具，可选）
- 微信开发者工具（小程序调试）

### 快速开始

```bash
# 1. 克隆项目
git clone <repo-url>
cd accounting-app

# 2. 后端初始化
cd server
cp .env.example .env
# 编辑 .env 填入数据库连接、JWT密钥、微信AppID等
npm install
npx prisma migrate dev    # 创建数据库表
npx prisma db seed         # 插入默认分类
npm run dev                # 启动后端 http://localhost:3000

# 3. 前端初始化
cd ../client
npm install
# 方式A: HBuilderX 打开 client/ 目录，运行到微信小程序/APP
# 方式B: npm run dev:mp-weixin  编译到微信小程序
# 方式C: npm run dev:h5          浏览器调试
```

### 环境变量 (server/.env)

```env
# 数据库
DATABASE_URL="mysql://root:password@localhost:3306/accounting"

# JWT
JWT_SECRET="your-access-token-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-token-secret-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# 微信小程序
WECHAT_APPID="your-wechat-appid"
WECHAT_SECRET="your-wechat-secret"

# 短信（可选）
SMS_ACCESS_KEY=""
SMS_SECRET=""

# 服务端口
PORT=3000
```

### 常用命令

```bash
# 后端
npm run dev          # 开发模式（ts-node + hot reload）
npm run build        # 编译 TypeScript
npm run start        # 生产模式
npm test             # 运行测试
npm run test:watch   # 监听模式
npm run db:studio    # Prisma Studio 可视化管理 http://localhost:5555
npm run db:migrate   # 执行数据库迁移
npm run db:seed      # 重置并填充种子数据

# 前端
npm run dev:h5            # H5 开发
npm run dev:mp-weixin     # 微信小程序开发
npm run build:h5          # H5 构建
npm run build:mp-weixin   # 微信小程序构建
```

## 数据库

### 表一览

| 表 | 说明 | 关键字段 |
|----|------|---------|
| users | 用户 | phone, password_hash, wechat_openid |
| refresh_tokens | 刷新令牌 | token, user_id, expires_at |
| books | 账本 | name, type, created_by |
| book_members | 账本成员 | book_id, user_id, role(owner/admin/editor/viewer) |
| categories | 收支分类 | name, type(income/expense), icon, is_default |
| records | 收支记录 | book_id, category_id, type, amount(Decimal), record_date |

### 角色权限

| 操作 | owner | admin | editor | viewer |
|------|-------|-------|--------|--------|
| 编辑账本 | ✅ | ✅ | ❌ | ❌ |
| 删除账本 | ✅ | ❌ | ❌ | ❌ |
| 管理成员 | ✅ | ✅ | ❌ | ❌ |
| 记账CRUD | ✅ | ✅ | ✅ | ❌ |
| 查看/报表 | ✅ | ✅ | ✅ | ✅ |

### 金额处理

- 数据库：`DECIMAL(12,2)` 精确存储
- API：字符串传输 `"123.45"`，避免JSON浮点精度丢失
- 前端展示：`¥1,234.56` 格式化

## API 概览

Base URL: `/api/v1`

统一响应：`{ code: 0, message: "ok", data: {} }`

### 认证 `/api/v1/auth`
- `POST /register` — 手机号注册
- `POST /login` — 手机号+密码登录
- `POST /wechat-login` — 微信code登录
- `POST /refresh` — 刷新AccessToken
- `POST /logout` — 注销RefreshToken

### 用户 `/api/v1/user`
- `GET /profile` — 个人信息
- `PUT /profile` — 修改资料
- `PUT /password` — 修改密码

### 账本 `/api/v1/books`
- `GET /` — 我的账本列表
- `POST /` — 创建账本
- `GET /:id` — 账本详情
- `PUT /:id` — 编辑
- `DELETE /:id` — 删除
- `GET /:id/members` — 成员列表
- `POST /:id/members` — 添加成员
- `PUT /:id/members/:mid` — 修改角色
- `DELETE /:id/members/:mid` — 移除成员

### 记账 `/api/v1`
- `GET /categories` — 分类列表
- `GET /books/:bid/records` — 记录列表（分页+筛选）
- `POST /books/:bid/records` — 添加记录
- `GET /books/:bid/records/:id` — 记录详情
- `PUT /books/:bid/records/:id` — 编辑记录
- `DELETE /books/:bid/records/:id` — 删除记录

### 报表 `/api/v1/books/:bid/reports`
- `GET /summary` — 收支汇总
- `GET /trend` — 趋势数据（折线图）
- `GET /category` — 分类占比（饼图）

## 密码安全

- 算法：bcryptjs，12轮 salt rounds
- 哈希耗时约250ms/次
- `compare()` 常量时间比较，防止时序攻击
- 密码强度：6-20位，至少数字+字母（Zod校验）
- 相同密码不同用户/不同时间产生不同哈希（salt 随机）

## 架构原则

1. **分层架构**：Controller（薄）→ Service（业务）→ Prisma（数据）
2. **权限中间件**：`bookAccess(roles)` 工厂函数，路由声明式挂载
3. **金额精确**：Decimal存储 + 字符串传输 + 前端格式化
4. **Token轮换**：每次刷新删除旧Token，泄露可撤销
5. **软删除**：books/records 不物理删除，is_deleted 标记
6. **条件编译**：uni-app `#ifdef` 处理平台差异

## 部署注意事项

1. 微信小程序需配置 `request` 合法域名（后端API地址）
2. 小程序服务器域名仅支持 HTTPS，需配置 SSL 证书
3. 生产环境 JWT Secret 长度 ≥ 32 字符
4. MySQL 字符集用 `utf8mb4`，支持 emoji
5. PM2 或 Docker 部署后端，建议 cluster 模式
6. 头像上传对接 OSS/COS，返回 CDN URL
