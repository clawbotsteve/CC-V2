"use client";

import { AlertCircle, Check, Clock, Trash2, Globe, Lock, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InfluencerWithLora } from "./LoraFormDialog";

interface InfluencerCardProps {
  influencer: InfluencerWithLora;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onLoraSubmit: (values: any) => void;
  onManageLoraClick?: () => void;
}

export default function InfluencerCard({
  influencer,
  isAdmin,
  onDelete,
  onManageLoraClick,
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
      {/* Video / Avatar - Full cover background */}
      <div className="relative w-full h-[280px] bg-muted flex-shrink-0 overflow-hidden rounded-t-lg">
        {influencer.introVideoUrl ? (
          <>
            <video
              ref={videoRef}
              src={influencer.introVideoUrl}
              poster={influencer.avatarImageUrl}
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
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
        ) : influencer.avatarImageUrl ? (
          // Show full image as background when no video
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={influencer.avatarImageUrl}
              alt={influencer.name || "AI Influencer"}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
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
          </div>
        ) : (
          // Fallback gradient with initial
          <div
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${gradientClass}`}
          >
            <span className="text-6xl font-bold text-white/80">
              {influencer.name?.charAt(0) || "AI"}
            </span>
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

            {isAdmin && (
              <Badge
                variant={influencer.lora?.isListed ? "default" : "outline"}
                className={`text-sm ${influencer.lora?.isListed ? "bg-green-100 text-green-800" : "text-gray-600 dark:text-gray-400"
                  }`}
              >
                {influencer.lora?.isListed ? "Published" : "Unpublished"}
              </Badge>
            )}
          </div>


          {/* delete button */}
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete the influencer profile.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setOpen(false);
                    if (onDelete) onDelete(influencer.id);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
              <Badge variant="outline" className="text-sm text-black dark:text-white">
                {influencer.mode}
              </Badge>
            )}
            {/* Privacy Badge */}
            <Badge
              variant="outline"
              className={`flex items-center gap-1 text-xs ${
                influencer.isPublic
                  ? "text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700"
                  : "text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-700"
              }`}
            >
              {influencer.isPublic ? (
                <Globe className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {influencer.isPublic ? "Public" : "Private"}
            </Badge>
            {/* Content Type Badge */}
            <Badge
              variant="outline"
              className={`flex items-center gap-1 text-xs ${
                influencer.contentType === "sfw"
                  ? "text-green-600 dark:text-green-400 border-green-300 dark:border-green-700"
                  : "text-red-600 dark:text-red-400 border-red-300 dark:border-red-700"
              }`}
            >
              {influencer.contentType === "sfw" ? (
                <ShieldCheck className="h-3 w-3" />
              ) : (
                <ShieldAlert className="h-3 w-3" />
              )}
              {influencer.contentType?.toUpperCase()}
            </Badge>
          </div>

          {isAdmin && influencer.status === "completed" && (
            <Button onClick={onManageLoraClick} variant="outline" size="sm">
              Manage LoRA
            </Button>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 mt-auto">
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

        {/* Create Button */}
        {influencer.status === "completed" && influencer.loraUrl && (
          <Link 
            href={`/tools/image-generation?lora=${encodeURIComponent(influencer.loraUrl)}&trigger=${encodeURIComponent(influencer.triggerWord || '')}&name=${encodeURIComponent(influencer.name || '')}`}
            className="w-full"
          >
            <Button 
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create with {influencer.name || "AI"}
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
