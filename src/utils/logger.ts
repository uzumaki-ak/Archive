/**
 * Structured Logger
 * - Namespaced log levels: info, warn, error
 * - Disabled in production builds to avoid leaking info
 * - Never logs tokens, user PII, or full API responses by default
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

const isDev = __DEV__;

function formatMessage(level: LogLevel, namespace: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] [${namespace}] ${message}`;
}

function log(level: LogLevel, namespace: string, message: string, meta?: unknown): void {
  if (!isDev) return; // Silence in production

  const formatted = formatMessage(level, namespace, message);

  switch (level) {
    case 'INFO':
      console.log(formatted, meta !== undefined ? meta : '');
      break;
    case 'WARN':
      console.warn(formatted, meta !== undefined ? meta : '');
      break;
    case 'ERROR':
      console.error(formatted, meta !== undefined ? meta : '');
      break;
  }
}

export const logger = {
  info: (namespace: string, message: string, meta?: unknown) =>
    log('INFO', namespace, message, meta),

  warn: (namespace: string, message: string, meta?: unknown) =>
    log('WARN', namespace, message, meta),

  error: (namespace: string, message: string, meta?: unknown) =>
    log('ERROR', namespace, message, meta),
};
