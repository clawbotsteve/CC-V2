import { NormalizedError } from "./normalize-fal-error";


/**
 * Generic function to generate normalized errors from flagged outputs
 * @param items Array of generated items with a `flag` property
 * @param code Error code to assign
 * @param reasonFn Function to produce human-readable reason
 */
export function flaggedErrors<T extends Record<string, any>>(
  items: T[],
  code: string,
  reasonFn: (item: T, index: number) => string
): NormalizedError[] {
  return items
    .map((item, index) => {
      if (item.flagged || item.is_nsfw || item.blocked) {
        return { code, reason: reasonFn(item, index) } as NormalizedError;
      }
      return null;
    })
    .filter((e): e is NormalizedError => e !== null);
}
