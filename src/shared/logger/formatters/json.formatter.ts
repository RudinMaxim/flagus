import { IFormatter, LogEntry } from '../interfaces/interfaces';

export class JsonFormatter implements IFormatter {
  format(entry: LogEntry): string {
    return JSON.stringify(entry);
  }
}
