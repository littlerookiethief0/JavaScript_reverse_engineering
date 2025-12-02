/**
 * 爬虫功能 Composable
 */
import { ref, computed, nextTick } from "vue";
import { invoke } from "@tauri-apps/api/core";
import type { SpiderParams, SpiderConfig } from "../types";
import { convertProjectType, formatDateTime } from "../utils/helpers";
import { sendNotificationWithPermission } from "./useNotification";
import { useSmtp } from "./useSmtp";

/**
 * 获取当前日期时间的默认值
 */
function getDefaultDateTime() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds()
  };
}

/**
 * 爬虫状态管理
 */
export function useSpider() {
  const smtp = useSmtp();
  
  // 请求参数
  const page = ref(1);
  const title = ref("");
  const projectType = ref("全部");

  // 邮箱和推送
  const email = ref("");
  const pushContent = ref("");
  const pushContentEnabled = ref(false);

  // 定时任务配置
  const defaultDateTime = getDefaultDateTime();
  const year = ref(defaultDateTime.year);
  const month = ref(defaultDateTime.month);
  const day = ref(defaultDateTime.day);
  const hour = ref(defaultDateTime.hour);
  const minute = ref(defaultDateTime.minute);
  const second = ref(defaultDateTime.second);
  const enabled = ref(false);
  const scheduledTaskStarted = ref(false);

  // 日期计算属性
  const date = computed({
    get: () => {
      const y = year.value;
      const m = String(month.value).padStart(2, '0');
      const d = String(day.value).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },
    set: (value: string) => {
      const parts = value.split('-');
      if (parts.length === 3) {
        year.value = parseInt(parts[0], 10);
        month.value = parseInt(parts[1], 10);
        day.value = parseInt(parts[2], 10);
      }
    }
  });

  // 执行状态
  const loading = ref(false);
  const result = ref("");
  const error = ref("");
  const status = ref("");
  const log = ref("");

  /**
   * 获取爬虫参数
   */
  function getSpiderParams(): SpiderParams {
    return {
      page: page.value,
      title: title.value,
      project_type: convertProjectType(projectType.value)
    };
  }

  /**
   * 构建配置对象
   */
  function buildConfig(): SpiderConfig {
    return {
      params: {
        page: page.value,
        title: title.value,
        project_type: convertProjectType(projectType.value)
      },
      email: email.value,
      push_content: pushContent.value,
      year: year.value,
      month: month.value,
      day: day.value,
      hour: hour.value,
      minute: minute.value,
      second: second.value,
      enabled: enabled.value,
      push_content_enabled: pushContentEnabled.value
    };
  }

  /**
   * 重置执行状态
   */
  function resetExecutionState() {
    error.value = "";
    result.value = "";
    status.value = "";
    log.value = "";
  }

  /**
   * 重置定时任务状态
   */
  function resetScheduledTaskState() {
    scheduledTaskStarted.value = false;
    console.log("[定时任务] 定时任务状态已重置");
  }

  /**
   * 追加日志
   */
  function appendLog(message: string) {
    const timestamp = new Date().toLocaleString();
    log.value = log.value 
      ? `${log.value}\n${message}\n时间: ${timestamp}` 
      : `${message}\n时间: ${timestamp}`;
  }

  /**
   * 从输入框读取 SMTP 配置值
   */
  function readSmtpConfigFromInputs() {
    // 使用更精确的选择器，确保能找到正确的输入框
    const smtpSection = document.querySelector('.smtp-config-section');
    if (!smtpSection) {
      console.warn("[邮件发送] 未找到 SMTP 配置区域，跳过从输入框读取值");
      return;
    }
    
    // 查找服务器输入框（通过 placeholder）
    const serverInput = smtpSection.querySelector('input[placeholder="smtp.qq.com"]') as HTMLInputElement;
    // 查找端口输入框（在 SMTP 配置区域内的 number 类型输入框）
    const portInput = smtpSection.querySelector('input[type="number"]') as HTMLInputElement;
    // 查找用户名输入框（在 SMTP 配置区域内的 email 类型输入框）
    const usernameInput = smtpSection.querySelector('input[type="email"]') as HTMLInputElement;
    // 查找密码输入框（在 SMTP 配置区域内的 password 类型输入框）
    const passwordInput = smtpSection.querySelector('input[type="password"]') as HTMLInputElement;
    
    if (serverInput && serverInput.value) {
      smtp.server.value = serverInput.value.trim();
      console.log("[邮件发送] 从输入框读取 server:", smtp.server.value);
    }
    if (portInput && portInput.value) {
      smtp.port.value = Number(portInput.value) || 587;
      console.log("[邮件发送] 从输入框读取 port:", smtp.port.value);
    }
    if (usernameInput && usernameInput.value) {
      smtp.username.value = usernameInput.value.trim();
      console.log("[邮件发送] 从输入框读取 username:", smtp.username.value ? "已设置" : "(空)");
    }
    if (passwordInput && passwordInput.value) {
      smtp.password.value = passwordInput.value;
      console.log("[邮件发送] 从输入框读取 password:", passwordInput.value ? "***已设置***" : "(空)");
    }
    
    // 验证读取的值
    console.log("[邮件发送] 读取后的 SMTP 配置状态:");
    console.log("[邮件发送]   server:", smtp.server.value);
    console.log("[邮件发送]   port:", smtp.port.value);
    console.log("[邮件发送]   username:", smtp.username.value || "(空)");
    console.log("[邮件发送]   password:", smtp.password.value ? "***已设置***" : "(空)");
  }

  /**
   * 构建邮件内容
   */
  function buildEmailBody(success: boolean, data?: string, errorMsg?: string): string {
    const parts: string[] = [];
    
    if (pushContentEnabled.value && pushContent.value) {
      parts.push(pushContent.value);
    }
    
    if (success && data) {
      parts.push(`爬虫执行成功：\n${data}`);
    } else if (errorMsg) {
      parts.push(`爬虫执行失败：\n${errorMsg}`);
    } else {
      parts.push(success ? "爬虫执行成功，但未返回数据。" : "爬虫执行失败，但未返回错误信息。");
    }
    
    return parts.join("\n\n");
  }

  /**
   * 发送执行结果邮件
   */
  async function sendResultEmail(success: boolean, data?: string, errorMsg?: string) {
    if (!email.value?.trim()) {
      const msg = "⚠️ 未填写接收邮箱，跳过邮件发送";
      appendLog(msg);
      status.value = msg;
      error.value = "未填写接收邮箱";
      await sendNotificationWithPermission("邮件发送跳过", "未填写接收邮箱，请先填写邮箱地址");
      return;
    }

    const emailValidation = smtp.validateEmail(email.value);
    if (!emailValidation.valid) {
      const msg = `⚠️ 邮箱地址无效，跳过邮件发送: ${emailValidation.error}`;
      appendLog(msg);
      status.value = msg;
      error.value = emailValidation.error || "邮箱地址无效";
      await sendNotificationWithPermission("邮件发送失败", `邮箱地址无效: ${emailValidation.error}`);
      return;
    }

    try {
      appendLog("📧 准备发送邮件...");
      
      // 先从输入框读取最新值（确保获取用户实际输入的值）
      readSmtpConfigFromInputs();
      
      // 保存配置（确保后端有最新的配置）
      try {
        await smtp.saveConfig();
        appendLog("✅ SMTP 配置已保存");
      } catch (saveError) {
        const errorMsg = saveError instanceof Error ? saveError.message : String(saveError);
        appendLog(`⚠️ SMTP 配置保存失败: ${errorMsg}`);
        // 继续尝试发送，可能配置已经存在
      }
      
      // 检查 SMTP 配置（必须在读取输入框值之后检查）
      if (!smtp.username.value?.trim() || !smtp.password.value?.trim()) {
        const msg = "❌ SMTP 配置不完整，无法发送邮件。请填写 SMTP 用户名和密码（QQ邮箱授权码），然后点击'保存 SMTP 配置'按钮";
        appendLog(msg);
        status.value = msg;
        error.value = "SMTP 配置不完整";
        await sendNotificationWithPermission("邮件发送失败", "请先配置 SMTP 服务器（QQ邮箱: smtp.qq.com, 端口: 587）");
        return;
      }
      
      appendLog("✅ SMTP 配置完整，将使用 SMTP 服务器发送");

      const subject = "爬虫任务执行结果";
      const body = buildEmailBody(success, data, errorMsg);
      
      // 如果邮件内容太大，截断并添加提示
      const MAX_BODY_LENGTH = 100000;
      const finalBody = body.length > MAX_BODY_LENGTH
        ? body.substring(0, MAX_BODY_LENGTH) + `\n\n... (内容已截断，原始内容长度: ${body.length} 字符)`
        : body;
      
      if (body.length > MAX_BODY_LENGTH) {
        appendLog("⚠️ 邮件内容较大，已截断部分内容");
      }
      
      appendLog(`📧 正在发送邮件到: ${email.value}...`);
      console.log("[邮件发送] 调用后端发送邮件...");
      console.log("[邮件发送] 收件人:", email.value);
      console.log("[邮件发送] 主题:", subject);
      console.log("[邮件发送] 内容长度:", finalBody.length, "字符");
      console.log("[邮件发送] SMTP 服务器:", smtp.server.value);
      console.log("[邮件发送] SMTP 端口:", smtp.port.value);
      console.log("[邮件发送] SMTP 用户名:", smtp.username.value || "(空)");
      console.log("[邮件发送] SMTP 密码:", smtp.password.value ? "***已设置***" : "(空)");
      
      const result = await invoke<string>("send_email", {
        to: email.value,
        subject,
        body: finalBody
      });

      console.log("[邮件发送] 后端返回结果:", result);

      // 检查返回结果
      if (!result) {
        throw new Error("邮件发送失败：后端未返回结果");
      }
      
      if (result.includes("失败") || result.includes("错误") || result.includes("不可用")) {
        throw new Error(result);
      }

      const successMsg = `✅ 邮件已成功发送到: ${email.value}`;
      appendLog(successMsg);
      status.value = successMsg;
      error.value = "";
      await sendNotificationWithPermission("邮件已发送", `执行结果已发送到 ${email.value}`);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      const failMsg = `❌ 邮件发送失败: ${errorMsg}`;
      appendLog(failMsg);
      console.error("[邮件发送] 发送失败:", e);
      status.value = failMsg;
      error.value = errorMsg;
      await sendNotificationWithPermission("邮件发送失败", `错误: ${errorMsg}`);
    }
  }

  /**
   * 立即执行爬虫
   */
  async function runSpider() {
    resetExecutionState();
    loading.value = true;

    await nextTick();

    const startTime = Date.now();

    try {
      const params = getSpiderParams();
      log.value = "正在执行爬虫任务...";

      const response = await invoke("run_spider", { params });
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const responseStr = typeof response === "string" 
        ? response 
        : JSON.stringify(response, null, 2);
      
      result.value = responseStr;
      status.value = "✅ 爬虫执行成功！";
      appendLog(`✅ 爬虫执行成功！\n执行耗时: ${duration} 秒`);

      // 执行成功后自动发送邮件
      if (email.value?.trim()) {
        try {
          await sendResultEmail(true, responseStr);
        } catch (emailError) {
          const emailErrorMsg = emailError instanceof Error ? emailError.message : String(emailError);
          appendLog(`⚠️ 邮件发送过程出错: ${emailErrorMsg}`);
          error.value = `邮件发送失败: ${emailErrorMsg}`;
        }
      } else {
        appendLog("⚠️ 未填写接收邮箱，跳过邮件发送");
      }
    } catch (e: unknown) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const errorMsg = e instanceof Error ? e.message : String(e);
      error.value = errorMsg;
      status.value = "❌ 爬虫执行失败";
      appendLog(`❌ 爬虫执行失败\n错误: ${errorMsg}\n执行耗时: ${duration} 秒`);

      // 执行失败后也发送邮件通知
      if (email.value?.trim()) {
        await sendResultEmail(false, undefined, errorMsg);
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * 验证执行时间是否为未来时间
   */
  function validateExecutionTime(): { valid: boolean; datetimeStr: string; error?: string } {
    const datetimeStr = formatDateTime(
      year.value,
      month.value,
      day.value,
      hour.value,
      minute.value,
      second.value
    );
    
    const now = new Date();
    const targetDate = new Date(
      year.value,
      month.value - 1,
      day.value,
      hour.value,
      minute.value,
      second.value
    );
    
    if (targetDate <= now) {
      return {
        valid: false,
        datetimeStr,
        error: `执行时间 ${datetimeStr} 已过，请选择未来的时间`
      };
    }
    
    return { valid: true, datetimeStr };
  }

  /**
   * 启动定时任务
   */
  async function startScheduledSpider() {
    if (!email.value?.trim()) {
      const msg = "❌ 请先输入邮箱地址";
      status.value = msg;
      log.value = msg;
      return;
    }

    if (!enabled.value) {
      const msg = "❌ 请先启用定时任务";
      status.value = msg;
      log.value = msg;
      return;
    }

    if (scheduledTaskStarted.value) {
      scheduledTaskStarted.value = false;
    }

    loading.value = true;
    
    try {
      const timeValidation = validateExecutionTime();
      if (!timeValidation.valid) {
        const msg = `❌ ${timeValidation.error}`;
        status.value = msg;
        log.value = msg;
        appendLog(msg);
        return;
      }
      
      const config = buildConfig();
      log.value = `正在启动定时任务...\n执行时间: ${timeValidation.datetimeStr}\n接收邮箱: ${email.value}`;
      appendLog(`正在启动定时任务...\n执行时间: ${timeValidation.datetimeStr}\n接收邮箱: ${email.value}`);

      const response = await invoke("start_scheduled_spider", { config });
      
      status.value = String(response);
      appendLog(String(response));
      scheduledTaskStarted.value = true;

      await sendNotificationWithPermission("定时任务已启动", `爬虫任务将在 ${timeValidation.datetimeStr} 执行`);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      const msg = errorMsg.includes("已过")
        ? `❌ ${errorMsg}\n\n💡 提示：请设置未来的时间（至少比当前时间晚几秒）`
        : `❌ 启动定时任务失败: ${errorMsg}`;
      
      error.value = errorMsg;
      status.value = msg;
      appendLog(msg);
      console.error("[定时任务] 启动失败:", e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 保存配置
   */
  async function saveConfig() {
    try {
      const config = buildConfig();
      await invoke("save_note", { content: JSON.stringify(config, null, 2) });
      appendLog("✅ 配置信息已保存");
      await sendNotificationWithPermission("配置已保存", "配置信息已成功保存");
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      appendLog(`❌ 保存配置失败: ${errorMsg}`);
      console.error("保存配置失败:", e);
      await sendNotificationWithPermission("保存失败", `配置保存失败: ${errorMsg}`);
    }
  }

  /**
   * 加载配置
   */
  async function loadConfig() {
    try {
      const configJson = await invoke("load_note");
      if (!configJson || typeof configJson !== "string" || !configJson.trim()) {
        return;
      }

      const config: any = JSON.parse(configJson);
      const defaultDT = getDefaultDateTime();

      // 支持新旧两种配置格式
      // 新格式：有 params 字段
      // 旧格式：直接有 page、title、project_type 字段
      if (config.params) {
        // 新格式
        page.value = config.params.page || 1;
        title.value = config.params.title || "";
        // 将后端的 project_type 转换回前端的显示值
        const projectTypeMap: Record<string, string> = {
          "": "全部",
          "0001": "物资",
          "0002": "工程"
        };
        projectType.value = projectTypeMap[config.params.project_type] || config.params.project_type || "全部";
      } else {
        // 旧格式（向后兼容）
        page.value = config.page || 1;
        title.value = config.title || "";
        projectType.value = config.project_type || "全部";
      }

      email.value = config.email || "";
      pushContent.value = config.push_content || "";

      if (config.year && config.month && config.day) {
        year.value = config.year;
        month.value = config.month;
        day.value = config.day;
      } else {
        year.value = defaultDT.year;
        month.value = defaultDT.month;
        day.value = defaultDT.day;
      }

      hour.value = config.hour ?? defaultDT.hour;
      minute.value = config.minute ?? defaultDT.minute;
      second.value = config.second ?? defaultDT.second;
      enabled.value = config.enabled ?? false;
      pushContentEnabled.value = config.push_content_enabled ?? false;

      console.log("配置信息已加载");
    } catch (e: unknown) {
      console.log("加载配置失败（可能文件不存在）:", e);
    }
  }

  /**
   * 复制到剪贴板
   */
  async function copyToClipboard(text: string, successMessage: string) {
    if (!text) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      appendLog(`✅ ${successMessage}`);
      await sendNotificationWithPermission("复制成功", successMessage);
      return true;
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      appendLog(`❌ 复制失败: ${errorMsg}`);
      console.error("复制失败:", e);
      return false;
    }
  }

  /**
   * 复制日志内容
   */
  async function copyLogContent() {
    const logText = log.value || status.value || "";
    if (!logText) {
      log.value = "❌ 没有日志内容可复制";
      return;
    }
    await copyToClipboard(logText, "日志已复制到剪贴板");
  }

  /**
   * 清空日志
   */
  function clearLogContent() {
    log.value = "";
    status.value = "";
    error.value = "";
  }

  /**
   * 复制响应内容
   */
  async function copyResponseContent() {
    if (!result.value) {
      log.value = "❌ 没有内容可复制";
      return;
    }
    await copyToClipboard(result.value, "内容已复制到剪贴板");
  }

  /**
   * 清空响应内容
   */
  function clearResponseContent() {
    result.value = "";
  }

  return {
    // 状态
    page,
    title,
    projectType,
    email,
    pushContent,
    pushContentEnabled,
    year,
    month,
    day,
    hour,
    minute,
    second,
    date,
    enabled,
    scheduledTaskStarted,
    loading,
    result,
    error,
    status,
    log,
    // 方法
    getSpiderParams,
    appendLog,
    runSpider,
    startScheduledSpider,
    saveConfig,
    loadConfig,
    copyLogContent,
    clearLogContent,
    copyResponseContent,
    clearResponseContent,
    resetScheduledTaskState
  };
}
