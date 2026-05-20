export function sanitizeText(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

export function sanitizeOptionalText(value: string | undefined) {
  return value === undefined ? undefined : sanitizeText(value);
}
