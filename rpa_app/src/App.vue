<script setup lang="ts">
import { ref, onMounted } from "vue";
import FeatureList from "./components/FeatureList.vue";
import { useSpider } from "./composables/useSpider";
import { useSmtp } from "./composables/useSmtp";
import { useEventListeners } from "./composables/useEventListeners";
import { sendNotificationWithPermission } from "./composables/useNotification";
import type { Feature } from "./types";

// 视图状态
const viewMode = ref<"list" | "detail">("list");
const selectedFeature = ref<string | null>(null);

// 功能列表
const features: Feature[] = [
  {
    id: "spider",
    title: "中国石油招标投标网爬虫",
    icon: "🕷️"
  }
];

// 使用 composables
const spider = useSpider();
const smtp = useSmtp();

// SMTP 输入框的 ref
const smtpServerInput = ref<HTMLInputElement | null>(null);
const smtpPortInput = ref<HTMLInputElement | null>(null);
const smtpUsernameInput = ref<HTMLInputElement | null>(null);
const smtpPasswordInput = ref<HTMLInputElement | null>(null);

const { setupListeners } = useEventListeners({
  onTaskResult: (data) => {
    spider.result.value = data;
    spider.appendLog("✅ 定时任务执行成功\n结果已更新到响应框");
  },
  onTaskError: (error) => {
    spider.error.value = error;
    spider.appendLog(`❌ 定时任务执行失败\n错误: ${error}`);
  },
  onEmailSent: (message) => {
    spider.appendLog(`📧 邮件发送成功: ${message}`);
    sendNotificationWithPermission("邮件已发送", message);
  },
  onEmailError: (error) => {
    spider.appendLog(`📧 邮件发送失败: ${error}`);
    spider.error.value = error;
  }
});

// 功能选择
function selectFeature(featureId: string) {
  selectedFeature.value = featureId;
  viewMode.value = "detail";
}

function backToList() {
  viewMode.value = "list";
  selectedFeature.value = null;
}

/**
 * 从输入框读取值并保存 SMTP 配置
 */
async function saveSmtpConfigFromInputs() {
  smtp.server.value = smtpServerInput.value?.value || smtp.server.value;
  smtp.port.value = smtpPortInput.value?.value ? Number(smtpPortInput.value.value) : smtp.port.value;
  smtp.username.value = smtpUsernameInput.value?.value || smtp.username.value;
  smtp.password.value = smtpPasswordInput.value?.value || smtp.password.value;
  await smtp.saveConfig();
}

/**
 * 处理启动定时任务按钮点击
 */
async function handleStartScheduledTask() {
  if (!spider.enabled.value) {
    spider.status.value = "❌ 请先勾选'启用定时任务'复选框";
    spider.log.value = "❌ 请先勾选'启用定时任务'复选框";
    return;
  }
  
  if (spider.loading.value) {
    return;
  }
  
  await spider.startScheduledSpider();
}

/**
 * 测试邮件发送
 */
async function testEmail() {
  if (!spider.email.value?.trim()) {
    spider.status.value = "❌ 请先输入邮箱地址";
    spider.log.value = "❌ 请先输入邮箱地址";
    return;
  }

  const emailValidation = smtp.validateEmail(spider.email.value);
  if (!emailValidation.valid) {
    const errorMsg = emailValidation.error || "邮箱地址无效";
    spider.status.value = `❌ ${errorMsg}`;
    spider.log.value = `❌ ${errorMsg}`;
    spider.error.value = errorMsg;
    return;
  }

  spider.loading.value = true;
  spider.error.value = "";
  spider.status.value = "";
  spider.log.value = "";

  try {
    spider.log.value = `正在发送测试邮件到: ${spider.email.value}...`;
    const result = await smtp.testEmail(
      spider.email.value,
      spider.pushContentEnabled.value,
      spider.pushContent.value
    );
    spider.status.value = "✅ 测试邮件发送成功！";
    spider.appendLog(`✅ 测试邮件发送成功！\n${String(result)}\n\n请检查您的邮箱（包括垃圾邮件文件夹）`);
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    spider.error.value = errorMsg;
    spider.status.value = "❌ 测试邮件发送失败";
    spider.appendLog(`❌ 测试邮件发送失败\n\n错误详情:\n${errorMsg}\n\n排查建议:\n1. 检查 SMTP 服务器地址是否正确（QQ邮箱: smtp.qq.com）\n2. 检查端口是否正确（QQ邮箱: 587）\n3. 检查邮箱账号是否正确（完整邮箱地址）\n4. 检查授权码是否正确（不是登录密码）\n5. 确认已开启QQ邮箱的SMTP服务\n6. 检查网络连接是否正常`);
  } finally {
    spider.loading.value = false;
  }
}

