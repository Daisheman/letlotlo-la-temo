import { useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Leaf, Plus, Search } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getCommunityPosts, getTrendingPosts } from "@/lib/queries";
import type { CommunityPost } from "@/types";

const categories = ["ALL", "CROPS", "LIVESTOCK", "SOIL", "QUESTIONS", "MARKET_PRICES", "SUCCESS_STORIES"];

function timeAgo(date: string) {
  const hours = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 3600000));
  return hours < 24 ? `${hours} hours ago` : `${Math.floor(hours / 24)} days ago`;
}

function PostCard({ post }: { post: CommunityPost }) {
  const author = post.isAnonymous ? "Anonymous Farmer" : (post.author?.name ?? "Farmer");
  return (
    <Pressable onPress={() => router.push(`/community/${post.id}` as any)}>
      <Card className="mb-3">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-field-100">
            <Text className="font-black text-field-700">{author.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="font-bold text-field-900">{author}</Text>
              <Badge label={post.author?.reputation?.badge ?? "Seedling"} tone="gold" />
              {post.isVerified ? <Badge label="✓ Expert Verified" /> : null}
            </View>
            <View className="mt-2 flex-row flex-wrap gap-2">
              <Badge label={post.category.replace("_", " ")} tone="blue" />
              {post.district ? <Badge label={post.district} /> : null}
            </View>
            <Text className="mt-3 text-lg font-black text-field-900">{post.title}</Text>
            <Text numberOfLines={2} className="mt-1 text-field-700">{post.content}</Text>
            <Text className="mt-3 text-xs text-field-700">{post.reactions?.length ?? 0} reactions - {post.comments?.length ?? 0} comments - {post.viewCount} views - {timeAgo(post.createdAt)}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export default function CommunityScreen() {
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const postsQuery = useQuery({ queryKey: ["community-posts", category, search], queryFn: () => getCommunityPosts({ category, search }) });
  const trendingQuery = useQuery({ queryKey: ["community-trending"], queryFn: getTrendingPosts });
  const posts = postsQuery.data ?? [];

  return (
    <Screen scroll={false}>
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Leaf size={28} color="#24623b" />
          <Text className="text-3xl font-black text-field-900">Tshimo Community</Text>
        </View>
        <Pressable onPress={() => router.push("/community/new" as any)} className="h-12 w-12 items-center justify-center rounded-full bg-soil-400">
          <Plus color="#fff" size={22} />
        </Pressable>
      </View>
      <View className="mb-3 flex-row items-center gap-2 rounded-lg bg-white px-3">
        <Search size={18} color="#24623b" />
        <TextInput className="h-12 flex-1 text-field-900" placeholder="Search title, content, tags" value={search} onChangeText={setSearch} />
      </View>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        className="max-h-12"
        renderItem={({ item }) => (
          <Pressable onPress={() => setCategory(item)} className={`mr-2 rounded-full px-4 py-2 ${category === item ? "bg-field-700" : "bg-white"}`}>
            <Text className={`font-bold ${category === item ? "text-white" : "text-field-700"}`}>{item.replace("_", " ")}</Text>
          </Pressable>
        )}
      />
      <Text className="mb-2 mt-4 font-black text-field-900">Trending</Text>
      <FlatList
        horizontal
        data={(trendingQuery.data ?? []).slice(0, 3)}
        keyExtractor={(item) => item.id}
        className="max-h-28"
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/community/${item.id}` as any)} className="mr-3 w-64 rounded-lg bg-soil-100 p-3">
            <Text numberOfLines={1} className="font-black text-field-900">{item.title}</Text>
            <Text numberOfLines={2} className="mt-1 text-field-700">{item.content}</Text>
          </Pressable>
        )}
      />
      <View className="my-3">
        <Button title="Market Prices" variant="ghost" onPress={() => router.push("/community/market-prices" as any)} />
      </View>
      <FlatList data={posts} keyExtractor={(item) => item.id} renderItem={({ item }) => <PostCard post={item} />} />
    </Screen>
  );
}
