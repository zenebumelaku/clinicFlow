import configuration from './configuration';

export interface ConfigAccessor {
  get<T = any>(key: string, defaultValue?: T): T;
  getOrThrow<T = any>(key: string): T;
}

export class ConfigService implements ConfigAccessor {
  private readonly configData: Record<string, unknown>;

  constructor(internalConfig?: Record<string, unknown>) {
    const defaultConfig = configuration();
    this.configData = {
      ...defaultConfig,
      ...(internalConfig || {}),
    };
  }

  get<T = any>(key: string, defaultValue?: T): T {
    // 1. Try dot-path traversal in configData
    const valFromPath = this.resolvePath(this.configData, key);
    if (valFromPath !== undefined && valFromPath !== null) {
      return valFromPath as T;
    }

    // 2. Try direct key in configData
    if (key in this.configData && this.configData[key] !== undefined && this.configData[key] !== null) {
      return this.configData[key] as T;
    }

    // 3. Try process.env with exact key
    if (process.env[key] !== undefined) {
      return this.castEnvValue(process.env[key]) as unknown as T;
    }

    // 4. Try process.env with converted key (e.g. 'jwt.secret' -> 'JWT_SECRET')
    const envKey = key.replace(/\./g, '_').toUpperCase();
    if (process.env[envKey] !== undefined) {
      return this.castEnvValue(process.env[envKey]) as unknown as T;
    }

    return defaultValue as T;
  }

  getOrThrow<T = any>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined || value === null) {
      throw new Error(`Configuration key "${key}" is not set`);
    }
    return value;
  }

  private resolvePath(obj: Record<string, unknown>, path: string): unknown {
    if (!obj || typeof obj !== 'object') return undefined;
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  private castEnvValue(val: string): unknown {
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (/^\d+$/.test(val)) return parseInt(val, 10);
    return val;
  }
}
