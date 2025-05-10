import { IFormatter, ITransport, LogEntry } from '../interfaces';

export class ConsoleTransport implements ITransport {
  constructor(private formatter: IFormatter) {}

  write(entry: LogEntry): void {
    const formattedLog = this.formatter.format(entry);

    switch (entry.level.toLowerCase()) {
      case 'error':
        console.error(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'debug':
        console.debug(formattedLog);
        break;
      case 'info':
      default:
        console.log(formattedLog);
    }
  }
}
