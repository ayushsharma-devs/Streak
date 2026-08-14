/** Returns whole seconds remaining until the next UTC midnight. */
export function secondsUntilUtcMidnight(now = new Date()) {
  const nextMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(0, Math.floor((nextMidnight - now.getTime()) / 1000));
}
