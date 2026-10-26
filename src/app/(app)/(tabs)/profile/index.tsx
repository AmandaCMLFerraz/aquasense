import { router } from "expo-router";
import {
  ChevronRight,
  LogOut,
  Monitor,
  Moon,
  Sun,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/hooks/use-auth";
import { useTabBarClearance } from "@/hooks/use-tab-bar-clearance";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/utils/cn";
import { useThemeColors } from "@/utils/colors";

const THEME_OPTIONS = [
  {
    key: "light",
    label: "Claro",
    icon: Sun,
    description: "Modo claro sempre ativo, com máximo contraste.",
  },
  {
    key: "dark",
    label: "Escuro",
    icon: Moon,
    description: "Modo escuro ativo, ideal para ambientes com pouca luz.",
  },
  {
    key: "system",
    label: "Sistema",
    icon: Monitor,
    description: "Segue automaticamente o tema do seu aparelho.",
  },
] as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-overline font-bold uppercase text-muted-foreground mb-2">
      {children}
    </Text>
  );
}

export default function ProfileScreen() {
  const colors = useThemeColors();
  const tabBarClearance = useTabBarClearance();
  const { preference, setPreference } = useAppTheme();
  const { user, logout, deleteAccount } = useAuth();
  const { showToast } = useToast();
  const [limitAlertsEnabled, setLimitAlertsEnabled] = useState(true);
  const [leakAlertsEnabled, setLeakAlertsEnabled] = useState(true);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      setIsDeleteDialogVisible(false);
      router.replace("/");
    } catch {
      setIsDeleteDialogVisible(false);
      showToast("Não foi possível excluir sua conta. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-background"
    >
      <Text className="text-2xl font-bold text-foreground px-screen pt-4">
        Perfil
      </Text>

      <View
        className="flex-1"
        style={{ paddingBottom: tabBarClearance }}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-screen gap-4 pt-4"
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <View className="flex-row items-center gap-4">
              <View className="h-14 w-14 items-center justify-center rounded-md bg-primary-soft">
                <Text className="text-primary font-bold">
                  {getInitials(user?.name ?? "")}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-callout font-bold text-foreground">
                  {user?.name}
                </Text>
                <Text className="text-footnote text-muted-foreground">
                  {user?.email}
                </Text>
              </View>
              <Pressable
                onPress={handleLogout}
                hitSlop={8}
                className="active:opacity-70"
              >
                <LogOut size={20} color={colors.primary} />
              </Pressable>
            </View>
          </Card>

          <View>
            <SectionLabel>Aparência</SectionLabel>
            <Card>
              <Text className="text-callout font-bold text-foreground">
                Tema do aplicativo
              </Text>

              <View className="flex-row gap-3 mt-3">
                {THEME_OPTIONS.map(({ key, label, icon: Icon }) => {
                  const isSelected = preference === key;

                  return (
                    <Pressable
                      key={key}
                      onPress={() => setPreference(key)}
                      className={cn(
                        "flex-1 items-center gap-1 rounded-md border-2 py-3 active:opacity-70",
                        isSelected
                          ? "border-primary bg-primary-soft"
                          : "border-transparent bg-secondary",
                      )}
                    >
                      <Icon
                        size={18}
                        color={
                          isSelected ? colors.primary : colors.mutedForeground
                        }
                      />
                      <Text
                        className={cn(
                          "text-footnote font-bold",
                          isSelected
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text className="text-footnote text-muted-foreground mt-3">
                {
                  THEME_OPTIONS.find((option) => option.key === preference)
                    ?.description
                }
              </Text>
            </Card>
          </View>

          <View>
            <SectionLabel>Residências</SectionLabel>
            <Pressable
              onPress={() => router.push("/profile/consumer-units")}
              className="active:opacity-80"
            >
              <Card className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-callout font-bold text-foreground">
                    Gerenciar residências
                  </Text>
                  <Text className="text-footnote text-muted-foreground mt-0.5">
                    Endereços, moradores e limite diário de consumo.
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.mutedForeground} />
              </Card>
            </Pressable>
          </View>

          <View>
            <SectionLabel>Notificações</SectionLabel>
            <Card>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="font-bold text-foreground">
                    Alertas de limite
                  </Text>
                  <Text className="text-footnote text-muted-foreground">
                    Avisar quando eu passar do limite.
                  </Text>
                </View>
                <Switch
                  value={limitAlertsEnabled}
                  onValueChange={setLimitAlertsEnabled}
                  trackColor={{ false: colors.track, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>

              <View className="h-px bg-border my-3" />

              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="font-bold text-foreground">
                    Possível vazamento
                  </Text>
                  <Text className="text-footnote text-muted-foreground">
                    Detectar fluxo contínuo incomum.
                  </Text>
                </View>
                <Switch
                  value={leakAlertsEnabled}
                  onValueChange={setLeakAlertsEnabled}
                  trackColor={{ false: colors.track, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>
            </Card>
          </View>

          <Button
            variant="outline"
            className="border-primary"
            textClassName="text-primary"
            onPress={handleLogout}
          >
            Sair
          </Button>

          <Button
            variant="outline"
            className="border-destructive mb-1"
            textClassName="text-destructive"
            onPress={() => setIsDeleteDialogVisible(true)}
          >
            Excluir conta
          </Button>
        </ScrollView>
      </View>

      <ConfirmDialog
        visible={isDeleteDialogVisible}
        title="Excluir conta"
        description="Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        isLoading={isDeleting}
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteDialogVisible(false)}
      />
    </SafeAreaView>
  );
}
