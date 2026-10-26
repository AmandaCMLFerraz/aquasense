import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { firstFieldErrors, loginSchema, type LoginInput } from "@/lib/validation";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginInput, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setFieldErrors(firstFieldErrors(result.error));
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      await login(result.data.email, result.data.password);
      router.replace("/home");
    } catch {
      showToast("E-mail ou senha incorretos");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-screen pb-[80px]"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View className="mb-10 items-center">
        <Logo width={220} />
      </View>
      <Text className="text-foreground text-2xl font-bold">
        Bem-vindo de volta
      </Text>
      <Text className="text-muted-foreground mt-1 mb-6">
        Acompanhe seu consumo de água em tempo real.
      </Text>
      <View className="gap-4">
        <View>
          <Input
            label="E-mail"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (fieldErrors.email) setFieldErrors((e) => ({ ...e, email: undefined }));
            }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          {fieldErrors.email && (
            <Text className="text-xs font-bold text-destructive mt-1">
              {fieldErrors.email}
            </Text>
          )}
        </View>
        <View>
          <Input
            label="Senha"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: undefined }));
            }}
            secureTextEntry
          />
          {fieldErrors.password && (
            <Text className="text-xs font-bold text-destructive mt-1">
              {fieldErrors.password}
            </Text>
          )}
        </View>
      </View>
      <Button
        className="mt-1 h-auto w-auto self-end border-0 bg-transparent p-0"
        textClassName="text-sm font-bold text-primary border-b border-primary"
        onPress={() => router.push("/forgot-password")}
      >
        Esqueci minha senha
      </Button>
      <Button
        className="w-full mt-10"
        onPress={handleSubmit}
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="white" /> : "Entrar"}
      </Button>
      <View className="w-full flex-row items-center justify-center gap-3 py-6">
        <View className="bg-subtle-foreground/50 h-px w-full flex-1" />
        <Text className="text-subtle-foreground text-sm">ou</Text>
        <View className="bg-subtle-foreground/50 h-px w-full flex-1" />
      </View>
      <Button
        className="w-full"
        variant="outline"
        onPress={() => router.push("/register")}
      >
        Criar conta
      </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
