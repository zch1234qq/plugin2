/**
 * 时间戳单位归一化工具
 *
 * 约定：
 * - JS 的 Date 构造函数使用「毫秒」时间戳
 * - 后端/旧数据可能返回「秒」时间戳（10位）
 * - 极少数情况下可能出现「微秒」时间戳
 */
// 兼容旧代码：缓存相关逻辑使用「秒」时间戳（10位）
export function Now(): number {
  return Math.floor(Date.now() / 1000);
}

// 兼容旧代码：freshTime 单位为「秒」
export function isExpired(start: number, freshTime: number): boolean {
  return Now() - start > freshTime;
}

export function toEpochMs(input: number): number {
  const ts = Number(input);
  if (!Number.isFinite(ts) || ts <= 0) return 0;

  // 秒级（常见 10 位，例如 1771204988）
  if (ts < 1e12) return Math.round(ts * 1000);

  // 微秒级（16 位左右），转为毫秒
  if (ts > 1e14) return Math.round(ts / 1000);

  // 认为已经是毫秒
  return Math.round(ts);
}

type LatestStatusLike = {
  statussave?: {
    time_update?: number;
    items?: Array<{ uuid: string; time_update: number }>;
  };
};

/**
 * 归一化 getLatestStatus 的时间字段（外层 time_update + item.time_update）。
 * 不改变结构，仅修正单位为毫秒。
 */
export function normalizeLatestStatusTimestamps<T extends LatestStatusLike>(data: T): T {
  const stat = data?.statussave;
  if (!stat) return data;

  const items = Array.isArray(stat.items)
    ? stat.items.map((it) => ({ ...it, time_update: toEpochMs(it.time_update) }))
    : stat.items;

  return {
    ...data,
    statussave: {
      ...stat,
      time_update: toEpochMs(stat.time_update || 0),
      items: items as any,
    },
  };
}


// 兼容旧代码的默认导出：import time from "./time"
export default {
  Now,
  isExpired,
};
