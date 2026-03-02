"use client";

import { ChevronDown, Copy, Check, Info } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface AIPromptWithThoughtProps {
  content: string;
  className?: string;
}

export function AIPromptWithThought({
  content,
  className,
}: AIPromptWithThoughtProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const promptRef = useRef<HTMLDivElement>(null);

  // Extract think content and main prompt
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  const thinkContent = thinkMatch ? thinkMatch[1].trim() : null;
  const mainPrompt = thinkMatch
    ? content.replace(thinkMatch[0], "").trim()
    : content;

  const handleCopy = () => {
    if (!promptRef.current) return;

    const textToCopy = promptRef.current.textContent || "";
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!thinkContent) {
    return (
      <div className={cn("relative group", className)}>
        <div ref={promptRef} className="whitespace-pre-wrap">{mainPrompt}</div>
        <button
          onClick={handleCopy}
          className="absolute top-0 right-0 p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      {/* Thought pill that acts as accordion trigger */}
      <div className="flex items-start gap-2">
        <button
          className={cn(
            "inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full",
            "hover:bg-muted/80 transition-colors mb-2"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Info className="h-3 w-3" />
          <span>Thought</span>
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              isExpanded ? "rotate-180" : ""
            )}
          />
        </button>

        {/* Copy button (positioned absolutely) */}
        <button
          onClick={handleCopy}
          className="absolute top-0 right-0 p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Accordion content */}
      {isExpanded && (
        <div className="pl-2 mb-3 ml-1 border-l-2 border-muted text-sm text-muted-foreground whitespace-pre-wrap">
          {thinkContent}
        </div>
      )}

      {/* Main prompt content */}
      <div ref={promptRef} className="whitespace-pre-wrap group">
        {mainPrompt}
      </div>
    </div>
  );
}
