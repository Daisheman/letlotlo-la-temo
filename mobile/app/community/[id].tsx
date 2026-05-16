import { useState } from "react";
import { Share, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { addCommunityComment, getCommunityPost, reactCommunity } from "@/lib/queries";

export default function CommunityPostDetailScreen() {
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const postQuery = useQuery({ queryKey: ["community-post", id], queryFn: () => getCommunityPost(id), enabled: Boolean(id) });
  const [comment, setComment] = useState("");
  const post = postQuery.data;
  const commentMutation = useMutation({
    mutationFn: () => addCommunityComment(id, comment),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["community-post", id] });
    }
  });

  if (!post) return <Screen><Text>Loading...</Text></Screen>;
  const best = post.comments?.find((item) => item.isBestAnswer);

  return (
    <Screen>
      <Card>
        <View className="flex-row flex-wrap gap-2">
          <Badge label={post.category.replace("_", " ")} tone="blue" />
          {post.isVerified ? <Badge label="✓ Expert Verified" /> : null}
        </View>
        <Text className="mt-3 text-3xl font-black text-field-900">{post.title}</Text>
        <Text className="mt-2 leading-6 text-field-800">{post.content}</Text>
        <View className="mt-4 flex-row flex-wrap gap-2">
          {(["HELPFUL", "LEARNED", "THANKS"] as const).map((type) => (
            <Button key={type} title={type === "HELPFUL" ? "Helpful" : type === "LEARNED" ? "Learned" : "Thanks"} variant="ghost" onPress={() => reactCommunity(post.id, "post", type)} />
          ))}
        </View>
        <View className="mt-3 gap-2">
          <Button title="Ask Temo AI about this topic" icon={MessageCircle} variant="secondary" onPress={() => router.push({ pathname: "/(tabs)/chat", params: { prompt: post.title } })} />
          <Button title="Share" variant="ghost" onPress={() => Share.share({ message: `${post.title}\n\n${post.content}` })} />
        </View>
      </Card>
      {best ? (
        <Card className="mt-4 border-field-700">
          <Badge label="Best answer" />
          <Text className="mt-2 text-field-800">{best.content}</Text>
        </Card>
      ) : null}
      <Text className="mb-2 mt-5 text-lg font-black text-field-900">Comments</Text>
      <View className="gap-3">
        {(post.comments ?? []).map((item) => (
          <Card key={item.id}>
            <Text className="font-bold text-field-900">{item.isAnonymous ? "Anonymous Farmer" : item.author?.name}</Text>
            <Text className="mt-2 text-field-800">{item.content}</Text>
            {item.replies?.map((reply) => (
              <View key={reply.id} className="ml-4 mt-3 rounded-lg bg-field-50 p-3">
                <Text className="font-bold text-field-900">{reply.isAnonymous ? "Anonymous Farmer" : reply.author?.name}</Text>
                <Text className="mt-1 text-field-800">{reply.content}</Text>
              </View>
            ))}
          </Card>
        ))}
      </View>
      <View className="mt-4 flex-row items-center gap-2 rounded-lg bg-white p-2">
        <TextInput className="min-h-11 flex-1 text-field-900" placeholder="Add a comment" value={comment} onChangeText={setComment} />
        <Button title="Send" icon={Send} disabled={comment.length < 2} loading={commentMutation.isPending} onPress={() => commentMutation.mutate()} />
      </View>
    </Screen>
  );
}
