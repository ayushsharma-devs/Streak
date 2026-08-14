"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getOrCreatePlayerId } from "@/lib/player";

const USERNAME_KEY = "streak_username";

interface UserContextValue {
  playerId: string | null;
  username: string | null;
  /** Persist username to localStorage + context */
  setUsername: (name: string) => void;
  /** Clear identity (logout) */
  clearIdentity: () => void;
}

const UserContext = createContext<UserContextValue>({
  playerId: null,
  username: null,
  setUsername: () => {},
  clearIdentity: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    const id = getOrCreatePlayerId();
    setPlayerId(id);

    const stored = localStorage.getItem(USERNAME_KEY);
    if (stored) setUsernameState(stored);
  }, []);

  const setUsername = useCallback((name: string) => {
    localStorage.setItem(USERNAME_KEY, name);
    setUsernameState(name);
  }, []);

  const clearIdentity = useCallback(() => {
    localStorage.removeItem(USERNAME_KEY);
    setUsernameState(null);
  }, []);

  return (
    <UserContext.Provider
      value={{ playerId, username, setUsername, clearIdentity }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
