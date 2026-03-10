# moriqiquanHtml

市场情报日报展示网站。从阿里云 RDS 读取 moriqiquan 采集的数据，按日期展示报告，支持 Clerk 认证与分级权限。

## 项目结构

```
moriqiquanHtml/
├── backend/     # FastAPI 后端，连接 RDS
├── frontend/    # Next.js 15 前端
├── .env.example
├── docker-compose.yml
└── README.md
```

## 环境准备

1. 复制 `.env.example` 为 `.env`，填写 `DATABASE_URL` 和 Clerk 相关变量。
2. 确保阿里云 RDS 中已有 moriqiquan 写入的报告数据。

## 本地开发

```bash
# 1. 复制环境变量
cp .env.example .env
# 填写 DATABASE_URL、CLERK_PEM_PUBLIC_KEY、CLERK_ISSUER

cp frontend/.env.example frontend/.env.local
# 填写 NEXT_PUBLIC_API_URL、NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY、CLERK_SECRET_KEY

# 2. 启动后端（必须在 backend 目录下运行，否则会报 Could not import module "main"）
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# 或在项目根目录执行: ./run-backend.sh

# 3. 启动前端（新终端）
cd frontend
npm install
npm run dev
```

- 后端: http://localhost:8000
- 前端: http://localhost:3000

## 部署（云上自动运行）

- **前后端一起上阿里云**：见 **[docs/阿里云部署.md](./docs/阿里云部署.md)**（ECS + Docker Compose 一步步操作）。
- 其他方式见 **[DEPLOY.md](./DEPLOY.md)**：Vercel + 后端、Railway/Render 等。
