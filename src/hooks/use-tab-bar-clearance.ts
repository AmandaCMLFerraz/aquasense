import {
  TAB_BAR_BOTTOM_MARGIN,
  TAB_BAR_DROPLET_SIZE,
  TAB_BAR_HEIGHT,
} from "@/components/ui/tab-bar-metrics";

const EXTRA_BREATHING_ROOM = 5

export function useTabBarClearance() {
  return (
    TAB_BAR_BOTTOM_MARGIN +
    TAB_BAR_HEIGHT +
    TAB_BAR_DROPLET_SIZE / 2 +
    EXTRA_BREATHING_ROOM
  );
}
