"use client";

import { AlertCircle, Check, Clock, } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InfluencerWithLora } from "../../tools/influencers/_components/LoraFormDialog";

interface InfluencerCardProps {
  influencer: InfluencerWithLora;
}

export default function InfluencerDashboardCard({
  influencer,
}: InfluencerCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
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
      <div className="relative aspect-video w-full bg-muted flex-1 overflow-hidden rounded-t-lg">
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
                <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm flex items-center gap-1">
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
            <Avatar className="h-40 w-40 border-4 border-white/30 transition-transform duration-500 group-hover:scale-105">
              <AvatarImage
                src={influencer.avatarImageUrl}
                className="object-cover"
              />
              <AvatarFallback>
                {influencer.name?.charAt(0) || "AI"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* Content */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CardTitle className="line-clamp-1">
              {influencer.name}
            </CardTitle>

            {influencer.step && (
              <Badge
                variant={"outline"}
                className="ml-2 text-sm"
              >
                {influencer.step} Steps
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Description */}
        <CardDescription className="line-clamp-2 mb-3">
          {influencer.description || "AI-generated influencer persona"}
        </CardDescription>

        {/* Badges */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                influencer.status === "completed"
                  ? "secondary"
                  : influencer.status === "failed"
                    ? "destructive"
                    : "outline"
              }
              className="flex items-center gap-1.5 text-sm"
            >
              {getStatusIcon(influencer.status)}
              {influencer.status.charAt(0).toUpperCase() +
                influencer.status.slice(1)}
            </Badge>
            {influencer.mode && (
              <Badge variant="outline" className="text-sm text-black">
                {influencer.mode}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto">
        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-muted-foreground w-full">
          <time dateTime={new Date(influencer.createdAt).toISOString()}>
            Created{" "}
            {new Date(influencer.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </div>
      </CardFooter>
    </Card>
  );
}
