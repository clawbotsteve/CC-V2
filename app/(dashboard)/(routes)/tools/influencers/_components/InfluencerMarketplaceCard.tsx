"use client";

import { Influencer } from "@prisma/client";
import { AlertCircle, Check, Clock, ShoppingCart } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { InfluencerWithLora } from "../../../dashboard/lora-market/page";
import { useUser } from "@clerk/nextjs";
import { useUserContext } from "@/components/layout/user-context";

interface InfluencerMarketplaceCardProps {
  influencer: InfluencerWithLora;
  hasPurchased: boolean;
}

export default function InfluencerMarketplaceCard({
  influencer,
  hasPurchased,
}: InfluencerMarketplaceCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useUser()
  const { userId } = useUserContext()

  const purchaseLora = async (
    loraId: string,
    price: string,
    title: string,
    note: string,
  ) => {
    try {

      const response = await fetch("/api/billing/pz/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user?.primaryEmailAddress?.emailAddress,
          userId: userId,
          price: price,
          title: title,
          note: note,
          nonce: `lora-${loraId}`
        }),
      });

      const data = await response.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error("Payment checkout URL not found.");
      }
    } catch (error) {
      console.error("Error purchasing credits:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
      case "completed":
        return <Check className="w-4 h-4 text-green-600" />;
      case "queued":
      case "processing":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const gradients = [
    "from-purple-900 to-blue-800",
    "from-pink-700 to-red-500",
    "from-green-700 to-teal-500",
    "from-indigo-800 to-purple-700",
    "from-indigo-600 to-violet-500",
    "from-cyan-700 to-blue-600",
    "from-sky-600 to-indigo-600",
  ];

  const gradientClass = useMemo(() => {
    const index = Math.floor(Math.random() * gradients.length);
    return gradients[index];
  }, []);

  return (
    <Card className="group relative flex flex-col h-full bg-muted/30">
      {/* Video / Avatar */}
      <div className="relative aspect-video w-full bg-muted flex-1 min-h-[300px] overflow-hidden rounded-t-lg">
        {influencer.introVideoUrl ? (
          <>
            <video
              ref={videoRef}
              src={influencer.introVideoUrl}
              poster={influencer.avatarImageUrl}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-100"
              onMouseEnter={() => videoRef.current?.play()}
              onMouseLeave={() => {
                if (videoRef.current) {
                  videoRef.current.pause();
                  videoRef.current.currentTime = 0;
                }
              }}
            />
            {influencer.status !== "completed" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <span className="rounded-full bg-background/90 px-4 py-2 text-sm font-medium text-foreground shadow-sm flex items-center gap-1">
                  {getStatusIcon(influencer.status)}
                  {influencer.status.charAt(0).toUpperCase() +
                    influencer.status.slice(1)}
                </span>
              </div>
            )}
          </>
        ) : (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${gradientClass}`}
          >
            <Avatar className="h-40 w-40 border-4 border-white/30 dark:border-white/10 transition-transform duration-500 group-hover:scale-105">
              <AvatarImage
                src={influencer.avatarImageUrl}
                className="object-cover"
              />
              <AvatarFallback>{influencer.name?.charAt(0) || "AI"}</AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* Content */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="line-clamp-1 flex-1 min-w-0">
            {influencer.name}
          </CardTitle>
          <Badge variant="secondary" className="text-sm ml-2">
            LoRA: {influencer.loraName}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Description snippet */}
        <CardDescription className="line-clamp-3 mb-3">
          {influencer.description || "AI-generated influencer persona"}
        </CardDescription>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Price badge */}
          {typeof influencer.price === "number" && (
            <Badge variant="outline" className="text-sm">
              Price: ${influencer.price.toFixed(2)}
            </Badge>
          )}

          {influencer.step && (
            <Badge variant="outline" className="text-sm">
              {influencer.step} Steps
            </Badge>
          )}
        </div>

        {/* Buyers count */}
        <p className="text-sm font-bold text-foreground mb-4">
          🔥{influencer.buyersCount >= 1 ? influencer.buyersCount : 5} user{influencer.buyersCount !== 1 ? "s" : ""} bought this
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 mt-auto">
        {/* Buy Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={() => purchaseLora(
            influencer.id, // lora id
            influencer.price?.toFixed(2)!,
            influencer.loraName,
            ""
          )}
          disabled={hasPurchased || influencer.status !== "completed"}
        >
          {hasPurchased ? "Purchased" : influencer.status !== "completed" ? "Unavailable" : "Buy"}
        </Button>

        {/* Dialog Trigger for detailed description */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="link" className="p-0 underline text-sm">
              More details
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{influencer.name} - LoRA Details</DialogTitle>
              <DialogDescription>
                {influencer.description || "No detailed description available."}
              </DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button className="mt-4">Close</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
