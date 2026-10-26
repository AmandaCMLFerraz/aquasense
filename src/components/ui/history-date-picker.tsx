import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import type { HistoryPeriod } from "@/lib/api";
import { cn } from "@/utils/cn";
import { useThemeColors } from "@/utils/colors";
import {
  atMidnight,
  isInSameWeek,
  isSameDay,
  MONTH_LABELS,
  MONTH_LABELS_SHORT,
} from "@/utils/history-date";

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export type HistoryDatePickerProps = {
  visible: boolean;
  period: HistoryPeriod;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
};

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayIndex = (firstOfMonth.getDay() + 6) % 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < mondayIndex; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

function isAfterToday(date: Date, today: Date): boolean {
  return date.getTime() > today.getTime();
}

function HistoryDatePicker({
  visible,
  period,
  value,
  onChange,
  onClose,
}: HistoryDatePickerProps) {
  const colors = useThemeColors();
  const today = useMemo(() => atMidnight(new Date()), []);
  const [viewDate, setViewDate] = useState(() => atMidnight(value));
  const [wasVisible, setWasVisible] = useState(visible);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setViewDate(atMidnight(value));
  }

  const isMonthMode = period === "mes";
  const isWeekMode = period === "semana";

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const canGoToNextMonth =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth < today.getMonth());
  const canGoToNextYear = viewYear < today.getFullYear();

  const monthGrid = useMemo(
    () => (isMonthMode ? [] : buildMonthGrid(viewYear, viewMonth)),
    [isMonthMode, viewYear, viewMonth],
  );

  function goToPreviousStep() {
    setViewDate((current) => {
      const next = new Date(current);
      if (isMonthMode) next.setFullYear(next.getFullYear() - 1);
      else next.setMonth(next.getMonth() - 1);
      return next;
    });
  }

  function goToNextStep() {
    if (isMonthMode ? !canGoToNextYear : !canGoToNextMonth) return;
    setViewDate((current) => {
      const next = new Date(current);
      if (isMonthMode) next.setFullYear(next.getFullYear() + 1);
      else next.setMonth(next.getMonth() + 1);
      return next;
    });
  }

  function selectDay(date: Date) {
    if (isAfterToday(date, today)) return;
    onChange(date);
    onClose();
  }

  function selectMonth(monthIndex: number) {
    const isCurrentMonth =
      viewYear === today.getFullYear() && monthIndex === today.getMonth();

    const monthDate = isCurrentMonth
      ? today
      : new Date(viewYear, monthIndex + 1, 0);

    if (isAfterToday(monthDate, today)) return;
    onChange(monthDate);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-8"
        onPress={onClose}
      >
        <Pressable
          className="w-full rounded-xl border border-border bg-card p-card shadow-sm"
          onPress={(event) => event.stopPropagation()}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={goToPreviousStep}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full active:opacity-70"
            >
              <ChevronLeft size={20} color={colors.mutedForeground} />
            </Pressable>

            <Text className="text-callout font-bold text-foreground">
              {isMonthMode
                ? viewYear
                : `${MONTH_LABELS[viewMonth]} de ${viewYear}`}
            </Text>

            <Pressable
              onPress={goToNextStep}
              disabled={isMonthMode ? !canGoToNextYear : !canGoToNextMonth}
              hitSlop={8}
              className={cn(
                "h-8 w-8 items-center justify-center rounded-full active:opacity-70",
                (isMonthMode ? !canGoToNextYear : !canGoToNextMonth) &&
                  "opacity-30",
              )}
            >
              <ChevronRight size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {isMonthMode ? (
            <View className="flex-row flex-wrap">
              {MONTH_LABELS_SHORT.map((label, monthIndex) => {
                const monthDate = new Date(viewYear, monthIndex, 1);
                const isSelected =
                  viewYear === value.getFullYear() &&
                  monthIndex === value.getMonth();
                const isDisabled = isAfterToday(monthDate, today);

                return (
                  <View key={label} className="w-1/3 p-1">
                    <Pressable
                      onPress={() => selectMonth(monthIndex)}
                      disabled={isDisabled}
                      className={cn(
                        "items-center justify-center rounded-md py-3 active:opacity-70",
                        isSelected ? "bg-primary" : "bg-secondary",
                        isDisabled && "opacity-30",
                      )}
                    >
                      <Text
                        className={cn(
                          "text-sm font-bold capitalize",
                          isSelected
                            ? "text-primary-foreground"
                            : "text-foreground",
                        )}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : (
            <View>
              <View className="flex-row">
                {WEEKDAY_LABELS.map((label) => (
                  <View key={label} className="flex-1 items-center py-1">
                    <Text className="text-xs font-bold text-muted-foreground">
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {monthGrid.map((row, rowIndex) => {
                const rowHighlighted =
                  isWeekMode &&
                  row.some((date) => date && isInSameWeek(date, value));

                return (
                  <View
                    key={rowIndex}
                    className={cn(
                      "flex-row rounded-md",
                      rowHighlighted && "bg-primary-soft",
                    )}
                  >
                    {row.map((date, cellIndex) => {
                      if (!date) {
                        return <View key={cellIndex} className="flex-1 py-1" />;
                      }

                      const isSelected = isSameDay(date, value);
                      const isToday = isSameDay(date, today);
                      const isDisabled = isAfterToday(date, today);

                      return (
                        <View
                          key={cellIndex}
                          className="flex-1 items-center py-1"
                        >
                          <Pressable
                            onPress={() => selectDay(date)}
                            disabled={isDisabled}
                            className={cn(
                              "h-9 w-9 items-center justify-center rounded-full active:opacity-70",
                              isSelected && "bg-primary",
                              !isSelected && isToday && "border border-primary",
                              isDisabled && "opacity-30",
                            )}
                          >
                            <Text
                              className={cn(
                                "text-sm font-bold",
                                isSelected
                                  ? "text-primary-foreground"
                                  : "text-foreground",
                              )}
                            >
                              {date.getDate()}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export { HistoryDatePicker };
