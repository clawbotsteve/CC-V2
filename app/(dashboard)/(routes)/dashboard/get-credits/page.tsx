"use client";

import { Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import PageContainer from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { useProModal } from "@/hooks/use-pro-modal";
import { useUserContext } from "@/components/layout/user-context";
import { CreditPackCard } from "./_components/CreditPackCard";
import { CREDIT_PACKS } from "@/constants";

export default function GetCreditsPage() {
  const { plan, userId, availableCredit } = useUserContext();
  const proModal = useProModal();
  const isFree = !plan || plan === "plan_free";

  return (
    <PageContainer>
      <div className="w-full p-4 space-y-8">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-foreground">Buy Credits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Purchase additional credits for your account
          </p>
        </div>

        {!isFree && (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                You currently have {availableCredit ?? 0} credit{availableCredit !== 1 ? "s" : ""}
              </p>
              <p className="text-foreground/70 text-sm">Your credits expire every 30 days</p>
            </div>
          </div>
        )}

        {isFree ? (
          <div className="w-full max-w-xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-bold text-foreground">
              Subscribe to Buy Credits
            </h2>
            <p className="text-muted-foreground text-lg">
              You must be on a paid plan to purchase credit packs.
            </p>
            <Button
              onClick={() => proModal.onOpen()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Upgrade Plan
              <Zap className="w-4 h-4 ml-2 fill-white" />
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xxl:grid-cols-5 gap-6">
            {CREDIT_PACKS.map((pack) => (
              <CreditPackCard key={pack.id} pack={pack} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
