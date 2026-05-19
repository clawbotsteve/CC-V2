/**
 * WaveSpeed AI client — used ONLY for the talking-creator video path.
 *
 * Why a third provider: Seedance 2.0 image-to-video on WaveSpeed
 * accepts a person-bearing start frame (our GPT-Image-2 fused still
 * of the creator + real product) and animates it talking, with
 * audio, in native 9:16. Replicate's Seedance-2 deployment hard-
 * blocks person images (E005); FAL's allowed it but the account is
 * locked. WaveSpeed's deployment allows it — validated end-to-end
 * 2026-05-19 (exact creator + exact product + talking + audio).
 *
 * Scoped to the talking-ad path only — everything else stays
 * Replicate. Falls back gracefully when WAVESPEED_API_KEY is unset.
 *
 * API: REST, Bearer auth.
 *   submit  POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.0/image-to-video
 *   result  GET  https://api.wavespeed.ai/api/v3/predictions/{id}/result
 *   statuses: created | processing | completed | failed
 *   output:  data.outputs[0]  (mp4 URL)
 */

const BASE = "https://api.wavespeed.ai/api/v3";

export function isWaveSpeedConfigured(): boolean {
  return !!process.env.WAVESPEED_API_KEY;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.WAVESPEED_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export interface WaveSpeedI2VInput {
  /** Start frame — the fused creator+product still (https URL). */
  image: string;
  /** Scene/action + spoken line (double-quote the dialogue for audio). */
  prompt: string;
  /** 4–15s. Default 5. */
  duration?: number;
  /** "480p" | "720p" | "1080p". Default 720p. */
  resolution?: string;
  /** Native vertical for ads. */
  aspectRatio?: string;
  /** Native synced audio/dialogue. Default true. */
  generateAudio?: boolean;
  /** Optional extra consistency refs (up to 4). */
  referenceImages?: string[];
}

/**
 * Submit a Seedance-2.0 image-to-video job. Returns the WaveSpeed
 * task id — we key the GeneratedVideo row on it and reconcile by
 * polling getWaveSpeedResult (WaveSpeed has no webhook into us).
 */
export async function submitWaveSpeedI2V(
  input: WaveSpeedI2VInput,
): Promise<{ taskId: string }> {
  if (!isWaveSpeedConfigured()) {
    throw new Error("WAVESPEED_API_KEY is not configured");
  }
  const body: Record<string, unknown> = {
    image: input.image,
    prompt: input.prompt,
    duration: input.duration ?? 5,
    resolution: input.resolution ?? "720p",
    aspect_ratio: input.aspectRatio ?? "9:16",
    generate_audio: input.generateAudio !== false,
  };
  if (input.referenceImages?.length) {
    body.reference_images = input.referenceImages.slice(0, 4);
  }

  const res = await fetch(`${BASE}/bytedance/seedance-2.0/image-to-video`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WaveSpeed submit failed ${res.status}: ${text.slice(0, 300)}`);
  }
  const json: any = await res.json();
  const taskId = json?.data?.id;
  if (!taskId) {
    throw new Error(
      `WaveSpeed submit: no task id in response: ${JSON.stringify(json).slice(0, 300)}`,
    );
  }
  return { taskId };
}

export interface WaveSpeedResult {
  status: "created" | "processing" | "completed" | "failed" | "unknown";
  videoUrl?: string;
  error?: string;
}

/**
 * Poll a WaveSpeed task. Best-effort: network/parse errors return
 * "unknown" so callers keep polling rather than hard-failing.
 */
export async function getWaveSpeedResult(
  taskId: string,
): Promise<WaveSpeedResult> {
  if (!isWaveSpeedConfigured()) return { status: "unknown" };
  try {
    const res = await fetch(`${BASE}/predictions/${taskId}/result`, {
      headers: { Authorization: `Bearer ${process.env.WAVESPEED_API_KEY}` },
    });
    if (!res.ok) return { status: "unknown" };
    const json: any = await res.json();
    const d = json?.data ?? json;
    const status = String(d?.status || "").toLowerCase();
    if (status === "completed") {
      const url = Array.isArray(d?.outputs) ? d.outputs[0] : undefined;
      return url
        ? { status: "completed", videoUrl: url }
        : { status: "failed", error: "No output in completed task" };
    }
    if (status === "failed") {
      return { status: "failed", error: String(d?.error || "WaveSpeed job failed") };
    }
    if (status === "created" || status === "processing") {
      return { status: status as WaveSpeedResult["status"] };
    }
    return { status: "unknown" };
  } catch {
    return { status: "unknown" };
  }
}
