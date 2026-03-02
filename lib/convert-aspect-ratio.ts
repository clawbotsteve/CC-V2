import { AspectRatio } from "@prisma/client";

type OldAspectRatio = AspectRatio

type NewAspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16";

const reverseAspectRatioMap: Record<NewAspectRatio, OldAspectRatio> = {
  "1:1": "square",
  "4:3": "landscape_4_3",
  "3:4": "portrait_4_3",
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
};

export function convertAspectRatio(value: NewAspectRatio): OldAspectRatio {
  return reverseAspectRatioMap[value];
}
