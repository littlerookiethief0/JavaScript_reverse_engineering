/**
 * 类型定义
 */

export interface Feature {
  id: string;
  title: string;
  icon: string;
}

export interface SpiderParams {
  page: number;
  title: string;
  project_type: string;
}

export interface SpiderConfig {
  params: SpiderParams;
  email: string;
  push_content: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  enabled: boolean;
  push_content_enabled: boolean;
}

export interface SmtpConfig {
  server: string;
  port: number;
  username: string;
  password: string;
}

