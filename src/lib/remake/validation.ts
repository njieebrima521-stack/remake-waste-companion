/** Gambian mobile numbers: 7 digits, not starting with 0 or 1. */
export const PHONE_RE = /^[2-9]\d{6}$/;
export const DEMO_CODE = "123456";
export const DEMO_ACCOUNT = { phone: "7012345", password: "remake123" };
/** Typing this number on sign-in demonstrates the "no account" error. */
export const UNKNOWN_PHONE = "7000000";

export function validatePhone(v: string) {
  return PHONE_RE.test(v) ? "" : "Enter a valid 7-digit Gambian number";
}
export function validatePassword(v: string) {
  return v.length >= 6 ? "" : "Use at least 6 characters";
}