// 初始化
onMounted(async () => {
  await spider.loadConfig();
  await smtp.loadConfig();
  await setupListeners();
});
</script>

<template>
  <div class="app">
    <!-- 功能列表页面 -->
    <FeatureList
      v-if="viewMode === 'list'"
      :features="features"
      @select="selectFeature"
    />

    <!-- 爬虫详情页面 -->
    <section v-if="viewMode === 'detail' && selectedFeature === 'spider'" class="page">
      <div class="page-header">
        <button class="back-button" @click="backToList">← 返回列表</button>
        <h1>🕷️ 中国石油招标投标网爬虫</h1>
      </div>

      <div class="config-container">
        <div class="form-section">
          <h2>📋 请求参数</h2>
        
          <div class="form-row">
            <label>页码：</label>
            <input 
              type="number" 
              v-model.number="spider.page"
              min="1" 
              class="number-input"
            />
          </div>

          <div class="form-row">
            <label>搜索关键字：</label>
            <input 
              :value="spider.title.value"
              @input="(e) => spider.title.value = (e.target as HTMLInputElement).value"
              placeholder="留空表示不限制"
              class="url-input"
            />
          </div>

          <div class="form-row">
            <label>项目类型：</label>
            <select 
              :value="spider.projectType.value"
              @change="(e) => spider.projectType.value = (e.target as HTMLSelectElement).value"
            >
              <option value="全部">全部</option>
              <option value="物资">物资</option>
              <option value="工程">工程</option>
              <option value="服务">服务</option>
            </select>
          </div>

          <div class="form-row">
            <label>接收邮箱：</label>
            <input 
              :value="spider.email.value"
              @input="(e) => spider.email.value = (e.target as HTMLInputElement).value"
              type="email"
              placeholder="example@email.com"
              class="url-input"
            />
          </div>

          <div class="form-row">
            <label>推送内容：</label>
            <input 
              :value="spider.pushContent.value"
              @input="(e) => spider.pushContent.value = (e.target as HTMLInputElement).value"
              type="text"
              placeholder="请输入推送内容"
              class="url-input"
            />
          </div>

          <div class="form-row">
            <label>定时执行：</label>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <input 
                type="date" 
                :value="spider.date.value"
                @input="(e) => spider.date.value = (e.target as HTMLInputElement).value"
                class="url-input"
                style="width: 150px; flex: 0 0 auto;"
              />
              <input 
                type="number" 
                :value="spider.hour.value"
                @input="(e) => spider.hour.value = Number((e.target as HTMLInputElement).value) || 0"
                min="0" 
                max="23"
                class="number-input"
                style="width: 70px;"
                placeholder="时"
              />
              <span>:</span>
              <input 
                type="number" 
                :value="spider.minute.value"
                @input="(e) => spider.minute.value = Number((e.target as HTMLInputElement).value) || 0"
                min="0" 
                max="59"
                class="number-input"
                style="width: 70px;"
                placeholder="分"
              />
              <span>:</span>
              <input 
                type="number" 
                :value="spider.second.value"
                @input="(e) => spider.second.value = Number((e.target as HTMLInputElement).value) || 0"
                min="0" 
                max="59"
                class="number-input"
                style="width: 70px;"
                placeholder="秒"
              />
            </div>
          </div>

          <div class="form-row">
            <label>
              <input 
                type="checkbox" 
                :checked="spider.enabled.value"
                @change="(e) => spider.enabled.value = (e.target as HTMLInputElement).checked"
              />
              启用定时任务
            </label>
          </div>

          <div class="form-row">
            <label>
              <input 
                type="checkbox" 
                :checked="spider.pushContentEnabled.value"
                @change="(e) => spider.pushContentEnabled.value = (e.target as HTMLInputElement).checked"
              />
              启用推送内容
            </label>
          </div>

          <div class="form-row">
            <label>
              <button @click="smtp.visible.value = !smtp.visible.value" type="button" class="toggle-button">
                {{ smtp.visible.value ? "隐藏" : "显示" }} SMTP 配置
              </button>
            </label>
          </div>

          <div v-if="smtp.visible.value" class="smtp-config-section">
            <h3 style="margin: 12px 0 8px 0; font-size: 14px; color: #374151;">📧 SMTP 邮件服务器配置</h3>

            <div class="form-row">
              <label>SMTP 服务器：</label>
              <input
                ref="smtpServerInput"
                :value="smtp.server.value"
                @input="(e) => smtp.server.value = (e.target as HTMLInputElement).value"
                type="text"
                placeholder="smtp.qq.com"
                class="url-input"
              />
            </div>

            <div class="form-row">
              <label>SMTP 端口：</label>
              <input
                ref="smtpPortInput"
                :value="smtp.port.value"
                @input="(e) => smtp.port.value = Number((e.target as HTMLInputElement).value)"
                type="number"
                min="1"
                max="65535"
                class="number-input"
                style="width: 100px;"
              />
            </div>

            <div class="form-row">
              <label>邮箱账号：</label>
              <input
                ref="smtpUsernameInput"
                :value="smtp.username.value"
                @input="(e) => smtp.username.value = (e.target as HTMLInputElement).value"
                type="email"
                placeholder="your-email@qq.com"
                class="url-input"
              />
            </div>

            <div class="form-row">
              <label>授权码：</label>
              <input
                ref="smtpPasswordInput"
                :value="smtp.password.value"
                @input="(e) => smtp.password.value = (e.target as HTMLInputElement).value"
                type="password"
                placeholder="请输入邮箱授权码"
                class="url-input"
              />
            </div>

            <div class="form-row">
              <button @click="saveSmtpConfigFromInputs" class="save-button" style="margin-top: 8px;">
                💾 保存 SMTP 配置
              </button>
            </div>
          </div>

          <div class="actions">
            <button @click="spider.runSpider" :disabled="spider.loading.value">
              {{ spider.loading.value ? "进行中" : "🚀 立即执行" }}
            </button>
            <button 
              @click="handleStartScheduledTask"
              :disabled="!spider.enabled.value || spider.loading.value"
              :class="[
                'scheduled-task-button',
                {
                  'task-started': spider.scheduledTaskStarted.value,
                  'task-disabled': !spider.enabled.value
                }
              ]"
              :title="!spider.enabled.value ? '请先勾选启用定时任务复选框' : (spider.loading.value ? '正在执行中...' : '点击启动定时任务')"
              style="position: relative; z-index: 1; cursor: pointer;"
            >
              {{ spider.scheduledTaskStarted.value ? "🔄 重新启动定时任务" : "🎯 启动定时任务" }}
            </button>
            <button @click="testEmail" :disabled="!spider.email.value || spider.loading.value" class="test-button">
              📧 测试邮件发送
            </button>
            <button @click="spider.saveConfig" class="save-button">
              💾 保存配置信息
            </button>
          </div>
        </div>
    </div>

      <div class="log-section">
        <div class="log-header">
          <h2>日志信息</h2>
          <div class="header-buttons">
            <button
              @click="spider.clearLogContent"
              class="clear-button"
              :disabled="!spider.log && !spider.status"
            >
              🗑️ 清空
            </button>
            <button
              @click="spider.copyLogContent"
              class="copy-button"
              :disabled="!spider.log && !spider.status"
            >
              📋 复制
            </button>
          </div>
        </div>
        <div class="log-container">
          <div class="log-content">{{ spider.log || spider.status || "暂无日志信息" }}</div>
          <p v-if="spider.error" class="error">
            <strong>错误：</strong>{{ spider.error }}
          </p>
        </div>
      </div>

      <div class="response-section">
        <div class="response-header">
          <h2>响应内容</h2>
          <div class="header-buttons">
            <button
              @click="spider.clearResponseContent"
              class="clear-button"
              :disabled="!spider.result"
            >
              🗑️ 清空
            </button>
            <button
              @click="spider.copyResponseContent"
              class="copy-button"
              :disabled="!spider.result"
            >
              📋 复制
            </button>
          </div>
        </div>
        <textarea 
          :value="spider.result.value"
          readonly
          class="response-textarea"
          placeholder="响应内容将显示在这里..."
        ></textarea>
      </div>
    </section>
  </div>
