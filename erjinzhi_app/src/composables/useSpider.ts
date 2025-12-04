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
  // 获取 SMTP 单例
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
      const m = String(month.value).padStart(2, "0");
      const d = String(day.value).padStart(2, "0");
      return `${y}-${m}-${d}`;
    },
    set: (value: string) => {
      const parts = value.split("-");
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
      params: getSpiderParams(),
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
   * 追加日志
   */
  function appendLog(message: string) {
    const timestamp = new Date().toLocaleString();
    log.value = log.value
      ? `${log.value}\n${message}\n时间: ${timestamp}`
      : `${message}\n时间: ${timestamp}`;
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
    // 检查邮箱地址
    if (!email.value?.trim()) {
      appendLog("⚠️ 未填写接收邮箱，跳过邮件发送");
      return;
    }

    const emailValidation = smtp.validateEmail(email.value);
    if (!emailValidation.valid) {
      appendLog(`⚠️ 邮箱地址无效: ${emailValidation.error}`);
      error.value = emailValidation.error || "邮箱地址无效";
      return;
    }

    // 检查 SMTP 配置是否完整
    if (!smtp.isConfigComplete()) {
      const msg = "❌ SMTP 配置不完整，无法发送邮件。请填写 SMTP 用户名和密码（QQ邮箱授权码），然后点击'保存 SMTP 配置'按钮";
      appendLog(msg);
      error.value = "SMTP 配置不完整";
      await sendNotificationWithPermission("邮件发送失败", "请先完成 SMTP 配置");
      return;
    }

    try {
      appendLog("📧 正在发送邮件...");

      const subject = "爬虫任务执行结果";
      const body = buildEmailBody(success, data, errorMsg);

      // 截断过长的邮件内容
      const MAX_BODY_LENGTH = 100000;
      const finalBody =
        body.length > MAX_BODY_LENGTH
          ? body.substring(0, MAX_BODY_LENGTH) + `\n\n... (内容已截断，原始长度: ${body.length} 字符)`
          : body;

      const sendResult = await invoke<string>("send_email", {
        to: email.value,
        subject,
        body: finalBody
      });

      // 检查返回结果
      if (!sendResult || sendResult.includes("失败") || sendResult.includes("错误")) {
        throw new Error(sendResult || "邮件发送失败");
      }

      appendLog(`✅ 邮件已发送到: ${email.value}`);
      await sendNotificationWithPermission("邮件已发送", `结果已发送到 ${email.value}`);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      appendLog(`❌ 邮件发送失败: ${errMsg}`);
      error.value = errMsg;
      await sendNotificationWithPermission("邮件发送失败", errMsg);
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
      const responseStr = typeof response === "string" ? response : JSON.stringify(response, null, 2);

      result.value = responseStr;
      status.value = "✅ 爬虫执行成功！";
      appendLog(`✅ 爬虫执行成功！\n执行耗时: ${duration} 秒`);

      // 执行成功后自动发送邮件
      if (email.value?.trim()) {
        await sendResultEmail(true, responseStr);
      }
    } catch (e: unknown) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const errMsg = e instanceof Error ? e.message : String(e);
      error.value = errMsg;
      status.value = "❌ 爬虫执行失败";
      appendLog(`❌ 爬虫执行失败\n错误: ${errMsg}\n执行耗时: ${duration} 秒`);

      // 执行失败后也发送邮件通知
      if (email.value?.trim()) {
        await sendResultEmail(false, undefined, errMsg);
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * 验证执行时间是否为未来时间
   */
  function validateExecutionTime(): { valid: boolean; datetimeStr: string; error?: string } {
    const datetimeStr = formatDateTime(year.value, month.value, day.value, hour.value, minute.value, second.value);

    const now = new Date();
    const targetDate = new Date(year.value, month.value - 1, day.value, hour.value, minute.value, second.value);

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

    // 重置定时任务状态
    scheduledTaskStarted.value = false;
    loading.value = true;

    try {
      const timeValidation = validateExecutionTime();
      if (!timeValidation.valid) {
        const msg = `❌ ${timeValidation.error}`;
        status.value = msg;
        appendLog(msg);
        return;
      }

      const config = buildConfig();
      appendLog(`正在启动定时任务...\n执行时间: ${timeValidation.datetimeStr}\n接收邮箱: ${email.value}`);

      const response = await invoke("start_scheduled_spider", { config });

      status.value = String(response);
      appendLog(String(response));
      scheduledTaskStarted.value = true;

      await sendNotificationWithPermission("定时任务已启动", `任务将在 ${timeValidation.datetimeStr} 执行`);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const msg = errMsg.includes("已过")
        ? `❌ ${errMsg}\n\n💡 提示：请设置未来的时间`
        : `❌ 启动定时任务失败: ${errMsg}`;

      error.value = errMsg;
      status.value = msg;
      appendLog(msg);
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
      const errMsg = e instanceof Error ? e.message : String(e);
      appendLog(`❌ 保存配置失败: ${errMsg}`);
      await sendNotificationWithPermission("保存失败", errMsg);
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
      if (config.params) {
        page.value = config.params.page || 1;
        title.value = config.params.title || "";
        const projectTypeMap: Record<string, string> = {
          "": "全部",
          "0001": "物资",
          "0002": "工程"
        };
        projectType.value = projectTypeMap[config.params.project_type] || config.params.project_type || "全部";
      } else {
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

      console.log("[Spider] 配置已加载");
    } catch (e: unknown) {
      console.log("[Spider] 加载配置失败:", e);
    }
  }

  /**
   * 复制到剪贴板
   */
  async function copyToClipboard(text: string, successMessage: string): Promise<boolean> {
    if (!text) return false;

    try {
      await navigator.clipboard.writeText(text);
      appendLog(`✅ ${successMessage}`);
      await sendNotificationWithPermission("复制成功", successMessage);
      return true;
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      appendLog(`❌ 复制失败: ${errMsg}`);
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
    appendLog,
    runSpider,
    startScheduledSpider,
    saveConfig,
    loadConfig,
    copyLogContent,
    clearLogContent,
    copyResponseContent,
    clearResponseContent
  };
}

