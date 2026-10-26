import { router, useFocusEffect } from "expo-router";
import { Plus, Router as RouterIcon } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ResidenceSelector } from "@/components/residence-selector";
import { useAuth } from "@/hooks/use-auth";
import { useSelectedResidence } from "@/hooks/use-selected-residence";
import { useTabBarClearance } from "@/hooks/use-tab-bar-clearance";
import { useToast } from "@/hooks/use-toast";
import { devicesApi, type Device } from "@/lib/api";
import { cn } from "@/utils/cn";
import { useThemeColors } from "@/utils/colors";

const POLL_INTERVAL_MS = 7000;

function formatElapsed(isoDate: string | null): string {
  if (!isoDate) return "nunca";

  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.floor(hours / 24);
  return `${days} d`;
}

export default function DevicesScreen() {
  const colors = useThemeColors();
  const tabBarClearance = useTabBarClearance();
  const { accessToken } = useAuth();
  const { selectedUnitId } = useSelectedResidence();
  const { showToast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasShownErrorRef = useRef(false);

  const loadDevices = useCallback(async () => {
    if (!accessToken) return;

    try {
      const data = await devicesApi.list(accessToken);
      setDevices(data);
    } catch {
      if (!hasShownErrorRef.current) {
        hasShownErrorRef.current = true;
        showToast("Não foi possível atualizar os dispositivos.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, showToast]);

  useFocusEffect(
    useCallback(() => {
      hasShownErrorRef.current = false;
      loadDevices();
      const interval = setInterval(loadDevices, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [loadDevices]),
  );

  const filteredDevices = selectedUnitId
    ? devices.filter((device) => device.consumerUnitId === selectedUnitId)
    : devices;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-background"
    >
      <View className="px-screen pt-4">
        <Text className="text-2xl font-bold text-foreground">
          Dispositivos
        </Text>
        <Text className="text-muted-foreground mt-1">
          {filteredDevices.length}{" "}
          {filteredDevices.length === 1
            ? "sensor vinculado"
            : "sensores vinculados"}{" "}
          à sua conta.
        </Text>
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

          {!isLoading && filteredDevices.length === 0 && (
            <EmptyState
              message={
                selectedUnitId
                  ? "Essa residência ainda não tem dispositivos vinculados."
                  : "Você ainda não tem dispositivos vinculados."
              }
            />
          )}

          {filteredDevices.map((device) => {
            const isOnline = device.status === "online";

            return (
              <Pressable
                key={device.id}
                onPress={() =>
                  router.push({
                    pathname: "/device-detail",
                    params: { id: device.id },
                  })
                }
                className="active:opacity-80"
              >
                <Card
                  className={cn(!isOnline && "border-2 border-destructive")}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={cn(
                        "h-10 w-10 items-center justify-center rounded-sm",
                        isOnline ? "bg-primary-soft" : "bg-destructive-soft",
                      )}
                    >
                      <RouterIcon
                        size={18}
                        color={isOnline ? colors.primary : colors.destructive}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-foreground">
                        {device.name}
                      </Text>
                      <Text className="text-footnote text-muted-foreground">
                        {device.description}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <View
                        className={cn(
                          "h-2 w-2 rounded-full",
                          isOnline ? "bg-success" : "bg-destructive",
                        )}
                      />
                      <Text
                        className={cn(
                          "text-xs font-bold",
                          isOnline ? "text-success" : "text-destructive",
                        )}
                      >
                        {isOnline ? "Online" : "Offline"}
                      </Text>
                    </View>
                  </View>

                  <View className="h-px bg-border my-3" />

                  <View className="flex-row justify-between">
                    <View>
                      <Text className="text-overline font-bold uppercase text-muted-foreground">
                        Vazão agora
                      </Text>
                      <Text className="font-bold text-foreground mt-1">
                        {device.currentFlowRate !== null
                          ? `${device.currentFlowRate} L/min`
                          : "—"}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-overline font-bold uppercase text-muted-foreground">
                        Hoje
                      </Text>
                      <Text className="font-bold text-foreground mt-1">
                        {device.todayConsumption} L
                      </Text>
                    </View>
                    <View>
                      <Text className="text-overline font-bold uppercase text-muted-foreground">
                        Última leitura
                      </Text>
                      <Text className="font-bold text-foreground mt-1">
                        {formatElapsed(device.lastSeenAt)}
                      </Text>
                    </View>
                  </View>

                  {!isOnline && (
                    <View className="rounded-md bg-destructive-soft px-3 py-2 mt-3">
                      <Text className="text-footnote font-bold text-destructive">
                        Sem comunicação há {formatElapsed(device.lastSeenAt)}
                      </Text>
                      <Text className="text-xs text-destructive mt-0.5">
                        Verifique a energia e o Wi-Fi no local.
                      </Text>
                    </View>
                  )}
                </Card>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => router.push("/add-device-form")}
            className="items-center justify-center gap-2 rounded-xl border border-dashed border-border py-6 active:opacity-70"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
              <Plus size={20} color={colors.primary} />
            </View>
            <Text className="font-bold text-foreground">
              Adicionar dispositivo
            </Text>
            <Text className="text-footnote text-muted-foreground">
              Conecte outro sensor em poucos passos.
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
