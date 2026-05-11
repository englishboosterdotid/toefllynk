Script Files
File	Keterangan
deploy.sh	Full deployment script dengan interaktif input
quick-deploy.sh	Quick deploy (single command)
manage.sh	Management script untuk daily operations
Quick Deploy (1 Command)

# Di server, jalankan:
sudo bash -c "$(curl -sL https://raw.githubusercontent.com/your-repo/toefllynk/main/scripts/quick-deploy.sh)" toefllynk.com admin@toefllynk.com
Atau Step by Step:

# 1. Upload project ke server (ke /opt/toefllynk)
# 2. Masuk ke folder
cd /opt/toefllynk

# 3. Buat script executable
chmod +x scripts/quick-deploy.sh

# 4. Jalankan (sebagai root)
sudo ./scripts/quick-deploy.sh toefllynk.com

# 5. Edit .env dengan API keys
nano .env

# 6. Rebuild
docker compose up -d --build
Fitur dalam Script:
✅ Docker + Docker Compose installation
✅ Nginx + SSL (Let's Encrypt)
✅ Auto-renewal SSL (cron job)
✅ UFW firewall configuration
✅ Health check
✅ Management commands (start/stop/restart/logs/update)
Management Commands (setelah deploy):

./scripts/manage.sh start        # Start services
./scripts/manage.sh stop         # Stop services
./scripts/manage.sh logs          # View logs
./scripts/manage.sh db-push      # Push database schema
./scripts/manage.sh ssl-renew   # Renew SSL
./scripts/manage.sh update       # Update & rebuild
./scripts/manage.sh db-backup   # Backup database