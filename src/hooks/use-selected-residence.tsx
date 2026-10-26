import * as SecureStore from "expo-secure-store";
import * as React from "react";
import { Platform } from "react-native";

import { consumerUnitsApi, type ConsumerUnit } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

const SELECTED_UNIT_KEY = "aquasense.selectedConsumerUnitId";

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

type SelectedResidenceContextValue = {
  units: ConsumerUnit[];
  isLoading: boolean;
  selectedUnitId: string | null;
  setSelectedUnitId: (unitId: string | null) => void;
};

const SelectedResidenceContext =
  React.createContext<SelectedResidenceContextValue | null>(null);

export function SelectedResidenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken } = useAuth();
  const [units, setUnits] = React.useState<ConsumerUnit[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedUnitId, setSelectedUnitIdState] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    (async () => {
      const stored = await secureStorage.getItem(SELECTED_UNIT_KEY);
      if (stored) {
        setSelectedUnitIdState(stored);
      }
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      if (!accessToken) {
        setUnits([]);
        return;
      }

      setIsLoading(true);
      try {
        const data = await consumerUnitsApi.list(accessToken);
        setUnits(data);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [accessToken]);

  const isSelectionValid =
    selectedUnitId === null ||
    isLoading ||
    units.some((unit) => unit.id === selectedUnitId);
  const effectiveSelectedUnitId = isSelectionValid ? selectedUnitId : null;

  React.useEffect(() => {
    if (!isSelectionValid) {
      secureStorage.deleteItem(SELECTED_UNIT_KEY);
    }
  }, [isSelectionValid]);

  const setSelectedUnitId = React.useCallback((unitId: string | null) => {
    setSelectedUnitIdState(unitId);
    if (unitId) {
      secureStorage.setItem(SELECTED_UNIT_KEY, unitId);
    } else {
      secureStorage.deleteItem(SELECTED_UNIT_KEY);
    }
  }, []);

  const value = React.useMemo<SelectedResidenceContextValue>(
    () => ({
      units,
      isLoading,
      selectedUnitId: effectiveSelectedUnitId,
      setSelectedUnitId,
    }),
    [units, isLoading, effectiveSelectedUnitId, setSelectedUnitId],
  );

  return (
    <SelectedResidenceContext.Provider value={value}>
      {children}
    </SelectedResidenceContext.Provider>
  );
}

export function useSelectedResidence() {
  const context = React.useContext(SelectedResidenceContext);

  if (!context) {
    throw new Error(
      "useSelectedResidence must be used within a SelectedResidenceProvider",
    );
  }

  return context;
}
