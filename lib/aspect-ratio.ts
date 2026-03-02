import { AspectRatio, ImageSize } from "@/types/types";

type CustomImageSize = { width: number; height: number };

export type SupportedAspect = AspectRatio | "square" | undefined;

export function normalizeAspect(value?: string): AspectRatio | undefined {
  if (!value) return undefined;
  const raw = String(value).trim().toLowerCase();

  if (["1:1", "square", "square_hd", "ratio1_1"].includes(raw)) return AspectRatio.Ratio1_1;
  if (["9:16", "portrait_16_9", "ratio9_16"].includes(raw)) return AspectRatio.Ratio9_16;
  if (["16:9", "landscape_16_9", "ratio16_9"].includes(raw)) return AspectRatio.Ratio16_9;
  if (["3:4", "portrait_4_3", "ratio3_4"].includes(raw)) return AspectRatio.Ratio3_4;
  if (["4:3", "landscape_4_3", "ratio4_3"].includes(raw)) return AspectRatio.Ratio4_3;

  const digits = raw.replace(/[^0-9]/g, "");
  if (digits === "11") return AspectRatio.Ratio1_1;
  if (digits === "916") return AspectRatio.Ratio9_16;
  if (digits === "169") return AspectRatio.Ratio16_9;
  if (digits === "34") return AspectRatio.Ratio3_4;
  if (digits === "43") return AspectRatio.Ratio4_3;

  return undefined;
}

export function aspectToImageSize(aspect?: SupportedAspect): ImageSize | CustomImageSize | undefined {
  const normalized = normalizeAspect(aspect as string);
  switch (normalized) {
    case AspectRatio.Ratio1_1:
      return ImageSize.Square;
    case AspectRatio.Ratio16_9:
      return ImageSize.Landscape16_9;
    case AspectRatio.Ratio9_16:
      return ImageSize.Portrait16_9;
    case AspectRatio.Ratio4_3:
      return ImageSize.Landscape4_3;
    case AspectRatio.Ratio3_4:
      return ImageSize.Portrait4_3;
    default:
      return undefined;
  }
}

export function imageSizeToAspect(size?: ImageSize | CustomImageSize): AspectRatio | undefined {
  switch (size) {
    case ImageSize.Square:
    case ImageSize.SquareHD:
      return AspectRatio.Ratio1_1;
    case ImageSize.Landscape16_9:
      return AspectRatio.Ratio16_9;
    case ImageSize.Portrait16_9:
      return AspectRatio.Ratio9_16;
    case ImageSize.Landscape4_3:
      return AspectRatio.Ratio4_3;
    case ImageSize.Portrait4_3:
      return AspectRatio.Ratio3_4;
    default:
      return undefined;
  }
}

export function normalizeAspectFromInputs(
  aspect?: AspectRatio,
  imageSize?: ImageSize | CustomImageSize
): AspectRatio | undefined {
  return aspect || imageSizeToAspect(imageSize);
}
