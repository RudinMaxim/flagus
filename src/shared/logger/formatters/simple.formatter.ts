import { IFormatter, LogEntry } from '../interfaces/interfaces';

export class SimpleFormatter implements IFormatter {
  format(entry: LogEntry): string {
    const { timestamp, level, message, serviceName, correlationId } = entry;
    let formatted = `[${level.toUpperCase()}] ${timestamp} [${serviceName}]`;

    if (correlationId) {
      formatted += ` [${correlationId}]`;
    }

    formatted += `: ${message}`;

    if (entry.meta && Object.keys(entry.meta).length > 0) {
      formatted += ` ${JSON.stringify(entry.meta)}`;
    }

    if (entry.error) {
      formatted += `\nError: ${entry.error.message}`;
      if (entry.error.stack) {
        formatted += `\nStack: ${entry.error.stack}`;
      }
    }

    return formatted;
  }
}
