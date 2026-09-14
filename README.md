# Cloudflare Pages + GitHub 注册登录系统（完整版）

## 功能列表
- 用户注册（用户名+邮箱+密码）
- 用户登录（用户名/邮箱+密码）
- 退出登录
- 个人中心（显示用户信息）
- EmailJS 邮箱验证码（注册时必须验证）
- 禁止临时邮箱注册（黑名单检测）
- 禁止域名邮箱/企业邮箱注册（仅允许公共邮箱）
- Cloudflare Turnstile 人机验证（注册+登录）
- 中国时区时间（UTC+8，广东茂名时间）
- 密码 PBKDF2 + SHA-256 哈希（10万次迭代）
- HttpOnly Cookie 会话（30天有效期）
- 防SQL注入（Prepared Statement）

## 技术栈
- 前端：纯 HTML + CSS + JS
- 后端：Cloudflare Pages Functions（Serverless）
- 数据库：Cloudflare D1（SQLite）
- 代码托管：GitHub
- 邮件：EmailJS REST API
- 人机验证：Cloudflare Turnstile

## 项目结构
```
cloudflare-auth/
├── index.html                  # 首页
├── login.html                  # 登录页（含Turnstile）
├── register.html               # 注册页（含验证码+Turnstile）
├── profile.html                # 个人中心
├── assets/
│   └── style.css               # 样式
├── functions/
│   ├── _utils.js               # 工具函数（密码哈希/邮箱检测/EmailJS/Turnstile/时区）
│   └── api/
│       ├── register.js         # 注册接口 POST /api/register
│       ├── login.js            # 登录接口 POST /api/login
│       ├── logout.js           # 退出接口 POST /api/logout
│       ├── user.js             # 用户信息 GET /api/user
│       └── send_code.js        # 发送验证码 POST /api/send_code
├── schema.sql                  # 数据库建表SQL（users/sessions/email_codes）
├── wrangler.toml               # 配置文件（Pages可忽略，Workers用）
└── README.md                   # 本教程
```

## 完整变量说明

### 一、Cloudflare Pages 环境变量（必须在后台设置）
| 变量名 | 说明 | 示例 |
|--------|------|------|
| DB | D1数据库绑定名（固定为DB） | 自动绑定 |
| TURNSTILE_SECRET_KEY | Turnstile 密钥 | 0xAAAA... |

> EmailJS 已内置配置（service_pj60jer / template_19nbgn9 / JyM2FaCOfdCyNkunC），无需额外设置环境变量。邮件标题为【龙黑化】注册验证码。

### 二、前端需要替换的变量
| 文件 | 变量 | 说明 |
|------|------|------|
| register.html | data-sitekey="YOUR_TURNSTILE_SITE_KEY" | 替换为你的Turnstile Site Key |
| login.html | data-sitekey="YOUR_TURNSTILE_SITE_KEY" | 替换为你的Turnstile Site Key |

### 三、数据库表结构

**users 表（用户表）**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 用户ID（自增） |
| username | TEXT UNIQUE | 用户名 |
| email | TEXT UNIQUE | 邮箱 |
| password | TEXT | 密码哈希（salt$hash） |
| avatar | TEXT | 头像URL |
| bio | TEXT | 个人简介 |
| created_at | DATETIME | 注册时间（中国时区UTC+8） |

**sessions 表（会话表）**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 会话ID |
| user_id | INTEGER | 关联用户ID |
| token | TEXT UNIQUE | 会话token |
| created_at | DATETIME | 创建时间 |
| expires_at | DATETIME | 过期时间（30天） |

**email_codes 表（验证码表）**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 验证码ID |
| email | TEXT | 邮箱 |
| code | TEXT | 6位验证码 |
| created_at | DATETIME | 创建时间 |
| expires_at | DATETIME | 过期时间（10分钟） |
| used | INTEGER | 是否已使用（0=未用，1=已用） |

### 四、Cookie 变量
| 变量 | 说明 |
|------|------|
| session_token | 会话token，HttpOnly，SameSite=Lax，有效期30天 |

### 五、中国时区说明
- D1 数据库默认使用 UTC 时间
- 代码中 `getChinaTime()` 函数自动将时间转换为 UTC+8（中国/广东茂名时间）
- 用户注册时间 `created_at` 存储的是中国时区时间
- 显示时直接读取即可，无需再转换

