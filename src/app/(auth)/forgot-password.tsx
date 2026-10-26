import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import {
  firstFieldErrors,
  forgotPasswordSchema,
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validation";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Step = "request" | "reset";

export default function ForgotPasswordScreen() {
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [requestError, setRequestError] = useState<string | undefined>();
  const [resetErrors, setResetErrors] = useState<
    Partial<Record<keyof ResetPasswordInput, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearResetError = (field: keyof ResetPasswordInput) => {
    if (resetErrors[field]) {
      setResetErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleRequestCode = async () => {
    if (isSubmitting) return;

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setRequestError(firstFieldErrors(result.error).email);
      return;
    }
    setRequestError(undefined);

    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(result.data.email);
      setEmail(result.data.email);
      setStep("reset");
      showToast("Se o e-mail existir, enviamos um código.", "success");
    } catch {
      showToast("Não foi possível enviar o código. Verifique sua conexão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (isSubmitting) return;

    const result = resetPasswordSchema.safeParse({
      email,
      code,
      newPassword,
      confirmPassword,
    });
    if (!result.success) {
      setResetErrors(firstFieldErrors(result.error));
      return;
    }
    setResetErrors({});

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(
        result.data.email,
        result.data.code,
        result.data.newPassword,
      );
      showToast("Senha atualizada com sucesso. Faça login.", "success");
      router.replace("/");
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : "Não foi possível redefinir sua senha.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 px-screen bg-background">
      <View className="items-start pt-4">
        <Button
          size="icon"
          variant="outline"
          onPress={() =>
            step === "reset" ? setStep("request") : router.push("/")
          }
        >
          <ChevronLeft />
        </Button>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center pb-[80px]"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === "request" ? (
          <>
            <Text className="text-foreground text-2xl font-bold">
              Esqueci minha senha
            </Text>
            <Text className="text-muted-foreground mt-1 mb-6">
              Informe seu e-mail e enviaremos um código de recuperação.
            </Text>
            <View>
              <Input
                label="E-mail"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (requestError) setRequestError(undefined);
                }}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
              {requestError && (
                <Text className="text-xs font-bold text-destructive mt-1">
                  {requestError}
                </Text>
              )}
            </View>
            <Button
              className="w-full mt-10"
              onPress={handleRequestCode}
              disabled={email.trim().length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                "Enviar código"
              )}
            </Button>
          </>
        ) : (
          <>
            <Text className="text-foreground text-2xl font-bold">
              Redefinir senha
            </Text>
            <Text className="text-muted-foreground mt-1 mb-6">
              Enviamos um código de 6 dígitos para {email}. Informe-o abaixo
              junto com sua nova senha.
            </Text>
            <View className="gap-4">
              <View>
                <Input
                  label="Código"
                  value={code}
                  onChangeText={(text) => {
                    setCode(text);
                    clearResetError("code");
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                {resetErrors.code && (
                  <Text className="text-xs font-bold text-destructive mt-1">
                    {resetErrors.code}
                  </Text>
                )}
              </View>
              <View>
                <Input
                  label="Nova senha"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    clearResetError("newPassword");
                  }}
                />
                {resetErrors.newPassword && (
                  <Text className="text-xs font-bold text-destructive mt-1">
                    {resetErrors.newPassword}
                  </Text>
                )}
              </View>
              <View>
                <Input
                  label="Confirmar nova senha"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearResetError("confirmPassword");
                  }}
                />
                {resetErrors.confirmPassword && (
                  <Text className="text-xs font-bold text-destructive mt-1">
                    {resetErrors.confirmPassword}
                  </Text>
                )}
              </View>
            </View>
            <Button
              className="w-full mt-10"
              onPress={handleResetPassword}
              disabled={
                code.trim().length === 0 ||
                newPassword.length === 0 ||
                confirmPassword.length === 0 ||
                isSubmitting
              }
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                "Redefinir senha"
              )}
            </Button>
          </>
        )}
      </ScrollView>
      <View className="items-center">
        <Logo width={140} />
      </View>
    </SafeAreaView>
  );
}
