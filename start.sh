#!/bin/bash

# 設定發生錯誤時停止執行
set -e

echo "開始部署專案 (含 Docker 資源限制)..."

# ==========================================
# 1. 後端 (Backend)
# ==========================================
echo "---------------------------------------"
echo "[Backend] 正在建置映像檔..."
cd backend
docker build -t latex-backend .

# 決定是否載入 backend/.env
BACKEND_ENV_ARGS=()
if [ -f ".env" ]; then
    echo "[Backend] 偵測到 .env，啟動容器時會自動載入。"
    BACKEND_ENV_ARGS+=(--env-file .env)
else
    echo "[Backend] 警告：找不到 backend/.env，帳號刪除等需要 Supabase Service Role 的功能將無法使用。"
fi

echo "[Backend] 正在啟動容器..."
docker rm -f latex-backend-container 2>/dev/null || true

# 建立一個 Docker Volume 來存快取 (如果不存在的話)
docker volume create tectonic-cache

# 執行容器 (加入 Volume 掛載)
# -v tectonic-cache:/root/.cache/Tectonic : 將快取資料夾掛載到 host，重啟不會消失
docker run -d \
    --name latex-backend-container \
    --rm \
    -p 3001:3001 \
    --cpus="1.0" \
    --memory="1g" \
    --security-opt=no-new-privileges:true \
    --tmpfs /tmp \
    -v tectonic-cache:/root/.cache/Tectonic \
    "${BACKEND_ENV_ARGS[@]}" \
    latex-backend

echo "[Backend] 已啟動 (Port 3001)"
cd ..

# ==========================================
# 2. 前端 (Frontend)
# ==========================================
echo "---------------------------------------"
echo "[Frontend] 正在建置映像檔..."
cd frontend
docker build -t latex-frontend .

echo "[Frontend] 正在啟動容器..."
# 先嘗試停止並移除舊的容器
docker rm -f latex-frontend-container 2>/dev/null || true

# 執行容器
# --cpus="0.5"    : 限制最多使用 0.5 顆 CPU
# --memory="512m" : 限制最多使用 512MB 記憶體
docker run -d \
    --name latex-frontend-container \
    --rm \
    -p 5173:5173 \
    --cpus="0.5" \
    --memory="512m" \
    latex-frontend

echo "[Frontend] 已啟動 (Port 5173)"
cd ..

echo "---------------------------------------"
echo "  部署完成 "
echo "   - 前端頁面: http://localhost:5173"
echo "   - 後端 API: http://localhost:3001"
