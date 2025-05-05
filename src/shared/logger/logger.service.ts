import { injectable } from 'inversify';

export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

@injectable()
export class LoggerService implements ILogger {
  public info(message: string, meta?: Record<string, unknown>): void {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta || null);
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, meta || null);
  }

  public error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, {
      error: error?.stack || error?.message || 'No error details',
      ...meta,
    });
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`, meta || null);
    }
  }
}
