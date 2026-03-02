import { ErrorDetail } from "@/types/types";
import type { Prisma } from "@prisma/client";

// JsonValue type for Prisma 7 compatibility
type JsonValue = Prisma.JsonValue;

export interface NormalizedError {
  code: string;
  reason: string;
}

export function normalizeApiErrors(errors: ErrorDetail[]): NormalizedError[] {
  if (!Array.isArray(errors)) return [];

  return errors.map(err => {
    // Format location path nicely
    const locStr = err.loc && err.loc.length ? err.loc.join(" > ") : "unknown_location";

    // Format context info if exists
    let ctxStr = "";
    if (err.ctx) {
      const parts: string[] = [];
      if (err.ctx.given !== undefined) parts.push(`given: ${JSON.stringify(err.ctx.given)}`);
      if (err.ctx.permitted) parts.push(`permitted: ${JSON.stringify(err.ctx.permitted)}`);
      if (parts.length) ctxStr = ` [${parts.join(", ")}]`;
    }

    // Combine into human-readable reason
    const reason = `${locStr}: ${err.msg}${ctxStr}`;

    return {
      code: err.type || "unknown_error",
      reason,
    };
  });
}


export function parseReason(reason: JsonValue): NormalizedError[] {
  if (!reason) return [];

  // If it's already an array (JsonArray)
  if (Array.isArray(reason)) {
    // Cast via unknown first
    return reason as unknown as NormalizedError[];
  }

  // If it was somehow stored as stringified JSON
  if (typeof reason === "string") {
    try {
      return JSON.parse(reason) as NormalizedError[];
    } catch {
      return [];
    }
  }

  return [];
}
