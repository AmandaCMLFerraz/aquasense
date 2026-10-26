import { useAppTheme } from "@/hooks/use-app-theme";

const COLORS = {
  light: {
    primary: "hsl(216, 82%, 49%)",
    mutedForeground: "hsl(214, 17%, 43%)",
    card: "hsl(0, 0%, 100%)",
    border: "hsl(217, 43%, 90%)",
    track: "hsl(220, 50%, 93%)",
    destructive: "hsl(347, 77%, 50%)",
    warning: "hsl(37, 91%, 37%)",
    success: "hsl(160, 84%, 34%)",
  },
  dark: {
    primary: "hsl(216, 100%, 65%)",
    mutedForeground: "hsl(212, 24%, 68%)",
    card: "hsl(215, 39%, 13%)",
    border: "hsl(215, 34%, 23%)",
    track: "hsl(211, 30%, 19%)",
    destructive: "hsl(349, 100%, 71%)",
    warning: "hsl(36, 86%, 63%)",
    success: "hsl(159, 67%, 55%)",
  },
} as const;

export function useThemeColors() {
  const { resolvedScheme } = useAppTheme();
  return COLORS[resolvedScheme];
}
