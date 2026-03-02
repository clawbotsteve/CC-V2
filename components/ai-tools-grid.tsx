"use client";

import Link from "next/link";
import {
  Pencil,
  WandSparkles,
  Image,
  ArrowUp,
  Video,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import { ToolIcon } from "@/components/ui/tool-icon";
import { useUserContext } from "@/components/layout/user-context";
import { ToolType } from "@prisma/client";

const tools = [
  {
    name: "AI Image Editor",
    description: "Edit and enhance your images with AI",
    icon: Pencil,
    toolType: ToolType.IMAGE_EDITOR,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
    hoverColor: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
    gradient: "from-blue-500/10 to-blue-600/20",
    href: "/tools/image-editor",
  },
  {
    name: "AI Face Swap",
    description: "Swap faces in photos and videos",
    icon: WandSparkles,
    toolType: ToolType.FACE_ENHANCE,
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800",
    hoverColor: "hover:bg-purple-50 dark:hover:bg-purple-900/20",
    gradient: "from-purple-500/10 to-purple-600/20",
    href: "/tools/face-swap",
  },
  {
    name: "AI Image Generator",
    description: "Generate stunning images from text",
    icon: Image,
    toolType: ToolType.IMAGE_GENERATOR,
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
    iconColor: "text-pink-600 dark:text-pink-400",
    borderColor: "border-pink-200 dark:border-pink-800",
    hoverColor: "hover:bg-pink-50 dark:hover:bg-pink-900/20",
    gradient: "from-pink-500/10 to-pink-600/20",
    href: "/tools/image-generation",
  },
  {
    name: "AI Upscaler",
    description: "Enhance image resolution and quality",
    icon: ArrowUp,
    toolType: ToolType.IMAGE_UPSCALER,
    bgColor: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
    hoverColor: "hover:bg-green-50 dark:hover:bg-green-900/20",
    gradient: "from-green-500/10 to-green-600/20",
    href: "/tools/image-upscale",
  },
  {
    name: "AI Video Generator",
    description: "Create videos from images and text",
    icon: Video,
    toolType: ToolType.VIDEO_GENERATOR,
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800",
    hoverColor: "hover:bg-orange-50 dark:hover:bg-orange-900/20",
    gradient: "from-orange-500/10 to-orange-600/20",
    href: "/tools/video-generation",
  },
  {
    name: "Generate Prompt",
    description: "Create AI prompts for better results",
    icon: Sparkles,
    toolType: ToolType.PROMPT_GENERATOR,
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    hoverColor: "hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
    gradient: "from-indigo-500/10 to-indigo-600/20",
    href: "/tools/prompt-generation",
  },
];

export function AIToolsGrid() {
  const { creditCosts } = useUserContext();

  const getCreditCost = (toolType: ToolType): { cost: number; hasMultipleVariants: boolean } | null => {
    const costs = creditCosts?.[toolType];
    if (typeof costs === "number") {
      return { cost: costs, hasMultipleVariants: false };
    } else if (costs && typeof costs === "object") {
      // Check for default or empty variant first
      if (costs[""] !== undefined || costs["default"] !== undefined) {
        const defaultCost = costs[""] ?? costs["default"];
        return { cost: defaultCost, hasMultipleVariants: false };
      }
      // If no default, find minimum cost from all variants (for tools like VIDEO_GENERATOR)
      const variantCosts = Object.values(costs).filter((v): v is number => typeof v === "number");
      if (variantCosts.length > 0) {
        const minCost = Math.min(...variantCosts);
        return { cost: minCost, hasMultipleVariants: variantCosts.length > 1 };
      }
    }
    return null;
  };

  return (
    <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => {
        const costInfo = getCreditCost(tool.toolType);
        return (
          <div
            key={tool.name}
            className="relative flex flex-col bg-white dark:bg-gray-900 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg w-full p-3 sm:p-4 md:p-6"
          >
            <div className="flex items-center mb-2 sm:mb-4">
              <tool.icon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 dark:text-slate-400 flex-shrink-0" />
              <h5 className="ml-2 sm:ml-3 text-slate-800 dark:text-slate-200 text-sm sm:text-base md:text-xl font-semibold line-clamp-1">
                {tool.name}
              </h5>
            </div>
            <p className="hidden sm:block text-slate-600 dark:text-slate-400 leading-normal font-light mb-4 text-sm">
              {tool.description}
            </p>
            <div className="mt-auto">
              <Link href={tool.href}>
                <Button
                  color="primary"
                  size="sm"
                  className="w-full sm:w-auto"
                  iconLeading={
                    <ToolIcon data-icon className="h-4 w-4" />
                  }
                >
                  <span className="hidden sm:inline">Use Tool</span>
                  <span className="sm:hidden">Use</span>
                </Button>
              </Link>
              {costInfo !== null && (
                <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-left">
                  {costInfo.hasMultipleVariants ? (
                    <>From {costInfo.cost} Credit{costInfo.cost !== 1 ? "s" : ""}</>
                  ) : (
                    <>{costInfo.cost} Credit{costInfo.cost !== 1 ? "s" : ""}</>
                  )}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
