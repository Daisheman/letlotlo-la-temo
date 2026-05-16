import { Tabs } from "expo-router";
import { House, Map, MessageCircle, User, Beef, Sprout } from "lucide-react-native";

const color = {
  active: "#24623b",
  inactive: "#7f8d83"
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.active,
        tabBarInactiveTintColor: color.inactive,
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 6 }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color: c }) => <House color={c} size={22} /> }} />
      <Tabs.Screen name="farms" options={{ title: "Farms", tabBarIcon: ({ color: c }) => <Map color={c} size={22} /> }} />
      <Tabs.Screen name="chat" options={{ title: "AI Chat", tabBarIcon: ({ color: c }) => <MessageCircle color={c} size={22} /> }} />
      <Tabs.Screen name="livestock" options={{ title: "Livestock", tabBarIcon: ({ color: c }) => <Beef color={c} size={22} /> }} />
      <Tabs.Screen name="community" options={{ title: "Community", tabBarIcon: ({ color: c }) => <Sprout color={c} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color: c }) => <User color={c} size={22} /> }} />
    </Tabs>
  );
}
