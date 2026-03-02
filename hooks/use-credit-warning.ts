// stores/use-credit-warning.ts
import { create } from "zustand";

type ReasonType = "free" | "no-credit";

interface CreditWarningModalStore {
  isOpen: boolean;
  reason: ReasonType;
  requiredCredit?: number;
  availableCredit?: number;
  onOpen: (reason: ReasonType, requiredCredit?: number, availableCredit?: number) => void;
  onClose: () => void;
}

export const useCreditWarningModal = create<CreditWarningModalStore>((set) => ({
  isOpen: false,
  reason: "free",
  requiredCredit: undefined,
  availableCredit: undefined,
  onOpen: (reason, requiredCredit, availableCredit) => set({ isOpen: true, reason, requiredCredit, availableCredit }),
  onClose: () => set({ isOpen: false, reason: "free", requiredCredit: undefined, availableCredit: undefined }),
}));
