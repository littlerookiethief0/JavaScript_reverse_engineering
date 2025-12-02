/**
 * 通知功能 Composable
 */
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

/**
 * 发送通知（带权限检查）
 */
export async function sendNotificationWithPermission(
  title: string,
  body: string
): Promise<void> {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const perm = await requestPermission();
      granted = perm === "granted";
    }
    if (granted) {
      sendNotification({ title, body });
    }
  } catch (e) {
    console.error("发送通知失败:", e);
  }
}

