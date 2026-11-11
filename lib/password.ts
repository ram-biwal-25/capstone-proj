import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedValue: string) {
  const [salt, storedHash] = storedValue.split(":");
  if (!salt || !storedHash) return false;

  const storedBuffer = Buffer.from(storedHash, "hex");
  const suppliedBuffer = scryptSync(password, salt, 64);
  return storedBuffer.length === suppliedBuffer.length && timingSafeEqual(storedBuffer, suppliedBuffer);
}