</template>

<style scoped>
.app {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page {
  width: 100%;
}

.config-container {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.form-row label {
  min-width: 100px;
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.number-input {
  width: 100px;
  padding: 6px 8px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

textarea,
.url-input,
select {
  width: 100%;
  max-width: 100%;
  padding: 6px 8px;
  font-family: inherit;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-sizing: border-box;
  flex: 1;
}

textarea {
  resize: vertical;
  min-height: 100px;
}

.url-input {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  font-size: 13px;
}

select {
  flex: 1;
  min-width: 0;
}

.actions {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 12px;
}

.header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

button {
  padding: 6px 12px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

button:disabled {
  background: #1f2937 !important;
  color: #ffffff !important;
  border-color: #1f2937 !important;
  opacity: 1;
  cursor: not-allowed;
}

.task-disabled {
  background: white !important;
  color: #374151 !important;
  border-color: #d1d5db !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
}

.scheduled-task-button {
  background: #1f2937 !important;
  color: #ffffff !important;
  border-color: #1f2937 !important;
  cursor: pointer !important;
  pointer-events: auto !important;
  user-select: none !important;
}

.scheduled-task-button:not(:disabled) {
  cursor: pointer !important;
  pointer-events: auto !important;
}

.scheduled-task-button:hover:not(:disabled) {
  background: #374151 !important;
  border-color: #374151 !important;
  cursor: pointer !important;
}

.scheduled-task-button:active:not(:disabled) {
  background: #111827 !important;
  transform: scale(0.98);
}

.scheduled-task-button.task-started:disabled {
  background: #9ca3af !important;
  color: #ffffff !important;
  border-color: #9ca3af !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
}

.scheduled-task-button:disabled {
  cursor: not-allowed !important;
  pointer-events: none !important;
}

.error {
  color: #dc2626;
  font-size: 14px;
  margin: 8px 0;
}

.log-section,
.response-section {
  margin-bottom: 20px;
}

.log-container {
  padding: 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.log-section h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  flex-shrink: 0;
}

.log-content {
  font-size: 12px;
  color: #374151;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.4;
}

.response-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.response-section h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  flex-shrink: 0;
}

.copy-button {
  padding: 6px 14px;
  font-size: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.copy-button:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.copy-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.clear-button {
  padding: 6px 14px;
  font-size: 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.clear-button:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.clear-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.response-textarea {
  width: 100%;
  max-width: 100%;
  height: 200px;
  padding: 8px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.4;
  background: #ffffff;
  border: 2px solid #dc2626;
  border-radius: 6px;
  resize: none;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.response-textarea:focus {
  outline: none;
  border-color: #dc2626;
}

.form-section {
  padding: 10px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.form-section h2 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #374151;
}

input[type="checkbox"] {
  margin-right: 8px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.back-button {
  padding: 6px 12px;
  font-size: 13px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background: #4b5563;
}

.save-button {
  padding: 6px 12px;
  font-size: 13px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;
}

.save-button:hover {
  background: #059669;
}

.test-button {
  padding: 6px 12px;
  font-size: 13px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.test-button:hover:not(:disabled) {
  background: #2563eb;
}

.test-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.toggle-button {
  padding: 4px 12px;
  font-size: 12px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-button:hover {
  background: #4b5563;
}

.smtp-config-section {
  margin-top: 12px;
  padding: 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
}
</style>
