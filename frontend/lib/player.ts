const STORAGE_KEY = "streak_player_id";

/**
 * Checks if the code is executing in a browser environment.
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Retrieves the stored anonymous player UUID from localStorage without side-effects.
 * Safe to call on client; returns null during SSR or if not set.
 */
export function getStoredPlayerId(): string | null {
  if (!isBrowser()) {
    return null;
  }
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Retrieves or generates and persists an anonymous player UUID in localStorage.
 * Guaranteed to be called only in browser context after mount.
 */
export function getOrCreatePlayerId(): string {
  if (!isBrowser()) {
    throw new Error("getOrCreatePlayerId must only be invoked in a client browser context");
  }

  try {
    let playerId = localStorage.getItem(STORAGE_KEY);
    if (!playerId) {
      playerId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, playerId);
    }
    return playerId;
  } catch {
    // Fallback for private mode or storage-blocked environments
    return crypto.randomUUID();
  }
}
