<template>
  <div class="automation-demo">
    <div class="demo-header">
      <h1>🐍 Tauri + Python 自动化 Demo</h1>
      <p class="subtitle">演示如何在 Tauri 应用中调用 Python 脚本</p>
    </div>

    <!-- Python 环境检测 -->
    <div class="section">
      <h2>🔍 Python 环境检测</h2>
      <div class="env-status">
        <div v-if="envInfo.available" class="status-success">
          <span class="status-icon">✅</span>
          <div class="status-details">
            <p><strong>Python 路径：</strong>{{ envInfo.python_path }}</p>
            <p><strong>版本：</strong>{{ envInfo.version }}</p>
          </div>
        </div>
        <div v-else class="status-error">
          <span class="status-icon">❌</span>
          <div class="status-details">
            <p><strong>错误：</strong>{{ envInfo.error }}</p>
            <p class="hint">请确保已安装 Python 3 并添加到 PATH</p>
          </div>
        </div>
      </div>
      <button @click="checkEnvironment" :disabled="loading" class="check-button">
        🔄 重新检测
      </button>
    </div>

    <!-- 任务配置 -->
    <div class="section">
      <h2>⚙️ 任务配置</h2>
      <div class="form-group">
        <label>URL：</label>
        <input
          v-model="config.url"
          type="text"
          placeholder="https://example.com"
          class="input-field"
        />
      </div>
      <div class="form-group">
        <label>操作类型：</label>
        <select v-model="config.action" class="input-field">
          <option value="info">信息查询</option>
          <option value="simulate">模拟操作</option>
          <option value="calculate">计算任务</option>
        </select>
      </div>
      <div v-if="config.action === 'calculate'" class="form-group">
        <label>数字列表（逗号分隔）：</label>
        <input
          v-model="numbersInput"
          type="text"
          placeholder="1,2,3,4,5"
          class="input-field"
        />
      </div>
      <div class="form-group">
        <label>输出文件：</label>
        <input
          v-model="config.output"
          type="text"
          placeholder="output.txt"
          class="input-field"
        />
      </div>
    </div>

    <!-- 执行按钮 -->
    <div class="section">
      <button
        @click="runAutomation"
        :disabled="loading || !envInfo.available"
        class="run-button"
      >
        {{ loading ? "⏳ 执行中..." : "🚀 执行自动化任务" }}
      </button>
    </div>

    <!-- 结果显示 -->
    <div class="section">
      <h2>📊 执行结果</h2>
      <div v-if="result" class="result-container">
        <div class="result-header">
          <span class="result-status" :class="result.status">
            {{ result.status === "success" ? "✅ 成功" : "❌ 失败" }}
          </span>
          <span class="result-time">{{ formatTime(result.timestamp) }}</span>
        </div>
        <div class="result-content">
          <pre>{{ JSON.stringify(result, null, 2) }}</pre>
        </div>
      </div>
      <div v-else class="result-placeholder">
        暂无执行结果，请点击"执行自动化任务"按钮
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="section error-section">
      <h2>❌ 错误信息</h2>
      <div class="error-content">
        <pre>{{ error }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";

// 响应式数据
const loading = ref(false);
const envInfo = ref<any>({
  available: false,
  python_path: "",
  version: "",
  error: "",
});
const config = ref({
  url: "https://example.com",
  action: "info",
  output: "output.txt",
});
const numbersInput = ref("1,2,3,4,5");
const result = ref<any>(null);
const error = ref("");

// 检测 Python 环境
async function checkEnvironment() {
  loading.value = true;
  error.value = "";
  try {
    const info = await invoke("check_python_env");
    envInfo.value = info as any;
  } catch (e: any) {
    error.value = e.toString();
    envInfo.value = {
      available: false,
      error: e.toString(),
    };
  } finally {
    loading.value = false;
  }
}

// 执行自动化任务
async function runAutomation() {
  loading.value = true;
  error.value = "";
  result.value = null;

  try {
    // 准备参数
    let params: any = {
      url: config.value.url,
      action: config.value.action,
      output: config.value.output,
    };

    // 如果是计算任务，添加数字列表
    if (config.value.action === "calculate") {
      params.numbers = numbersInput.value
        .split(",")
        .map((n) => parseFloat(n.trim()))
        .filter((n) => !isNaN(n));
    }

    // 调用 Tauri 命令
    const response = await invoke("run_automation", {
      url: params.url,
      action: params.action,
      output: params.output,
    });

    // 解析 JSON 响应
    const jsonResult = typeof response === "string" ? JSON.parse(response) : response;
    result.value = jsonResult;

    // 如果返回错误状态，显示错误
    if (jsonResult.status === "error") {
      error.value = jsonResult.message || "执行失败";
    }
  } catch (e: any) {
    error.value = e.toString();
    result.value = {
      status: "error",
      message: e.toString(),
      timestamp: new Date().toISOString(),
    };
  } finally {
    loading.value = false;
  }
}

// 格式化时间
function formatTime(isoString?: string) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleString("zh-CN");
  } catch {
    return isoString;
  }
}

// 组件挂载时检测环境
onMounted(() => {
  checkEnvironment();
});
</script>

<style scoped>
.automation-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.demo-header {
  text-align: center;
  margin-bottom: 32px;
}

.demo-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #1f2937;
}

.subtitle {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.section h2 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #374151;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.input-field {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-sizing: border-box;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.env-status {
  margin-bottom: 16px;
}

.status-success,
.status-error {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
}

.status-success {
  background: #f0fdf4;
  border: 1px solid #86efac;
}

.status-error {
  background: #fef2f2;
  border: 1px solid #fca5a5;
}

.status-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.status-details {
  flex: 1;
}

.status-details p {
  margin: 4px 0;
  font-size: 14px;
  color: #374151;
}

.hint {
  color: #6b7280;
  font-size: 13px;
}

.check-button,
.run-button {
  width: 100%;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.check-button {
  background: #6b7280;
}

.check-button:hover:not(:disabled),
.run-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.check-button:disabled,
.run-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.result-container {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.result-status {
  font-weight: 600;
  font-size: 14px;
}

.result-status.success {
  color: #059669;
}

.result-status.error {
  color: #dc2626;
}

.result-time {
  font-size: 12px;
  color: #6b7280;
}

.result-content {
  padding: 16px;
  background: #ffffff;
}

.result-content pre {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.result-placeholder {
  padding: 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

.error-section {
  border-color: #fca5a5;
  background: #fef2f2;
}

.error-content {
  padding: 12px;
  background: #ffffff;
  border: 1px solid #fca5a5;
  border-radius: 6px;
}

.error-content pre {
  margin: 0;
  font-size: 13px;
  color: #dc2626;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>

