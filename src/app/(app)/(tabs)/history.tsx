import { useFocusEffect } from "expo-router";
import { ArrowDown, ArrowUp, CalendarDays } from "lucide-react-native";
import {
  type ComponentRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "@/components/ui/card";
import { HistoryDatePicker } from "@/components/ui/history-date-picker";
import { ResidenceSelector } from "@/components/residence-selector";
import { useAuth } from "@/hooks/use-auth";
import { useSelectedResidence } from "@/hooks/use-selected-residence";
import { useTabBarClearance } from "@/hooks/use-tab-bar-clearance";
import { useToast } from "@/hooks/use-toast";
import {
  consumptionApi,
  type HistoryPeriod,
  type HistorySummary,
} from "@/lib/api";
import { cn } from "@/utils/cn";
import { formatLiters } from "@/utils/format-liters";
import { useThemeColors } from "@/utils/colors";
import { formatPeriodLabel, toDateParam } from "@/utils/history-date";

const PERIODS: { key: HistoryPeriod; label: string }[] = [
  { key: "dia", label: "Dia" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mês" },
  { key: "ano", label: "Ano" },
];

const PERIOD_TITLE: Record<HistoryPeriod, string> = {
  dia: "Consumo do dia",
  semana: "Consumo da semana",
  mes: "Consumo do mês",
  ano: "Consumo do ano",
};

const CHART_MAX_HEIGHT = 120;
const MONTH_BAR_WIDTH = 28;
const CHART_GAP = 8;
const HOURS_PER_BUCKET = 1;

function getCurrentBucketIndex(
  period: HistoryPeriod,
  reference: Date,
  today: Date,
) {
  if (period === "dia") {
    return reference.toDateString() === today.toDateString()
      ? Math.floor(new Date().getHours() / HOURS_PER_BUCKET)
      : undefined;
  }

  if (period === "semana") {
    const mondayOf = (date: Date) =>
      new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - ((date.getDay() + 6) % 7),
      ).getTime();
    return mondayOf(reference) === mondayOf(today)
      ? (today.getDay() + 6) % 7
      : undefined;
  }

  if (period === "ano") {
    return reference.getFullYear() === today.getFullYear()
      ? today.getMonth()
      : undefined;
  }

  return reference.getFullYear() === today.getFullYear() &&
    reference.getMonth() === today.getMonth()
    ? today.getDate() - 1
    : undefined;
}
const SEGMENTED_CONTROL_PADDING = 4;

const STATUS_BAR_CLASSNAME = {
  normal: "bg-chart-normal",
  above: "bg-chart-above",
  peak: "bg-chart-peak",
};

const LEGEND_ITEMS = [
  { label: "Atual", dotClassName: "bg-primary" },
  { label: "Normal", dotClassName: "bg-chart-normal" },
  { label: "Acima do esperado", dotClassName: "bg-chart-above" },
  { label: "Pico", dotClassName: "bg-chart-peak" },
];

export default function HistoryScreen() {
  const colors = useThemeColors();
  const tabBarClearance = useTabBarClearance();
  const { accessToken } = useAuth();
  const { units, selectedUnitId } = useSelectedResidence();
  const { showToast } = useToast();
  const [period, setPeriod] = useState<HistoryPeriod>("semana");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, HistorySummary>>(
    {},
  );
  const [segmentedControlWidth, setSegmentedControlWidth] = useState(0);
  const selectedPeriodIndex = PERIODS.findIndex(({ key }) => key === period);
  const today = useMemo(() => new Date(), []);
  const chartScrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const autoScrolledMonthRef = useRef<string | null>(null);
  const [chartViewportWidth, setChartViewportWidth] = useState(0);
  const [selection, setSelection] = useState<{
    scope: string;
    index: number;
  } | null>(null);
  const selectionScope = `${period}-${referenceDate.getTime()}`;
  const selectedIndex =
    selection?.scope === selectionScope ? selection.index : null;

  const handleSegmentedControlLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setSegmentedControlWidth(event.nativeEvent.layout.width);
    },
    [],
  );

  const segmentWidth =
    (segmentedControlWidth - SEGMENTED_CONTROL_PADDING * 2) / PERIODS.length;

  const summaryKeyOf = useCallback(
    (targetPeriod: HistoryPeriod, targetDate: Date) =>
      `${selectedUnitId ?? "all"}|${targetPeriod}|${toDateParam(targetDate)}`,
    [selectedUnitId],
  );

  const loadHistory = useCallback(
    async (targetPeriod: HistoryPeriod, targetDate: Date) => {
      if (!accessToken) return;

      try {
        const data = await consumptionApi.getHistory(
          accessToken,
          targetPeriod,
          toDateParam(targetDate),
          selectedUnitId ?? undefined,
        );
        const key = summaryKeyOf(targetPeriod, targetDate);
        setSummaries((current) => ({ ...current, [key]: data }));
      } catch {
        showToast("Não foi possível carregar o histórico de consumo.");
      }
    },
    [accessToken, selectedUnitId, showToast, summaryKeyOf],
  );

  // Mostra o último resultado deste período/data (se houver) enquanto o novo
  // carrega; sem cache, exibe um indicador em vez de barras do período anterior.
  const summary = summaries[summaryKeyOf(period, referenceDate)] ?? null;
  const isLoading = summary === null;

  useFocusEffect(
    useCallback(() => {
      loadHistory(period, referenceDate);
    }, [loadHistory, period, referenceDate]),
  );

  const isMonth = period === "mes";
  const isScrollable = isMonth || period === "dia";
  const currentBucketIndex = getCurrentBucketIndex(
    period,
    referenceDate,
    today,
  );

  const scrollChartToCurrent = useCallback(
    (contentWidth: number) => {
      if (!isScrollable) {
        autoScrolledMonthRef.current = null;
        return;
      }
      if (chartViewportWidth === 0 || contentWidth <= chartViewportWidth)
        return;

      const monthKey = `${period}-${referenceDate.getFullYear()}-${referenceDate.getMonth()}-${referenceDate.getDate()}`;
      if (autoScrolledMonthRef.current === monthKey) return;
      autoScrolledMonthRef.current = monthKey;

      const barCenter =
        (currentBucketIndex ?? 0) * (MONTH_BAR_WIDTH + CHART_GAP) +
        MONTH_BAR_WIDTH / 2;
      const maxX = Math.max(0, contentWidth - chartViewportWidth);
      const barStart =
        (currentBucketIndex ?? 0) * (MONTH_BAR_WIDTH + CHART_GAP);
      const target =
        period === "dia" ? barStart : barCenter - chartViewportWidth / 2;
      const x = Math.min(maxX, Math.max(0, target));
      chartScrollRef.current?.scrollTo({ x, animated: false });
    },
    [
      isScrollable,
      period,
      chartViewportWidth,
      currentBucketIndex,
      referenceDate,
    ],
  );
  const buckets = summary?.buckets ?? [];
  const bucketName = (label: string) => (isMonth ? `Dia ${label}` : label);
  const selectedBucket =
    selectedIndex !== null ? (buckets[selectedIndex] ?? null) : null;
  const maxLiters = Math.max(1, ...buckets.map(({ liters }) => liters));

  const bucketsWithData = buckets.filter(({ liters }) => liters > 0);
  const peakBucket = bucketsWithData.reduce<(typeof buckets)[number] | null>(
    (max, bucket) => (!max || bucket.liters > max.liters ? bucket : max),
    null,
  );
  const lowestBucket = bucketsWithData.reduce<(typeof buckets)[number] | null>(
    (min, bucket) => (!min || bucket.liters < min.liters ? bucket : min),
    null,
  );

  const highlights = [
    peakBucket
      ? {
          id: "peak",
          icon: ArrowUp,
          colorKey: "warning" as const,
          iconBgClassName: "bg-warning-soft",
          title: `${bucketName(peakBucket.label)} foi o pico do período`,
          description: `${formatLiters(peakBucket.liters)}, o maior valor registrado.`,
        }
      : undefined,
    lowestBucket && lowestBucket !== peakBucket
      ? {
          id: "lowest",
          icon: ArrowDown,
          colorKey: "success" as const,
          iconBgClassName: "bg-success-soft",
          title: `${bucketName(lowestBucket.label)} teve o menor consumo`,
          description: `${formatLiters(lowestBucket.liters)}, dentro do esperado.`,
        }
      : undefined,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-background"
    >
      <View className="px-screen pt-4">
        <Text className="text-2xl font-bold text-foreground">Histórico</Text>
        <Text className="text-muted-foreground mt-1">
          Veja como seu consumo mudou ao longo do tempo.
        </Text>
      </View>

      {units.length > 1 && (
        <View className="px-screen mt-4">
          <ResidenceSelector />
        </View>
      )}

      <View
        onLayout={handleSegmentedControlLayout}
        className="flex-row rounded-md bg-secondary p-1 mx-screen mt-4 mb-4"
      >
        {segmentedControlWidth > 0 && (
          <View
            pointerEvents="none"
            className="absolute rounded-sm bg-card shadow-sm"
            style={{
              top: SEGMENTED_CONTROL_PADDING,
              bottom: SEGMENTED_CONTROL_PADDING,
              left:
                SEGMENTED_CONTROL_PADDING + selectedPeriodIndex * segmentWidth,
              width: segmentWidth,
            }}
          />
        )}

        {PERIODS.map(({ key, label }) => {
          const isSelected = period === key;

          return (
            <Pressable
              key={key}
              onPress={() => setPeriod(key)}
              className="flex-1 items-center justify-center rounded-sm py-2 active:opacity-80"
            >
              <Text
                className={cn(
                  "text-sm font-bold",
                  isSelected ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-1" style={{ paddingBottom: tabBarClearance }}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-screen gap-4"
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-overline font-bold uppercase text-muted-foreground">
                  {PERIOD_TITLE[period]}
                </Text>
                <Pressable
                  onPress={() => setDatePickerVisible(true)}
                  className="flex-row items-center gap-1 mt-1 self-start active:opacity-70"
                >
                  <CalendarDays size={14} color={colors.primary} />
                  <Text className="text-xs font-bold text-primary">
                    {formatPeriodLabel(period, referenceDate, today)}
                  </Text>
                </Pressable>
              </View>
              <View className="rounded-pill bg-warning-soft px-2 py-1">
                <Text className="text-xs font-bold text-warning">
                  {(summary?.changePercent ?? 0) > 0 ? "+" : ""}
                  {summary?.changePercent ?? 0}%
                </Text>
              </View>
            </View>

            <Text className="text-metric font-bold text-foreground mt-1">
              {formatLiters(summary?.totalLiters ?? 0)}
            </Text>

            {!isLoading && (
              <Text className="text-sm text-muted-foreground mt-1">
                {selectedBucket
                  ? `${bucketName(selectedBucket.label)}: ${formatLiters(selectedBucket.liters)}`
                  : "Toque em uma barra para ver o valor exato"}
              </Text>
            )}

            {isLoading ? (
              <View
                className="mt-6 items-center justify-center"
                style={{ height: CHART_MAX_HEIGHT + 24 }}
              >
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <ScrollView
                ref={chartScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                onLayout={(event) =>
                  setChartViewportWidth(event.nativeEvent.layout.width)
                }
                onContentSizeChange={scrollChartToCurrent}
                className="mt-6 flex-none"
                contentContainerClassName="items-end gap-2"
                contentContainerStyle={
                  isScrollable ? undefined : { width: chartViewportWidth }
                }
              >
                {buckets.map(({ label, liters, status }, index) => (
                  <Pressable
                    key={label}
                    onPress={() =>
                      setSelection(
                        selectedIndex === index
                          ? null
                          : { scope: selectionScope, index },
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${bucketName(label)}: ${formatLiters(liters)}`}
                    className={cn(
                      "items-center gap-2",
                      !isScrollable && "flex-1",
                    )}
                    style={[
                      isScrollable ? { width: MONTH_BAR_WIDTH } : undefined,
                      selectedIndex !== null && selectedIndex !== index
                        ? { opacity: 0.45 }
                        : undefined,
                    ]}
                  >
                    <View
                      className="w-full items-center justify-end"
                      style={{ height: CHART_MAX_HEIGHT }}
                    >
                      <View
                        className={cn(
                          "w-full max-w-[28px] rounded-sm",
                          index === currentBucketIndex
                            ? "bg-primary"
                            : STATUS_BAR_CLASSNAME[status],
                        )}
                        style={{
                          height: Math.max(
                            2,
                            (liters / maxLiters) * CHART_MAX_HEIGHT,
                          ),
                        }}
                      />
                    </View>
                    <Text
                      className={cn(
                        "text-xs",
                        index === currentBucketIndex
                          ? "font-bold text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2 mt-4">
              {LEGEND_ITEMS.map(({ label, dotClassName }) => (
                <View key={label} className="flex-row items-center gap-2">
                  <View className={cn("h-2 w-2 rounded-full", dotClassName)} />
                  <Text className="text-xs text-muted-foreground">{label}</Text>
                </View>
              ))}
            </View>
          </Card>

          {highlights.length > 0 && (
            <Text className="text-title3 font-bold text-foreground">
              O que chamou atenção
            </Text>
          )}

          {highlights.map(
            ({
              id,
              icon: Icon,
              colorKey,
              iconBgClassName,
              title,
              description,
            }) => (
              <Card key={id} className="flex-row items-center gap-3">
                <View
                  className={cn(
                    "h-10 w-10 items-center justify-center rounded-sm",
                    iconBgClassName,
                  )}
                >
                  <Icon size={18} color={colors[colorKey]} />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-foreground">{title}</Text>
                  <Text className="text-footnote text-muted-foreground mt-0.5">
                    {description}
                  </Text>
                </View>
              </Card>
            ),
          )}
        </ScrollView>
      </View>

      <HistoryDatePicker
        visible={isDatePickerVisible}
        period={period}
        value={referenceDate}
        onChange={setReferenceDate}
        onClose={() => setDatePickerVisible(false)}
      />
    </SafeAreaView>
  );
}
