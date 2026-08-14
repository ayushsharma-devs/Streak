import test from "node:test";
import assert from "node:assert/strict";

import { getOrCreatePlayerId } from "../lib/player.js";

test("anonymous identity is persisted before it is returned", () => {
  const values = new Map();
  global.window = { localStorage: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } };

  const playerId = getOrCreatePlayerId();
  assert.match(playerId, /^[0-9a-f-]{36}$/i);
  assert.equal(getOrCreatePlayerId(), playerId);
  assert.equal(values.size, 1);
});

test("identity creation fails rather than returning a disposable UUID", () => {
  global.window = { localStorage: { getItem: () => null, setItem: () => { throw new Error("blocked"); } } };

  assert.throws(() => getOrCreatePlayerId(), /Unable to save/);
});
