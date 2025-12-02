/**
 * 事件监听 Composable
 */
import { onUnmounted } from "vue";
import { listen } from "@tauri-apps/api/event";

/**
 * 设置事件监听器
 */
export function useEventListeners(callbacks: {
  onTaskResult?: (data: string) => void;
  onTaskError?: (error: string) => void;
  onEmailSent?: (message: string) => void;
  onEmailError?: (error: string) => void;
}) {
  const unlisteners: Array<() => void> = [];

  async function setupListeners() {
    if (callbacks.onTaskResult) {
      const unlisten = await listen<string>("scheduled-task-result", (event) => {
        callbacks.onTaskResult?.(typeof event.payload === "string" 
          ? event.payload 
          : JSON.stringify(event.payload, null, 2));
      });
      unlisteners.push(unlisten);
    }

    if (callbacks.onTaskError) {
      const unlisten = await listen<string>("scheduled-task-error", (event) => {
        callbacks.onTaskError?.(String(event.payload));
      });
      unlisteners.push(unlisten);
    }

    if (callbacks.onEmailSent) {
      const unlisten = await listen<string>("email-sent", (event) => {
        callbacks.onEmailSent?.(String(event.payload));
      });
      unlisteners.push(unlisten);
    }

    if (callbacks.onEmailError) {
      const unlisten = await listen<string>("email-error", (event) => {
        callbacks.onEmailError?.(String(event.payload));
      });
      unlisteners.push(unlisten);
    }
  }

  onUnmounted(() => {
    unlisteners.forEach(unlisten => unlisten());
  });

  return {
    setupListeners
  };
}

