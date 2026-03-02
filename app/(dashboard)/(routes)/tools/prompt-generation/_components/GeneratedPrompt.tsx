"use client";

import React, { useState } from "react";
import { ImageIcon, AlertCircle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BlurImage } from "@/components/blur-image";
import { AIPromptWithThought } from "./AIPromptWithThought";
import { ImageAnalysis } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { toast } from "sonner";

type Props = {
  isLoading: boolean;
  generatedPrompt: ImageAnalysis[];
  onDelete?: () => void;
  pollingRefs?: React.RefObject<Record<string, NodeJS.Timeout>>;
};

export function GeneratedPromptList({ 
  isLoading, 
  generatedPrompt, 
  onDelete,
  pollingRefs 
}: Props) {
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());

  const togglePrompt = (id: string) => {
    setExpandedPrompts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDelete = async (promptId: string) => {
    try {
      console.log("Delete prompt:", promptId);
      const response = await fetch(`/api/tools/prompt/${promptId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete prompt");
      }

      // Clear polling interval if exists
      if (pollingRefs?.current?.[promptId]) {
        clearInterval(pollingRefs.current[promptId]);
        delete pollingRefs.current[promptId];
      }

      // Trigger refresh
      onDelete?.();

      toast.success("Prompt deleted successfully");
    } catch (error: any) {
      console.error("Prompt delete failed:", error);
      toast.error(error.message || "Failed to delete prompt");
    }
  };

  return (
    <div className="px-0 sm:px-4 pt-9">
      {isLoading ? (
        [...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-background rounded-xl border border-border p-5 shadow-sm"
          >
            <div className="mb-4 space-y-3">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="w-32 h-32 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[80%]" />
              </div>
            </div>
          </div>
        ))
      ) : generatedPrompt.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-0 sm:px-4 pt-9">
          <div className="w-[200px] h-[200px] bg-muted rounded-full flex items-center justify-center mb-6">
            <ImageIcon className="h-16 w-16 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No generatedPrompt yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            Upload an image and click "Analyze" to generate your first
            generatedPrompt.
          </p>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold mb-5">
              {generatedPrompt.length} Generated Prompt
            </h2>
          </div>

          {generatedPrompt.map((item) => {
            const isExpanded = expandedPrompts.has(item.id);

            return (
              <div
                key={item.id}
                className="bg-background rounded-xl my-2 border border-border p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-pink-500 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted rounded-lg px-3 py-1">
                        <p
                          className={cn(
                            "text-sm font-medium text-foreground",
                            isExpanded
                              ? "break-words whitespace-pre-line overflow-auto"
                              : "line-clamp-1"
                          )}
                        >
                          {item.prompt}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePrompt(item.id)}
                        className="mt-1 h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Hide prompt
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            View full prompt
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <DeleteButton 
                        onConfirmDelete={() => handleDelete(item.id)} 
                        className="rounded-full bg-transparent text-destructive hover:text-destructive hover:bg-destructive/20 transition"
                        title="Delete Prompt"
                        description="Are you sure you want to delete this prompt? This action cannot be undone."
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                    {item.status !== "completed" && (
                      <span
                        className={cn(
                          "capitalize",
                          item.status === "processing" && "text-blue-500",
                          item.status === "queued" && "text-yellow-500"
                        )}
                      >
                        • {item.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-[1fr_5fr]">
                  <div className="relative group rounded-xl overflow-hidden">
                    <div className="aspect-square relative overflow-hidden rounded-xl">
                      <BlurImage
                        src={item.originalImage}
                        alt="Source"
                        aspectRatio={4 / 3}
                        className="object-contain"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center h-full">
                    {item.status === "queued" ? (
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-[90%]" />
                        <Skeleton className="h-4 w-[80%]" />
                      </div>
                    ) : item.status === "failed" ? (
                      <div className="flex flex-col items-center gap-2 text-red-500">
                        <AlertCircle className="h-6 w-6" />
                        <span className="text-sm">Processing failed</span>
                      </div>
                    ) : item.status === "completed" ? (
                      <AIPromptWithThought
                        content={item.description}
                        className="p-4 pt-0 bg-background rounded-lg"
                      />
                    ) : (
                      <div className="w-full">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-[90%]" />
                          <Skeleton className="h-4 w-[80%]" />
                          <div className="flex justify-center pt-2">
                            <span className="text-sm text-muted-foreground">
                              Thinking...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
