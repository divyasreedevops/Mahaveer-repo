# 🚀 Quick Start Guide

Get your production-ready Patient Admin App running in 5 minutes!

## ⚡ Fast Track (TL;DR)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local and set VITE_API_BASE_URL

# 3. Start development (with mocks)
npm run dev

# 4. Run tests
npm run test

# 5. Build for production
npm run build
```

**Done!** Your app is running at `http://localhost:5173`

---

## 🔧 Development Workflow

### Daily Development
```bash
# Start dev server with hot reload
npm run dev

# Run tests in watch mode (separate terminal)
npm run test

# Run linter
npm run lint

# Format code
npm run format
```

### Before Committing
```bash
# Type check
npm run type-check

# Run all tests with coverage
npm run test:ci

# Lint and fix
npm run lint:fix

# Format code
npm run format
```

### Production Build
```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🐳 Docker Workflow

### Quick Docker Start
```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d

# Stop containers
docker-compose down
```

**Access app**: `http://localhost:3000`

### Manual Docker Build
```bash
# Build image
docker build -t patient-admin-app \
  --build-arg VITE_API_BASE_URL=https://your-api.com \
  .

# Run container
docker run -p 3000:80 patient-admin-app
```

---

## ⚙️ Configuration

### Environment Variables (.env.local)

**Required:**
```env
VITE_API_BASE_URL=https://your-api-url.com
```

**For Local Development (with mocks):**
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_ENABLE_MOCKS=true
```

**Optional:**
```env
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GA_ID=your-google-analytics-id
VITE_APP_NAME=PatientAdminApp
VITE_APP_VERSION=0.0.1
```

---

## 📝 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests (watch mode) |
| `npm run test:ci` | Run tests once + coverage |
| `npm run test:ui` | Open Vitest UI |
| `npm run lint` | Check linting errors |
| `npm run lint:fix` | Fix linting errors |
| `npm run format` | Format all code |
| `npm run format:check` | Check formatting |
| `npm run type-check` | TypeScript type checking |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Run Docker Compose |

---

## 🧪 Testing

### Run Tests
```bash
# Watch mode (recommended for development)
npm test

# Run once with coverage
npm run test:ci

# Interactive UI
npm run test:ui
```

### Write Tests
```typescript
import { render, screen } from '@/test/utils';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

---

## 🎨 Code Style

### Auto-format on Save
ESLint and Prettier are configured to run automatically via Husky pre-commit hooks.

### Manual Formatting
```bash
# Format all files
npm run format

# Check formatting
npm run format:check

# Fix linting issues
npm run lint:fix
```

---

## 🔌 API Integration

### Using Real Backend
1. Update `.env.local`:
   ```env
   VITE_API_BASE_URL=https://your-api-url.com
   VITE_ENABLE_MOCKS=false
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

### Using Mock API (MSW)
1. Enable mocks in `.env.local`:
   ```env
   VITE_ENABLE_MOCKS=true
   ```

2. Mock data is in `src/mocks/handlers.ts`

3. Start dev server:
   ```bash
   npm run dev
   ```

**Mock Credentials:**
- Username: `admin`
- Password: `admin123`

---

## 🐛 Troubleshooting

### Issue: Dependencies not installing
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 5173 already in use
```bash
npm run dev -- --port 3000
```

### Issue: TypeScript errors
```bash
npm run type-check
```

### Issue: Tests failing
```bash
# Clear test cache
npm run test -- --clearCache

# Run specific test
npm run test -- ErrorBoundary.test
```

### Issue: Docker build fails
```bash
# Clean Docker cache
docker system prune -a

# Rebuild
docker-compose up --build --force-recreate
```

---

## 📚 Documentation

Quick links to detailed docs:

- **[README.md](README.md)** - Full project overview
- **[INSTALLATION.md](INSTALLATION.md)** - Detailed setup guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute
- **[SECURITY.md](SECURITY.md)** - Security guidelines
- **[CHECKLIST_STATUS.md](CHECKLIST_STATUS.md)** - Implementation status
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was built

---

## 🎯 Next Steps

### 1. First Time Setup
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env.local`
- [ ] Configure environment variables
- [ ] Run `npm run dev`

### 2. Start Development
- [ ] Explore the codebase structure
- [ ] Check out existing components
- [ ] Review API services in `src/api/`
- [ ] Look at custom hooks in `src/hooks/`
- [ ] Understand validation schemas in `src/schemas/`

### 3. Write Your First Feature
- [ ] Create a new component
- [ ] Add validation schema
- [ ] Create custom hook if needed
- [ ] Write tests
- [ ] Run linter
- [ ] Commit changes

### 4. Deploy
- [ ] Run `npm run build`
- [ ] Test production build with `npm run preview`
- [ ] Build Docker image
- [ ] Deploy to your hosting platform

---

## 💡 Pro Tips

1. **Use SWR for data fetching**: Already configured and ready to use
2. **Leverage custom hooks**: Don't put logic in components
3. **Validate with Zod**: Use schemas for all forms
4. **Write tests**: Test utilities are set up for you
5. **Use TypeScript**: Full type safety is configured
6. **Enable mocks**: Develop without backend using MSW
7. **Check coverage**: Run `npm run test:ci` regularly
8. **Format on save**: Configure your IDE for auto-format
9. **Use Docker**: Consistent environment across team
10. **Read the docs**: All answers are in the documentation

---

## 🆘 Getting Help

1. **Check documentation** in the repo
2. **Search existing issues** on GitHub
3. **Ask in discussions** (if enabled)
4. **Create a new issue** with:
   - Error message
   - Steps to reproduce
   - Environment info (OS, Node version)

---

## ✅ Verification Checklist

After setup, verify everything works:

```bash
# ✓ Dependencies installed
npm list

# ✓ TypeScript compiles
npm run type-check

# ✓ Tests pass
npm run test:ci

# ✓ Linting passes
npm run lint

# ✓ App builds
npm run build

# ✓ Dev server starts
npm run dev
```

All green? **You're ready to go! 🎉**

---

**Happy Coding!** 🚀

For detailed documentation, see [README.md](README.md) or [INSTALLATION.md](INSTALLATION.md).
