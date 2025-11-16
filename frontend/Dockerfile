FROM node:20-bookworm

WORKDIR /app/frontend

# 先複製 package 檔，利用快取
COPY package.json package-lock.json ./

# 優先用 npm ci（有 lock 檔比較穩），失敗再退回 npm install
RUN npm ci || npm install

# 再複製其它程式碼
COPY . .

# Vite dev server 預設是 5173
EXPOSE 5173

# 用 dev server 跑，對外開放 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]