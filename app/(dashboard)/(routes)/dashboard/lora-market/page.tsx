"use client";

import InfluencerMarketplaceCard from "@/app/(dashboard)/(routes)/tools/influencers/_components/InfluencerMarketplaceCard";
import { Influencer } from "@prisma/client";
import React, { useState, useEffect } from "react";
import { Smile, Loader2 } from "lucide-react";
import { InfluencerMarketplaceCardSkeleton } from "@/app/(dashboard)/(routes)/tools/influencers/_components/InfluencerMarketplaceCardSkeleton";
import PageContainer from "@/components/page-container";

export type InfluencerWithLora = Influencer & {
  id: string;
  name: string;
  description?: string | null;
  introVideoUrl?: string | null;
  avatarImageUrl?: string | null;
  status: string;
  loraName: string;
  price?: number;
  phyziroPriceId?: string;
  buyersCount: number;
  hasPurchased: boolean;
};

export default function MarketplacePage() {
  const [loras, setLoras] = useState<InfluencerWithLora[]>([]);
  const [loadingBuyId, setLoadingBuyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch LoRAs and influencer data from your backend
  useEffect(() => {
    async function fetchLoras() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/lora/marketplace");
        if (!res.ok) throw new Error("Failed to fetch LoRAs");
        const data = await res.json();
        
        setLoras(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLoras();
  }, []);

  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  return (
    <PageContainer>
      <div className="w-full px-4 pb-8">
        <h1 className="text-3xl font-bold mb-8">Buy Pre-trained LoRA here</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <InfluencerMarketplaceCardSkeleton key={i} />
            ))}
          </div>
        ) : loras.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Smile className="h-24 w-24 text-gray-400" />
            </div>
            <h2 className="text-2xl font-medium text-gray-700 mb-2">No LoRAs available</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              There are currently no LoRAs in the marketplace. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 auto-rows-fr">
            {loras.map((lora) => (
              <InfluencerMarketplaceCard
                key={lora.id}
                influencer={lora}
                hasPurchased={lora.hasPurchased}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
