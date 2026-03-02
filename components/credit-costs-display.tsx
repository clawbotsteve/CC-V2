"use client";

import React from "react";
import { ToolType } from "@prisma/client";

interface VariantCosts {
  [variant: string]: number;
}

interface CreditCostsMap {
  [tool: string]: VariantCosts | number | null | undefined;
}

interface CreditCostDisplayProps {
  toolType: ToolType;
  creditCosts?: CreditCostsMap;
}

export function CreditCostDisplay({ toolType, creditCosts }: CreditCostDisplayProps) {
  if (!creditCosts) return null;

  const costs = creditCosts[toolType as string];
  if (!costs) return null;

  let displayText: string;

  if (typeof costs === "number") {
    displayText = `${costs} Credit`;
  } else if (typeof costs === "object") {
    const variants = Object.keys(costs).filter(v => v !== "default");
    const minCost = Math.min(...Object.values(costs));
    displayText = variants.length > 0 ? `Starts from ${minCost} Credit` : `${minCost} Credit`;
  } else {
    return null;
  }

  return (
    <span className="font-medium text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
      {displayText}
    </span>
  )
}
