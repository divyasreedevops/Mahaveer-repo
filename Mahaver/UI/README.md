# Patient Admin App

A production-ready, responsive patient administration application built with React, TypeScript, and Vite.

## Features

- 🔐 **Authentication**: Secure admin and patient login with OTP verification
- 👥 **Patient Management**: Complete patient registration, approval, and management workflow
- 💊 **Inventory Management**: Medicine inventory tracking and management
- 📱 **Responsive Design**: Mobile-first design with Tailwind CSS
- 🧪 **Testing**: Comprehensive test coverage with Vitest and React Testing Library
- 🔄 **Data Fetching**: Efficient data fetching with SWR
- ✅ **Form Validation**: Type-safe form validation with Zod
- 🎨 **UI Components**: Beautiful UI with shadcn/ui components
- 🐳 **Docker Support**: Containerized deployment ready
- 🚀 **CI/CD**: Automated testing and deployment workflows

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite 6
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Data Fetching**: SWR + Axios
- **Form Validation**: Zod + React Hook Form
- **Testing**: Vitest + Testing Library + MSW
- **Linting**: ESLint + Prettier
- **CI/CD**: GitHub Actions
- **Containerization**: Docker + Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Backend API running at `https://localhost:7212` (or configure your API URL in `.env`)
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Patient Admin App"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your backend API URL:
   ```env
   # Use proxy for backend API (recommended - avoids HTTPS issues)
   VITE_API_BASE_URL=/api
   
   # Disable mocks to use real API
   VITE_ENABLE_MOCKS=false
   ```
   
   > **Note**: The proxy forwards `/api/*` to `https://localhost:7212/*`. See [HTTPS Setup Guide](./docs/HTTPS_SETUP.md) for alternative configurations and troubleshooting.

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

### Development with Mock API

To enable MSW for local development without a backend:

```env
# In .env
VITE_ENABLE_MOCKS=true
```

```bash
npm run dev
```

MSW will intercept API calls and return mock data. Set `VITE_ENABLE_MOCKS=false` to use the real backend API.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests in watch mode |
| `npm run test:ci` | Run tests once with coverage |
| `npm run test:ui` | Open Vitest UI |
| `npm run lint` | Lint code with ESLint |
| `npm run lint:fix` | Fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Type check with TypeScript |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Run with Docker Compose |

## Project Structure

```
src/
├── api/              # API client and service modules
│   ├── client.ts     # Axios instance with interceptors
│   ├── auth.service.ts
│   ├── patient.service.ts
│   ├── inventory.service.ts
│   └── ...
├── app/              # Application components
│   ├── components/   # React components
│   └── context/      # React context providers
├── hooks/            # Custom React hooks
│   ├── useAuth.ts
│   ├── usePatients.ts
│   └── ...
├── lib/              # Library configurations
│   ├── fetcher.ts    # SWR fetcher functions
│   ├── swrConfig.ts
│   └── SWRProvider.tsx
├── mocks/            # MSW mock handlers
│   ├── handlers.ts
│   ├── browser.ts    # Browser MSW worker
│   └── server.ts     # Node MSW server (for tests)
├── schemas/          # Zod validation schemas
│   ├── auth.schema.ts
│   ├── patient.schema.ts
│   └── ...
├── test/             # Test utilities and setup
│   ├── setup.ts
│   └── utils.tsx
├── types/            # TypeScript type definitions
│   └── api.ts        # API types from OpenAPI spec
└── main.tsx          # Application entry point
```

## Testing

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once with coverage
npm run test:ci

# Open Vitest UI
npm run test:ui
```

### Writing Tests

Tests use Vitest, React Testing Library, and MSW for mocking:

```typescript
import { render, screen } from '@/test/utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Docker Deployment

### Build and Run with Docker Compose

```bash
# Build and run
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop containers
docker-compose down
```

### Build Docker Image

```bash
docker build -t patient-admin-app \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  .
```

### Run Docker Container

```bash
docker run -p 3000:80 patient-admin-app
```

The app will be available at `http://localhost:3000`

## CI/CD

The project includes GitHub Actions workflow for:
- Linting and code formatting checks
- Running tests with coverage
- Building the application
- Automated deployment (configurable)

See [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) for details.

## API Integration

The application integrates with a backend API. API types are auto-generated from the OpenAPI specification in [`api.json`](api.json).

### API Services

- **Auth Service**: Admin login/logout
- **Patient Service**: Patient registration, verification, and management
- **OTP Service**: OTP sending and verification
- **Inventory Service**: Medicine inventory management
- **User Service**: User creation and management

See [`src/api/`](src/api/) for implementation details.

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the application.

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | Yes |
| `VITE_ENABLE_MOCKS` | Enable MSW mocking | No |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | No |
| `VITE_GA_ID` | Google Analytics ID | No |
| `VITE_APP_NAME` | Application name | No |
| `VITE_APP_VERSION` | Application version | No |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the ESLint and Prettier configurations
- Write tests for new features
- Update documentation as needed

## Production Checklist

See [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for the complete production readiness checklist.

## License

This project was generated from a Figma design and is available for use under the project's license terms.

## Original Design

The original Figma project is available at: https://www.figma.com/design/K8tELsdacAeRfGfxgypdr5/Responsive-Patient-Admin-App

## Support

For issues and questions, please create an issue in the repository.
