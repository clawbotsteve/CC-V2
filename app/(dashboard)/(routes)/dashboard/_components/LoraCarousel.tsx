"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Influencer } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, Footprints, Clock, Users, Shield, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useUserContext } from "@/components/layout/user-context";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type LoraWithDetails = Influencer & {
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
  isNsfw?: boolean;
  steps?: number;
  updatedAt?: Date | string;
};

// Helper to format relative time
const formatRelativeTime = (date: Date | string | undefined): string => {
  if (!date) return "Recently";
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
};

// Filter tabs configuration
type FilterType = "all" | "sfw" | "nsfw";

const filterTabs: { id: FilterType; label: string; icon: typeof Users }[] = [
  { id: "all", label: "All Influencers", icon: Users },
  { id: "sfw", label: "SFW", icon: Shield },
  { id: "nsfw", label: "NSFW", icon: AlertTriangle },
];

interface LoraCardProps {
  lora: LoraWithDetails;
  onPurchase: (loraId: string, price: string, title: string) => void;
  gradientClass: string;
  cardWidth: number;
}

function LoraCard({ lora, onPurchase, gradientClass, cardWidth }: LoraCardProps) {
  // Calculate responsive height based on card width (maintaining aspect ratio)
  const imageHeight = Math.round(cardWidth * 1.33); // ~4:3 aspect ratio for portrait
  
  return (
    <div 
      className="flex-shrink-0 group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-transparent dark:border-white/10"
      style={{ width: cardWidth }}
    >
      {/* Portrait Image Container with Gradient Background */}
      <div className={`relative bg-gradient-to-br ${gradientClass} overflow-hidden`}>
        {/* Portrait Image Area */}
        <div 
          className="relative w-full flex items-center justify-center overflow-hidden"
          style={{ height: imageHeight }}
        >
          {lora.avatarImageUrl ? (
            <img
              src={lora.avatarImageUrl}
              alt={lora.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-4xl font-bold text-white/80">
                {lora.name?.charAt(0) || "AI"}
              </span>
            </div>
          )}
          
          {/* Owned Badge */}
          {lora.hasPurchased && (
            <Badge className="absolute top-2 right-2 bg-green-500 text-white text-xs">
              Owned
            </Badge>
          )}
          
          {/* Sold Badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 bg-primary text-black text-xs"
          >
            🔥 {lora.buyersCount >= 1 ? lora.buyersCount : 5} sold
          </Badge>

          {/* Steps Badge */}
          {lora.steps && (
            <Badge 
              variant="secondary" 
              className="absolute bottom-2 left-2 bg-black/50 text-white text-xs backdrop-blur-sm flex items-center gap-1"
            >
              <Footprints className="h-3 w-3" />
              {lora.steps} steps
            </Badge>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="bg-muted/30 border-t border-border p-3">
        <h3 className="text-sm font-bold text-foreground line-clamp-1 mb-1">
          {lora.name}
        </h3>
        
        {/* Price and Updated Row */}
        <div className="flex items-center justify-between mb-2">
          {typeof lora.price === "number" && (
            <span className="text-base font-semibold text-foreground">
              ${lora.price.toFixed(2)}
            </span>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">{formatRelativeTime(lora.updatedAt)}</span>
          </div>
        </div>

        <Button
          className="w-full"
          size="sm"
          onClick={() => onPurchase(lora.id, lora.price?.toFixed(2) || "0", lora.loraName)}
          disabled={lora.hasPurchased || lora.status !== "completed"}
        >
          {lora.hasPurchased ? "Owned" : "Buy Now"}
        </Button>
      </div>
    </div>
  );
}

const gradients = [
  "from-purple-900 to-blue-800",
  "from-pink-700 to-red-500",
  "from-green-700 to-teal-500",
  "from-indigo-800 to-purple-700",
  "from-indigo-600 to-violet-500",
  "from-cyan-700 to-blue-600",
];

export default function LoraCarousel() {
  const [loras, setLoras] = useState<LoraWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { userId } = useUserContext();

  // Filter LoRAs based on active filter
  const filteredLoras = useMemo(() => {
    if (activeFilter === "all") return loras;
    if (activeFilter === "sfw") return loras.filter(lora => !lora.isNsfw);
    if (activeFilter === "nsfw") return loras.filter(lora => lora.isNsfw);
    return loras;
  }, [loras, activeFilter]);

  // Memoize gradient assignments so they don't change on re-render
  const loraGradients = useMemo(() => {
    return filteredLoras.map((_, index) => gradients[index % gradients.length]);
  }, [filteredLoras]);

  // Calculate responsive card width based on container width
  const cardWidth = useMemo(() => {
    if (containerWidth < 400) return 140; // Mobile small
    if (containerWidth < 640) return 160; // Mobile
    if (containerWidth < 768) return 170; // Tablet
    return 180; // Desktop
  }, [containerWidth]);

  // Calculate animation duration based on content width for consistent speed
  const animationDuration = useMemo(() => {
    const gap = 16; // gap-4 = 16px
    const totalWidth = filteredLoras.length * (cardWidth + gap);
    // Base speed: ~50px per second
    const duration = Math.max(20, totalWidth / 50);
    return duration;
  }, [filteredLoras.length, cardWidth]);

  // Track container width with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setContainerWidth(container.offsetWidth);
    };

    // Initial measurement
    updateWidth();

    // Use ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    // Also listen to window resize as fallback
    window.addEventListener("resize", updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const fetchLoras = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lora/marketplace");
      if (!res.ok) throw new Error("Failed to fetch Influencers");
      const data = await res.json();
      setLoras(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoras();
  }, [fetchLoras]);

  const purchaseLora = async (loraId: string, price: string, title: string) => {
    try {
      const response = await fetch("/api/billing/pz/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.primaryEmailAddress?.emailAddress,
          userId: userId,
          price: price,
          title: title,
          note: "",
          nonce: `lora-${loraId}`,
        }),
      });

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error purchasing LoRA:", error);
    }
  };

  // Calculate responsive height for loading/error states
  const stateHeight = useMemo(() => {
    const imageHeight = Math.round(cardWidth * 1.33);
    return imageHeight + 100; // image height + card content
  }, [cardWidth]);

  // Header and filter tabs component (shared across states)
  const HeaderAndFilters = () => (
    <div className="space-y-3">
      {/* Header Row - matches AI Tools section */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Influencers</h3>
        <Link href="/dashboard/lora-market">
          <Button variant="outline" size="sm">
            Shop All Influencers
          </Button>
        </Link>
      </div>

      {/* Filter Tabs - matches AnimatedTabs styling */}
      <div className="flex flex-row items-center justify-start [perspective:1000px] relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className="relative px-4 py-2 rounded-full flex items-center gap-2"
              style={{ transformStyle: "preserve-3d" }}
            >
              {activeFilter === tab.id && (
                <motion.div
                  layoutId="loraFilterPill"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  className="absolute inset-0 bg-primary rounded-full"
                />
              )}
              <Icon className={cn(
                "h-4 w-4 relative z-10",
                activeFilter === tab.id ? "text-primary-foreground" : "text-foreground"
              )} />
              <span className={cn(
                "relative z-10",
                activeFilter === tab.id ? "text-primary-foreground" : "text-foreground"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div ref={containerRef} className="space-y-3 min-w-0 overflow-hidden">
        <HeaderAndFilters />
        <div 
          className="flex items-center justify-center" 
          style={{ height: stateHeight || 340 }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div ref={containerRef} className="space-y-3 min-w-0 overflow-hidden">
        <HeaderAndFilters />
        <div 
          className="flex items-center justify-center text-muted-foreground" 
          style={{ height: stateHeight || 340 }}
        >
          Failed to load Influencers
        </div>
      </div>
    );
  }

  if (loras.length === 0) {
    return (
      <div ref={containerRef} className="space-y-3 min-w-0 overflow-hidden">
        <HeaderAndFilters />
        <div 
          className="flex flex-col items-center justify-center text-center" 
          style={{ height: stateHeight || 340 }}
        >
          <div className="p-3 rounded-full border border-dashed border-white/20 mb-4">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4">No Influencers available in the marketplace</p>
          <Link href="/dashboard/lora-market">
            <Button variant="outline">Browse Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Handle empty filtered results
  if (filteredLoras.length === 0) {
    return (
      <div ref={containerRef} className="space-y-3 min-w-0 overflow-hidden">
        <HeaderAndFilters />
        <div 
          className="flex flex-col items-center justify-center text-center" 
          style={{ height: stateHeight || 340 }}
        >
          <div className="p-3 rounded-full border border-dashed border-white/20 mb-4">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4">
            No {activeFilter === "sfw" ? "SFW" : activeFilter === "nsfw" ? "NSFW" : ""} Influencers available
          </p>
        </div>
      </div>
    );
  }

  // Duplicate items for seamless infinite scroll
  const duplicatedLoras = [...filteredLoras, ...filteredLoras];

  return (
    <div ref={containerRef} className="space-y-3 min-w-0 overflow-hidden">
      <HeaderAndFilters />

      {/* Carousel Container */}
      <div className="relative w-full max-w-full overflow-hidden">
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling container with dynamic animation duration */}
        <div 
          className="flex gap-4 py-2 w-max hover:[animation-play-state:paused]"
          style={{
            animation: `scroll ${animationDuration}s linear infinite`,
          }}
        >
          {duplicatedLoras.map((lora, index) => (
            <LoraCard 
              key={`${lora.id}-${index}`} 
              lora={lora} 
              onPurchase={purchaseLora}
              gradientClass={loraGradients[index % filteredLoras.length]}
              cardWidth={cardWidth}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
