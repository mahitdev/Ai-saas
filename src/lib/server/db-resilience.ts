export function isMissingTableError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("no such table")
  );
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Unexpected server error";
}
