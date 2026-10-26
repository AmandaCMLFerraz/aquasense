import { CircleCheck, TriangleAlert } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  type AlertCategory,
  type AlertSeverity,
  useNotifications,
} from "@/hooks/use-notifications";
import { useTabBarClearance } from "@/hooks/use-tab-bar-clearance";
import { cn } from "@/utils/cn";
import { useThemeColors } from "@/utils/colors";

type FilterKey = "todos" | AlertCategory;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "vazamento", label: "Vazamento" },
  { key: "limite", label: "Limite" },
  { key: "sensor", label: "Sensor" },
];

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  {
    icon: typeof TriangleAlert;
    colorKey: "destructive" | "warning" | "success";
    iconBgClassName: string;
    borderClassName: string;
    dotClassName: string;
  }
> = {
  critical: {
    icon: TriangleAlert,
    colorKey: "destructive",
    iconBgClassName: "bg-destructive-soft",
    borderClassName: "border-destructive",
    dotClassName: "bg-destructive",
  },
  warning: {
    icon: TriangleAlert,
    colorKey: "warning",
    iconBgClassName: "bg-warning-soft",
    borderClassName: "border-warning",
    dotClassName: "bg-warning",
  },
  success: {
    icon: CircleCheck,
    colorKey: "success",
    iconBgClassName: "bg-success-soft",
    borderClassName: "border-success",
    dotClassName: "bg-success",
  },
};

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const tabBarClearance = useTabBarClearance();
  const { alerts, unreadCount, markAllRead, markAsRead } = useNotifications();
  const [filter, setFilter] = useState<FilterKey>("todos");

  const openCriticalAlert = alerts.find(
    (alert) => alert.severity === "critical" && alert.unread,
  );
  const filteredAlerts =
    filter === "todos"
      ? alerts
      : alerts.filter((alert) => alert.category === filter);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-background"
    >
      <View className="px-screen pt-4">
        <Text className="text-2xl font-bold text-foreground">
          Alertas
        </Text>
        <Text className="text-muted-foreground mt-1">
          {unreadCount} alertas não lidos.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4 flex-none"
        contentContainerClassName="px-screen gap-2"
      >
        {FILTERS.map(({ key, label }) => {
          const isSelected = filter === key;

          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              className={cn(
                "rounded-pill border px-4 py-2 active:opacity-70",
                isSelected
                  ? "bg-primary border-primary"
                  : "bg-card border-border",
              )}
            >
              <Text
                className={cn(
                  "text-sm font-bold",
                  isSelected ? "text-primary-foreground" : "text-foreground",
                )}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {alerts.length > 0 && (
        <View className="flex-row justify-end px-screen mt-4">
          <Pressable
            onPress={markAllRead}
            hitSlop={8}
            className="active:opacity-70"
          >
            <Text className="text-primary font-bold text-xs">
              Marcar todos como lido
            </Text>
          </Pressable>
        </View>
      )}

      <View
        className="flex-1"
        style={{ paddingBottom: tabBarClearance }}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-screen gap-4 pt-4"
          showsVerticalScrollIndicator={false}
        >
          {openCriticalAlert && (
            <Card className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-sm bg-destructive-soft">
                <TriangleAlert size={18} color={colors.destructive} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-foreground">
                  1 alerta crítico aberto
                </Text>
                <Text className="text-footnote text-muted-foreground mt-0.5">
                  {openCriticalAlert.description}
                </Text>
              </View>
            </Card>
          )}

          {filteredAlerts.length === 0 && (
            <EmptyState
              message={
                filter === "todos"
                  ? "Você ainda não tem alertas."
                  : "Não há alertas nesta categoria."
              }
            />
          )}

          {filteredAlerts.map((alert) => {
            const config = SEVERITY_CONFIG[alert.severity];
            const Icon = config.icon;

            return (
              <Pressable
                key={alert.id}
                onPress={() => markAsRead(alert.id)}
                className="active:opacity-80"
              >
                <Card
                  className={cn(
                    "relative",
                    alert.unread && "border-2",
                    alert.unread && config.borderClassName,
                  )}
                >
                  {alert.unread && (
                    <View
                      className={cn(
                        "absolute right-4 top-4 h-2 w-2 rounded-full",
                        config.dotClassName,
                      )}
                    />
                  )}
                  <View className="flex-row gap-3">
                    <View
                      className={cn(
                        "h-10 w-10 items-center justify-center rounded-sm",
                        config.iconBgClassName,
                      )}
                    >
                      <Icon size={18} color={colors[config.colorKey]} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-foreground">
                        {alert.title}
                      </Text>
                      <Text className="text-footnote text-muted-foreground mt-0.5">
                        {alert.description}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1">
                        {alert.timestamp}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
