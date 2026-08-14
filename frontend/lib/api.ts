import {
  GameStateResponse,
  GuessResponse,
  PlayerCreateResponse,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Common request wrapper injecting X-Player-ID header and handling errors.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  playerId?: string
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  if (playerId) {
    headers.set("X-Player-ID", playerId);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errJson = await response.json();
      if (typeof errJson.detail === "string") {
        errorDetail = errJson.detail;
      } else if (Array.isArray(errJson.errors)) {
        errorDetail = errJson.errors.map((e: { message: string }) => e.message).join(", ");
      }
    } catch {
      errorDetail = `Request failed with status ${response.status}: ${response.statusText}`;
    }
    throw new ApiError(errorDetail, response.status);
  }

  return response.json() as Promise<T>;
}

/**
 * Registers an anonymous player UUID with the backend.
 */
export async function registerPlayer(playerId: string): Promise<PlayerCreateResponse> {
  return request<PlayerCreateResponse>(
    "/api/player",
    {
      method: "POST",
    },
    playerId
  );
}

/**
 * Fetches today's safe game state for the current player.
 */
export async function fetchTodayGame(playerId: string): Promise<GameStateResponse> {
  return request<GameStateResponse>(
    "/api/game/today",
    {
      method: "GET",
    },
    playerId
  );
}

/**
 * Submits the single daily guess for today's riddle.
 */
export async function submitGuess(
  playerId: string,
  guess: string
): Promise<GuessResponse> {
  return request<GuessResponse>(
    "/api/game/guess",
    {
      method: "POST",
      body: JSON.stringify({ guess }),
    },
    playerId
  );
}
