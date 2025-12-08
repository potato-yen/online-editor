FROM --platform=linux/amd64 node:20-bookworm

WORKDIR /app/backend

# 1. 安裝基礎工具
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# 2. 下載並安裝 Tectonic
RUN curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh \
    && mv tectonic /usr/local/bin/tectonic

# 3. 顯示版本確保安裝成功
RUN tectonic --version

# =======================================================
# 4. Tectonic 暖身 (Pre-cache) [最終修正版]
# =======================================================
# 1. 使用 printf 避免特殊字元問題
# 2. 使用 rm -f 避免因檔案不存在而報錯 (Tectonic 預設不留 log)
RUN printf '\\documentclass{article}\\begin{document}Warmup\\end{document}' > warmup.tex \
    && tectonic warmup.tex \
    && rm -f warmup.tex warmup.pdf warmup.log

# =======================================================

# 5. 繼續標準的 Node.js 專案建置
COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3001
CMD ["npm", "start"]
