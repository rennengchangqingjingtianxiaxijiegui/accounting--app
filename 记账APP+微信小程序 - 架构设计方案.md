# 记账APP + 微信小程序 — 项目架构方案

## Context

从零搭建记账工具，需同时支持移动端APP和微信小程序。Vue3 + Node.js + TypeScript 全栈，功能涵盖用户模块、多账本管理、收支记账、数据报表。

---

## 1. 技术栈选型

### 前端 (client/)

| 层面 | 选型 | 理由 |
|------|------|------|
| 跨端框架 | **uni-app v3 (Vue3 + TypeScript)** | 一套代码编译 iOS/Android APP + 微信小程序 + H5 |
| 开发语言 | **TypeScript** | 编译时类型检查，分类枚举、金额计算等关键逻辑安全 |
| UI 组件库 | **uView Plus 3.0** | uni-app 生态最成熟的 Vue3 组件库，100+组件，SCSS主题定制 |
| 路由 | **pages.json**（uni-app 内置） | 微信小程序无浏览器URL，页面导航基于栈模型。uni-app 通过 pages.json 配置所有路由和 TabBar，通过 `uni.navigateTo` 等 API 跳转。不支持 Vue Router |
| 状态管理 | **Pinia** | Vue3 官方推荐，TypeScript 完美支持，模块化设计 |
| 图表 | **uCharts** | 基于 Canvas 2D 渲染，专为 uni-app 设计，支持折线图/饼图/环形图/柱状图，约30KB。ECharts 依赖DOM/SVG，小程序不可用 |
| CSS 预处理 | **SCSS** | uView Plus 内置 SCSS，保持一致便于主题覆盖 |
| HTTP 请求 | **Axios**（uni-app 适配层） | 拦截器机制成熟，token 注入和刷新队列 |
| 工具库 | **dayjs**（日期） | 2KB，替代 moment.js（70KB），适合小程序 2MB 包限制 |

### 后端 (server/)

| 层面 | 选型 | 理由 |
|------|------|------|
| 开发语言 | **TypeScript** | 全栈类型一致，Prisma Client 类型安全，减少运行时错误 |
| 运行时 | **Node.js 20 LTS** | |
| 框架 | **Express 4** | 生态最大，中间件丰富，社区成熟 |
| ORM | **Prisma** | Schema 驱动，自动生成类型安全 Client，内置 migration + Studio 可视化 |
| 数据库 | **MySQL 8.0** | 关系型，适合记账结构化数据和聚合统计 |
| 认证 | **JWT**（access + refresh token） | Access Token 15min，Refresh Token 7天（存DB，支持轮换撤销） |
| 密码加密 | **bcryptjs** — 12轮 salt | bcrypt 是业界标准自适应哈希算法。12轮 salt 在安全性和性能间平衡（约250ms/次），有效抵御彩虹表和暴力破解。bcryptjs 是纯 JS 实现，跨平台无编译问题 |
| 微信登录 | 微信 `code2Session` API | 官方标准：`wx.login()` → code → 服务端换 openid/unionid |
| 参数校验 | **Zod** | TypeScript 原生类型推导，运行时校验 + 静态类型二合一 |
| 日志 | **morgan**（请求）+ **winston**（应用） | 请求日志 + 分级应用日志 |

### 可选增强（后期引入）

| 层面 | 选型 | 场景 |
|------|------|------|
| 缓存 | **Redis** (ioredis) | 微信 access_token 缓存（2h TTL）、登录限流计数器 |
| 限流 | **express-rate-limit** | 登录/注册接口防暴力破解 |
| 文件存储 | 阿里云 OSS / 腾讯云 COS | 头像上传，CDN 加速 |

---

## 2. 项目目录结构

> 所有文件名使用 `.ts`（TypeScript），前端 SFC 使用 `<script setup lang="ts">`

