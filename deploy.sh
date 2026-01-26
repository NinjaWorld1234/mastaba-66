#!/bin/bash
set -e

APP_DIR="/var/www/apps/scientific-bench"
mkdir -p $APP_DIR
cd $APP_DIR

echo ">>> Unzipping updated application (Patch)..."
unzip -o deploy_v3_r2_patch.zip

echo ">>> Building and starting Docker container..."
docker compose up -d --build

echo ">>> Configuring Nginx..."
cp nginx_app.conf /etc/nginx/sites-available/scientific-bench
ln -sf /etc/nginx/sites-available/scientific-bench /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo ">>> Reloading Nginx..."
nginx -t && systemctl reload nginx

echo ">>> Cleaning up..."
rm -f deploy_v3_r2_patch.zip

echo ">>> Deployment Complete!"
docker ps
