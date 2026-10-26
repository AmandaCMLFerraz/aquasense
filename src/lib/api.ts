const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const { method = "GET", body, token } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      (Array.isArray(data?.message) ? data.message[0] : data?.message) ??
      "Não foi possível completar a solicitação.";
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = { user: AuthUser } & AuthTokens;

export const authApi = {
  register(name: string, email: string, password: string) {
    return request<{ message: string }>("/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
  },

  login(email: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },

  forgotPassword(email: string) {
    return request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  },

  resetPassword(email: string, code: string, newPassword: string) {
    return request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: { email, code, newPassword },
    });
  },

  verifyEmail(email: string, code: string) {
    return request<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: { email, code },
    });
  },

  resendVerification(email: string) {
    return request<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: { email },
    });
  },

  refresh(refreshToken: string) {
    return request<AuthTokens>("/auth/refresh", {
      method: "POST",
      token: refreshToken,
    });
  },

  logout(accessToken: string) {
    return request<void>("/auth/logout", {
      method: "POST",
      token: accessToken,
    });
  },

  profile(accessToken: string) {
    return request<AuthUser & { createdAt: string; updatedAt: string }>(
      "/users/profile",
      { token: accessToken },
    );
  },

  deleteAccount(accessToken: string) {
    return request<void>("/users/profile", {
      method: "DELETE",
      token: accessToken,
    });
  },
};

export type DeviceStatus = "online" | "offline";

export type Device = {
  id: string;
  consumerUnitId: string;
  name: string;
  description: string | null;
  identifier: string;
  status: DeviceStatus;
  currentFlowRate: number | null;
  todayConsumption: number;
  lastSeenAt: string | null;
};

export type CreateDeviceInput = {
  identifier: string;
  name: string;
  description: string;
  calibrationFactor: number;
  consumerUnitId?: string;
};

export type UpdateDeviceInput = {
  name: string;
  description: string;
  calibrationFactor: number;
  consumerUnitId: string;
};

export type DeviceFlowSample = {
  timestamp: string;
  flowRate: number;
};

export type DeviceDetail = Device & {
  consumerUnitName: string;
  calibrationFactor: number;
  installedAt: string;
  weekConsumption: number;
  flowHistory: DeviceFlowSample[];
};

export const devicesApi = {
  list(token: string) {
    return request<Device[]>("/devices", { token });
  },

  get(token: string, deviceId: string) {
    return request<DeviceDetail>(`/devices/${deviceId}`, { token });
  },

  create(token: string, input: CreateDeviceInput) {
    return request<Device>("/devices", {
      method: "POST",
      body: input,
      token,
    });
  },

  update(token: string, deviceId: string, input: UpdateDeviceInput) {
    return request<Device>(`/devices/${deviceId}`, {
      method: "PATCH",
      body: input,
      token,
    });
  },

  remove(token: string, deviceId: string) {
    return request<void>(`/devices/${deviceId}`, {
      method: "DELETE",
      token,
    });
  },
};

export type Address = {
  street: string;
  number: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode?: string;
};

export type ConsumerUnit = {
  id: string;
  name: string;
  address: Address;
  numberResidents: number;
  dailyConsumptionLimit: number;
  hourlyConsumptionLimit: number;
  leakDurationMinutes: number;
  deviceCount: number;
};

export type ConsumerUnitInput = {
  name: string;
  address: Address;
  numberResidents: number;
  dailyConsumptionLimit: number;
  hourlyConsumptionLimit: number;
  leakDurationMinutes: number;
};

export const consumerUnitsApi = {
  list(token: string) {
    return request<ConsumerUnit[]>("/consumer-units", { token });
  },

  get(token: string, consumerUnitId: string) {
    return request<ConsumerUnit>(`/consumer-units/${consumerUnitId}`, {
      token,
    });
  },

  create(token: string, input: ConsumerUnitInput) {
    return request<ConsumerUnit>("/consumer-units", {
      method: "POST",
      body: input,
      token,
    });
  },

  update(token: string, consumerUnitId: string, input: ConsumerUnitInput) {
    return request<ConsumerUnit>(`/consumer-units/${consumerUnitId}`, {
      method: "PATCH",
      body: input,
      token,
    });
  },

  remove(token: string, consumerUnitId: string) {
    return request<void>(`/consumer-units/${consumerUnitId}`, {
      method: "DELETE",
      token,
    });
  },
};

export type DashboardSummary = {
  todayLiters: number;
  dailyLimit: number;
  currentFlowRate: number;
  weeklyAverageLiters: number;
  weeklyChangePercent: number;
  monthSavingsLiters: number;
};

export type HistoryPeriod = "dia" | "semana" | "mes";
export type BucketStatus = "normal" | "above" | "peak";

export type HistoryBucket = {
  label: string;
  liters: number;
  status: BucketStatus;
};

export type HistorySummary = {
  totalLiters: number;
  changePercent: number;
  dailyLimit: number;
  buckets: HistoryBucket[];
};

export const consumptionApi = {
  getDashboard(token: string, consumerUnitId?: string) {
    const query = consumerUnitId ? `?consumerUnitId=${consumerUnitId}` : "";
    return request<DashboardSummary>(
      `/consumption-records/dashboard${query}`,
      { token },
    );
  },

  getHistory(
    token: string,
    period: HistoryPeriod,
    date?: string,
    consumerUnitId?: string,
  ) {
    const dateParam = date ? `&date=${date}` : "";
    const unitParam = consumerUnitId ? `&consumerUnitId=${consumerUnitId}` : "";
    return request<HistorySummary>(
      `/consumption-records/history?period=${period}${dateParam}${unitParam}`,
      { token },
    );
  },
};

export { request as apiRequest };

export type NotificationType =
  | "excessive_consumption"
  | "possible_leak"
  | "communication_failure"
  | "device_recovered";

export type ApiNotification = {
  _id: string;
  deviceId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export const notificationsApi = {
  list(token: string) {
    return request<ApiNotification[]>("/notifications", { token });
  },

  markAsRead(token: string, notificationId: string) {
    return request<void>(`/notifications/${notificationId}/read`, {
      method: "PATCH",
      token,
    });
  },

  markAllAsRead(token: string) {
    return request<void>("/notifications/read-all", {
      method: "PATCH",
      token,
    });
  },
};