```
accounting-app/
├── client/                                # uni-app Vue3 TypeScript 前端
│   ├── src/
│   │   ├── api/                           # HTTP 请求层
│   │   │   ├── request.ts                 # Axios实例 + 拦截器（token注入/401刷新队列）
│   │   │   ├── auth.ts                    # 登录/注册/微信登录/刷新token
│   │   │   ├── user.ts                    # 个人资料/密码修改/头像上传
│   │   │   ├── book.ts                    # 账本CRUD + 成员管理
│   │   │   ├── record.ts                  # 收支记录CRUD + 分页筛选
│   │   │   ├── category.ts               # 分类列表查询
│   │   │   └── report.ts                  # 汇总/趋势/分类统计
│   │   │
│   │   ├── components/                    # 公共组件
│   │   │   ├── NavBar.vue                 # 自定义导航栏（安全区域适配）
│   │   │   ├── EmptyState.vue             # 空状态占位
│   │   │   ├── LoadingSpinner.vue         # 加载指示器
│   │   │   ├── CategoryIcon.vue           # 分类图标展示
│   │   │   ├── AmountDisplay.vue          # 金额展示（红绿区分收支）
│   │   │   ├── TransactionForm.vue        # 记账表单（类型切换/金额/分类/日期/备注）
│   │   │   ├── CategoryPicker.vue         # 分类网格选择器
│   │   │   ├── LineChart.vue              # 趋势折线图（uCharts 封装）
│   │   │   ├── PieChart.vue               # 分类饼图（uCharts 封装）
│   │   │   └── SummaryCards.vue           # 收入/支出/结余 KPI 卡片
│   │   │
│   │   ├── composables/                   # Vue3 组合式函数
│   │   │   ├── useAuth.ts                 # 登录状态/Token管理/微信登录流程
│   │   │   ├── useBook.ts                 # 当前账本切换/权限检查
│   │   │   ├── useRecord.ts              # 记录CRUD操作/乐观更新
│   │   │   ├── useReport.ts              # 报表数据获取/日期范围管理
│   │   │   └── usePagination.ts           # 上拉加载更多/下拉刷新
│   │   │
│   │   ├── pages/                         # 页面组件（pages.json 中注册）
│   │   │   ├── auth/
│   │   │   │   ├── login.vue              # 手机号+密码登录 / 微信快捷登录
│   │   │   │   └── register.vue           # 手机号注册
│   │   │   ├── user/
│   │   │   │   ├── profile.vue            # 个人资料展示/编辑
│   │   │   │   └── change-password.vue    # 修改密码
│   │   │   ├── book/
│   │   │   │   ├── list.vue               # 我的账本列表
│   │   │   │   ├── create.vue             # 创建/编辑账本
│   │   │   │   └── members.vue            # 成员管理（邀请/角色设置/移除）
│   │   │   ├── record/
│   │   │   │   ├── index.vue              # 首页：当月收支概览+记录时间线
│   │   │   │   ├── add.vue                # 添加记录（核心表单页）
│   │   │   │   ├── edit.vue               # 编辑记录
│   │   │   │   └── detail.vue             # 记录详情
│   │   │   └── report/
│   │   │       ├── index.vue              # 报表首页（汇总卡片+图表入口）
│   │   │       ├── trend.vue              # 收支趋势折线图
│   │   │       └── category.vue           # 分类支出饼图
│   │   │
│   │   ├── store/                         # Pinia Store（TypeScript）
│   │   │   ├── auth.ts                    # 用户信息 + token + 登录状态
│   │   │   ├── book.ts                    # 当前账本 + 账本列表 + 权限角色
│   │   │   └── category.ts               # 收支分类缓存
│   │   │
│   │   ├── types/                         # 前端类型定义
│   │   │   ├── api.ts                     # API 请求/响应泛型
│   │   │   ├── user.ts                    # User, LoginParams, RegisterParams
│   │   │   ├── book.ts                    # Book, BookMember, MemberRole
│   │   │   ├── record.ts                 # Record, CreateRecordParams, RecordFilter
│   │   │   └── report.ts                 # SummaryData, TrendData, CategoryData
│   │   │
│   │   ├── utils/
│   │   │   ├── storage.ts                 # uni.storage 类型化封装
│   │   │   ├── validator.ts              # 表单校验规则（手机号/密码/金额）
│   │   │   └── format.ts                 # 金额格式化（¥1,234.56）/日期格式化
│   │   │
│   │   ├── static/
│   │   │   └── icons/                     # 分类图标资源
│   │   │
│   │   ├── App.vue
│   │   ├── main.ts                        # createApp → Pinia → uView Plus
│   │   ├── env.d.ts                       # 全局类型声明
│   │   ├── pages.json                     # 页面路由配置 + TabBar
│   │   ├── manifest.json                  # 应用配置（AppID/权限）
│   │   └── uni.scss                       # 全局 SCSS 变量
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts                     # uni-app Vite 插件配置
│
├── server/                                # Express TypeScript 后端
│   ├── prisma/
│   │   ├── schema.prisma                  # 数据模型（5张表+索引）
│   │   ├── migrations/                    # Prisma 自动生成
│   │   └── seed.ts                        # 默认收支分类 + 测试数据
│   │
│   ├── src/
│   │   ├── app.ts                         # Express 应用工厂：中间件+路由挂载
│   │   ├── index.ts                       # 入口：启动服务、优雅关闭
│   │   │
│   │   ├── config/
│   │   │   └── index.ts                   # 环境变量解析 + 集中配置
│   │   │
│   │   ├── controllers/                   # 路由处理器（薄层）
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── book.controller.ts
│   │   │   ├── record.controller.ts
│   │   │   ├── category.controller.ts
│   │   │   └── report.controller.ts
│   │   │
│   │   ├── services/                      # 业务逻辑层
│   │   │   ├── auth.service.ts            # 注册/登录/微信登录/Token刷新
│   │   │   ├── user.service.ts            # 资料/密码/头像
│   │   │   ├── book.service.ts            # 账本CRUD+成员+权限
│   │   │   ├── record.service.ts          # 记录CRUD+分页筛选
│   │   │   ├── category.service.ts        # 分类管理
│   │   │   └── report.service.ts          # 聚合统计查询
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts                    # JWT Bearer Token 验证 → req.user
│   │   │   ├── bookAccess.ts             # 账本成员角色校验 → req.memberRole
│   │   │   ├── validate.ts               # Zod Schema → 校验中间件工厂
│   │   │   └── errorHandler.ts            # 全局错误捕获 → 统一响应
│   │   │
│   │   ├── routes/
│   │   │   ├── index.ts                   # 路由汇总 /api/v1
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── book.routes.ts
│   │   │   ├── record.routes.ts
│   │   │   ├── category.routes.ts
│   │   │   └── report.routes.ts
│   │   │
│   │   ├── validators/                    # Zod 校验 Schema
│   │   │   ├── auth.validator.ts
│   │   │   ├── user.validator.ts
│   │   │   ├── book.validator.ts
│   │   │   ├── record.validator.ts
│   │   │   └── report.validator.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.ts                     # JWT 签发/验证（access + refresh）
│   │   │   ├── password.ts               # bcryptjs 哈希/比较（12轮salt）
│   │   │   ├── wechat.ts                  # 微信 code2Session + 数据解密
│   │   │   ├── response.ts               # 统一响应格式
│   │   │   └── errors.ts                  # 自定义 AppError 类族
│   │   │
│   │   └── types/
│   │       ├── express.d.ts               # 扩展 Express Request（注入user/memberRole）
│   │       └── index.ts                   # 通用类型
│   │
│   ├── tests/
│   │   ├── helpers/
│   │   │   └── factory.ts                 # 测试数据工厂函数
│   │   ├── unit/
│   │   │   ├── auth.service.test.ts
│   │   │   ├── record.service.test.ts
│   │   │   └── report.service.test.ts
│   │   └── integration/
│   │       ├── auth.test.ts
│   │       ├── book.test.ts
│   │       ├── record.test.ts
│   │       └── report.test.ts
│   │
│   ├── tsconfig.json
│   ├── jest.config.ts                     # Jest + ts-jest 配置
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── shared/                                # 前后端共享（唯一真相源）
│   ├── constants/
│   │   └── categories.ts                  # 收支分类定义（key/名称/图标/类型）
│   └── types/
│       └── enums.ts                       # 枚举：BookType, MemberRole, RecordType
│
├── .eslintrc.cjs                          # ESLint + TypeScript 规则
├── .prettierrc
├── .gitignore
├── CLAUDE.md                              # AI 助手上文文档
└── README.md
```

