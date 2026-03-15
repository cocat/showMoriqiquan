#!/usr/bin/env bash
# 一键启动前后端，均开启热更新（后端 uvicorn --reload，前端 Next.js Fast Refresh）
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

BACKEND_PID=""
cleanup() {
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo ">>> 启动后端 (uvicorn --reload) http://localhost:8000"
cd "$ROOT/backend"
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd "$ROOT"

# 等后端就绪再起前端，避免首屏请求失败
sleep 2

# Next.js 16 需要 Node.js 20+（含 ??= 等语法），优先用 nvm/fnm 切换
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
  nvm use 20 2>/dev/null || nvm use 22 2>/dev/null || nvm use default 2>/dev/null || true
fi
if command -v fnm &>/dev/null; then
  eval "$(fnm env)" 2>/dev/null
  fnm use 20 2>/dev/null || fnm use default 2>/dev/null || true
fi

NODE_MAJOR=$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1)
if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 20 ]; then
  echo ">>> 错误: Next.js 16 需要 Node.js 20+，当前: $(node -v 2>/dev/null || echo '未找到')"
  echo "    请安装并选用 Node 20: nvm install 20 && nvm use 20  或  fnm install 20 && fnm use 20"
  exit 1
fi

echo ">>> 启动前端 (Next.js dev) http://localhost:3000"
cd "$ROOT/frontend"
exec npm run dev
