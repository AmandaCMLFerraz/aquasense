import { vars } from "nativewind";
import * as React from "react";
import { useColorScheme as useSystemColorScheme, View } from "react-native";

export type ThemePreference = "light" | "dark" | "system";
type ResolvedScheme = "light" | "dark";

const LIGHT_VARS = vars({
  background: "222 62% 96%",
  foreground: "214 57% 13%",
  card: "0 0% 100%",
  "card-foreground": "214 57% 13%",
  secondary: "220 50% 93%",
  "secondary-foreground": "214 57% 13%",
  muted: "220 50% 93%",
  "muted-foreground": "214 17% 43%",
  "subtle-foreground": "213 17% 59%",
  primary: "216 82% 49%",
  "primary-foreground": "0 0% 100%",
  "primary-soft": "218 84% 93%",
  accent: "216 82% 49%",
  "accent-foreground": "0 0% 100%",
  success: "160 84% 34%",
  "success-foreground": "0 0% 100%",
  "success-soft": "153 61% 90%",
  warning: "37 91% 37%",
  "warning-foreground": "0 0% 100%",
  "warning-soft": "37 84% 90%",
  destructive: "347 77% 50%",
  "destructive-foreground": "0 0% 100%",
  "destructive-soft": "346 79% 93%",
  border: "217 43% 90%",
  input: "217 43% 90%",
  ring: "216 82% 49%",
  track: "220 50% 93%",
  "chart-normal": "216 82% 49%",
  "chart-above": "37 91% 37%",
  "chart-peak": "347 77% 50%",
  "chart-goal": "160 84% 34%",
  "chart-grid": "220 33% 95%",
});

const DARK_VARS = vars({
  background: "214 51% 9%",
  foreground: "214 47% 94%",
  card: "215 39% 13%",
  "card-foreground": "214 47% 94%",
  secondary: "214 34% 17%",
  "secondary-foreground": "214 47% 94%",
  muted: "214 34% 17%",
  "muted-foreground": "212 24% 68%",
  "subtle-foreground": "213 19% 54%",
  primary: "216 100% 65%",
  "primary-foreground": "211 68% 7%",
  "primary-soft": "213 56% 20%",
  accent: "216 100% 65%",
  "accent-foreground": "211 68% 7%",
  success: "159 67% 55%",
  "success-foreground": "160 59% 8%",
  "success-soft": "160 59% 14%",
  warning: "36 86% 63%",
  "warning-foreground": "37 53% 9%",
  "warning-soft": "37 53% 15%",
  destructive: "349 100% 71%",
  "destructive-foreground": "340 44% 10%",
  "destructive-soft": "340 44% 16%",
  border: "215 34% 23%",
  input: "215 34% 23%",
  ring: "216 100% 65%",
  track: "211 30% 19%",
  "chart-normal": "216 100% 65%",
  "chart-above": "36 86% 63%",
  "chart-peak": "349 100% 71%",
  "chart-goal": "159 67% 55%",
  "chart-grid": "215 34% 20%",
});

type AppThemeContextValue = {
  preference: ThemePreference;
  resolvedScheme: ResolvedScheme;
  setPreference: (preference: ThemePreference) => void;
};

const AppThemeContext = React.createContext<AppThemeContextValue | null>(
  null,
);

export function AppThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreference] = React.useState<ThemePreference>(
    "system",
  );

  const resolvedScheme: ResolvedScheme =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const value = React.useMemo<AppThemeContextValue>(
    () => ({ preference, resolvedScheme, setPreference }),
    [preference, resolvedScheme],
  );

  return (
    <AppThemeContext.Provider value={value}>
      <View
        className="flex-1"
        style={resolvedScheme === "dark" ? DARK_VARS : LIGHT_VARS}
      >
        {children}
      </View>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = React.useContext(AppThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within an AppThemeProvider");
  }

  return context;
}
