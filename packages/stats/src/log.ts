import { Logger } from "@galacean/engine";

export function log(...args: any): void {
  Logger.info("🚀 [galacean engine--stats]", ...args);
}

export function errorLog(...args: any): void {
  Logger.error("🚀 [galacean engine-stats]", ...args);
}
