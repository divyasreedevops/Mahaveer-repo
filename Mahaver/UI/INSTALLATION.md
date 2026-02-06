# Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js**: Version 20 or higher
- **npm**: Version 10 or higher (comes with Node.js)
- **Git**: For version control
- **Docker** (optional): For containerized deployment

## Step 1: Install Dependencies

Run the following command to install all required dependencies:

```bash
npm install
```

This will install all dependencies listed in `package.json`, including:

### Production Dependencies
- `axios` - HTTP client for API calls
- `swr` - Data fetching and caching library
- `zod` - Schema validation
- All existing React, UI, and styling dependencies

### Development Dependencies
- `typescript` - TypeScript compiler
- `@types/react` & `@types/react-dom` - Type definitions
- `vitest` - Test runner
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - DOM testing matchers
- `@testing-library/user-event` - User interaction simulation
- `msw` - Mock Service Worker for API mocking
- `eslint` - JavaScript/TypeScript linter
- `prettier` - Code formatter
- `husky` - Git hooks
- `lint-staged` - Run linters on staged files
- `@hookform/resolvers` - Form validation resolvers

## Step 2: Setup Environment

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` and configure:**
   ```env
   # Required
   VITE_API_BASE_URL=http://localhost:5000
   
   # Optional - Enable mock API in development
   VITE_ENABLE_MOCKS=true
   
   # Optional - Error monitoring
   VITE_SENTRY_DSN=
   
   # Optional - Analytics
   VITE_GA_ID=
   ```

## Step 3: Initialize Git Hooks

```bash
npm run prepare
```

This sets up Husky git hooks for:
- Pre-commit linting and formatting
- Running tests before push (if configured)

## Step 4: Verify Installation

Run these commands to verify everything is set up correctly:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Tests
npm run test

# Build
npm run build
```

## Step 5: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Troubleshooting

### Issue: `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: TypeScript errors

**Solution:**
```bash
# Ensure TypeScript is installed
npm install -D typescript

# Rebuild type definitions
npm run type-check
```

### Issue: MSW not working

**Solution:**
1. Ensure `VITE_ENABLE_MOCKS=true` in `.env.local`
2. Check browser console for MSW initialization message
3. Clear browser cache and reload

### Issue: Port 5173 already in use

**Solution:**
```bash
# Use a different port
npm run dev -- --port 3000
```

### Issue: Husky hooks not running

**Solution:**
```bash
# Reinstall husky
npm run prepare

# Make sure hooks are executable (Unix/Mac)
chmod +x .husky/pre-commit
```

## Docker Installation

### Build Docker Image

```bash
docker build -t patient-admin-app .
```

### Run with Docker Compose

```bash
docker-compose up --build
```

The application will be available at `http://localhost:3000`

## IDE Setup

### VS Code (Recommended)

1. Install recommended extensions when prompted
2. Extensions will be automatically suggested from `.vscode/extensions.json`:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - Vitest

### Other IDEs

Ensure your IDE supports:
- TypeScript
- ESLint
- Prettier
- EditorConfig

## Next Steps

1. Read [README.md](README.md) for feature overview
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for architecture details
3. Check [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
4. See [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for production setup

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [SWR Documentation](https://swr.vercel.app/)
- [Zod Documentation](https://zod.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [MSW Documentation](https://mswjs.io/)

## Getting Help

If you encounter issues:
1. Check this installation guide
2. Review the troubleshooting section
3. Search existing issues on GitHub
4. Create a new issue with:
   - Error message
   - Steps to reproduce
   - System information (OS, Node version, npm version)

## Success!

If all steps completed without errors, you're ready to start developing! 🎉

Run `npm run dev` and navigate to `http://localhost:5173` to see the application.
