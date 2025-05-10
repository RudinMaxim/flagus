export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  serviceName: string;
  correlationId?: string;
  meta?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
}

export interface IFormatter {
  format(entry: LogEntry): string;
}

export interface ITransport {
  write(entry: LogEntry): void;
}

export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  withCorrelationId(correlationId: string): ILogger;
}
