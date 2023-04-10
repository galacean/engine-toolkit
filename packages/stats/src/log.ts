import { Logger } "@galacean/engine";

export function log(...args: any): void {
  Logger.info("🚀 [o3-engine-stats]", ...args);
}

export function errorLog(...args: any): void {
  Logger.error("🚀 [o3-engine-stats]", ...args);
}
