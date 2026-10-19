import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Compile only our synthetic fixtures using the app's already-installed compiler.
const compiler = fileURLToPath(
  new URL(
    "../../math-practice-app/node_modules/typescript/bin/tsc",
    import.meta.url,
  ),
);
const config = fileURLToPath(new URL("./tsconfig.json", import.meta.url));
const compiled = spawnSync(process.execPath, [compiler, "--project", config], {
  encoding: "utf8",
});
assert.equal(compiled.status, 0, compiled.stderr + compiled.stdout);
const require = createRequire(import.meta.url);
const aBefore = require("./.generated/a-before.js");
const aAfter = require("./.generated/a-after.js");
const bBefore = require("./.generated/b-before.js");
const bAfter = require("./.generated/b-after.js");

assert.deepEqual(aBefore.buildAttempt("q1", 0), {
  questionId: "q1",
  selectedAnswer: 0,
});
assert.equal(aAfter.buildAttempt("q1", 0), null);
for (const value of [null, 1, 9, 100]) {
  assert.deepEqual(
    aAfter.buildAttempt("q1", value),
    aBefore.buildAttempt("q1", value),
  );
}

for (const records of [
  [],
  [
    { id: "old", savedAt: 1 },
    { id: "new", savedAt: 3 },
    { id: "middle", savedAt: 2 },
  ],
  [
    { id: "first", savedAt: 2 },
    { id: "second", savedAt: 2 },
  ],
]) {
  const snapshot = structuredClone(records);
  records.forEach(Object.freeze);
  Object.freeze(records);
  for (const limit of [1, 2, 100]) {
    const before = bBefore.retainRecent(records, limit);
    const after = bAfter.retainRecent(records, limit);
    assert.deepEqual(after, before);
    assert.deepEqual(records, snapshot);
    assert.notEqual(after, records);
    assert.ok(
      after.every(
        (entry, index) =>
          index === 0 || after[index - 1].savedAt >= entry.savedAt,
      ),
    );
    assert.equal(after.length, Math.min(limit, records.length));
  }
}
assert.deepEqual(
  bAfter.retainRecent(
    [
      { id: "old", savedAt: 1 },
      { id: "new", savedAt: 3 },
    ],
    1,
  ),
  [{ id: "new", savedAt: 3 }],
);
console.log("TypeScript strict compilation passed for all four fixtures.");
console.log(
  "Ground truth confirmed: change A drops valid zero answers; change B preserves the contract.",
);
console.log(
  "Retention checks passed for ordering, stable ties, empty inputs, limits, and frozen inputs.",
);
console.log(
  "This local verification made no API requests and executed no external model output.",
);
