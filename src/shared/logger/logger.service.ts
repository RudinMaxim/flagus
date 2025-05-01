import { injectable } from 'inversify';

@injectable()
export class LoggerService {
  public info(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
  }

  public warn(message: string): void {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
  }

  public error(message: string): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
  }

  public debug(message: string): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`);
    }
  }
}
