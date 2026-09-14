# Cloudflare Pages + GitHub 注册登录系统 完整部署教程

## 技术栈
- 前端：纯 HTML + CSS + JS（静态页面）
- 后端：Cloudflare Pages Functions（Serverless）
- 数据库：Cloudflare D1（SQLite）
- 代码托管：GitHub
- 密码加密：PBKDF2 + SHA-256（10万次迭代）
- 会话：HttpOnly Cookie + 数据库 Session 表

## 项目结构
```
cloudflare-auth/
├── index.html              # 首页
├── login.html              # 登录页
├── register.html           # 注册页
├── profile.html            # 个人中心
├── assets/
│   └── style.css           # 样式
├── functions/
│   ├── _utils.js           # 工具函数（密码哈希、token、用户验证）
│   └── api/
│       ├── register.js     # 注册接口 POST /api/register
│       ├── login.js        # 登录接口 POST /api/login
│       ├── logout.js       # 退出接口 POST /api/logout
│       └── user.js         # 用户信息 GET /api/user
├── schema.sql              # 数据库建表SQL
├── wrangler.toml           # Cloudflare配置
└── README.md               # 本教程
```

## 完整变量说明

### 环境变量（在 Cloudflare Pages 后台设置）
| 变量名 | 说明 | 是否必须 |
|--------|------|----------|
| DB | D1 数据库绑定名 | 必须（代码中通过 env.DB 访问） |

### wrangler.toml 变量
| 变量 | 说明 |
|------|------|
| name | 项目名称 |
| compatibility_date | Workers 兼容日期 |
| d1_databases.binding | 数据库绑定名（必须为 DB） |
| d1_databases.database_name | D1 数据库名称 |
| d1_databases.database_id | D1 数据库ID（创建后获取） |

### 数据库表结构

**users 表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 用户ID（自增） |
| username | TEXT UNIQUE | 用户名 |
| email | TEXT UNIQUE | 邮箱 |
| password | TEXT | 密码哈希（salt$hash 格式） |
| avatar | TEXT | 头像URL |
| bio | TEXT | 个人简介 |
| created_at | DATETIME | 注册时间 |

**sessions 表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 会话ID |
| user_id | INTEGER | 关联用户ID |
| token | TEXT UNIQUE | 会话token（32位十六进制） |
| created_at | DATETIME | 创建时间 |
| expires_at | DATETIME | 过期时间（30天） |

### Cookie 变量
| 变量 | 说明 |
|------|------|
| session_token | 会话token，HttpOnly，SameSite=Lax，有效期30天 |

## 部署步骤（从零开始）

### 第一步：注册账号
1. 注册 GitHub：https://github.com
2. 注册 Cloudflare：https://dash.cloudflare.com（免费版即可）

### 第二步：创建 GitHub 仓库
1. 登录 GitHub，点击右上角 + → New repository
2. 仓库名：`cloudflare-auth`（随意）
3. 选择 Public 或 Private
4. 勾选 Add a README file
5. 点击 Create repository

### 第三步：上传代码到 GitHub
**方法A：网页上传（推荐新手）**
1. 打开刚创建的仓库
2. 点击 Add file → Upload files
3. 把本项目所有文件拖进去（保持目录结构）
4. 点击 Commit changes

**方法B：Git命令行**
```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/你的用户名/cloudflare-auth.git
git push -u origin main
```

### 第四步：创建 Cloudflare D1 数据库
1. 登录 Cloudflare Dashboard
2. 左侧菜单 → Workers & Pages → D1 SQL databases
3. 点击 Create database
4. 名称填 `auth_db`，位置选离你最近的
5. 创建后复制 Database ID（后面要用）

### 第五步：导入数据库表
1. 进入刚创建的 D1 数据库
2. 点击 Console 标签
3. 打开本项目的 `schema.sql`，复制全部内容
4. 粘贴到 Console 输入框，按回车执行
5. 执行 `SELECT name FROM sqlite_master WHERE type='table';` 确认 users 和 sessions 表已创建

### 第六步：创建 Cloudflare Pages 项目
1. Cloudflare Dashboard → Workers & Pages → Create application
2. 选择 Pages 标签 → Connect to Git
3. 授权 GitHub，选择刚才的仓库
4. 点击 Begin setup
5. 构建设置：
   - Framework preset：None
   - Build command：留空
   - Build output directory：留空（或填 `/`）
6. 点击 Environment variables (advanced)
7. 添加变量（生产环境）：
   - 暂时不需要额外变量，D1绑定在后面设置
8. 点击 Save and Deploy
9. 等待部署完成（第一次约1-2分钟）

### 第七步：绑定 D1 数据库到 Pages
1. 进入刚创建的 Pages 项目
2. 点击 Settings → Functions → D1 database bindings
3. 点击 Add binding
4. Variable name 填：`DB`（必须全大写，代码里用的是 env.DB）
5. D1 database 选择：`auth_db`
6. 点击 Save

### 第八步：重新部署
1. 回到 Pages 项目的 Deployments 标签
2. 找到最新的部署，点击右上角 ... → Retry deployment
3. 等待重新部署完成（绑定D1后必须重新部署才生效）

### 第九步：测试
1. 点击 Visit site 打开网站
2. 点击注册，填写用户名、邮箱、密码
3. 注册成功后自动登录，跳转到首页
4. 点击个人中心，确认能看到用户信息
5. 点击退出，再用账号密码登录，确认正常

## API 接口文档

### POST /api/register
请求体：
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "123456"
}
```
响应：
```json
{
  "success": true,
  "message": "注册成功",
  "user": { "id": 1, "username": "testuser", "email": "test@example.com" }
}
```

### POST /api/login
请求体：
```json
{
  "account": "testuser",
  "password": "123456"
}
```
响应：
```json
{
  "success": true,
  "message": "登录成功",
  "user": { "id": 1, "username": "testuser", "email": "test@example.com" }
}
```

### POST /api/logout
响应：
```json
{ "success": true, "message": "已退出登录" }
```

### GET /api/user
响应：
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "avatar": "",
    "bio": "",
    "created_at": "2024-01-01 00:00:00"
  }
}
```

## 常见问题

**Q：部署后接口404？**
A：确认 functions 目录在项目根目录，且文件名正确。Pages Functions 会自动路由 functions/api/xxx.js 到 /api/xxx。

**Q：接口报 DB is not defined？**
A：D1 绑定没做好。回到 Settings → Functions → D1 database bindings，确认 Variable name 是 `DB`，然后重新部署。

**Q：登录后刷新页面就退出了？**
A：检查 Cookie 是否设置成功。浏览器 F12 → Application → Cookies，看有没有 session_token。

**Q：怎么自定义域名？**
A：Pages 项目 → Custom domains → Set up a custom domain，按提示添加 CNAME 记录。

**Q：免费额度够吗？**
A：Cloudflare Pages 免费版：无限请求、无限带宽。D1 免费版：5GB存储、每天500万次读取、10万次写入。个人项目完全够用。

## 安全说明
- 密码使用 PBKDF2 + SHA-256 哈希，10万次迭代，带随机salt
- Session token 使用 crypto.getRandomValues 生成32位随机值
- Cookie 设置 HttpOnly（防止XSS窃取）、SameSite=Lax（防CSRF）
- 所有用户输入都使用 Prepared Statement 绑定，防SQL注入
- 注册时校验用户名长度、邮箱格式、密码长度
