# Contributing to TOEFL Lynk

Terima kasih atas kontribusi Anda! Berikut panduan untuk berkontribusi.

## Code of Conduct

Harap bersikap hormat dan profesional dalam semua interaksi. Kami tidak toleransi untuk pelecehan dalam bentuk apapun.

## Getting Started

### 1. Fork Repository

Klik tombol "Fork" di GitHub untuk membuat salinan repository.

### 2. Clone Repository

```bash
git clone https://github.com/YOUR-USERNAME/toefllynk.git
cd toefllynk
```

### 3. Setup Development Environment

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example.development .env

# Setup database
npx prisma generate
npm run db:push
```

### 4. Create Branch

```bash
# For new feature
git checkout -b feature/feature-name

# For bug fix
git checkout -b fix/bug-description

# For documentation
git checkout -b docs/doc-improvement
```

## Development Workflow

### 1. Make Changes

Buat perubahan yang diperlukan. Pastikan:

- Kode mengikuti style guide project
- Component memiliki types yang benar
- Error handling yang adequate

### 2. Test Locally

```bash
# Run development server
npm run dev

# Run linter
npm run lint

# Run tests (if any)
npm run test
```

### 3. Commit Changes

Gunakan conventional commits:

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: code style change
refactor: code refactoring
test: add/update tests
chore: maintenance tasks
```

Contoh:
```bash
git commit -m "feat: add affiliate click tracking"
git commit -m "fix: resolve certificate validity date issue"
```

### 4. Push Changes

```bash
git push origin feature/feature-name
```

### 5. Create Pull Request

- Gunakan judul yang jelas dan deskriptif
- Jelaskan perubahan yang dibuat
- Referensikan issue yang terkait (jika ada)
- Tunggu review dari maintainer

## Pull Request Guidelines

### Do's

- ✅ Write clear commit messages
- ✅ Include tests for new features
- ✅ Update documentation if needed
- ✅ Keep PR focused (one feature/fix per PR)
- ✅ Run linter before submitting

### Don'ts

- ❌ Don't commit sensitive information
- ❌ Don't submit large PRs without discussion
- ❌ Don't modify unrelated files
- ❌ Don't ignore lint errors

## Project Structure

```
src/
├── app/              # Next.js pages
│   ├── api/          # API routes
│   ├── admin/        # Admin pages
│   ├── user/         # Seller dashboard
│   └── student/      # Student portal
├── components/       # React components
│   └── ui/           # UI components
├── lib/              # Utilities & services
├── hooks/            # Custom hooks
└── types/            # TypeScript types
```

## Questions?

- Buka issue baru dengan label "question"
- Hubungi maintainer via email/Discord

## License

Dengan berkontribusi, Anda setuju bahwa kontribusi Anda akan dilisensikan di bawah MIT License.