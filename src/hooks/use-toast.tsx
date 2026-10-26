import * as React from "react";
import { Pressable, Text } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/utils/cn";

type ToastVariant = "error" | "success";

type ToastState = { id: number; message: string; variant: ToastVariant };

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const TOAST_DURATION_MS = 3000;

const VARIANT_STYLES: Record<ToastVariant, string> = {
  error: "bg-destructive",
  success: "bg-success",
};

const VARIANT_TEXT_STYLES: Record<ToastVariant, string> = {
  error: "text-destructive-foreground",
  success: "text-success-foreground",
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const insets = useSafeAreaInsets();
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  const showToast = React.useCallback(
    (message: string, variant: ToastVariant = "error") => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const id = Date.now();
      setToast({ id, message, variant });
      timeoutRef.current = setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, TOAST_DURATION_MS);
    },
    [],
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({ showToast }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(250)}
          exiting={FadeOutUp.duration(200)}
          className="absolute left-4 right-4 items-center"
          style={{ top: insets.top + 12 }}
        >
          <Pressable
            onPress={dismiss}
            className={cn(
              "max-w-full rounded-md px-4 py-3 shadow-md",
              VARIANT_STYLES[toast.variant],
            )}
          >
            <Text
              className={cn(
                "text-center text-sm font-bold",
                VARIANT_TEXT_STYLES[toast.variant],
              )}
            >
              {toast.message}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
