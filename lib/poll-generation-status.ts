import { RefObject } from "react";

export interface PollGenerationStatusParams<TItem extends { id: string; status?: string;[key: string]: any }> {
  generationId: string;
  apiEndpoint: string;
  setItems: React.Dispatch<React.SetStateAction<TItem[]>>;
  pollingRefs: RefObject<Record<string, NodeJS.Timeout>>;
  refetch?: () => void;
  urlField?: keyof TItem; // defaults to "imageUrl"
}

export const pollGenerationStatus = <TItem extends { id: string; status?: string;[key: string]: any }>({
  generationId,
  apiEndpoint,
  setItems,
  pollingRefs,
  refetch,
  urlField = "imageUrl" as keyof TItem,
}: PollGenerationStatusParams<TItem>) => {
  if (!pollingRefs.current) return;
  if (pollingRefs.current[generationId]) return;

  const MAX_POLLING_ATTEMPTS = 120; // 10 minutes (120 * 5 seconds)
  const MAX_POLLING_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
  let attempts = 0;
  const startTime = Date.now();

  const interval = setInterval(async () => {
    attempts++;
    const elapsedTime = Date.now() - startTime;

    // Stop polling if max attempts or time exceeded
    if (attempts >= MAX_POLLING_ATTEMPTS || elapsedTime >= MAX_POLLING_TIME) {
      console.warn(`[POLLING] Stopping polling for ${generationId} after ${attempts} attempts or ${Math.round(elapsedTime / 1000)}s`);
      clearInterval(pollingRefs.current![generationId]);
      delete pollingRefs.current![generationId];
      
      // Mark as potentially stuck
      setItems((prev: TItem[]) =>
        prev.map((item: TItem) =>
          item.id === generationId && (item.status === "queued" || item.status === "processing")
            ? { ...item, status: "failed" as any, reason: { code: "polling_timeout", message: "Generation timed out. Please try again." } }
            : item
        )
      );
      return;
    }

    try {
      const res = await fetch(`${apiEndpoint}/status/${generationId}`, {
        signal: AbortSignal.timeout(10000), // 10 second timeout per request
      });

      if (!res.ok) {
        console.warn(`[POLLING] Status check not ready for ${generationId}: ${res.status} ${res.statusText}`);
        return;
      }

      const data = await res.json();

      if (!data || typeof data.status !== "string") {
        throw new Error("Invalid response format");
      }

      // Update status in UI
      setItems((prev: TItem[]) =>
        prev.map((item: TItem) =>
          item.id === generationId
            ? { ...item, status: data.status, reason: data.reason ?? item.reason, [urlField]: data[urlField] ?? item[urlField] }
            : item
        )
      );

      // Stop polling if completed or failed
      if (["completed", "failed"].includes(data.status)) {
        console.log(`[POLLING] Generation ${generationId} finished with status: ${data.status}`);
        clearInterval(pollingRefs.current![generationId]);
        delete pollingRefs.current![generationId];
        refetch?.();
      }
    } catch (err: any) {
      console.error(`[POLLING] Error for generation ${generationId} (attempt ${attempts}):`, err);
      
      // If we've had too many consecutive errors, stop polling
      if (attempts >= 10 && attempts % 10 === 0) {
        console.warn(`[POLLING] Multiple errors for ${generationId}, but continuing...`);
      }
      
      // Don't stop on individual errors, but log them
    }
  }, 5000);

  pollingRefs.current[generationId] = interval;
};
