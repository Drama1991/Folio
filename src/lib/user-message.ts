/**
 * 用户可见文案中心。
 *
 * 同 oauth-errors.ts 思路：UI 只渲染白名单文案；err.message / HTTP status /
 * 上游 JSON.error 字符串走 console.error，不带给用户看。
 *
 * 调性：保留"安静书房"的拟人化（"没回话"、"断了一下"），但关键动作短句
 * 一律带"请重试"行动暗示。
 */

export const USER_MESSAGE = {
  MARK_FAILED: "标记失败，请重试",
  DELETE_FAILED: "删除失败，请重试",
  SAVE_FAILED: "保存失败，请重试",
  PUBLISH_FAILED: "发布失败，请重试",
  NETWORK_HICCUP: "网络断了一下，请重试",

  AI_CONFIG_MISSING: "尚未配置 AI。去 设置 → AI 填一份 API key 再来。",
  AI_REQUEST_FAILED: "AI 没回话，请稍后再试。",
  AI_STREAM_BROKEN: "对话中途断了，请稍后再试。",

  UPSTREAM_QUIET: "NeoDB 这会儿没回话",
  LOAD_MORE_FAILED: "没加载到，点一下重试",
} as const;

/** 把任意 unknown 错误归一成给用户看的中文短句。
 *  err 走 console.error（含 stack / 上游响应），UI 只看到 fallback。 */
export function formatUserError(
  err: unknown,
  fallback: string = USER_MESSAGE.NETWORK_HICCUP,
): string {
  console.error("[user-error]", err);
  return fallback;
}
