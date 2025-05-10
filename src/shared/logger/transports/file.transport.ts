import * as fs from 'fs';
import * as path from 'path';
import { IFormatter, ITransport, LogEntry } from '../interfaces';

export class FileTransport implements ITransport {
  private logFile: string;
  private currentSize: number = 0;

  constructor(
    private formatter: IFormatter,
    private filePath: string = './logs',
    private maxFileSize: number = 10 * 1024 * 1024, // 10MB by default
    private maxFiles: number = 5,
    private serviceName: string = 'app'
  ) {
    this.ensureLogDirectory();
    this.logFile = this.getOrCreateLogFile();
    this.currentSize = this.getFileSize(this.logFile);
  }

  write(entry: LogEntry): void {
    const formattedLog = this.formatter.format(entry) + '\n';

    if (this.currentSize >= this.maxFileSize) {
      this.rotateLogFiles();
    }

    fs.appendFileSync(this.logFile, formattedLog);
    this.currentSize += Buffer.byteLength(formattedLog);
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(this.filePath, { recursive: true });
    }
  }

  private getOrCreateLogFile(): string {
    const fileName = path.join(this.filePath, `${this.serviceName}.log`);

    if (!fs.existsSync(fileName)) {
      fs.writeFileSync(fileName, '');
    }

    return fileName;
  }

  private getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  private rotateLogFiles(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedFile = path.join(this.filePath, `${this.serviceName}-${timestamp}.log`);
    fs.renameSync(this.logFile, rotatedFile);

    fs.writeFileSync(this.logFile, '');
    this.currentSize = 0;

    this.cleanupOldLogFiles();
  }

  private cleanupOldLogFiles(): void {
    // Get all rotated log files for this service
    const logFiles = fs
      .readdirSync(this.filePath)
      .filter(file => file.startsWith(`${this.serviceName}-`) && file.endsWith('.log'))
      .map(file => path.join(this.filePath, file))
      .sort((a, b) => {
        return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
      });

    if (logFiles.length >= this.maxFiles) {
      const filesToRemove = logFiles.slice(this.maxFiles - 1);
      for (const file of filesToRemove) {
        try {
          fs.unlinkSync(file);
        } catch (error) {
          console.error(`Failed to delete log file ${file}:`, error);
        }
      }
    }
  }
}
