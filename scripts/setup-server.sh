#!/bin/bash
# =============================================================================
# CourseMini — One-time Linode server setup script
# Run as root on a fresh Ubuntu 22.04 LTS Linode instance:
#   bash setup-server.sh
# =============================================================================
set -euo pipefail

APP_USER="coursemini"
APP_DIR="/var/www/coursemini"
DB_NAME="coursemini"
DB_USER="coursemini"

echo "==> Updating system..."
apt-get update && apt-get upgrade -y

# ── Node.js 20 LTS ────────────────────────────────────────────────────────────
echo "==> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# ── PM2 ───────────────────────────────────────────────────────────────────────
echo "==> Installing PM2..."
npm install -g pm2

# ── PostgreSQL ────────────────────────────────────────────────────────────────
echo "==> Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

echo "==> Creating database and user..."
# Prompt for DB password
read -rsp "Enter a password for the '$DB_USER' database user: " DB_PASSWORD
echo ""

sudo -u postgres psql <<SQL
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL

echo "==> DATABASE_URL will be:"
echo "    postgresql://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME"

# ── Nginx ─────────────────────────────────────────────────────────────────────
echo "==> Installing Nginx..."
apt-get install -y nginx

# ── Certbot (Let's Encrypt SSL) ───────────────────────────────────────────────
echo "==> Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx

# ── App user & directories ────────────────────────────────────────────────────
echo "==> Creating app user and directories..."
id -u $APP_USER &>/dev/null || useradd -m -s /bin/bash $APP_USER

mkdir -p $APP_DIR/uploads
mkdir -p /var/log/coursemini
chown -R $APP_USER:$APP_USER $APP_DIR /var/log/coursemini

# ── Git ───────────────────────────────────────────────────────────────────────
apt-get install -y git

# ── SSH deploy key placeholder ────────────────────────────────────────────────
echo ""
echo "==> NEXT STEPS:"
echo "    1. Clone your repo:"
echo "       cd /var/www && git clone git@github.com:YOUR_USERNAME/coursemini.git coursemini"
echo ""
echo "    2. Create /var/www/coursemini/.env (use .env.example as a template)"
echo "       DATABASE_URL=postgresql://$DB_USER:YOUR_PASSWORD@localhost/$DB_NAME"
echo ""
echo "    3. Copy Nginx config:"
echo "       cp /var/www/coursemini/nginx/coursemini.conf /etc/nginx/sites-available/coursemini"
echo "       ln -s /etc/nginx/sites-available/coursemini /etc/nginx/sites-enabled/"
echo "       nano /etc/nginx/sites-available/coursemini  # domain is already set to coursemini.com"
echo "       nginx -t && systemctl reload nginx"
echo ""
echo "    4. Get SSL certificate:"
echo "       certbot --nginx -d coursemini.com -d www.coursemini.com"
echo ""
echo "    5. Run first deploy:"
echo "       cd /var/www/coursemini && bash scripts/deploy.sh"
echo ""
echo "    6. Set PM2 to start on reboot:"
echo "       pm2 startup && pm2 save"
echo ""
echo "==> Setup complete!"
