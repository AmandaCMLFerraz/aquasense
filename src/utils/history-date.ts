import type { HistoryPeriod } from "@/lib/api";

export const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const MONTH_LABELS_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export function atMidnight(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeekMonday(date: Date): Date {
  const midnight = atMidnight(date);
  const day = midnight.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  midnight.setDate(midnight.getDate() + diffToMonday);
  return midnight;
}

export function isInSameWeek(a: Date, b: Date): boolean {
  return isSameDay(startOfWeekMonday(a), startOfWeekMonday(b));
}

export function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDay(date: Date): string {
  return `${date.getDate()} de ${MONTH_LABELS_SHORT[date.getMonth()]}`;
}

export function formatPeriodLabel(
  period: HistoryPeriod,
  date: Date,
  today: Date,
): string {
  if (period === "dia") {
    if (isSameDay(date, today)) return "Hoje";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (isSameDay(date, yesterday)) return "Ontem";
    return formatDay(date);
  }

  if (period === "semana") {
    if (isInSameWeek(date, today)) return "Esta semana";
    const weekStart = startOfWeekMonday(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${formatDay(weekStart)} a ${formatDay(weekEnd)}`;
  }

  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  ) {
    return "Este mês";
  }
  return `${MONTH_LABELS[date.getMonth()]} de ${date.getFullYear()}`;
}