---

## 3. 数据库表设计

### 3.1 ER 关系

```
User  1──N  BookMember  N──1  Book
User  1──N  Record      N──1  Book
Record N──1  Category
Category N──1  Book?（自定义分类归属账本；null=系统默认）
User  1──N  RefreshToken
```

### 3.2 表定义

#### users — 用户表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT PK AUTO_INCREMENT | | |
| phone | VARCHAR(20) | UNIQUE, NULLABLE | 纯微信用户无手机号 |
| password_hash | VARCHAR(255) | NULLABLE | bcryptjs 12轮哈希，仅手机注册用户有 |
| wechat_openid | VARCHAR(100) | UNIQUE, NULLABLE | |
| wechat_unionid | VARCHAR(100) | NULLABLE | 跨平台统一ID |
| nickname | VARCHAR(50) | DEFAULT '' | |
| avatar_url | VARCHAR(500) | NULLABLE | |
| gender | TINYINT | DEFAULT 0 | 0未知 1男 2女 |
| created_at | DATETIME | DEFAULT NOW() | |
| updated_at | DATETIME | ON UPDATE NOW() | |

#### refresh_tokens — 刷新令牌表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT PK AUTO_INCREMENT | | |
| token | VARCHAR(255) | UNIQUE, INDEX | JWT Refresh Token |
| user_id | INT FK→users.id | INDEX | 级联删除 |
| expires_at | DATETIME | | 7天后过期 |
| created_at | DATETIME | DEFAULT NOW() | |

