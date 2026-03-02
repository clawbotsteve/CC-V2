type StoredReferral = {
  code: string;
  expires: number;
};

export function getValidReferralCode(storageKey = "referralCode__ccai"): string | null {
  const item = localStorage.getItem(storageKey);
  if (!item) return null;

  try {
    const { code, expires }: StoredReferral = JSON.parse(item);
    if (Date.now() < expires) {
      return code;
    } else {
      localStorage.removeItem(storageKey);
      return null;
    }
  } catch {
    // Invalid JSON or missing fields
    localStorage.removeItem(storageKey);
    return null;
  }
}
