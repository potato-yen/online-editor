# 步驟 1: 使用 Node.js 20 (Debian 12 'Bookworm' 完整版)
FROM node:20-bookworm

# 設定工作目錄
WORKDIR /app/backend

# 
# 步驟 2: (已修改) 安裝 pdflatex (TeX Live) 及其依賴
# 
# 警告：這會下載非常多的套件，映像檔會變大，請耐心等待
# 根據 README.md，我們需要以下套件：
#
RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    # 安裝 Tectonic 時安裝的 fontconfig，texlive 可能也需要
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# 步驟 3: 複製 package.json 和 package-lock.json
COPY package.json package-lock.json ./

# 步驟 4: 安裝 Node.js 依賴
RUN npm install

# 步驟 5: 複製後端所有剩餘的程式碼
COPY . .

# 步驟 6: 宣告伺服器運行的埠號
EXPOSE 3001

# 步驟 7: 啟動伺服器
CMD ["npm", "start"]
