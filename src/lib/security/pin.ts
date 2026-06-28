import { createHmac, timingSafeEqual } from "crypto";
import { getLockHashSecret } from "@/lib/env";

export function hashPin(pin: string) {
  return createHmac("sha256", getLockHashSecret()).update(pin).digest("hex");
}

export function verifyPin(pin: string, storedHash: string | null) {
  if (!storedHash) return false;
  const incoming = Buffer.from(hashPin(pin));
  const stored = Buffer.from(storedHash);
  if (incoming.length !== stored.length) return false;
  return timingSafeEqual(incoming, stored);
}

export function isValidPin(pin: string) {
  return /^\d{4}$|^\d{6}$/.test(pin);
}
