import { useAuthStore } from "@/stores/auth-store";

export const translations = {
  EN: {
    appName: "Letlotlo la Temo",
    tagline: "AI farming guidance for Botswana",
    farm: "Farm",
    farms: "Farms",
    crops: "Crops",
    livestock: "Livestock",
    weather: "Weather",
    soil: "Soil",
    water: "Water",
    plantNow: "Plant now",
    harvest: "Harvest",
    sickAnimal: "Sick animal",
    callVet: "Call vet",
    askAI: "Ask AI",
    addCrop: "Add Crop",
    reportSickAnimal: "Report Sick Animal",
    premium: "Premium",
    profile: "Profile",
    dashboard: "Dashboard"
  },
  TN: {
    appName: "Letlotlo la Temo",
    tagline: "Thuso ya temo ka AI mo Botswana",
    farm: "Tshimo",
    farms: "Ditshimo",
    crops: "Dijalo",
    livestock: "Dikgomo le Dinku",
    weather: "Bolepi",
    soil: "Mobu",
    water: "Metsi",
    plantNow: "Jala jaanong",
    harvest: "Kotulo",
    sickAnimal: "Phologolo e e lweleng",
    callVet: "Bitsa ngaka ya diphologolo",
    askAI: "Botsa AI",
    addCrop: "Tsenya Sejalo",
    reportSickAnimal: "Begela phologolo e e lweleng",
    premium: "Premium",
    profile: "Profaele",
    dashboard: "Tsebe ya ntlha"
  }
} as const;

export type TranslationKey = keyof typeof translations.EN;

export function t(key: TranslationKey) {
  const language = useAuthStore.getState().user?.preferredLanguage ?? useAuthStore.getState().language;
  return translations[language][key] ?? translations.EN[key];
}

export function useT() {
  const language = useAuthStore((state) => state.user?.preferredLanguage ?? state.language);
  return (key: TranslationKey) => translations[language][key] ?? translations.EN[key];
}