> **Token 轮换策略**：每次刷新时删除旧 token 生成新 token，泄露后可撤销。

#### books — 账本表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT PK AUTO_INCREMENT | | |
| name | VARCHAR(50) | NOT NULL | |
| type | ENUM('personal','family','travel','business','other') | DEFAULT 'personal' | |
| cover_icon | VARCHAR(50) | DEFAULT 'wallet' | |
| created_by | INT FK→users.id | | 创建者 |
| is_deleted | TINYINT | DEFAULT 0 | 软删除 |
| created_at | DATETIME | DEFAULT NOW() | |
| updated_at | DATETIME | ON UPDATE NOW() | |

#### book_members — 账本成员表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT PK AUTO_INCREMENT | | |
| book_id | INT FK→books.id | | 级联删除 |
| user_id | INT FK→users.id | | 级联删除 |
| role | ENUM('owner','admin','editor','viewer') | DEFAULT 'editor' | |
| joined_at | DATETIME | DEFAULT NOW() | |
| | | UNIQUE(book_id, user_id) | 一人一账本唯一角色 |

**角色权限矩阵**：

| 操作 | owner | admin | editor | viewer |
|------|-------|-------|--------|--------|
| 编辑账本信息 | ✅ | ✅ | ❌ | ❌ |
| 删除账本 | ✅ | ❌ | ❌ | ❌ |
| 管理成员 | ✅ | ✅ | ❌ | ❌ |
| 添加/编辑/删除记录 | ✅ | ✅ | ✅ | ❌ |
| 查看记录 | ✅ | ✅ | ✅ | ✅ |
| 查看报表 | ✅ | ✅ | ✅ | ✅ |

#### categories — 收支分类表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT PK AUTO_INCREMENT | | |
| name | VARCHAR(30) | NOT NULL | |
| type | ENUM('income','expense') | NOT NULL | |
| icon | VARCHAR(50) | DEFAULT '' | 图标标识 |
| parent_id | INT FK→categories.id | NULLABLE | 父分类（二级） |
| sort_order | INT | DEFAULT 0 | 排序权重 |
| is_default | TINYINT | DEFAULT 1 | 系统分类不可删除 |
| book_id | INT FK→books.id | NULLABLE | NULL=全局，非NULL=某账本自定义 |

**预置默认分类**：

| 支出 | 图标 | 支出 | 图标 | 收入 | 图标 |
|------|------|------|------|------|------|
| 餐饮 | food | 医疗 | medical | 工资 | salary |
| 交通 | transport | 教育 | education | 奖金 | bonus |
| 购物 | shopping | 通讯 | telecom | 投资 | invest |
| 衣物 | clothing | 娱乐 | entertainment | 兼职 | parttime |
| 居住 | housing | 数码 | digital | 红包 | redpacket |
| 美容 | beauty | 宠物 | pet | 报销 | reimburse |
| 运动 | sport | 社交 | social | 退款 | refund |
| 旅行 | travel | 其他 | other-expense | 其他收入 | other-income |

#### records — 收支记录表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT PK AUTO_INCREMENT | | |
| book_id | INT FK→books.id | NOT NULL | 所属账本 |
| user_id | INT FK→users.id | NOT NULL | 记录人 |
| category_id | INT FK→categories.id | NOT NULL | 分类 |
| type | ENUM('income','expense') | NOT NULL | 冗余字段加速筛选 |
| amount | DECIMAL(12,2) | NOT NULL | 精确十进制，避免浮点误差 |
| note | VARCHAR(200) | NULLABLE | 备注 |
| record_date | DATE | NOT NULL | 记账日期 |
| is_deleted | TINYINT | DEFAULT 0 | 软删除 |
| created_at | DATETIME | DEFAULT NOW() | |
| updated_at | DATETIME | ON UPDATE NOW() | |

