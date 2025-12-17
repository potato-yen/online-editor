FROM --platform=linux/amd64 node:20-bookworm

WORKDIR /app/backend

# 1. 安裝基礎工具
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# 2. 建立 latex-user 並給予家目錄 (重要！)
# -m: 建立家目錄 /home/latex-user
RUN groupadd -r latex-user \
    && useradd -r -m -g latex-user latex-user

# 3. 下載並安裝 Tectonic
RUN curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | \
    sh \
    && mv tectonic /usr/local/bin/tectonic

# 4. Tectonic 暖身 (Pre-cache) - 先用 Root 跑一次
RUN printf '\\documentclass{article}\\begin{document}Warmup\\end{document}' > warmup.tex \
    && tectonic warmup.tex \
    && rm -f warmup.tex warmup.pdf warmup.log

# 5. [關鍵修復] 將 Root 的快取移交給 latex-user
# Tectonic 預設快取在 ~/.cache/Tectonic，我們把它複製到 latex-user 的家並給予權限
RUN mkdir -p /home/latex-user/.cache \
    && cp -r /root/.cache/Tectonic /home/latex-user/.cache/Tectonic \
    && chown -R latex-user:latex-user /home/latex-user

# 6. 繼續標準的 Node.js 專案建置
COPY package.json package-lock.json ./
RUN npm install

# 確保是單行指令
COPY . .

EXPOSE 3001
CMD ["npm", "start"]