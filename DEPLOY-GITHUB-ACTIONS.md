# Deploy dengan GitHub Actions

Panduan lengkap untuk setup CI/CD deployment menggunakan GitHub Actions.

## Prerequisites

- Repository GitHub
- Server VPS dengan SSH access (root)
- Domain yang sudah dikonfigurasi (optional)

## Langkah 1: Setup SSH Keys

### 1.1 Generate SSH Key (di komputer lokal)

```bash
# Generate SSH key baru
ssh-keygen -t ed25519 -C "github-actions@toefllynk" -f deploy_key

# Akan menghasilkan:
# - deploy_key (private key) - untuk GitHub Secrets
# - deploy_key.pub (public key) - untuk server
```

### 1.2 Copy Public Key ke Server

```bash
# Login ke server dan tambahkan public key
ssh root@SERVER_IP "mkdir -p ~/.ssh && echo 'ISI_PUBLIC_KEY_DISINI' >> ~/.ssh/authorized_keys"

# Atau gunakan ssh-copy-id
ssh-copy-id -i deploy_key.pub root@SERVER_IP
```

### 1.3 Get Server Host Key

```bash
# Ini diperlukan untuk verify server identity
ssh-keyscan -H SERVER_IP >> ~/.ssh/known_hosts
cat ~/.ssh/known_hosts | grep SERVER_IP
```

## Langkah 2: Setup GitHub Secrets

1. Buka repository GitHub → **Settings** → **Secrets and variables** → **Actions**

2. Tambahkan secrets berikut:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SSH_PRIVATE_KEY` | Isi dari `deploy_key` (private key) | SSH private key untuk connect ke server |
| `SERVER_IP` | IP server (contoh: 192.168.1.100) | Alamat IP server |
| `SERVER_HOST_KEY` | Output dari `ssh-keyscan` | Server SSH host key |
| `SERVER_APP_DIR` | `/var/www/toefllynk` | Path direktori aplikasi di server |
| `SERVER_DOMAIN` | `toefllynk.com` | Domain aplikasi |

### Cara mendapatkan nilai untuk secrets:

```bash
# SSH_PRIVATE_KEY - isi dari file deploy_key (private key)
cat deploy_key

# SERVER_IP - IP server kamu
# Contoh: 103.xxx.xxx.xxx

# SERVER_HOST_KEY - output dari:
ssh-keyscan -H YOUR_SERVER_IP

# SERVER_APP_DIR - direktori deployment di server
# Contoh: /var/www/toefllynk

# SERVER_DOMAIN - domain yang mengarah ke server
# Contoh: toefllynk.com atau ip server jika tanpa domain
```

## Langkah 3: Persiapan Server

### 3.1 Install Docker & Docker Compose

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose -y

# Enable dan start Docker
systemctl enable docker
systemctl start docker

# Add docker group (optional)
usermod -aG docker $USER
```

### 3.2 Buat Direktori Aplikasi

```bash
# Buat direktori
mkdir -p /var/www/toefllynk

# Copy file aplikasi
# (atau clone dari GitHub)
git clone https://github.com/USERNAME/REPO.git /var/www/toefllynk

# Set ownership
chown -R root:root /var/www/toefllynk
```

### 3.3 Setup Nginx Reverse Proxy (Recommended)

```bash
# Install Nginx
apt install nginx -y

# Buat config
cat > /etc/nginx/sites-available/toefllynk << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3000;
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
EOF

# Enable site
ln -s /etc/nginx/sites-available/toefllynk /etc/nginx/sites-enabled/

# Test config
nginx -t

# Restart Nginx
systemctl restart nginx
```

### 3.4 Setup SSL dengan Let's Encrypt (Optional)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Dapatkan sertifikat
certbot --nginx -d yourdomain.com

# Auto-renew sudah aktif otomatis
```

## Langkah 4: Push ke GitHub

```bash
# Add file ke git
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment workflow"

# Push ke main branch
git push origin main
```

## Langkah 5: Monitor Deployment

1. Buka repository → **Actions** tab
2. Klik workflow run yang sedang berjalan
3. Lihat progress dan log real-time

## Cara Penggunaan

### Automatic Deployment
Setiap push ke branch `main` akan otomatis memicu deployment.

```bash
# Edit kode
git add .
git commit -m "Update feature"
git push origin main

# Buka GitHub Actions untuk monitor
# Deployment berjalan otomatis
```

### Manual Deployment
Dari GitHub:
1. Repository → **Actions** tab
2. Pilih workflow **"Deploy to Production"**
3. Klik **"Run workflow"**
4. Optional: centang "Skip database migration"

### Rollback (Jika Gagal)

```bash
# Login ke server
ssh root@SERVER_IP

cd /var/www/toefllynk

# Lihat docker logs
docker-compose logs -f app

# Rollback ke versi sebelumnya
git log --oneline -10
git checkout TAG_DULU
docker-compose up -d --build

# Atau restore dari backup
ls backups/
docker-compose down
docker-compose up -d
```

## Troubleshooting

### Deployment Gagal?

```bash
# Check container logs
docker-compose logs -f

# Check container status
docker-compose ps

# Restart containers
docker-compose restart

# Full rebuild
docker-compose down
docker-compose up -d --build --force-recreate
```

### Database Migration Error?

```bash
# Skip migration dari GitHub Actions
# Atau manual run:
docker-compose exec app npx prisma migrate deploy
```

### SSL Certificate Expired?

```bash
# Renew certificate
certbot renew

# Atau force renew
certbot renew --force-renewal
```

## Environment Variables di Server

Pastikan `.env` ada di server:

```bash
# Di server
cd /var/www/toefllynk
cp .env.example .env
nano .env  # Update dengan nilai sebenarnya
```

Variable yang WAJIB di-set:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- Email credentials (SMTP)

## Diagram Alur Deployment

```
┌─────────────┐
│ Push to main │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ GitHub Actions  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐     ┌──────────────┐
│   Build App     │────►│ Run Tests    │
└──────┬──────────┘     └──────────────┘
       │
       ▼
┌─────────────────┐
│ SSH to Server   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Pull Docker     │
│ Images          │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Run Migration   │ (optional)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Restart         │
│ Containers      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Verify & Notify │
└─────────────────┘
```

## Tips Keamanan

1. **Gunakan SSH key khusus** untuk deployment (bukan key utama)
2. **Batasi akses SSH** - hanya izinkan dari GitHub IP ranges
3. **Rotate secrets** secara berkala
4. **Monitor logs** setelah setiap deployment
5. **Backup database** sebelum deployment major
