import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "../lib/password";

test("hashPassword produces a verifiable hash", () => {
  const hash = hashPassword("correct-horse-battery");
  assert.ok(hash.includes(":"), "hash must include salt separator");
  assert.ok(verifyPassword("correct-horse-battery", hash), "correct password must verify");
  assert.ok(!verifyPassword("wrong-password", hash), "wrong password must not verify");
});

test("hashPassword produces a different hash each call (random salt)", () => {
  const hash1 = hashPassword("same-password");
  const hash2 = hashPassword("same-password");
  assert.notEqual(hash1, hash2, "each hash should use a unique salt");
});

test("verifyPassword returns false for a malformed stored value", () => {
  assert.ok(!verifyPassword("any", "no-separator-here"));
  assert.ok(!verifyPassword("any", ""));
});
