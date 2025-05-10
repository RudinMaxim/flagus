import { IFormatter } from '../interfaces/interfaces';
import { SimpleFormatter } from './simple.formatter';
import { JsonFormatter } from './json.formatter';
import { PrettyFormatter } from './pretty.formatter';
import { LogFormat } from '../interfaces/types';

export class FormatterFactory {
  static createFormatter(format: LogFormat): IFormatter {
    switch (format) {
      case LogFormat.SIMPLE:
        return new SimpleFormatter();
      case LogFormat.JSON:
        return new JsonFormatter();
      case LogFormat.PRETTY:
        return new PrettyFormatter();
      default:
        return new JsonFormatter();
    }
  }
}
