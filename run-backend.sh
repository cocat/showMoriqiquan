#!/usr/bin/env bash
# 在 backend 目录启动 API，避免误监听 frontend/node_modules 导致 reload 报错
cd "$(dirname "$0")/backend" && exec uvicorn main:app --reload --host 0.0.0.0 --port 8000