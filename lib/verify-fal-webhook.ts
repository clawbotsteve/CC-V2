import { createHash } from "crypto";
import { resolve } from "path";

// Lazy load libsodium-wrappers to handle pnpm module resolution issues
let sodiumModule: any = null;
async function loadSodium() {
  if (sodiumModule) return sodiumModule;
  
  // Ensure libsodium is available before loading libsodium-wrappers
  // This helps with pnpm's strict module resolution
  try {
    // Pre-load libsodium to ensure it's available for libsodium-wrappers' internal imports
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("libsodium");
  } catch (e) {
    // libsodium might not be directly required, but it should be available
    console.warn("[WEBHOOK] Could not pre-load libsodium:", e);
  }
  
  try {
    // Use require for better pnpm compatibility - avoids ESM module resolution issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const libsodium = require("libsodium-wrappers");
    sodiumModule = libsodium.default || libsodium;
    
    if (!sodiumModule) {
      throw new Error("libsodium-wrappers module is null");
    }
  } catch (requireError: any) {
    // Fallback: Try ESM import as last resort
    try {
      const module = await import("libsodium-wrappers");
      sodiumModule = module.default || module;
    } catch (esmError: any) {
      console.error("[WEBHOOK] Failed to load libsodium-wrappers:", {
        requireError: requireError.message,
        esmError: esmError.message,
        stack: requireError.stack || esmError.stack
      });
      throw new Error(`Failed to load libsodium-wrappers. Require: ${requireError.message}, ESM: ${esmError.message}`);
    }
  }
  
  if (!sodiumModule) {
    throw new Error("libsodium-wrappers module is null");
  }
  
  return sodiumModule;
}

const JWKS_URL = "https://rest.alpha.fal.ai/.well-known/jwks.json";
let jwksCache: any[] | null = null;
let jwksCacheTime = 0;
const JWKS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function fetchJwks(): Promise<any[]> {
  const now = Date.now();
  if (!jwksCache || now - jwksCacheTime > JWKS_CACHE_DURATION) {

    const res = await fetch(JWKS_URL, {
      cache: "no-store"
    });
    if (!res.ok) throw new Error("Failed to fetch FAL JWKS");

    const json = await res.json();
    jwksCache = json.keys || [];
    jwksCacheTime = now;
  }
  return jwksCache!;
}

export async function verifyFalWebhookSignature(
  requestId: string,
  userId: string,
  timestamp: string,
  signatureHex: string,
  body: Buffer
): Promise<boolean> {
  try {
    // Load sodium module with fallback for pnpm compatibility
    const sodium = await loadSodium();
    await sodium.ready;

    const timestampInt = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    // if (Math.abs(now - timestampInt) > 300) {
    //   console.log("Current time", new Date().toISOString());
    //   console.log("Provided timestamp", new Date(timestampInt * 1000).toLocaleString());


    //   console.error("⚠️ Timestamp too far from now");
    //   return false;
    // }

    const hashHex = createHash("sha256").update(body).digest("hex");
    const message = [requestId, userId, timestamp, hashHex].join("\n");
    const messageBytes = Buffer.from(message, "utf-8");

    const signature = Buffer.from(signatureHex, "hex");
    const keys = await fetchJwks();

    for (const key of keys) {
      const x = key?.x;
      if (!x) continue;

      const publicKey = Buffer.from(x, "base64url");
      const isValid = sodium.crypto_sign_verify_detached(signature, messageBytes, publicKey);
      if (isValid) return true;
    }

    console.error("❌ Signature verification failed with all keys");
    return false;
  } catch (err) {
    console.error("❌ Error verifying signature", err);
    return false;
  }
}
