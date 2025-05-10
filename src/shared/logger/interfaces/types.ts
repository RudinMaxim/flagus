export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export enum LogFormat {
  SIMPLE = 'simple',
  JSON = 'json',
  PRETTY = 'pretty',
}

export enum Transport {
  CONSOLE = 'console',
  FILE = 'file',
}

export interface LoggerConfig {
  level: LogLevel;
  format: LogFormat;
  transports: Transport[];
  serviceName: string;
  enableConsole: boolean;
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
}

export const defaultConfig: LoggerConfig = {
  level: LogLevel.ERROR,
  format: LogFormat.JSON,
  transports: [Transport.CONSOLE, Transport.FILE],
  serviceName: 'app',
  enableConsole: true,
  filePath: './logs',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
};
