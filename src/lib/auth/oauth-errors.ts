/**
 * OAuth 错误码 → 用户文案映射。
 *
 * 目的（P0-4）：route 端永远只往 ?error=<code> 里塞固定 enum；
 * 真错误（含 stack / 上游响应体）走 console.error，不带给前端 URL。
 * LoginCard 用 describeOAuthError 把 code 翻成中文展示。
 */
export type OAuthErrorCode =
  | "missing_instance"
  | "register_failed"
  | "state_mismatch"
  | "missing_code_or_state"
  | "app_not_found"
  | "token_exchange_failed"
  | "account_fetch_failed"
  | "upstream_denied"
  | "unknown";

export const OAUTH_ERROR_MESSAGE: Record<OAuthErrorCode, string> = {
  missing_instance: "请填写 NeoDB 实例域名后重试。",
  register_failed: "无法在该实例上注册 folion 应用，可能实例不支持 Mastodon API。",
  state_mismatch: "登录会话已过期或已被使用过，请重试。",
  missing_code_or_state: "授权回调缺少必要参数，请重新登录。",
  app_not_found: "未找到该实例的注册记录，请重新发起登录。",
  token_exchange_failed: "向 NeoDB 兑换登录凭证失败，请稍后再试。",
  account_fetch_failed: "登录成功但获取账号资料失败，请重试。",
  upstream_denied: "NeoDB 拒绝了本次授权请求。",
  unknown: "登录过程中遇到未知错误，请重试。",
};

const ALL_CODES = new Set(Object.keys(OAUTH_ERROR_MESSAGE));

export function describeOAuthError(code: string | undefined): string | null {
  if (!code) return null;
  if (ALL_CODES.has(code)) return OAUTH_ERROR_MESSAGE[code as OAuthErrorCode];
  return OAUTH_ERROR_MESSAGE.unknown;
}
