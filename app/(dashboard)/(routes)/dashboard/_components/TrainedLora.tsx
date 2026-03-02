
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useUserContext } from "@/components/layout/user-context";
import { Influencer } from "@prisma/client";
import InfluencerDashboardCard from "./InfluencerDashboardCard";
import { EmptyState } from "@/components/empty-state";
import InfluencerLoading from "../../tools/influencers/_components/InfluencerLoading";
import { Users } from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import Link from "next/link";


export default function TrainedLora() {
  const { userId, isLoading: isContextLoading, refetch } = useUserContext();

  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInfluencers = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch("/api/influencers");
      if (!res.ok) throw new Error("Failed to fetch influencers");
      const influencers = await res.json();

      setInfluencers(influencers || []);
    } catch (err: any) {
    } finally {
      setLoading(false);
    }
  }, [userId]);


  useEffect(() => {
    fetchInfluencers();
  }, [fetchInfluencers]);

  return (
    <div className="p-4 sm:p-6 w-full">
      {/* Content Area */}
      {loading ? (
        <InfluencerLoading />
      ) : influencers.length === 0 ? (
        <EmptyStateCard
          icon={<Users className="h-5 w-5 text-black dark:text-white" />}
          title="No Trained LoRA found"
          description="Create your first AI influencer to get started with your virtual personality"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
          {influencers.map((inf) => (
            <InfluencerDashboardCard
              key={inf.id}
              influencer={inf}
            />
          ))}

        </div>
      )}
    </div>
  );
}

const EmptyStateCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div
      className="border border-black/[0.2] group/canvas-card flex items-center justify-center dark:border-white/[0.2] w-full mx-auto p-4 relative h-[30rem] rounded-lg overflow-hidden bg-white dark:bg-black"
    >
      <Icon className="absolute h-5 w-5 -top-3 -left-3 dark:text-white text-black z-30" />
      <Icon className="absolute h-5 w-5 -bottom-3 -left-3 dark:text-white text-black z-30" />
      <Icon className="absolute h-5 w-5 -top-3 -right-3 dark:text-white text-black z-30" />
      <Icon className="absolute h-5 w-5 -bottom-3 -right-3 dark:text-white text-black z-30" />

      <div className="relative z-20">
        <div className="text-center w-full mx-auto flex items-center justify-center">
          <div className="h-16 w-16 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center mb-4 ring-4 ring-background shadow-xl">
            {icon}
          </div>
        </div>
        <h3 className="text-xl font-bold relative z-10 text-black dark:text-white mt-4 text-center">
          {title}
        </h3>
        <p className="text-muted-foreground text-center text-sm max-w-sm mb-6">
          {description}
        </p>
        {title === "No Trained LoRA found" && (
          <div className="flex justify-center mt-4">
            <Link href="/dashboard/lora-market">
              <Button color="secondary" size="md">
                Browse LoRA Marketplace
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};
