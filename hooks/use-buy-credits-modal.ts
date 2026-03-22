import { create } from "zustand";

interface BuyCreditsModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const useBuyCreditsModal = create<BuyCreditsModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
