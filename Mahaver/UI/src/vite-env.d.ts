/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENABLE_MOCKS: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENV?: string;
  readonly VITE_GA_ID?: string;
  readonly VITE_AUTH_CLIENT_ID?: string;
  readonly VITE_AUTH_ISSUER?: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
