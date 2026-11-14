import assert from "node:assert/strict";
import test from "node:test";

// We test the isValidDate logic by extracting a copy of it here.
// The actual function lives inside the API route handler module; since it's
// not exported we reproduce the same logic to test its specification.

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) return false;

  const now = new Date();
  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  if (date > todayUtc) return false;

  const tenYearsAgo = new Date(todayUtc);
  tenYearsAgo.setUTCFullYear(tenYearsAgo.getUTCFullYear() - 10);
  if (date < tenYearsAgo) return false;

  return true;
}

test("isValidDate: today is accepted", () => {
  const now = new Date();
  const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  assert.ok(isValidDate(today));
});

test("isValidDate: a date one year ago is accepted", () => {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  const dateStr = d.toISOString().slice(0, 10);
  assert.ok(isValidDate(dateStr));
});

test("isValidDate: tomorrow is rejected", () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  const dateStr = d.toISOString().slice(0, 10);
  assert.ok(!isValidDate(dateStr));
});

test("isValidDate: 11 years ago is rejected", () => {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 11);
  const dateStr = d.toISOString().slice(0, 10);
  assert.ok(!isValidDate(dateStr));
});

test("isValidDate: non-date strings are rejected", () => {
  assert.ok(!isValidDate("not-a-date"));
  assert.ok(!isValidDate("2024-13-01"));
  assert.ok(!isValidDate("2024-00-01"));
  assert.ok(!isValidDate("2024-01-00"));
  assert.ok(!isValidDate(""));
  assert.ok(!isValidDate("20240101"));
});
