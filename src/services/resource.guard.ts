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
   * Kiểm tra dung lượng RAM, CPU hiện tại xem có đủ an toàn để thực hiện render mới
   */
  public static check(): ResourceStatus {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const systemMemoryUsagePercent = ((totalMem - freeMem) / totalMem) * 100;

    const rssBytes = process.memoryUsage().rss;
    const processMemoryMb = rssBytes / (1024 * 1024);

    const cpuCores = os.cpus().length || 1;
    const loadAvg = os.loadavg();
    // loadavg[0] là tải trung bình trong 1 phút qua
    const loadAvg1Min = loadAvg && loadAvg.length > 0 ? loadAvg[0] : 0;
    const cpuLoadRatio = loadAvg1Min / cpuCores;

    const details = {
      systemMemoryUsagePercent: Math.round(systemMemoryUsagePercent * 100) / 100,
      processMemoryMb: Math.round(processMemoryMb * 100) / 100,
      cpuLoadRatio: Math.round(cpuLoadRatio * 100) / 100,
      cpuCores,
      loadAvg1Min: Math.round(loadAvg1Min * 100) / 100,
    };

    // 1. Kiểm tra RAM hệ thống (hoặc RAM container)
    if (systemMemoryUsagePercent > this.maxSystemMemPercent) {
      return {
        isSafe: false,
        reason: `System Memory usage is too high (${details.systemMemoryUsagePercent}% > ${this.maxSystemMemPercent}%). Danger of crash.`,
        details,
      };
    }

    // 2. Kiểm tra RAM của chính tiến trình (phòng tránh OOMKilled trong Docker)
    if (processMemoryMb > this.maxProcessMemMb) {
      return {
        isSafe: false,
        reason: `Process RSS memory is too high (${details.processMemoryMb}MB > ${this.maxProcessMemMb}MB). Danger of Docker OOMKilled.`,
        details,
      };
    }

    // 3. Kiểm tra CPU Load (Chỉ áp dụng khi loadAvg1Min > 0, vì Windows trả về 0 hoặc Unix mới khởi chạy chưa cập nhật loadavg)
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
