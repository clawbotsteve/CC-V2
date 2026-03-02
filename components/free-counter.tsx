import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { MAX_FREE_COUNTS } from "@/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface IFreeCounterProps {
  isPro: boolean;
  apiLimitCount: number;
  isCollapsed?: boolean;
}

export const FreeCounter = ({
  isPro = false,
  apiLimitCount = 0,
  isCollapsed = false,
}: IFreeCounterProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isPro) {
    return null;
  }

  const progressPercent = Math.min(
    (apiLimitCount / MAX_FREE_COUNTS) * 100,
    100
  );

  // Wrap with Tooltip only if collapsed, else just show card
  const content = (
    <Card
      className="bg-gradient-to-r from-purple-600 via-indigo-700 to-blue-700 rounded-md shadow-md w-full"
      style={{ padding: isCollapsed ? undefined : 4 }}
    >
      <CardContent
        className={cn("flex items-center p-0", isCollapsed ? "p-1 justify-center" : "gap-3")}
      >
        <Sparkles className="w-5 h-5 text-white" />
        {!isCollapsed && (
          <span className="text-white font-semibold text-sm select-none">
            {apiLimitCount} / {MAX_FREE_COUNTS}
          </span>
        )}
        {!isCollapsed && (
          <Progress
            className="h-2 flex-1 rounded-full bg-white/30"
            value={progressPercent}
            style={{
              backgroundImage: "linear-gradient(90deg, #a78bfa, #818cf8)",
            }}
          />
        )}
      </CardContent>
    </Card>
  );

  if (isCollapsed) {
    return (
      <div
        className={cn(
          "transition-all duration-300 w-full",
          isCollapsed ? "px-0" : "px-3"
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            className="px-2 py-1 text-xs"
          >
            {apiLimitCount} / {MAX_FREE_COUNTS}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "transition-all duration-300 w-full",
        isCollapsed ? "px-0" : "px-3"
      )}
    >
      {content}
    </div>
  );
};
