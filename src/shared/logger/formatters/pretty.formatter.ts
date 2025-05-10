import { IFormatter, LogEntry } from '../interfaces/interfaces';

export class PrettyFormatter implements IFormatter {
  private colors = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m', // Yellow
    info: '\x1b[36m', // Cyan
    debug: '\x1b[90m', // Grey
    reset: '\x1b[0m', // Reset
  };

  format(entry: LogEntry): string {
    const color = this.getColorForLevel(entry.level);
    const { timestamp, level, message, serviceName, correlationId } = entry;

    let formatted = `${color}[${level.toUpperCase()}]${this.colors.reset} ${timestamp} `;
    formatted += `${this.colors.info}[${serviceName}]${this.colors.reset}`;

    if (correlationId) {
      formatted += ` ${this.colors.info}[${correlationId}]${this.colors.reset}`;
    }

    formatted += `: ${message}`;

    if (entry.meta && Object.keys(entry.meta).length > 0) {
      formatted += `\n${JSON.stringify(entry.meta, null, 2)}`;
    }

    if (entry.error) {
      formatted += `\n${this.colors.error}Error: ${entry.error.message}${this.colors.reset}`;
      if (entry.error.stack) {
        formatted += `\n${this.colors.error}Stack: ${entry.error.stack}${this.colors.reset}`;
      }
    }

    return formatted;
  }

  private getColorForLevel(level: string): string {
    switch (level.toLowerCase()) {
      case 'error':
        return this.colors.error;
      case 'warn':
        return this.colors.warn;
      case 'info':
        return this.colors.info;
      case 'debug':
        return this.colors.debug;
      default:
        return this.colors.reset;
    }
  }
}