**索引**：
- `INDEX idx_book_date (book_id, record_date DESC)` — 主查询路径
- `INDEX idx_book_category (book_id, category_id, record_date)` — 分类报表
- `INDEX idx_user (user_id)` — 用户维度查询

---

## 4. API 设计

**Base URL**: `/api/v1`
**统一响应**:
```json
// 成功
{ "code": 0, "message": "ok", "data": { ... } }
// 错误
{ "code": 1001, "message": "手机号已注册", "data": null }
```

**错误码体系**：

| code | 含义 |
|------|------|
| 0 | 成功 |
| 1001 | 参数校验失败 |
| 1002 | 未登录/Token无效 |
| 1003 | 无权限 |
| 1004 | 资源不存在 |
| 1005 | 资源冲突（重复） |
| 2001 | 微信登录失败 |
| 5000 | 服务器内部错误 |

> **金额传输规范**：API 中金额以字符串传输（`"123.45"`），避免 JSON 浮点精度问题。前端展示时格式化，计算时转为整数分（fen）。

### 4.1 认证 `/api/v1/auth`

| 方法 | 路径 | 需登录 | 说明 | 请求体 |
|------|------|--------|------|--------|
| POST | /auth/register | ❌ | 手机号注册 | `{ phone, password, code }` |
| POST | /auth/login | ❌ | 手机号+密码登录 | `{ phone, password }` |
| POST | /auth/wechat-login | ❌ | 微信code登录 | `{ code }` (wx.login) |
| POST | /auth/refresh | ❌ | 刷新AccessToken | `{ refreshToken }` |
| POST | /auth/logout | ✅ | 注销RefreshToken | `{ refreshToken }` |
| POST | /auth/send-sms | ❌ | 发送短信验证码 | `{ phone }` |

### 4.2 用户 `/api/v1/user`

| 方法 | 路径 | 需登录 | 说明 |
|------|------|--------|------|
| GET | /user/profile | ✅ | 获取个人信息 |
| PUT | /user/profile | ✅ | 修改昵称/头像/性别 |
| PUT | /user/password | ✅ | 修改密码（需旧密码验证） |
| POST | /user/avatar/upload | ✅ | 上传头像 |

### 4.3 账本 `/api/v1/books`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /books | 登录 | 我的账本列表 |
| POST | /books | 登录 | 创建账本（自动成为owner） |
| GET | /books/:id | member+ | 账本详情+成员数/记录数 |
| PUT | /books/:id | owner/admin | 编辑名称/类型 |
| DELETE | /books/:id | owner | 软删除 |
| GET | /books/:id/members | member+ | 成员列表 |
| POST | /books/:id/members | owner/admin | 添加成员 `{ userId, role }` |
| PUT | /books/:id/members/:mid | owner/admin | 修改角色 `{ role }` |
| DELETE | /books/:id/members/:mid | owner/admin | 移除成员 |

### 4.4 记账 `/api/v1`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /categories | 登录 | 分类列表 `?type=expense` |
| GET | /books/:bid/records | member+ | 记录列表 `?page=&pageSize=&startDate=&endDate=&type=&categoryId=` |
| POST | /books/:bid/records | editor+ | 添加记录 |
| GET | /books/:bid/records/:id | member+ | 记录详情 |
| PUT | /books/:bid/records/:id | editor+ (自己) 或 admin+ | 编辑记录 |
| DELETE | /books/:bid/records/:id | editor+ (自己) 或 admin+ | 删除记录 |

### 4.5 报表 `/api/v1/books/:bid/reports`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | .../summary | member+ | 汇总 `?period=month&date=2026-08` → `{income, expense, balance}` |
| GET | .../trend | member+ | 趋势 `?period=month&date=2026-08` → `[{date, income, expense}, ...]` |
| GET | .../category | member+ | 分类占比 `?period=month&date=2026-08&type=expense` → `[{category, amount, percent}, ...]` |

---

## 5. 各文件职责

### 5.1 后端核心

