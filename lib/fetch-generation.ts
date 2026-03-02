import { RefObject } from "react";
import { pollGenerationStatus } from "./poll-generation-status";

export interface FetchGenerationsParams<TItem extends { id: string; status?: string;[key: string]: any }> {
  apiEndpoint: string;
  setItems: React.Dispatch<React.SetStateAction<TItem[]>>;
  pollingRefs: RefObject<Record<string, NodeJS.Timeout>>;
  refetch?: () => void;
  urlField?: keyof TItem;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
}


export const fetchGenerations = async <TItem extends { id: string; status?: string;[key: string]: any }>({
  apiEndpoint,
  setItems,
  pollingRefs,
  refetch,
  urlField = "imageUrl" as keyof TItem,
  setIsLoading,
}: FetchGenerationsParams<TItem>) => {
  try {
    setIsLoading?.(true); // start loading

    const res = await fetch(apiEndpoint);
    const data = await res.json();

    if (!res.ok) {
      console.warn("Failed to fetch generations:", data?.error || `${res.status} ${res.statusText}`);
      return;
    }

    // In degraded mode (DB offline), do not wipe optimistic in-memory items.
    if (data?.degraded) {
      console.warn("Fetch generations in degraded mode; keeping in-memory items.");
      return;
    }

    const items: TItem[] =
      data.items ??
      data.images ??
      data.videos ??
      data.faceEnhances ??
      data.faceSwaps ??
      data.upscales ??
      data.analysis ??
      [];

    setItems(items);

    items.forEach((item) => {
      if (["queued", "processing"].includes(item.status!)) {
        pollGenerationStatus({
          generationId: item.id,
          apiEndpoint,
          setItems,
          pollingRefs,
          refetch,
          urlField,
        });
      }
    });
  } catch (err) {
    console.error("Failed to fetch generations", err);
  } finally {
    setIsLoading?.(false);
  }
};
