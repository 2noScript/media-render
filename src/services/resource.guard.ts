import os from "os";

export interface ResourceStatus {
  isSafe: boolean;
  reason?: string;
  details: {
    systemMemoryUsagePercent: number;
    processMemoryMb: number;
    cpuLoadRatio: number;
    cpuCores: number;
    loadAvg1Min: number;
  };
}

export class ResourceGuard {
  private static maxSystemMemPercent = parseInt(process.env.MAX_MEMORY_USAGE_PERCENT || "85", 10);
  private static maxProcessMemMb = parseInt(process.env.MAX_PROCESS_MEMORY_MB || "1536", 10);
  private static maxCpuLoadRatio = parseFloat(process.env.MAX_CPU_LOAD_RATIO || "0.9");

  /**
   * Diagnoses current RAM and CPU load averages to check if it's safe to start a new rendering task
   */
  public static check(): ResourceStatus {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const systemMemoryUsagePercent = ((totalMem - freeMem) / totalMem) * 100;

    const rssBytes = process.memoryUsage().rss;
    const processMemoryMb = rssBytes / (1024 * 1024);

    const cpuCores = os.cpus().length || 1;
    const loadAvg = os.loadavg();
    // loadavg[0] corresponds to the 1-minute load average
    const loadAvg1Min = loadAvg && loadAvg.length > 0 ? loadAvg[0] : 0;
    const cpuLoadRatio = loadAvg1Min / cpuCores;

    const details = {
      systemMemoryUsagePercent: Math.round(systemMemoryUsagePercent * 100) / 100,
      processMemoryMb: Math.round(processMemoryMb * 100) / 100,
      cpuLoadRatio: Math.round(cpuLoadRatio * 100) / 100,
      cpuCores,
      loadAvg1Min: Math.round(loadAvg1Min * 100) / 100,
    };

    // 1. Guard against system/container memory exhaustion
    if (systemMemoryUsagePercent > this.maxSystemMemPercent) {
      return {
        isSafe: false,
        reason: `System Memory usage is too high (${details.systemMemoryUsagePercent}% > ${this.maxSystemMemPercent}%). Danger of crash.`,
        details,
      };
    }

    // 2. Enforce limits on the active Bun process memory to prevent Docker OOMKilled events
    if (processMemoryMb > this.maxProcessMemMb) {
      return {
        isSafe: false,
        reason: `Process RSS memory is too high (${details.processMemoryMb}MB > ${this.maxProcessMemMb}MB). Danger of Docker OOMKilled.`,
        details,
      };
    }

    // 3. Prevent rendering overloading when CPU load ratio thresholds are breached
    if (loadAvg1Min > 0 && cpuLoadRatio > this.maxCpuLoadRatio) {
      return {
        isSafe: false,
        reason: `CPU Load average is too high (ratio ${details.cpuLoadRatio} > ${this.maxCpuLoadRatio}). System is throttled.`,
        details,
      };
    }

    return {
      isSafe: true,
      details,
    };
  }
}
