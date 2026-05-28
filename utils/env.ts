import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function envOrDefault(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const val = process.env[key];
  if (val === undefined) return fallback;
  return val === 'true' || val === '1';
}

function envInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (val === undefined) return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

export const env = {
  BASE_URL: envOrDefault('BASE_URL', 'http://localhost:8080'),
  HEADLESS: envBool('HEADLESS', false),

  ADMIN_EMAIL: envOrDefault('ADMIN_EMAIL', ''),
  ADMIN_PASSWORD: envOrDefault('ADMIN_PASSWORD', ''),

  LEARNER_EMAIL: envOrDefault('LEARNER_EMAIL', ''),
  LEARNER_PASSWORD: envOrDefault('LEARNER_PASSWORD', ''),

  LINK_TOKEN: envOrDefault('LINK_TOKEN', ''),

  ACTION_TIMEOUT: envInt('ACTION_TIMEOUT', 10_000),
  NAVIGATION_TIMEOUT: envInt('NAVIGATION_TIMEOUT', 30_000),

  SLOW_MO: envInt('SLOW_MO', 0),

  WORKERS: envInt('WORKERS', 1),
  RETRIES: envInt('RETRIES', 0),
} as const;
