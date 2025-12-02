/**
 * SMTP 配置 Composable
 */
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import type { SmtpConfig } from "../types";
import { sendNotificationWithPermission } from "./useNotification";

/**
 * 默认 SMTP 配置
 */
const DEFAULT_SMTP_CONFIG: Omit<SmtpConfig, "password"> = {
  server: "smtp.qq.com",
  port: 587,
  username: ""
};

/**
 * 邮箱格式验证正则
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * SMTP 配置管理
 */
export function useSmtp() {
  const server = ref(DEFAULT_SMTP_CONFIG.server);
  const port = ref(DEFAULT_SMTP_CONFIG.port);
  const username = ref(DEFAULT_SMTP_CONFIG.username);
  const password = ref("");
  const visible = ref(false);

  /**
   * 保存 SMTP 配置
   */
  async function saveConfig() {
    if (!server.value?.trim()) {
      await sendNotificationWithPermission("保存失败", "SMTP 服务器地址不能为空");
      return false;
    }
    
    if (!port.value || port.value < 1 || port.value > 65535) {
      await sendNotificationWithPermission("保存失败", "SMTP 端口必须是 1-65535 之间的数字");
      return false;
    }
    
    try {
      const config: SmtpConfig = {
        server: server.value.trim(),
        port: port.value,
        username: username.value.trim(),
        password: password.value.trim()
      };

      await invoke("save_smtp_config", { config });
      
      if (!config.username || !config.password) {
        await sendNotificationWithPermission("配置已保存", "SMTP 配置已保存，但用户名或密码为空，将使用系统邮件客户端");
      } else {
        await sendNotificationWithPermission("配置已保存", "SMTP 配置已成功保存");
      }
      return true;
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error("[SMTP保存] 保存失败:", e);
      await sendNotificationWithPermission("保存失败", `SMTP 配置保存失败: ${errorMsg}`);
      return false;
    }
  }

  /**
   * 加载 SMTP 配置
   */
  async function loadConfig() {
    try {
      const config = await invoke("load_smtp_config");
      if (!config || typeof config !== "object") {
        server.value = DEFAULT_SMTP_CONFIG.server;
        port.value = DEFAULT_SMTP_CONFIG.port;
        username.value = "";
        password.value = "";
        return;
      }

      const smtpConfig = config as SmtpConfig;
      server.value = smtpConfig.server?.trim() || DEFAULT_SMTP_CONFIG.server;
      port.value = smtpConfig.port || DEFAULT_SMTP_CONFIG.port;
      username.value = smtpConfig.username?.trim() || "";
      password.value = smtpConfig.password?.trim() || "";
    } catch (e: unknown) {
      server.value = DEFAULT_SMTP_CONFIG.server;
      port.value = DEFAULT_SMTP_CONFIG.port;
      username.value = "";
      password.value = "";
    }
  }

  /**
   * 验证邮箱地址格式
   */
  function validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email?.trim()) {
      return { valid: false, error: "请先输入邮箱地址" };
    }

    if (!email.includes('@') || !email.includes('.')) {
      return { 
        valid: false, 
        error: "邮箱地址格式不正确，应包含 @ 和域名（例如: user@example.com）" 
      };
    }

    if (email.includes("@gamil.com")) {
      return { 
        valid: false, 
        error: "邮箱地址拼写错误：应该是 @gmail.com 而不是 @gamil.com" 
      };
    }

    if (!EMAIL_REGEX.test(email)) {
      return { 
        valid: false, 
        error: "邮箱地址格式不正确，请检查是否正确（例如: user@example.com）" 
      };
    }

    return { valid: true };
  }

  /**
   * 测试邮件发送
   */
  async function testEmail(to: string, pushContentEnabled: boolean, pushContent: string) {
    const validation = validateEmail(to);
    if (!validation.valid) {
      throw new Error(validation.error || "邮箱地址无效");
    }

    await saveConfig();

    const subject = "测试邮件 - RPA 应用";
    const body = `这是一封测试邮件，用于验证邮件发送功能是否正常工作。

发送时间: ${new Date().toLocaleString()}
推送内容: ${pushContentEnabled ? (pushContent || "无") : "未启用"}

如果您收到这封邮件，说明邮件发送功能正常工作。`;

    const result = await invoke("send_email", {
      to,
      subject,
      body
    });

    await sendNotificationWithPermission("测试邮件已发送", `邮件已发送到 ${to}`);
    return result;
  }

  return {
    server,
    port,
    username,
    password,
    visible,
    saveConfig,
    loadConfig,
    validateEmail,
    testEmail
  };
}
