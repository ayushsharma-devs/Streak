export interface SafePuzzle {
  id: number;
  clue: string;
  word_lengths: number[];
}

export interface GameResult {
  correct: boolean;
}

export interface GameStateResponse {
  date: string;
  puzzle: SafePuzzle;
  has_played_today: boolean;
  current_streak: number;
  highest_streak: number;
  result: GameResult | null;
}

export interface GuessRequest {
  guess: string;
}

export interface GuessResponse {
  correct: boolean;
  current_streak: number;
  highest_streak: number;
}

export interface PlayerCreateResponse {
  player_id: string;
  created: boolean;
}
