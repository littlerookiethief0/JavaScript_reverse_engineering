/**
 * 工具函数集合
 */
import { PROJECT_TYPE_MAP } from "./constants";

/**
 * 项目类型转换
 */
export function convertProjectType(type: string): string {
  return PROJECT_TYPE_MAP[type] || "";
}

/**
 * 格式化日期时间
 */
export function formatDateTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number
): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

/**
 * 格式化日期（仅日期部分）
 */
export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * 解析日期字符串
 */
export function parseDate(dateStr: string): { year: number; month: number; day: number } | null {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10)
    };
  }
  return null;
}

