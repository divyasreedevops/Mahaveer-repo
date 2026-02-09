# Production Readiness Checklist — Patient Admin App

This file lists recommended changes, setup steps, and example commands to take the Figma-exported app to production readiness.

## 1. TypeScript
- Add `tsconfig.json` with `strict: true` and JSX settings.
- Install types: `npm install -D typescript @types/react @types/react-dom`.

## 2. Project Structure
Create the following folders and move responsibilities out of `AppContext`:
- `src/types/` — shared TypeScript types (patient, medicine, invoice, api responses)
- `src/api/` — HTTP client and service modules
- `src/hooks/` — reusable hooks (`useAuth`, `usePatient`, `useInvoice`)
- `src/lib/` — library configs (SWR/ReactQuery client, axios instance)
- `src/schemas/` — Zod/Yup validation schemas
- `src/mocks/` — MSW handlers for local development and tests

## 3. Environment Variables
- Add `.env.example` (created) and add `.env.local` to `.gitignore`.
- Use Vite env vars with `VITE_` prefix (`VITE_API_BASE_URL`, `VITE_SENTRY_DSN`, etc.).
- Access in code via `import.meta.env.VITE_API_BASE_URL`.

## 4. API Layer & Data Fetching (SWR example)
- Install: `npm install swr axios`
- Add a single axios client: `src/api/client.ts`

Example `src/api/client.ts`:

```ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Optional: request/response interceptors for auth + error handling
api.interceptors.request.use(cfg => {
  // attach token if available
  return cfg;
});

export default api;
```

Example SWR fetcher `src/lib/fetcher.ts`:

```ts
import api from '@/api/client';

export async function fetcher(url: string) {
  const res = await api.get(url);
  return res.data;
}
```

Global SWR config (wrap at app root) `src/lib/swrConfig.tsx`:

```tsx
import { SWRConfig } from 'swr';
import { fetcher } from './fetcher';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: true, shouldRetryOnError: true }}>
      {children}
    </SWRConfig>
  );
}
```

- Replace direct context fetches with `useSWR('/patients/123')` and create service helpers in `src/api/services`.

## 5. Hooks & Services
- Implement `src/hooks/useAuth.ts` for login/logout/token refresh logic.
- Implement `src/api/services/patient.service.ts` with functions: `getPatient`, `registerPatient`, `uploadPrescription`, etc., used by hooks and components.

## 6. Validation
- Install Zod: `npm install zod`
- Add schemas in `src/schemas/` and use with `react-hook-form` resolver: `@hookform/resolvers`.

## 7. Testing
- Install: `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event msw`
- Add `vitest` config and test scripts in `package.json`:

```json
"scripts": {
  "test": "vitest",
  "test:watch": "vitest --watch",
  "test:ui": "vitest --ui"
}
```

- Create `src/mocks/handlers.ts` and `src/setupTests.ts` to initialize MSW for tests.

## 8. Linting & Formatting
- Install ESLint + Prettier: `npm install -D eslint prettier eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks`
- Add `husky` + `lint-staged` to run linters and tests on commit.

## 9. Authentication & Security
- Replace mock auth with real auth flow (JWT/OAuth). Store tokens in `httpOnly` cookies where possible, otherwise secure storage.
- Implement token refresh logic and attach tokens in axios interceptor.
- Protect admin routes and add role checks in UI.

## 10. Error Handling & Monitoring
- Add Error Boundary component and global error display.
- Integrate Sentry (use `VITE_SENTRY_DSN`) for error tracking.

## 11. CI / CD
- Add GitHub Actions to run `npm ci`, lint, tests, and build on push.
- Example steps: `install`, `lint`, `test`, `build`, `deploy`.

## 12. Docker & Deployment
- Add `Dockerfile` and optional `docker-compose.yml` for running locally.
- Ensure environment injection for Vite at build-time: use `envsubst` or build-time args.

## 13. MSW & Local Mocks
- Use MSW for local development when `VITE_ENABLE_MOCKS=true`.
- Keep `src/mocks` and toggle in `main.tsx` to start mock server in dev.

## 14. Accessibility & Performance
- Run axe-core checks, Lighthouse audits.
- Add aria attributes and keyboard focus handling in components.

## 15. Observability & Analytics
- Add basic page/view tracking and key events to analytics.
- Add performance metrics collection if needed.

## 16. Docs & Onboarding
- Update `README.md` with setup, env, run, test, and deployment steps.
- Add `CONTRIBUTING.md` and architecture overview.

---

### Quick install commands (suggested):
```bash
npm install swr axios zod
npm install -D typescript vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event msw eslint prettier husky lint-staged @types/react @types/react-dom
```

### Next suggested small tasks (pick one to start):
- Create `tsconfig.json` and install TS types.
- Add `src/api/client.ts` and `src/lib/fetcher.ts`, then replace one hardcoded fetch with `useSWR`.
- Add `.env.local` to `.gitignore` and fill values from `.env.example`.

If you want, I can implement one of the next-small tasks now (create `tsconfig.json`, add SWR + axios client and wire one sample fetch, or add test setup).