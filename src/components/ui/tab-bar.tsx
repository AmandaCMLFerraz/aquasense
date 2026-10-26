import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { Logo } from "@/components/logo";
import { cn } from "@/utils/cn";
import {
  TAB_BAR_BOTTOM_MARGIN,
  TAB_BAR_CORNER_RADIUS,
  TAB_BAR_DROPLET_SIZE as ICON_SIZE,
  TAB_BAR_HEIGHT as BAR_HEIGHT,
} from "@/components/ui/tab-bar-metrics";
import { useNotifications } from "@/hooks/use-notifications";
import { useThemeColors } from "@/utils/colors";

const NOTCH_RADIUS = 12.5;
const CORNER_RADIUS = TAB_BAR_CORNER_RADIUS;

const DROPLET_PATH =
  "M12,2 C15,6 19,10.5 19,15 A7,7 0 1,1 5,15 C5,10.5 9,6 12,2 Z";

const AnimatedPath = Animated.createAnimatedComponent(Path);

function buildBarPath(cx: number, width: number, height: number) {
  "worklet";

  if (width === 0) return `M0,0 H0 V${height} H0 Z`;

  const s = 0.5;
  const r = CORNER_RADIUS;
  const right = width - s;
  const bottom = height - s;

  const notchStart = cx - NOTCH_RADIUS;
  const notchEnd = cx + NOTCH_RADIUS;

  const topLeft =
    notchStart >= s + r
      ? `M${s},${s + r} A${r},${r} 0 0,1 ${s + r},${s} H${notchStart} `
      : `M${s},${s + r} Q${s},${s} ${notchStart},${s} `;
  const topRight =
    notchEnd <= right - r
      ? `H${right - r} A${r},${r} 0 0,1 ${right},${s + r} `
      : `Q${right},${s} ${right},${s + r} `;

  return (
    topLeft +
    `A${NOTCH_RADIUS},${NOTCH_RADIUS} 0 0,0 ${notchEnd},${s} ` +
    topRight +
    `V${bottom - r} A${r},${r} 0 0,1 ${right - r},${bottom} ` +
    `H${s + r} A${r},${r} 0 0,1 ${s},${bottom - r} Z`
  );
}

type TabBarOptions = {
  title?: string;
  tabBarIcon?: (props: {
    focused: boolean;
    color: string;
    size: number;
  }) => React.ReactNode;
};

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: TabBarOptions }>;
  emitter: {
    emit: (event: {
      type: "tabPress";
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
  };
  navigateToTab: (routeKey: string) => void;
};

export function TabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: TabBarProps) {
  const colors = useThemeColors();
  const { unreadCount } = useNotifications();
  const [barWidth, setBarWidth] = useState(0);
  const [tabCenters, setTabCenters] = useState<number[]>([]);
  const notchX = useSharedValue(0);

  const handleTabLayout = (index: number, x: number, width: number) => {
    setTabCenters((previous) => {
      const center = x + width / 2;
      if (previous[index] === center) return previous;

      const next = [...previous];
      next[index] = center;
      return next;
    });
  };

  useEffect(() => {
    const center = tabCenters[state.index];
    if (center === undefined) return;

    notchX.value = withSpring(center, {
      damping: 22,
      stiffness: 200,
      mass: 0.8,
    });
  }, [state.index, tabCenters, notchX]);

  const animatedPathProps = useAnimatedProps(() => ({
    d: buildBarPath(notchX.value, barWidth, BAR_HEIGHT),
  }));

  const dropletStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: notchX.value - ICON_SIZE / 2 }],
  }));

  return (
    <>
      <View
        className="absolute inset-x-0 bottom-0 items-center justify-center"
        pointerEvents="none"
        style={{ height: TAB_BAR_BOTTOM_MARGIN }}
      >
        <View style={{ opacity: 0.7 }}>
          <Logo width={64} />
        </View>
      </View>
      <View
        className="absolute left-5 right-5"
        style={{ bottom: TAB_BAR_BOTTOM_MARGIN }}
      >
        {barWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                top: -ICON_SIZE / 2,
                width: ICON_SIZE,
                height: ICON_SIZE,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1 },
              },
              dropletStyle,
            ]}
          >
            <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
              <Path d={DROPLET_PATH} fill={colors.primary} />
            </Svg>
          </Animated.View>
        )}

        <View
          onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
          style={{
            height: BAR_HEIGHT,
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          {barWidth > 0 && (
            <Svg
              width={barWidth}
              height={BAR_HEIGHT}
              style={{ position: "absolute", top: 0, left: 0 }}
            >
              <AnimatedPath
                animatedProps={animatedPathProps}
                fill={colors.card}
                stroke={colors.border}
                strokeWidth={1}
              />
            </Svg>
          )}

          <View
            className="items-center"
            style={{
              height: BAR_HEIGHT,
              flexDirection: "row",
              justifyContent: "space-evenly",
            }}
          >
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              const label = options.title ?? route.name;
              const color = isFocused ? colors.primary : colors.mutedForeground;

              const onPress = () => {
                const event = emitter.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigateToTab(route.key);
                }
              };

              const showBadge =
                route.name === "notifications" && unreadCount > 0;

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  onLayout={(event) => {
                    const { x, width } = event.nativeEvent.layout;
                    handleTabLayout(index, x, width);
                  }}
                  className="items-center justify-center gap-1 px-2"
                >
                  <View>
                    {options.tabBarIcon?.({
                      focused: isFocused,
                      color,
                      size: 22,
                    })}
                    {showBadge && (
                      <View
                        style={{
                          position: "absolute",
                          top: -4,
                          right: -6,
                          minWidth: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: colors.primary,
                          alignItems: "center",
                          justifyContent: "center",
                          paddingHorizontal: 3,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: "700",
                            color: "#fff",
                          }}
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                    className={cn(
                      "text-[10px] font-bold text-center",
                      isFocused ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </>
  );
}
