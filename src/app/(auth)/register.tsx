import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Input } from "@/components/ui/input";
import { VerifyEmailModal } from "@/components/ui/verify-email-modal";
import { ApiError } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import {
  firstFieldErrors,
  registerSchema,
  verifyEmailSchema,
  type RegisterInput,
} from "@/lib/validation";
import { cn } from "@/utils/cn";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

type PasswordStrength = "weak" | "medium" | "strong";

const TOTAL_BARS = 3;

const STRENGTH_BARS: Record<PasswordStrength, number> = {
  weak: 1,
  medium: 2,
  strong: 3,
};

function getPasswordStrength(
  password: string,
): { level: PasswordStrength; filledBars: number } | null {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const level: PasswordStrength =
    score <= 1 ? "weak" : score <= 2 ? "medium" : "strong";

  return { level, filledBars: STRENGTH_BARS[level] };
}

const STRENGTH_CONFIG: Record<
  PasswordStrength,
  { label: string; barColor: string; textColor: string }
> = {
  weak: {
    label: "Fraca",
    barColor: "bg-destructive",
    textColor: "text-destructive",
  },
  medium: {
    label: "Média",
    barColor: "bg-warning",
    textColor: "text-warning",
  },
  strong: {
    label: "Forte",
    barColor: "bg-success",
    textColor: "text-success",
  },
};

export default function RegisterScreen() {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegisterInput, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verifyError, setVerifyError] = useState<string | undefined>();

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    passwordsMatch;

  const clearFieldError = (field: keyof RegisterInput) => {
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    const result = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });
    if (!result.success) {
      setFieldErrors(firstFieldErrors(result.error));
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      await authApi.register(
        result.data.name,
        result.data.email,
        result.data.password,
      );
      setRegisteredEmail(result.data.email);
      setShowVerifyModal(true);
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : "Não foi possível criar sua conta. Verifique sua conexão.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => {
    setShowVerifyModal(false);
    router.replace("/");
  };

  const handleCancelVerification = () => {
    setVerifyError(undefined);
    setShowVerifyModal(false);
  };

  const handleVerifyCode = async (code: string) => {
    if (isVerifying) return;

    const result = verifyEmailSchema.safeParse({ code });
    if (!result.success) {
      setVerifyError(firstFieldErrors(result.error).code);
      return;
    }
    setVerifyError(undefined);

    setIsVerifying(true);
    try {
      await authApi.verifyEmail(registeredEmail, result.data.code);
      showToast("E-mail confirmado com sucesso. Faça login.", "success");
      goToLogin();
    } catch (err) {
      setVerifyError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível confirmar o código. Verifique sua conexão.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (isResending) return;

    setIsResending(true);
    try {
      await authApi.resendVerification(registeredEmail);
      showToast("Reenviamos o código de confirmação.", "success");
    } catch {
      showToast("Não foi possível reenviar o código. Tente novamente.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 px-screen bg-background">
      <View className="items-start pt-4">
        <Button size="icon" variant="outline" onPress={() => router.push("/")}>
          <ChevronLeft />
        </Button>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center pb-[80px]"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-foreground text-2xl font-bold">
          Criar sua conta
        </Text>
        <Text className="text-muted-foreground mt-1 mb-6">
          Leva menos de um minuto.
        </Text>
        <View className="gap-4">
          <View>
            <Input
              label="Nome completo"
              required
              value={name}
              onChangeText={(text) => {
                setName(text);
                clearFieldError("name");
              }}
            />
            {fieldErrors.name && (
              <Text className="text-xs font-bold text-destructive mt-1">
                {fieldErrors.name}
              </Text>
            )}
          </View>
          <View>
            <Input
              label="E-mail"
              required
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearFieldError("email");
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
              required
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearFieldError("password");
              }}
            />
            {fieldErrors.password && (
              <Text className="text-xs font-bold text-destructive mt-1">
                {fieldErrors.password}
              </Text>
            )}
            {strength && (
              <View className="flex-row items-center gap-2 mt-2">
                <View className="flex-row flex-1 gap-1">
                  {Array.from({ length: TOTAL_BARS }).map((_, index) => (
                    <View
                      key={index}
                      className={cn(
                        "h-1.5 flex-1 rounded-pill bg-track",
                        index < strength.filledBars &&
                          STRENGTH_CONFIG[strength.level].barColor,
                      )}
                    />
                  ))}
                </View>
                <Text
                  className={cn(
                    "text-xs font-bold uppercase",
                    STRENGTH_CONFIG[strength.level].textColor,
                  )}
                >
                  {STRENGTH_CONFIG[strength.level].label}
                </Text>
              </View>
            )}
          </View>
          <View>
            <Input
              label="Confirmar senha"
              required
              secureTextEntry
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearFieldError("confirmPassword");
              }}
            />
            {fieldErrors.confirmPassword ? (
              <Text className="text-xs font-bold text-destructive mt-1">
                {fieldErrors.confirmPassword}
              </Text>
            ) : (
              confirmPassword.length > 0 &&
              (passwordsMatch ? (
                <Text className="text-xs font-bold text-success mt-1">
                  As senhas coincidem
                </Text>
              ) : (
                <Text className="text-xs font-bold text-destructive mt-1">
                  As senhas não coincidem
                </Text>
              ))
            )}
          </View>
        </View>
        <Button
          className="w-full mt-10"
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="white" /> : "Criar conta"}
        </Button>
      </ScrollView>
      <View className="items-center">
        <Logo width={140} />
      </View>
      <VerifyEmailModal
        visible={showVerifyModal}
        email={registeredEmail}
        isSubmitting={isVerifying}
        isResending={isResending}
        error={verifyError}
        onSubmit={handleVerifyCode}
        onResend={handleResendCode}
        onClose={handleCancelVerification}
      />
    </SafeAreaView>
  );
}
