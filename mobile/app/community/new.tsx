import { useState } from "react";
import { Alert, Pressable, Switch, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Send } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { createCommunityPost } from "@/lib/queries";

const categories = ["CROPS", "LIVESTOCK", "SOIL", "WEATHER", "EQUIPMENT", "MARKET_PRICES", "SUCCESS_STORIES", "QUESTIONS", "GENERAL"];
const districts = ["Central", "North-East District", "Kgatleng", "Kweneng", "Southern", "South-East", "Ngamiland", "Ghanzi", "Kgalagadi", "Chobe"];

export default function NewCommunityPostScreen() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("QUESTIONS");
  const [district, setDistrict] = useState("North-East District");
  const [tags, setTags] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isAnonymous, setAnonymous] = useState(false);
  const mutation = useMutation({
    mutationFn: () => createCommunityPost({ title, content, category, district, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), photoUrls, isAnonymous } as any),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      router.replace(`/community/${post.id}` as any);
    },
    onError: (err: any) => Alert.alert("Could not post", err.response?.data?.error ?? "Try again.")
  });

  async function addPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0].uri && photoUrls.length < 3) setPhotoUrls((items) => [...items, result.assets[0].uri]);
  }

  return (
    <Screen>
      <Text className="text-3xl font-black text-field-900">New community post</Text>
      <Text className="mt-2 text-field-700">Share real farming experiences from Botswana. Posts in English or Setswana are welcome.</Text>
      <View className="mt-4 rounded-lg bg-soil-100 p-3">
        {["Be respectful to fellow farmers", "No spam or advertisements", "For sick animals, recommend calling a vet for serious cases", "For notifiable diseases, direct to DVS Botswana +267 3950500", "Photos of crops, animals, and farms encouraged"].map((rule) => (
          <Text key={rule} className="mb-1 text-soil-700">• {rule}</Text>
        ))}
      </View>
      <View className="mt-5">
        <TextField label="Title" value={title} onChangeText={setTitle} />
        <TextField label="Content" value={content} onChangeText={setContent} multiline className="min-h-32" />
        <Text className="mb-2 font-semibold text-field-900">Category</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {categories.map((item) => (
            <Pressable key={item} onPress={() => setCategory(item)} className={`rounded-full px-3 py-2 ${category === item ? "bg-field-700" : "bg-white"}`}>
              <Text className={`font-bold ${category === item ? "text-white" : "text-field-700"}`}>{item.replace("_", " ")}</Text>
            </Pressable>
          ))}
        </View>
        <Text className="mb-2 font-semibold text-field-900">District</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {districts.map((item) => (
            <Pressable key={item} onPress={() => setDistrict(item)} className={`rounded-full px-3 py-2 ${district === item ? "bg-soil-400" : "bg-white"}`}>
              <Text className={`font-bold ${district === item ? "text-white" : "text-field-700"}`}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <TextField label="Tags" value={tags} onChangeText={setTags} placeholder="maize, drought, goats" />
        <Button title={`Add Photo (${photoUrls.length}/3)`} icon={Camera} variant="ghost" disabled={photoUrls.length >= 3} onPress={addPhoto} />
        <View className="my-4 flex-row items-center justify-between">
          <Text className="font-semibold text-field-800">Post anonymously</Text>
          <Switch value={isAnonymous} onValueChange={setAnonymous} />
        </View>
        <Button title="Post to Community" icon={Send} loading={mutation.isPending} disabled={title.length < 4 || content.length < 20} onPress={() => mutation.mutate()} />
      </View>
    </Screen>
  );
}
