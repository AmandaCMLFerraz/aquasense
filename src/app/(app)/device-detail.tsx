import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Pencil, Router as RouterIcon, Trash2 } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApiError, useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { devicesApi, type DeviceDetail } from "@/lib/api";
import { cn } from "@/utils/cn";
import { useThemeColors } from "@/utils/colors";

const POLL_INTERVAL_MS = 7000;
const CHART_WINDOW_MS = 60 * 60 * 1000;
const CHART_WIDTH = 300;
const CHART_HEIGHT = 100;
const CHART_PADDING = 8;

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

function formatLiters(value: number) {
  return `${Math.round(value).toLocaleString("pt-BR")} L`;
}

function formatInstalledDate(isoDate: string) {
  const date = new Date(isoDate);
  const month = date
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");

  return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

function buildChartPaths(flowHistory: DeviceDetail["flowHistory"]) {
  if (flowHistory.length === 0) return null;

  const windowStart = Date.now() - CHART_WINDOW_MS;
  const maxFlow = Math.max(1, ...flowHistory.map((sample) => sample.flowRate));
  const usableHeight = CHART_HEIGHT - CHART_PADDING * 2;

  const points = flowHistory.map((sample) => {
    const elapsed = new Date(sample.timestamp).getTime() - windowStart;
    const x = Math.min(
      CHART_WIDTH,
      Math.max(0, (elapsed / CHART_WINDOW_MS) * CHART_WIDTH),
    );
    const y =
      CHART_HEIGHT - CHART_PADDING - (sample.flowRate / maxFlow) * usableHeight;

    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");

  const lastPoint = points[points.length - 1];
  const areaPath = `${linePath} L ${lastPoint.x.toFixed(1)} ${CHART_HEIGHT} L ${points[0].x.toFixed(1)} ${CHART_HEIGHT} Z`;

  return { linePath, areaPath, lastPoint };
}

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const hasShownErrorRef = useRef(false);

  const loadDevice = useCallback(async () => {
    if (!accessToken || !id) return;

    try {
      const data = await devicesApi.get(accessToken, id);
      setDevice(data);
    } catch {
      if (!hasShownErrorRef.current) {
        hasShownErrorRef.current = true;
        showToast("Não foi possível carregar os dados do dispositivo.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, id, showToast]);

  useFocusEffect(
    useCallback(() => {
      hasShownErrorRef.current = false;
      loadDevice();
      const interval = setInterval(loadDevice, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [loadDevice]),
  );

  const handleRemove = async () => {
    if (!accessToken || !device) return;

    setIsRemoving(true);
    try {
      await devicesApi.remove(accessToken, device.id);
      setIsDeleteDialogVisible(false);
      router.back();
    } catch (err) {
      setIsDeleteDialogVisible(false);
      showToast(
        err instanceof ApiError
          ? err.message
          : "Não foi possível excluir o dispositivo.",
      );
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading || !device) {
    return (
      <SafeAreaView
        edges={["top", "left", "right", "bottom"]}
        className="flex-1 bg-background items-center justify-center"
      >
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const isOnline = device.status === "online";
  const chart = buildChartPaths(device.flowHistory);

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      className="flex-1 bg-background"
    >
      <View className="flex-row items-center justify-between px-screen pt-4">
        <Button size="icon" variant="outline" onPress={() => router.back()}>
          <ChevronLeft color={colors.primary} />
        </Button>
        <ActionMenu
          items={[
            {
              label: "Editar",
              icon: Pencil,
              onPress: () =>
                router.push({
                  pathname: "/add-device-form",
                  params: { id: device.id },
                }),
            },
            {
              label: "Excluir",
              icon: Trash2,
              destructive: true,
              onPress: () => setIsDeleteDialogVisible(true),
            },
          ]}
        />
      </View>

      <View className="px-screen pt-4">
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
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-bold text-foreground">
                {device.name}
              </Text>
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
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <Text className="text-muted-foreground">
                {device.consumerUnitName}
              </Text>
              <View className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <Text className="text-muted-foreground">
                {device.identifier}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-1 px-screen">
        <View className="gap-4 pt-6">
          <Card>
            <View className="flex-row items-center justify-between">
              <Text className="text-overline font-bold uppercase text-muted-foreground">
                Vazão em tempo real
              </Text>
              {isOnline && (
                <View className="rounded-pill bg-primary-soft px-2 py-1">
                  <Text className="text-xs font-bold text-primary">
                    ao vivo
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-metric font-bold text-foreground mt-1">
              {(device.currentFlowRate ?? 0).toFixed(1).replace(".", ",")}{" "}
              <Text className="text-title3 font-bold text-muted-foreground">
                L/min
              </Text>
            </Text>

            <View className="mt-4" style={{ height: CHART_HEIGHT }}>
              {chart ? (
                <Svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                  preserveAspectRatio="none"
                >
                  <Path d={chart.areaPath} fill={colors.primary} fillOpacity={0.12} />
                  <Path
                    d={chart.linePath}
                    stroke={colors.primary}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <Circle
                    cx={chart.lastPoint.x}
                    cy={chart.lastPoint.y}
                    r={4}
                    fill={colors.primary}
                  />
                </Svg>
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-footnote text-muted-foreground">
                    Sem leituras na última hora.
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-xs text-muted-foreground text-center mt-2">
              últimos 60 min
            </Text>
          </Card>

          <View className="flex-row gap-4">
            <Card className="flex-1">
              <Text className="text-overline font-bold uppercase text-muted-foreground">
                Hoje
              </Text>
              <Text className="text-title1 font-bold text-foreground mt-1">
                {formatLiters(device.todayConsumption)}
              </Text>
            </Card>

            <Card className="flex-1">
              <Text className="text-overline font-bold uppercase text-muted-foreground">
                Esta semana
              </Text>
              <Text className="text-title1 font-bold text-foreground mt-1">
                {formatLiters(device.weekConsumption)}
              </Text>
            </Card>
          </View>

          <Card>
            <InfoRow label="Identificador" value={device.identifier} />
            <View className="h-px bg-border my-3" />
            <InfoRow
              label="Fator de calibração"
              value={`${device.calibrationFactor} pulsos/L`}
            />
            <View className="h-px bg-border my-3" />
            <InfoRow label="Unidade consumidora" value={device.consumerUnitName} />
            <View className="h-px bg-border my-3" />
            <InfoRow
              label="Última leitura"
              value={formatElapsed(device.lastSeenAt)}
            />
            <View className="h-px bg-border my-3" />
            <InfoRow
              label="Instalado em"
              value={formatInstalledDate(device.installedAt)}
            />
          </Card>
        </View>
      </View>

      <ConfirmDialog
        visible={isDeleteDialogVisible}
        title="Excluir dispositivo"
        description="Essa ação também excluirá todo o histórico de leituras e consumo registrado para este dispositivo. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        isLoading={isRemoving}
        onConfirm={handleRemove}
        onCancel={() => setIsDeleteDialogVisible(false)}
      />
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-muted-foreground">{label}</Text>
      <Text className="font-bold text-foreground">{value}</Text>
    </View>
  );
}
