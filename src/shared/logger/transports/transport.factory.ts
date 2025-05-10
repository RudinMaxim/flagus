import { ITransport, LogFormat, Transport as TransportType } from '../interfaces';
import { ConsoleTransport } from './console.transport';
import { FileTransport } from './file.transport';
import { FormatterFactory } from '../formatters/formatter.factory';

export class TransportFactory {
  static createTransport(
    type: TransportType,
    format: LogFormat,
    filePath?: string,
    maxFileSize?: number,
    maxFiles?: number
  ): ITransport {
    const formatter = FormatterFactory.createFormatter(format);

    switch (type) {
      case TransportType.CONSOLE:
        return new ConsoleTransport(formatter);
      case TransportType.FILE:
        return new FileTransport(formatter, filePath, maxFileSize, maxFiles);
      default:
        return new ConsoleTransport(formatter);
    }
  }
}