| 文件 | 职责 |
|------|------|
| `prisma/schema.prisma` | 全部数据表、枚举、关联、索引定义。Prisma Client 由此生成 |
| `prisma/seed.ts` | 初始化24个默认分类，可选插入测试用户和数据 |
| `src/app.ts` | Express应用工厂：`cors→json→morgan→路由→errorHandler` |
| `src/index.ts` | 启动HTTP服务，`prisma.$connect()`，注册 `SIGTERM` 优雅关闭 |
| `src/config/index.ts` | 从 `.env` 读取并校验：`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `WECHAT_APPID`, `WECHAT_SECRET` 等 |
| `src/middleware/auth.ts` | `Authorization: Bearer <token>` → JWT.verify → 查DB用户存在 → `req.user = { id, phone }` |
| `src/middleware/bookAccess.ts` | 工厂函数 `requireRole(...roles)` → 查 book_members → 校验角色 → `req.memberRole = role` |
| `src/middleware/validate.ts` | `validate(schema, 'body'|'query'|'params')` → Zod校验 → 失败返回1001 |
| `src/middleware/errorHandler.ts` | 捕获 `AppError`/`ZodError`/`PrismaError` → 映射为统一错误响应 |
| `src/utils/jwt.ts` | `signAccess(payload)`, `signRefresh(payload)`, `verify(token, secret)` |
| `src/utils/password.ts` | `hash(plain)` — bcryptjs 12轮salt, `compare(plain, hash)` — 防时序攻击 |
| `src/utils/response.ts` | `success(res, data)`, `fail(res, code, message)` |
| `src/utils/errors.ts` | `AppError`, `AuthError`, `PermissionError`, `NotFoundError` 类 |
| `src/utils/wechat.ts` | `code2Session(code)` 用 axios 调微信API；`decryptData()` 解密用户敏感信息 |
| `src/services/auth.service.ts` | 注册：短信校验→手机号查重→bcrypt hash→创建User→生成Token对。登录：查User→bcrypt compare→Token对。微信登录：code→openid→找或创User→Token对。refreshToken：查找→验证过期→轮换删除旧Token生成新Token对 |
| `src/services/record.service.ts` | create/update/delete 含权限校验；list 含动态 where 构建+游标分页 |
| `src/services/report.service.ts` | Prisma groupBy 聚合：按日/月求和、按分类+金额排序计算占比 |
| `src/controllers/*.ts` | 解析 req → 调 service → `success(res, data)` |
| `src/routes/*.ts` | 定义路由 → 绑定中间件(auth, bookAccess, validate) → 绑定controller |
| `src/validators/*.ts` | Zod schema：手机号正则、密码长度(6-20)、金额正数、日期格式等 |

### 5.2 前端核心

| 文件 | 职责 |
|------|------|
| `src/api/request.ts` | Axios 实例：`baseURL` + 请求拦截器注入 token + 响应拦截器处理401（Promise队列防并发刷新） |
| `src/api/*.ts` | 各模块 API 函数，返回 `Promise<ApiResponse<T>>` |
| `src/store/auth.ts` | `user`, `accessToken`, `refreshToken` 状态；`login/logout/refreshToken` actions；持久化到 `uni.storage` |
| `src/store/book.ts` | `activeBookId`, `myBooks[]`, `currentRole`；`switchBook/fetchBooks` |
| `src/composables/useAuth.ts` | `isLoggedIn` ref + `loginByPhone/loginByWechat/register/logout` |
| `src/composables/useRecord.ts` | 封装CRUD操作+乐观更新（先更新UI失败回滚）+ 筛选分页状态 |
| `src/composables/useReport.ts` | 报表日期切换 + 数据获取 + uCharts 数据格式转换 |
| `src/pages/record/add.vue` | 核心表单：类型Tab切换→金额输入→分类网格选择→备注→日期→提交 |
| `src/components/LineChart.vue` | uCharts 折线图封装：rpx→px 尺寸计算、Canvas 初始化、触摸交互 |
| `src/components/PieChart.vue` | uCharts 饼图封装：环形图、点击扇形查看详情 |

### 5.3 共享层

| 文件 | 职责 |
|------|------|
| `shared/constants/categories.ts` | 24个默认分类定义，server seed 和 client 分类选择器共同引用 |
| `shared/types/enums.ts` | `BookType`, `MemberRole`, `RecordType` 枚举，前后端类型一致 |

---

## 6. 实现步骤（7个阶段）

### Phase 1: 项目脚手架（1-2天）

1. 创建根目录，`git init`
2. `server/`：`npm init`，安装 `express typescript ts-node prisma @prisma/client zod bcryptjs jsonwebtoken morgan cors dotenv`
3. 配置 `tsconfig.json`、`jest.config.ts`
4. 编写 `src/app.ts` 骨架
5. 编写 `src/utils/response.ts`、`src/utils/errors.ts`
6. 编写 `src/middleware/errorHandler.ts`、`src/middleware/validate.ts`
7. `client/`：用 uni-app CLI 创建 Vue3+TS 项目
8. 安装 uView Plus / Pinia / Axios / dayjs
9. 编写 `src/api/request.ts`（请求拦截器+401刷新队列）
10. 编写 `src/utils/storage.ts`
11. 配置 `pages.json` 页面路由和 TabBar（首页/报表/我的）
12. 配置 ESLint + Prettier

### Phase 2: 数据库与认证（3-4天）

1. 编写 `prisma/schema.prisma`（全部6张表含 refresh_tokens）
2. `npx prisma migrate dev` 生成数据库
3. 编写 `prisma/seed.ts` 插入24个默认分类
4. 编写 `src/utils/jwt.ts`（access 15min + refresh 7d 双token）
5. 编写 `src/utils/password.ts`（bcryptjs 12轮）
6. 编写 `src/utils/wechat.ts`（code2Session）
7. 编写 `src/middleware/auth.ts`
8. 编写 `src/validators/auth.validator.ts`
9. 实现认证全链路：`auth.service.ts` → `auth.controller.ts` → `auth.routes.ts`
10. 实现用户接口：`user.service.ts` → `user.controller.ts` → `user.routes.ts`
11. 前端：`store/auth.ts` → `api/auth.ts` → `pages/auth/login.vue` → `pages/auth/register.vue`
12. 前端：`pages/user/profile.vue`、`pages/user/change-password.vue`
13. 编写 `tests/integration/auth.test.ts`

### Phase 3: 账本模块（2-3天）

1. 编写 `src/middleware/bookAccess.ts`（角色权限工厂函数）
2. 编写 `src/validators/book.validator.ts`
3. 实现 `book.service.ts`（CRUD + 成员管理）→ `book.controller.ts` → `book.routes.ts`
4. 前端：`store/book.ts` → `api/book.ts`
5. 前端：`pages/book/list.vue`（账本列表+创建入口）
6. 前端：`pages/book/create.vue`（创建/编辑表单）
7. 前端：`pages/book/members.vue`（成员列表+邀请+角色管理）
8. 编写 `tests/integration/book.test.ts`

### Phase 4: 记账模块（核心，4-5天）

1. 编写 `src/validators/record.validator.ts`
2. 实现 `record.service.ts`（CRUD + 日期范围/分类/类型筛选 + 游标分页）→ `record.controller.ts` → `record.routes.ts`
3. 实现 `category.service.ts` → `category.controller.ts` → `category.routes.ts`
4. 前端：`api/record.ts` + `api/category.ts`
5. 前端：`components/CategoryIcon.vue` + `components/CategoryPicker.vue`
6. 前端：`components/TransactionForm.vue`（核心表单组件，被 add/edit 共用）
7. **首页**: `pages/record/index.vue` — 当月汇总卡片 + 按日期分组的时间线列表 + 下拉刷新 + 上拉加载
8. **添加页**: `pages/record/add.vue` — 类型Tab、金额数字键盘、分类网格选择器、备注、日期
9. 前端：`pages/record/edit.vue` + `pages/record/detail.vue`
10. 前端：`composables/useRecord.ts`（乐观更新逻辑）
11. 编写 `tests/integration/record.test.ts`

### Phase 5: 报表模块（3-4天）

1. 实现 `report.service.ts`（Prisma groupBy 日/月/分类聚合）→ `report.controller.ts` → `report.routes.ts`
2. 前端：安装 uCharts（npm 或 uni-app 插件市场）
3. 前端：`components/LineChart.vue`（uCharts 折线图封装，Canvas 适配）
4. 前端：`components/PieChart.vue`（uCharts 环形饼图封装）
5. 前端：`components/SummaryCards.vue`（KPI卡片：收入/支出/结余）
6. 前端：`pages/report/index.vue`（汇总卡片 + 图表入口）
7. 前端：`pages/report/trend.vue`（日趋势折线图 + 月/年切换）
8. 前端：`pages/report/category.vue`（分类支出饼图）
9. 前端：`composables/useReport.ts`
10. 编写 `tests/integration/report.test.ts`

### Phase 6: 平台适配与优化（2-3天）

1. uni-app 条件编译：`#ifdef MP-WEIXIN` 微信特定逻辑、`#ifdef APP-PLUS` APP 特定逻辑
2. 微信小程序 `manifest.json` 配置：AppID、request 合法域名、权限声明
3. 小程序分包配置（主包 + 报表分包，控制2MB限制）
4. SAFE AREA 适配：状态栏高度、底部安全区、自定义 NavBar
5. APP 端：启动页、状态栏沉浸式
6. 微信登录完整流程联调：`wx.login()` → code → 后端 → JWT
7. 性能优化：记录列表虚拟滚动、图片懒加载、Pinia 持久化策略

### Phase 7: 测试与文档（2-3天）

1. 后端单元测试补全（覆盖率：service≥80%，整体≥60%）
2. 后端集成测试补全（完整用户旅程）
3. 前端组件测试：TransactionForm、CategoryPicker
4. 前端 Store 测试：auth store 登录/登出状态流转
5. 端到端流程验证：注册→创建账本→记账→查看报表
6. 编写 `CLAUDE.md`（项目文档）
7. 编写 `.env.example` + `README.md` 启动指南

---

## 7. 测试方案

### 7.1 后端测试

| 类型 | 工具 | 范围 |
|------|------|------|
| 单元测试 | Jest + ts-jest | Service 层，Mock Prisma Client |
| 集成测试 | Jest + Supertest | 完整 HTTP 链路，真实测试数据库 |

### 7.2 关键测试用例

| 模块 | 用例 | 验证点 |
|------|------|--------|
| 认证 | 手机号注册→登录→获取profile | 返回JWT双token |
| 认证 | 错误密码登录 | 返回1002 |
| 认证 | 过期Token请求 | 返回1002 |
| 认证 | 刷新Token→旧Token失效 | 轮换生效 |
| 密码 | bcrypt 哈希不可逆 | 相同密码生成不同哈希(salt随机) |
| 密码 | 修改密码后旧密码登录失败 | bcrypt compare 一致性 |
| 账本 | 创建账本→自动owner | member表自动插入 |
| 账本 | 非成员访问 | 返回1003 |
| 账本 | viewer尝试添加记录 | 返回1003 |
| 记账 | CRUD完整流程 | 增查改删 |
| 记账 | 金额Decimal精度 | `100.01 + 200.02 = 300.03` 无浮点误差 |
| 记账 | 日期范围筛选 | 仅返回范围内的记录 |
| 报表 | 汇总金额正确 | 插入3条记录→汇总一致 |
| 报表 | 分类占比正确 | 餐饮60%+交通40%=100% |

### 7.3 前端测试

| 类型 | 工具 | 范围 |
|------|------|------|
| 组件测试 | Vitest + @vue/test-utils | TransactionForm 表单校验、金额格式化 |
| Store 测试 | Vitest | auth store 登录/登出/Token刷新 |
| E2E | HBuilderX 真机调试 | MVP 阶段手动测试 |

---

## 8. 密码安全方案详解

### bcryptjs 12轮 salt

```
注册: 用户密码 "MyPass123"
  → bcryptjs.hash("MyPass123", 12)
  → "$2a$12$L9XmJvT8kQ3wR5yN7pZ1uO..." (60字符，含salt和hash)

登录: 用户提交 "MyPass123"
  → bcryptjs.compare("MyPass123", storedHash)
  → true / false
```

**为什么选12轮**：
- bcrypt 是自适应哈希，迭代次数 = 2^rounds。10轮是常用默认值，12轮安全性翻4倍
- 12轮约250ms/次，登录体验无感知，暴力破解成本极高
- bcryptjs 纯 JS 实现，无 node-gyp 原生编译依赖，跨平台一致

**防时序攻击**：`bcryptjs.compare()` 内部使用常量时间比较，不会因字符匹配提前返回

**密码强度要求**（Zod校验）：6-20位，至少包含数字+字母

---

## 9. 验证方式

1. **Phase 2**：Postman/curl 走通注册→登录→JWT→获取profile→修改密码
2. **Phase 3**：创建2个账本→互相添加不同角色成员→验证权限隔离
3. **Phase 4**：不同账本各添加20+条记录→测试分页/筛选/日期范围
4. **Phase 5**：跑集成测试 `npm test` → 确认覆盖率达标
5. **Phase 7**：HBuilderX 编译 → 微信开发者工具扫码测试完整流程

---

## 10. CLAUDE.md — 项目文档（审批后写入根目录）

以下为 `accounting-app/CLAUDE.md` 的完整内容，审批后立即创建：

```markdown
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
```

---

## 审批后立即执行

1. 将上述 CLAUDE.md 写入 `c:\Users\lr961\Desktop\AICoding\vue3-app\accounting-app\CLAUDE.md`
2. 开始 Phase 1：项目脚手架搭建
