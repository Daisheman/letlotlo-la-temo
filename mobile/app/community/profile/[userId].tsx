import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getReputation } from "@/lib/queries";
import { useAuthStore } from "@/stores/auth-store";

export default function CommunityUserProfileScreen() {
  const { userId = "" } = useLocalSearchParams<{ userId: string }>();
  const me = useAuthStore((state) => state.user);
  const query = useQuery({ queryKey: ["reputation", userId], queryFn: () => getReputation(userId), enabled: Boolean(userId) });
  const rep = query.data?.reputation;

  return (
    <Screen>
      <View className="items-center">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-field-100">
          <Text className="text-2xl font-black text-field-700">{rep?.user?.name?.slice(0, 2).toUpperCase() ?? "FM"}</Text>
        </View>
        <Text className="mt-3 text-3xl font-black text-field-900">{rep?.user?.name ?? "Farmer"}</Text>
        <Badge label={rep?.badge ?? "Seedling"} tone="gold" />
        <Text className="mt-2 text-field-700">{rep?.user?.locationName ?? "Botswana"}</Text>
        {me?.id === userId ? <Text className="mt-1 text-field-700">This is your community profile.</Text> : null}
      </View>
      <View className="mt-5 flex-row gap-2">
        <Card className="flex-1"><Text className="text-xl font-black text-field-900">{rep?.points ?? 0}</Text><Text className="text-field-700">Points</Text></Card>
        <Card className="flex-1"><Text className="text-xl font-black text-field-900">{rep?.postCount ?? 0}</Text><Text className="text-field-700">Posts</Text></Card>
        <Card className="flex-1"><Text className="text-xl font-black text-field-900">{rep?.bestAnswerCount ?? 0}</Text><Text className="text-field-700">Best</Text></Card>
      </View>
      <Text className="mb-2 mt-5 text-lg font-black text-field-900">Recent posts</Text>
      <View className="gap-3">
        {(query.data?.posts ?? []).map((post) => (
          <Card key={post.id}>
            <Text className="font-black text-field-900">{post.title}</Text>
            <Text numberOfLines={2} className="mt-1 text-field-700">{post.content}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
