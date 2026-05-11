# TOEFL Lynk Deployment Guide

Panduan deployment untuk production environment.

## Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| vCPU | 2 | 4 |
| RAM | 4 GB | 8 GB |
| Storage | 40 GB | 100 GB |
| Bandwidth | 10 Mbps | 30 Mbps |

## Deployment Options

### Option 1: Docker (Recommended)

#### 1. Persiapan Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Setup Project

```bash
# Clone repository
git clone https://github.com/your-repo/toefllynk.git
cd toefllynk

# Copy production environment
cp .env.example.production .env
nano .env  # Edit dengan nilai sebenarnya
```

#### 3. Setup Environment Variables

```bash
# Required
POSTGRES_PASSWORD=your-secure-password
JWT_SECRET=your-32-char-minimum-secret-key

# Midtrans (Production)
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key

# Storage (Optional - sesuai kebutuhan)
STORAGE_PROVIDER=cloudflare-r2
# Atau
STORAGE_PROVIDER=cloudinary
```

#### 4. Deploy

```bash
# Build dan start
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

#### 5. Setup SSL (Let's Encrypt)

```bash
# Install Nginx
sudo apt install nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/toefllynk

# Enable site
sudo ln -s /etc/nginx/sites-available/toefllynk /etc/nginx/sites-enabled/

# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### Option 2: Manual Deployment (VPS)

#### 1. Install Dependencies

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-16

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx
```

#### 2. Setup PostgreSQL

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE toefllynk;
CREATE USER toefl_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE toefllynk TO toefl_user;

# Exit
\q
```

#### 3. Setup Application

```bash
# Clone project
git clone https://github.com/your-repo/toefllynk.git
cd toefllynk

# Install dependencies
npm install

# Setup environment
cp .env.example.production .env
nano .env

# Update DATABASE_URL
DATABASE_URL="postgresql://toefl_user:your_password@localhost:5432/toefllynk"

# Generate Prisma client & push schema
npx prisma generate
npm run db:push

# Build
npm run build
```

#### 4. Setup PM2 for Process Management

```bash
# Install PM2
sudo npm install -g pm2

# Start application
pm2 start npm --name "toefllynk" -- start

# Setup startup script
pm2 startup
pm2 save

# Check status
pm2 status
```

#### 5. Setup Nginx Reverse Proxy

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/toefllynk
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/toefllynk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. Setup SSL

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# Auto-renew
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

## Post-Deployment

### 1. Create Admin User

```bash
# Via Prisma Studio
npx prisma studio

# Or via seed
npm run db:seed
```

### 2. Configure Webhooks

```
Midtrans Payment Notification:
https://yourdomain.com/api/payment/snap/notification
```

### 3. Monitoring

```bash
# View logs
pm2 logs toefllynk

# Monitor resources
pm2 monit
```

## Troubleshooting

### Container won't start

```bash
docker-compose logs app
docker-compose exec app sh
```

### Database connection failed

```bash
# Check PostgreSQL
docker-compose logs db
sudo systemctl status postgresql
```

### Build failed

```bash
# Clear cache
rm -rf .next
npm run build
```

## Backup

### Database Backup

```bash
# Docker
docker-compose exec db pg_dump -U postgres toefllynk > backup_$(date +%Y%m%d).sql

# Manual
pg_dump -U toefl_user toefllynk > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
# Docker
cat backup.sql | docker-compose exec -T db psql -U postgres toefllynk

# Manual
psql -U toefl_user toefllynk < backup.sql
```

## Update Deployment

```bash
# Docker
git pull
docker-compose up -d --build

# Manual
git pull
npm run build
pm2 restart toefllynk
```