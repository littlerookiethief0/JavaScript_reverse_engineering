/**
 * 常量定义
 */

/**
 * 项目类型映射
 */
export const PROJECT_TYPE_MAP: Record<string, string> = {
  "全部": "",
  "物资": "0001",
  "工程": "0002",
  "服务": "0001"
} as const;

/**
 * 默认邮箱配置
 */
export const DEFAULT_EMAIL = "";

/**
 * 默认 SMTP 配置
 */
export const DEFAULT_SMTP = {
  server: "smtp.qq.com",
  port: 587,
  username: ""
} as const;

