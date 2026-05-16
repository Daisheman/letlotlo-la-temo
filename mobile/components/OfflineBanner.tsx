import { Text, View } from "react-native";
import { WifiOff } from "lucide-react-native";
import { useOnlineStatus } from "@/lib/offline";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <View className="mb-3 flex-row items-center gap-2 rounded-lg bg-yellow-100 px-3 py-2">
      <WifiOff size={16} color="#854d0e" />
      <Text className="flex-1 text-sm font-semibold text-yellow-800">Offline mode. Showing cached farm data and queued messages.</Text>
    </View>
  );
}
