import test from "node:test";
import assert from "node:assert/strict";

import { secondsUntilUtcMidnight } from "../lib/time.js";

test("countdown targets UTC midnight regardless of local timezone", () => {
  assert.equal(secondsUntilUtcMidnight(new Date("2026-08-14T18:29:30.000Z")), 19_830);
  assert.equal(secondsUntilUtcMidnight(new Date("2026-08-14T23:59:59.999Z")), 0);
});