---

## 部署步骤（Pages 方式，纯网页操作）

### 第1步：准备工作
1. 注册 GitHub：https://github.com
2. 注册 Cloudflare：https://dash.cloudflare.com
3. 注册 EmailJS：https://www.emailjs.com（免费版够用）
4. Cloudflare Turnstile：在 Cloudflare 后台创建（免费）

### 第2步：创建 GitHub 仓库并上传代码
1. GitHub 右上角 + → New repository
2. 仓库名：`my-auth-site`，选 Public，勾选 Add README
3. Create repository
4. Add file → Upload files
5. 把本项目所有文件拖进去（保持目录结构）
6. Commit changes

### 第3步：创建 Cloudflare D1 数据库
1. Cloudflare 后台 → Workers & Pages → D1 SQL databases
2. Create database
3. 名称：`auth_db`，位置选 WNAM（美国西部，对中国访问快）
4. Create
5. 进入数据库 → Console 标签
6. 打开 schema.sql，全选复制，粘贴到 Console，回车执行
7. 验证：输入 `SELECT name FROM sqlite_master WHERE type='table';`，应显示 users、sessions、email_codes 三张表

### 第4步：EmailJS 已配置（无需操作）
EmailJS 已内置在代码中，配置如下：
- Service ID：`service_pj60jer`
- Template ID：`template_19nbgn9`
- User ID：`JyM2FaCOfdCyNkunC`
- 邮件标题：`【龙黑化】注册验证码`
- 模板变量：`to_email`、`to_name`、`code`、`subject`

> 确保你的 EmailJS 模板里包含 `{{to_email}}`、`{{to_name}}`、`{{code}}`、`{{subject}}` 这四个变量。

### 第5步：创建 Cloudflare Turnstile
1. Cloudflare 后台 → 左侧菜单 Turnstile（在 SSL/TLS 下面，或搜索 Turnstile）
2. Add site
3. Site name：随便填，比如 `my-auth-site`
4. Domain：填你的 Pages 域名，比如 `my-auth-site.pages.dev`
5. Widget Mode：选 Managed（自动判断）
6. Create
7. 创建后复制 Site Key（前端用）和 Secret Key（后端用）

### 第6步：修改前端代码中的 Turnstile Site Key
1. 打开 GitHub 仓库里的 register.html
2. 找到 `data-sitekey="YOUR_TURNSTILE_SITE_KEY"`
3. 替换为你刚复制的 Turnstile Site Key
4. 同样修改 login.html 里的 sitekey
5. Commit changes（Pages 会自动重新部署）

### 第7步：创建 Cloudflare Pages 项目
1. Cloudflare 后台 → Workers & Pages → Create application
2. 选 Pages 标签 → Connect to Git
3. 授权 GitHub，选择 `my-auth-site` 仓库
4. Begin setup
5. 构建设置：
   - Framework preset：None
   - Build command：留空
   - Build output directory：留空
6. Save and Deploy
7. 等部署成功

### 第8步：设置环境变量
1. Pages 项目 → Settings → Environment variables
2. Production 环境，点 Add variable，添加：
   - `TURNSTILE_SECRET_KEY` = 你的Turnstile Secret Key
3. 点 Save

> EmailJS 已内置在代码中，无需设置环境变量。

### 第9步：绑定 D1 数据库
1. Pages 项目 → Settings → Functions
2. 找到 D1 database bindings → Add binding
3. Variable name：`DB`（必须全大写）
4. D1 database：选 `auth_db`
5. Save

### 第10步：重新部署
1. Pages 项目 → Deployments 标签
2. 最新部署右边点 ... → Retry deployment
3. 等成功（环境变量和D1绑定后必须重新部署才生效）

### 第11步：测试
1. 点 Visit site 打开网站
2. 点注册
3. 填用户名、邮箱（必须是公共邮箱如Gmail/QQ/163）
4. 点发送验证码（先完成人机验证）
5. 去邮箱收验证码，填入
6. 完成人机验证，点注册
7. 注册成功自动登录，跳首页
8. 点个人中心，确认信息正常
9. 退出，再登录测试

---

## API 接口文档

### POST /api/send_code（发送验证码）
请求体：
```json
{
  "email": "test@gmail.com",
  "turnstile_token": "Turnstile验证返回的token"
}
```
响应：
```json
{ "success": true, "message": "验证码已发送，有效期10分钟" }
```

