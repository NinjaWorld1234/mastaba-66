#!/bin/bash
set -e

# Log output
exec > >(tee -a /var/log/server_setup.log) 2>&1

echo ">>> Starting Server Setup..."

# 1. Update System
echo ">>> Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get upgrade -y

# 2. Check/Install Docker
if ! command -v docker &> /dev/null; then
    echo ">>> Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
else
    echo ">>> Docker already installed."
fi

# 3. Check/Install Nginx
if ! command -v nginx &> /dev/null; then
    echo ">>> Installing Nginx..."
    apt-get install -y nginx
else
    echo ">>> Nginx already installed."
fi

# 4. Security (UFW & Fail2ban)
echo ">>> Configuring UFW..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
# ufw enable # CAUTION: Enabling usually requires 'yes' confirmation. We will do this carefully.
echo "y" | ufw enable

if ! command -v fail2ban-client &> /dev/null; then
    echo ">>> Installing Fail2ban..."
    apt-get install -y fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
else
     echo ">>> Fail2ban already installed."
fi

# 5. Create Directory Structure
echo ">>> Creating app directories..."
mkdir -p /var/www/apps

echo ">>> Setup Complete!"
docker --version
nginx -v
ufw status verbose
