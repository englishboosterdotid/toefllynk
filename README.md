# TOEFL Lynk

Platform marketplace untuk simulasi TOEFL ITP dengan fitur affiliate, microsite builder, dan certificate generation.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Cache:** Redis (optional, fallback to in-memory)
- **Payment:** Midtrans
- **Storage:** Local / Cloudflare R2 / Cloudinary / Supabase

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm / yarn / pnpm

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-repo/toefllynk.git
cd toefllynk
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
# Copy development environment template
cp .env.example.development .env

# Edit .env and fill in your values
```

### 4. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npm run db:push

# (Optional) Seed database with sample data
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Buka http://localhost:3000

## Environment Variables

Lihat `.env.example.development` untuk development atau `.env.example.production` untuk production.

### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `NEXT_PUBLIC_BASE_URL` | Base URL of the application |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Redis connection (for caching) |
| `MIDTRANS_*` | Midtrans payment gateway |
| `SMTP_*` | Email SMTP settings |
| `STORAGE_*` | Cloud storage settings |

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
```

## Deployment

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

Lihat [DEPLOY.md](DEPLOY.md) untuk panduan deployment detail.

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   ├── admin/              # Admin pages
│   │   ├── user/               # Seller dashboard
│   │   ├── student/            # Student portal
│   │   └── [username]/         # Public microsite
│   ├── components/             # React components
│   ├── lib/                    # Utilities & services
│   └── hooks/                  # Custom React hooks
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets
└── scripts/                    # Utility scripts
```

## Features

Lihat [FEATURES.md](FEATURES.md) untuk daftar fitur lengkap.

## License

MIT License - lihat [LICENSE](LICENSE) untuk detail.