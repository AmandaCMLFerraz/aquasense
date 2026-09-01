import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background">
      <Text className="text-foreground text-2xl font-bold">Cadastro</Text>
    </SafeAreaView>
  );
}
