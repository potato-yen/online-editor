FROM --platform=linux/amd64 node:20-bookworm

WORKDIR /app/backend

# 1. 安裝基礎工具 (維持 Root 權限執行，因為 apt 需要 root)
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# 2. 下載並安裝 Tectonic (維持 Root，安裝到 /usr/local/bin)
RUN curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | \
    sh \
    && mv tectonic /usr/local/bin/tectonic

# 3. 顯示版本
RUN tectonic --version

# =======================================================
# [新增] 權限設定
# 1. 確保 /app/backend 目錄的所有權屬於 'node' 使用者
# 2. 建立 tectonic 快取目錄並授權 (避免執行時無法寫入快取)
# =======================================================
RUN chown -R node:node /app/backend

# [新增] 切換到非 root 使用者 'node'
USER node

# =======================================================
# 4. Tectonic 暖身 (Pre-cache)
# [修改] 現在這一步會以 'node' 使用者執行
# 這樣下載的套件會存在 /home/node/.cache/Tectonic，
# 確保應用程式執行時讀取得到，且有權限更新。
# =======================================================
RUN printf '\\documentclass{article}\\begin{document}Warmup\\end{document}' > warmup.tex \
    && tectonic warmup.tex \
    && rm -f warmup.tex warmup.pdf warmup.log

# =======================================================
# 5. Node.js 專案建置
# [修改] 使用 --chown=node:node 確保複製進來的檔案屬於該使用者
# =======================================================
COPY --chown=node:node package.json package-lock.json ./
RUN npm install

COPY --chown=node:node . .

EXPOSE 3001
CMD ["npm", "start"]