### POST /api/register（注册）
请求体：
```json
{
  "username": "testuser",
  "email": "test@gmail.com",
  "password": "123456",
  "code": "123456",
  "turnstile_token": "Turnstile验证返回的token"
}
```
响应：
```json
{
  "success": true,
  "message": "注册成功",
  "user": { "id": 1, "username": "testuser", "email": "test@gmail.com" }
}
```

### POST /api/login（登录）
请求体：
```json
{
  "account": "testuser",
  "password": "123456",
  "turnstile_token": "Turnstile验证返回的token"
}
```
响应：
```json
{
  "success": true,
  "message": "登录成功",
  "user": { "id": 1, "username": "testuser", "email": "test@gmail.com" }
}
```

### POST /api/logout（退出）
响应：
```json
{ "success": true, "message": "已退出登录" }
```

### GET /api/user（获取用户信息）
响应：
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@gmail.com",
    "avatar": "",
    "bio": "",
    "created_at": "2026-09-14 12:00:00"
  }
}
```

---

## 邮箱检测规则说明

### 禁止的临时邮箱（部分示例）
- tempmail.com、10minutemail.com、mailinator.com、yopmail.com
- guerrillamail.com、trashmail.com、throwawaymail.com
- temp-mail.org、emailondeck.com、fakeinbox.com
- 以及其他500+临时邮箱域名

### 允许的公共邮箱（部分示例）
- gmail.com、outlook.com、hotmail.com、live.com
- yahoo.com、protonmail.com、icloud.com、aol.com
- qq.com、163.com、126.com、foxmail.com、139.com、189.cn
- sina.com、sohu.com、tom.com、aliyun.com
- 以及其他100+公共邮箱域名

### 禁止的域名邮箱/企业邮箱
- 任何自定义域名邮箱（如 yourname@yourcompany.com）
- 仅允许上面列出的公共邮箱域名

---

## 常见问题

**Q：发送验证码失败？**
A：检查 EmailJS 账号是否正常，模板里是否包含 `{{to_email}}`、`{{to_name}}`、`{{code}}`、`{{subject}}` 四个变量。EmailJS 配置已内置在代码中（service_pj60jer / template_19nbgn9 / JyM2FaCOfdCyNkunC）。

**Q：人机验证不显示？**
A：检查 register.html 和 login.html 里的 `data-sitekey` 是否替换为你自己的 Turnstile Site Key。检查 Turnstile 后台添加的域名是否包含你的 Pages 域名。

**Q：提示"不支持域名邮箱"？**
A：这是正常的，系统只允许公共邮箱（Gmail、QQ、163等），不允许企业邮箱/自定义域名邮箱。换一个公共邮箱注册即可。

**Q：提示"不支持临时邮箱"？**
A：你用的是临时邮箱（如10分钟邮箱），系统禁止。换一个正规邮箱注册。

**Q：注册时间显示不对？**
A：代码已经自动转换为中国时区（UTC+8），存储的就是广东茂名时间。如果显示不对，检查是否重新部署了最新代码。

**Q：D1 数据库地点能改吗？**
A：创建后不能直接改，需要导出数据→删除旧库→新地点创建→导入数据。注册登录系统数据量小，重建很快。

**Q：免费额度够吗？**
A：Pages 免费版无限请求/带宽。D1 免费版5GB存储、每天500万读/10万写。EmailJS 免费版每月200封邮件。Turnstile 完全免费。个人项目完全够用。

**Q：如何自定义域名？**
A：Pages 项目 → Custom domains → Set up a custom domain，按提示添加 CNAME 记录。注意：添加自定义域名后，需要在 Turnstile 后台也添加这个域名。

---

## 安全说明
- 密码使用 PBKDF2 + SHA-256 哈希，10万次迭代，带随机salt
- Session token 使用 crypto.getRandomValues 生成32位随机值
- Cookie 设置 HttpOnly（防XSS）、SameSite=Lax（防CSRF）
- 所有SQL使用 Prepared Statement，防SQL注入
- 注册必须邮箱验证码验证，防止恶意注册
- 注册/登录必须 Turnstile 人机验证，防止机器人
- 禁止临时邮箱和域名邮箱，提高注册门槛
- 验证码10分钟过期，使用后立即失效
