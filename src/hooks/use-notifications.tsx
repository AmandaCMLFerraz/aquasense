import { router } from "expo-router";
import * as React from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  notificationsApi,
  type ApiNotification,
  type NotificationType,
} from "@/lib/api";
import {
  onNotificationOpened,
  onPushTokenRefresh,
  registerPushToken,
} from "@/lib/push";

export type AlertCategory = "vazamento" | "limite" | "sensor";
export type AlertSeverity = "critical" | "warning" | "success";

export type AlertItem = {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
};

const POLL_INTERVAL_MS = 5000;
const EMPTY_ALERTS: AlertItem[] = [];

const TYPE_CONFIG: Record<
  NotificationType,
  { category: AlertCategory; severity: AlertSeverity }
> = {
  possible_leak: { category: "vazamento", severity: "critical" },
  excessive_consumption: { category: "limite", severity: "warning" },
  communication_failure: { category: "sensor", severity: "warning" },
  device_recovered: { category: "sensor", severity: "success" },
};

function formatTimestamp(isoDate: string) {
  const date = new Date(isoDate);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const time = date
    .toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    .replace(":", "h");

  if (date.toDateString() === now.toDateString()) return `Hoje · ${time}`;
  if (date.toDateString() === yesterday.toDateString()) {
    return `Ontem · ${time}`;
  }

  const day = date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
  return `${day.replace(".", "")} · ${time}`;
}

function toAlertItem(notification: ApiNotification): AlertItem {
  const config = TYPE_CONFIG[notification.type];

  return {
    id: notification._id,
    category: config.category,
    severity: config.severity,
    title: notification.title,
    description: notification.message,
    timestamp: formatTimestamp(notification.createdAt),
    unread: !notification.read,
  };
}

type NotificationsContextValue = {
  alerts: AlertItem[];
  unreadCount: number;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
};

const NotificationsContext =
  React.createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken } = useAuth();
  const [fetchedAlerts, setAlerts] = React.useState<AlertItem[]>([]);
  const alerts = accessToken ? fetchedAlerts : EMPTY_ALERTS;

  const load = React.useCallback(async () => {
    if (!accessToken) return;

    try {
      const data = await notificationsApi.list(accessToken);
      setAlerts(data.map(toAlertItem));
    } catch {
    }
  }, [accessToken]);

  React.useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(load, POLL_INTERVAL_MS);
    const first = setTimeout(load, 0);
    return () => {
      clearInterval(interval);
      clearTimeout(first);
    };
  }, [accessToken, load]);

  React.useEffect(() => {
    if (!accessToken) return;

    void registerPushToken(accessToken);
    const stopRefresh = onPushTokenRefresh(accessToken);
    const stopOpened = onNotificationOpened(() =>
      router.push("/notifications"),
    );
    return () => {
      stopRefresh();
      stopOpened();
    };
  }, [accessToken]);

  const markAllRead = React.useCallback(() => {
    if (!accessToken) return;

    setAlerts((current) =>
      current.map((alert) => ({ ...alert, unread: false })),
    );
    notificationsApi.markAllAsRead(accessToken).catch(() => void load());
  }, [accessToken, load]);

  const markAsRead = React.useCallback(
    (id: string) => {
      if (!accessToken) return;

      setAlerts((current) =>
        current.map((alert) =>
          alert.id === id ? { ...alert, unread: false } : alert,
        ),
      );
      notificationsApi.markAsRead(accessToken, id).catch(() => void load());
    },
    [accessToken, load],
  );

  const unreadCount = alerts.filter((alert) => alert.unread).length;

  const value = React.useMemo<NotificationsContextValue>(
    () => ({ alerts, unreadCount, markAllRead, markAsRead }),
    [alerts, unreadCount, markAllRead, markAsRead],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = React.useContext(NotificationsContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }

  return context;
}
