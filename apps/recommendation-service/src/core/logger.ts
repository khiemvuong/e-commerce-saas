/**
 * Structured Logger
 *
 * Lightweight logger replacing raw console.log('[Module] ...') calls.
 * Provides consistent formatting, log levels, and optional data payload.
 *
 * Usage:
 *   const log = createLogger('ChatService');
 *   log.info('Session started', { userId, sessionId });
 *   log.warn('No products found', { keyword });
 *   log.debug('Score breakdown', { chatScore, behaviorScore });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (msg: string, data?: Record<string, unknown>) => void;
  info: (msg: string, data?: Record<string, unknown>) => void;
  warn: (msg: string, data?: Record<string, unknown>) => void;
  error: (msg: string, data?: Record<string, unknown>) => void;
}

/** Minimum log level (can be set via LOG_LEVEL env var) */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const minLevel: number = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || 'debug'] ?? 0;

function formatData(data?: Record<string, unknown>): string {
  if (!data || Object.keys(data).length === 0) return '';
  // Compact single-line JSON for structured log lines
  return ' ' + JSON.stringify(data);
}

function emit(level: LogLevel, module: string, msg: string, data?: Record<string, unknown>): void {
  if (LOG_LEVELS[level] < minLevel) return;

  const tag = `[${module}]`;
  const payload = formatData(data);

  switch (level) {
    case 'error':
      console.error(`${tag} ${msg}${payload}`);
      break;
    case 'warn':
      console.warn(`${tag} ${msg}${payload}`);
      break;
    case 'debug':
      console.debug(`${tag} ${msg}${payload}`);
      break;
    default:
      console.log(`${tag} ${msg}${payload}`);
  }
}

/**
 * Create a scoped logger for a module.
 *
 * @example
 * const log = createLogger('SmartFallback');
 * log.info('Layer 1 (fuzzy): corrected', { correctedQuery: 'adidas' });
 * log.debug('Processing through 4 fallback layers', { message: 'adisdas' });
 */
export function createLogger(module: string): Logger {
  return {
    debug: (msg, data?) => emit('debug', module, msg, data),
    info: (msg, data?) => emit('info', module, msg, data),
    warn: (msg, data?) => emit('warn', module, msg, data),
    error: (msg, data?) => emit('error', module, msg, data),
  };
}
