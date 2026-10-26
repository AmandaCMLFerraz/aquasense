import { router, useFocusEffect } from "expo-router";
import {
  LogOut,
  Trash2,
  TriangleAlert,
  User,
} from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionMenu } from "@/components/ui/action-menu";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ResidenceSelector } from "@/components/residence-selector";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { useSelectedResidence } from "@/hooks/use-selected-residence";
import { useTabBarClearance } from "@/hooks/use-tab-bar-clearance";
import { useToast } from "@/hooks/use-toast";
import { consumptionApi, type DashboardSummary } from "@/lib/api";
import { cn } from "@/utils/cn";
import { useThemeColors } from "@/utils/colors";

const POLL_INTERVAL_MS = 3000;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getFormattedDate() {
  const formatted = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatLiters(value: number) {
  return `${Math.round(value).toLocaleString("pt-BR")} L`;
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const tabBarClearance = useTabBarClearance();
  const { user, accessToken, logout, deleteAccount } = useAuth();
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { selectedUnitId } = useSelectedResidence();
  const { showToast } = useToast();
  const { alerts } = useNotifications();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const hasShownErrorRef = useRef(false);
  const userName = user?.name ?? "";
  const firstName = userName.split(" ")[0];

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

  const loadSummary = useCallback(async () => {
    if (!accessToken) return;

    try {
      const data = await consumptionApi.getDashboard(
        accessToken,
        selectedUnitId ?? undefined,
      );
      setSummary(data);
      hasShownErrorRef.current = false;
    } catch {
      if (!hasShownErrorRef.current) {
        hasShownErrorRef.current = true;
        showToast("Não foi possível carregar seu resumo de consumo.");
      }
    }
  }, [accessToken, selectedUnitId, showToast]);

  useFocusEffect(
    useCallback(() => {
      hasShownErrorRef.current = false;
      loadSummary();
      const interval = setInterval(loadSummary, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [loadSummary]),
  );

  const priorityAlert = alerts.find(
    (alert) =>
      alert.unread &&
      (alert.severity === "critical" || alert.severity === "warning"),
  );

  const limitPercentage =
    summary && summary.dailyLimit > 0
      ? Math.min(
          100,
          Math.round((summary.todayLiters / summary.dailyLimit) * 100),
        )
      : 0;
  const remainingLiters = summary
    ? Math.max(0, summary.dailyLimit - summary.todayLiters)
    : 0;
  const isWeeklyImprovement = (summary?.weeklyChangePercent ?? 0) <= 0;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-background"
    >
      <View className="flex-row items-center justify-between px-screen pt-4">
        <View>
          <Text className="text-foreground text-2xl font-bold">
            Olá, {firstName}
          </Text>
          <Text className="text-muted-foreground mt-1">
            {getFormattedDate()}
          </Text>
        </View>
        <ActionMenu
          items={[
            {
              label: "Perfil",
              icon: User,
              onPress: () => router.navigate("/profile"),
            },
            { label: "Sair", icon: LogOut, onPress: () => logout() },
            {
              label: "Excluir conta",
              icon: Trash2,
              destructive: true,
              onPress: () => setIsDeleteDialogVisible(true),
            },
          ]}
          renderTrigger={(open) => (
            <Pressable
              onPress={open}
              accessibilityRole="button"
              accessibilityLabel="Abrir menu do usuário"
              className="h-[3.5rem] w-[3.5rem] items-center justify-center rounded-md border border-border bg-card shadow-sm active:opacity-70"
            >
              <Text className="text-primary font-bold">
                {getInitials(userName)}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <View
        className="flex-1"
        style={{ paddingBottom: tabBarClearance }}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-screen gap-4 pt-4"
          showsVerticalScrollIndicator={false}
        >
          <ResidenceSelector />

          <Card>
            <View className="flex-row items-center justify-between">
              <Text className="text-overline font-bold uppercase text-muted-foreground">
                Consumo de hoje
              </Text>
              <View className="rounded-pill bg-success-soft px-2 py-1">
                <Text className="text-xs font-bold text-success">
                  {limitPercentage}% do limite
                </Text>
              </View>
            </View>

            <Text className="text-metric font-bold text-foreground mt-1">
              {formatLiters(summary?.todayLiters ?? 0)}
            </Text>

            <View className="h-2 rounded-pill bg-track mt-4 overflow-hidden">
              <View
                className="h-full rounded-pill bg-primary"
                style={{ width: `${limitPercentage}%` }}
              />
            </View>

            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-footnote text-muted-foreground">
                Limite diário {formatLiters(summary?.dailyLimit ?? 0)}
              </Text>
              <Text className="text-footnote text-muted-foreground">
                restam {formatLiters(remainingLiters)}
              </Text>
            </View>

            <View className="h-px bg-border mt-4 mb-3" />

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-primary" />
                <Text className="text-footnote text-muted-foreground">
                  Vazão agora
                </Text>
              </View>
              <Text className="text-footnote font-bold text-foreground">
                {(summary?.currentFlowRate ?? 0).toFixed(1).replace(".", ",")}{" "}
                L/min
              </Text>
            </View>
          </Card>

          <View className="flex-row gap-4">
            <Card className="flex-1">
              <Text className="text-overline font-bold uppercase text-muted-foreground">
                Média últimos 7 dias
              </Text>
              <Text className="text-title1 font-bold text-foreground mt-1">
                {formatLiters(summary?.weeklyAverageLiters ?? 0)}
              </Text>
              <Text
                className={cn(
                  "text-xs font-bold mt-1",
                  isWeeklyImprovement ? "text-success" : "text-warning",
                )}
              >
                {(summary?.weeklyChangePercent ?? 0) > 0 ? "+" : ""}
                {summary?.weeklyChangePercent ?? 0}% vs. semana passada
              </Text>
            </Card>

            <Card className="flex-1">
              <Text className="text-overline font-bold uppercase text-muted-foreground">
                Economia mês
              </Text>
              <Text className="text-title1 font-bold text-foreground mt-1">
                {formatLiters(summary?.monthSavingsLiters ?? 0)}
              </Text>
              <Text className="text-xs text-muted-foreground mt-1">
                vs. o limite diário
              </Text>
            </Card>
          </View>

          {priorityAlert && (
            <Pressable
              onPress={() => router.push("/notifications")}
              className="active:opacity-80"
            >
              <Card
                className={cn(
                  "border-2",
                  priorityAlert.severity === "critical"
                    ? "border-destructive"
                    : "border-warning",
                )}
              >
                <View className="flex-row gap-3">
                  <View
                    className={cn(
                      "h-10 w-10 items-center justify-center rounded-sm",
                      priorityAlert.severity === "critical"
                        ? "bg-destructive-soft"
                        : "bg-warning-soft",
                    )}
                  >
                    <TriangleAlert
                      size={18}
                      color={
                        priorityAlert.severity === "critical"
                          ? colors.destructive
                          : colors.warning
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-foreground">
                      {priorityAlert.title}
                    </Text>
                    <Text className="text-footnote text-muted-foreground mt-0.5">
                      {priorityAlert.description}
                    </Text>
                    <Text className="text-primary font-bold text-xs mt-2">
                      Ver detalhes
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          )}

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
