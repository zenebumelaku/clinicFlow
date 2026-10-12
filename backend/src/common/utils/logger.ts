export class Logger {
  constructor(private readonly context: string = 'Application') {}

  log(message: unknown, ...optionalParams: unknown[]): void {
    const timestamp = new Date().toISOString();
    console.log(`[ClinicFlow] [${timestamp}] [LOG] [${this.context}] ${message}`, ...optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    const timestamp = new Date().toISOString();
    console.warn(`[ClinicFlow] [${timestamp}] [WARN] [${this.context}] ${message}`, ...optionalParams);
  }

  error(message: unknown, trace?: unknown, ...optionalParams: unknown[]): void {
    const timestamp = new Date().toISOString();
    console.error(
      `[ClinicFlow] [${timestamp}] [ERROR] [${this.context}] ${message}`,
      trace ? `\nStack: ${trace}` : '',
      ...optionalParams,
    );
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    const timestamp = new Date().toISOString();
    console.debug(`[ClinicFlow] [${timestamp}] [DEBUG] [${this.context}] ${message}`, ...optionalParams);
  }
}
