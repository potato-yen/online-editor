#!/bin/bash

echo "正在停止服務..."

docker stop latex-backend-container latex-frontend-container

echo "所有服務已停止。"
