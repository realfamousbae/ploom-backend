/**
 * @module src/utils/logger
 *
 * @description Lightweight structured logger built on top of `console.*`. Designed for
 * environments that capture process stdout/stderr (e.g. Render). It supports four severity
 * levels (`debug`, `info`, `warn`, `error`) and a free-form metadata object that is
 * serialized to JSON next to the log line.
 *
 * The active log level is read from the `LOG_LEVEL` environment variable on first use and
 * defaults to `info`. Lines look like:
 *
 *   [2026-05-14T10:11:12.345Z] [INFO ] [auth] user authorized {"userId":42}
 */
import { env } from 'process';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLevel(): LogLevel {
  const raw = (env.LOG_LEVEL ?? '').toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw;
  }
  return 'info';
}

const activeLevel: LogLevel = resolveLevel();
const activePriority = levelPriority[activeLevel];

function isEnabled(level: LogLevel): boolean {
  return levelPriority[level] >= activePriority;
}

function formatMeta(meta?: Record<string, unknown>): string {
  if (!meta) {
    return '';
  }
  try {
    return ` ${JSON.stringify(meta, replacer)}`;
  } catch {
    return ' [meta serialization failed]';
  }
}

function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Buffer.isBuffer(value)) {
    return `<Buffer ${value.length} bytes>`;
  }
  return value;
}

function format(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const levelTag = level.toUpperCase().padEnd(5, ' ');
  return `[${timestamp}] [${levelTag}] [${scope}] ${message}${formatMeta(meta)}`;
}

function emit(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>): void {
  if (!isEnabled(level)) {
    return;
  }
  const line = format(level, scope, message, meta);
  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export interface ScopedLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(subScope: string): ScopedLogger;
}

function createLogger(scope: string): ScopedLogger {
  return {
    debug: (message, meta) => emit('debug', scope, message, meta),
    info: (message, meta) => emit('info', scope, message, meta),
    warn: (message, meta) => emit('warn', scope, message, meta),
    error: (message, meta) => emit('error', scope, message, meta),
    child: (subScope: string) => createLogger(`${scope}:${subScope}`),
  };
}

/**
 * Returns a logger pre-bound to a scope (typically the module name). Scopes show up between
 * brackets in the log line, making it easy to grep for a particular subsystem.
 */
export function getLogger(scope: string): ScopedLogger {
  return createLogger(scope);
}

/**
 * Root logger. Most modules should prefer `getLogger('module-name')` for a scoped logger.
 */
export const logger = createLogger('app');

/**
 * The level the logger was initialized with. Exposed for diagnostic purposes
 * (e.g. logging which level is active on startup).
 */
export const currentLogLevel: LogLevel = activeLevel;
