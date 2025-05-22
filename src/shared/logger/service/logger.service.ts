import { injectable, inject } from 'inversify';
import { ITransport, LoggerConfig, LogLevel, LogEntry } from '../interfaces';
import { ILogger } from '../logger.service';
import { TransportFactory } from '../transports/transport.factory';

@injectable()
export class LoggerService implements ILogger {
  private transports: ITransport[] = [];
  private correlationId?: string;

  constructor(@inject('LoggerConfig') private config: LoggerConfig) {
    this.initTransports();
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    if (this.config.level >= LogLevel.INFO) {
      this.log('info', message, undefined, meta);
    }
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    if (this.config.level >= LogLevel.WARN) {
      this.log('warn', message, undefined, meta);
    }
  }

  public error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    if (this.config.level >= LogLevel.ERROR) {
      this.log('error', message, error, meta);
    }
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    if (this.config.level >= LogLevel.DEBUG) {
      this.log('debug', message, undefined, meta);
    }
  }

  public withCorrelationId(correlationId: string): any {
    const childLogger = new LoggerService(this.config);
    childLogger.correlationId = correlationId;
    childLogger.transports = this.transports;
    return childLogger;
  }

  private log(level: string, message: string, error?: Error, meta?: Record<string, unknown>): void {
    const timestamp = new Date();

    const entry: LogEntry = {
      timestamp,
      level,
      message,
      serviceName: this.config.serviceName,
      correlationId: this.correlationId,
      meta,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
      };
    }

    for (const transport of this.transports) {
      transport.write(entry);
    }
  }

  private initTransports(): void {
    this.config.transports.forEach((transportType: any) => {
      const transport = TransportFactory.createTransport(
        transportType,
        this.config.format,
        this.config.filePath,
        this.config.maxFileSize,
        this.config.maxFiles
      );
      this.transports.push(transport);
    });
  }
}
