"use client";

import { Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useUserContext } from "@/components/layout/user-context";
// import { purchaseCredits } from "@/lib/actions";

interface Props {
  pack: {
    id: string;
    price: number;
    credits: number;
    popular?: boolean;
    title: string;
    note: string;
  };
}

export const CreditPackCard = ({ pack }: Props) => {

  const { user } = useUser()
  const { userId } = useUserContext()

  const purchaseCredits = async (packId: string) => {
    try {
      const response = await fetch("/api/billing/pz/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user?.primaryEmailAddress?.emailAddress,
          userId: userId,
          price: pack.price,
          title: pack.title,
          note: pack.note,
          nonce: `charge-${packId}`
        }),
      });

      const data = await response.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error("Phyziro checkout URL not found.");
      }
    } catch (error) {
      console.error("Error purchasing credits:", error);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl p-6 transition-all duration-300 border bg-muted/50",
        pack.popular &&
        "bg-gradient-to-b from-primary/10 via-background to-background border-primary shadow-xl"
      )}
    >
      {pack.popular && (
        <div className="absolute top-3 right-3 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1 rounded-full">
          Most Popular
        </div>
      )}

      <div className="space-y-2">
        <div className="text-4xl font-bold text-foreground">${pack.price}</div>
        <div className="flex items-center gap-2 text-purple-500 text-lg font-medium">
          <Sparkles className="w-5 h-5" />
          {pack.credits} Credits
        </div>
      </div>

      <Button
        onClick={() => purchaseCredits(pack.id)}
        className={cn(
          "mt-6 w-full text-center py-2 rounded-lg font-semibold transition",
          pack.popular
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-background text-foreground border hover:bg-accent"
        )}
      >
        Get Credits
      </Button>

      <div className="mt-4 border-t pt-4 text-sm text-muted-foreground">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          Features
        </h4>
        <ul className="space-y-1 ml-6 list-disc">
          <li>Instant top-up</li>
          <li>Valid for all tools</li>
          <li>No expiration</li>
        </ul>
      </div>
    </div>
  );
};
