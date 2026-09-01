import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <Text className="text-foreground text-2xl font-bold">Home</Text>
    </SafeAreaView>
  );
}
