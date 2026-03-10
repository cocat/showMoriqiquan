# 云上自动运行前后端

三种常见方式，任选其一。

---

## 方式一：一台云主机 + Docker Compose（推荐，前后端同机）

适合：阿里云 ECS、腾讯云 CVM、AWS EC2、任意有 Docker 的 VPS。

### 1. 准备服务器

- 系统：Ubuntu 22.04 或同类 Linux。
- 安装 Docker 与 Docker Compose：
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  # 登出再登录后生效
  ```

### 2. 部署项目

```bash
# 克隆（或用 rsync/scp 上传已打包的代码）
git clone <你的仓库地址> moriqiquanHtml
cd moriqiquanHtml

# 配置环境变量（必填：DATABASE_URL、NEXT_PUBLIC_API_URL 等）
cp .env.example .env
vim .env
```

`.env` 里**至少**要设（云上地址换成你的）：

```bash
# 数据库（阿里云 RDS 等）
DATABASE_URL=postgresql://user:password@your-rds-host:5432/barkme

# 后端对外地址（供浏览器请求 API，可以是公网 IP 或域名）
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# 若暂时用 IP：NEXT_PUBLIC_API_URL=http://你的服务器公网IP:8000

# 若禁用 Clerk（不登录即最高权限）
NEXT_PUBLIC_SKIP_CLERK=true
SKIP_CLERK=true

# 若用 Clerk，填 Clerk 相关变量
# CLERK_PEM_PUBLIC_KEY=...
# CLERK_ISSUER=...
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
# CLERK_SECRET_KEY=...
```

### 3. 一键启动

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

- 后端：`http://服务器IP:8000`
- 前端：`http://服务器IP:3000`

### 4. 开机自启

Docker Compose 里已设 `restart: unless-stopped`，只要 Docker 服务开机自启，前后端就会自动跑。Ubuntu 上 Docker 默认开机自启。

### 5. 用 Nginx 绑域名（可选）

若希望用域名并让前端通过同域名访问后端，可在同一台机装 Nginx，例如：

- `https://yourdomain.com` → 前端（3000）
- `https://yourdomain.com/api` → 反向代理到后端（8000）

然后把 `.env` 里 `NEXT_PUBLIC_API_URL` 设为 `https://yourdomain.com/api`，前端请求会走同源，无需再单独暴露 8000 端口。

---

## 方式二：前端 Vercel + 后端单独部署

- **前端**：交给 Vercel 自动构建、自动运行。
- **后端**：部署到任意一台能跑 Python 的机器（阿里云 ECS、Railway、Render、Fly.io 等）。

### 前端（Vercel）

1. 在 [Vercel](https://vercel.com) 导入你的 Git 仓库。
2. 根目录选为项目根，**Build 与输出**只针对前端：
   - **Root Directory** 设为 `frontend`，或把前端单独仓库给 Vercel。
   - 若仓库是 monorepo 且根目录是项目根，在 Vercel 里设置：
     - **Build Command**: `cd frontend && npm ci && npm run build`
     - **Output Directory**: `frontend/.next`（若用默认 Next 部署则选 Vercel 自动识别）
   - 更简单做法：只把 `frontend` 目录单独建一个仓库，用该仓库在 Vercel 里建项目，则无需改命令。
3. 在 Vercel 项目 **Settings → Environment Variables** 里配置：
   - `NEXT_PUBLIC_API_URL` = 你的后端公网地址（如 `https://api.yourdomain.com`）
   - `NEXT_PUBLIC_SKIP_CLERK`、`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 等按需填写。

每次推代码，Vercel 会自动构建并发布，相当于前端在云上“自动运行”。

### 后端（任选其一）

- **阿里云 ECS**：SSH 上去装 Python 3.12，用 systemd 或 supervisor 跑 `uvicorn main:app --host 0.0.0.0 --port 8000`，或用同一台机跑 Docker 只起 backend 容器。
- **Railway / Render / Fly.io**：把 `backend` 目录设为服务根目录，指定启动命令为 `uvicorn main:app --host 0.0.0.0 --port 8000`，在控制台填 `DATABASE_URL`、`CLERK_*` 等环境变量即可自动跑。

后端地址填到前端的 `NEXT_PUBLIC_API_URL`，并确保后端 CORS 里包含 Vercel 给的域名（如 `https://xxx.vercel.app`）。

---

## 方式三：Railway / Render 等一键部署后端 + 前端

这类平台可以一个项目里挂两个服务（或两个项目）：一个用 `backend/Dockerfile`，一个用 `frontend/Dockerfile`。

- **Railway**：在项目里添加两个 Service，分别选对应目录和 Dockerfile，填好环境变量；把后端生成的公网 URL 填到前端的 `NEXT_PUBLIC_API_URL`。
- **Render**：同理，一个 Web Service 用 backend、一个用 frontend，环境变量在控制台配置。

这样前后端都在云上自动构建、自动运行，无需自己管服务器。

---

## 环境变量速查（云上必看）

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | 数据库连接串（后端） | `postgresql://user:pass@rds.aliyuncs.com:5432/barkme` |
| `NEXT_PUBLIC_API_URL` | 前端请求的后端地址（构建时打进前端） | `https://api.yourdomain.com` 或 `http://IP:8000` |
| `NEXT_PUBLIC_SKIP_CLERK` | 前端是否跳过 Clerk | `true` / `false` |
| `SKIP_CLERK` | 后端是否跳过 Clerk | `true` / `false` |
| `CORS_ORIGINS` | 后端允许的前端来源 | `https://yourdomain.com,https://xxx.vercel.app` |

生产环境建议：用域名 + HTTPS，`NEXT_PUBLIC_API_URL` 用 HTTPS；若前后端同机，可用 Nginx 反代，API 用同一域名下的 `/api`。
