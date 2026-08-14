const STORAGE_KEY = "streak_player_id";

export function getOrCreatePlayerId() {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("A persistent browser storage area is required to play.");
  }

  try {
    const storedPlayerId = window.localStorage.getItem(STORAGE_KEY);
    if (storedPlayerId) return storedPlayerId;

    const playerId = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, playerId);
    return playerId;
  } catch {
    throw new Error("Unable to save your anonymous player identity. Enable local storage and try again.");
  }
}
