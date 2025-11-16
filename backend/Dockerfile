FROM --platform=linux/amd64 node:20-bookworm

WORKDIR /app/backend

RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net \
    | sh \
 && mv tectonic /usr/local/bin/tectonic

RUN tectonic --version

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3001
CMD ["npm", "start"]