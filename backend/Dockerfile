# 步驟 1: 使用 Node.js 20 (Debian 12 'Bookworm' 完整版)
FROM node:20-bookworm

# 設定工作目錄
WORKDIR /app/backend

# 步驟 2: 安裝 Tectonic 及其依賴
# Tectonic 需要 'fontconfig'
# 安裝腳本需要 'curl' 和 'ca-certificates'
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# 
# 步驟 3: (已修改) 執行 Tectonic 官方 *最新* 的安裝腳本
#
# 您專案 README.md 中的 'drop-sh.fullyjustified.net' 已過時，
# 且無法正確處理 aarch64 (Apple Silicon) 架構。
# 這個新腳本 (get-tectonic.netlify.app) 可以。
#
RUN curl --proto '=https' --tlsv1.2 -fsSL https://get-tectonic.netlify.app | sh \
    # 將 binary 安裝到 /usr/local/bin/tectonic
    -s -- --to /usr/local/bin

# 步驟 4: 複製 package.json 和 package-lock.json
COPY package.json package-lock.json ./

# 步驟 5: 安裝 Node.js 依賴
RUN npm install

# 步驟 6: 複製後端所有剩餘的程式碼
COPY . .

# 步驟 7: 宣告伺服器運行的埠號
EXPOSE 3001

# 步驟 8: 啟動伺服器
CMD ["npm", "start"]
