import { create } from "zustand";

type FarmState = {
  selectedFarmId: string | null;
  setSelectedFarmId: (id: string | null) => void;
};

export const useFarmStore = create<FarmState>((set) => ({
  selectedFarmId: null,
  setSelectedFarmId: (selectedFarmId) => set({ selectedFarmId })
}));
