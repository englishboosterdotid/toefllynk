# Changelog

Semua perubahan signifikan akan didokumentasikan dalam file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Seller tier system (FREE, STARTER, PRO, BUSINESS)
- Microsite builder with social links and contact info
- Custom certificate template (PRO+)
- Affiliate system with click/conversion tracking
- Exam monitoring dashboard
- Product visibility controls
- Promo code system

### Changed
- Product URLs changed from `/product/id` to `/[username]/id`
- Microsite product limits based on tier

### Fixed
- Prisma select/include conflicts
- Certificate validity date not saving correctly
- Affiliate commission percentage saving

## [0.1.0] - 2026-05-11

### Added

#### Seller Features
- Seller dashboard with analytics
- Product CRUD with images and pricing
- Order management
- Promo codes (percentage & fixed)
- Withdrawal system
- Bank account configuration
- Customer management
- Webhook endpoints
- Email campaigns
- Support tickets
- Seller tier upgrade flow

#### Student Features
- Student dashboard
- TOEFL exam simulation (3 sections)
- Section timers
- Warning system (tab switch, fullscreen exit)
- Auto-submit after 3 warnings
- Exam review with answer explanations
- PDF certificate generation with QR verification
- Exam credits tracking

#### Admin Features
- Admin dashboard
- User management
- Product approval
- Order monitoring
- Subscription management
- Withdrawal approval
- Exam monitoring (real-time)
- Question bank with import/export
- Audit log
- Leaderboard

#### Technical Features
- JWT authentication
- Role-based access control
- Midtrans payment integration
- Multiple storage providers (Local, R2, Cloudinary, Supabase)
- Email integration (Nodemailer, Resend)
- Redis caching
- Sentry error tracking
- Microsite views tracking
- Product views tracking
- Affiliate tracking

### Infrastructure
- Docker support
- Prisma ORM
- Next.js 16 with App Router
- TypeScript
- Tailwind CSS v4

[unreleased]: https://github.com/your-repo/toefllynk/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-repo/toefllynk/releases/tag/v0.1.0