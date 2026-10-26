import * as React from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import {
  COLORS,
  DROP,
  WAVES,
  WORD_AQUA,
  WORD_SENSE,
} from "@/components/logo";
import { useAppTheme } from "@/hooks/use-app-theme";

const CYCLE_MS = 3200;

const ICON_WIDTH = 108;
const ICON_HEIGHT = ICON_WIDTH * (139 / 169);
const WORD_WIDTH = 150;
const WORD_HEIGHT = WORD_WIDTH * (104 / 632);
const BAR_WIDTH = 104;

const DROP_IN = [0, 0.12];
const WAVE_IN = [
  [0.2, 0.32], 
  [0.14, 0.26], 
  [0.08, 0.2], 
];
const WORD_IN = [0.3, 0.42];
const FADE_OUT = [0.88, 0.98];

function useEnter(
  progress: SharedValue<number>,
  [from, to]: number[],
  offsetY: number,
  fromScale = 1,
) {
  return useAnimatedStyle(() => {
    const t = interpolate(progress.value, [from, to], [0, 1], "clamp");
    return {
      opacity: t,
      transform: [
        { translateY: (1 - t) * offsetY },
        { scale: fromScale + (1 - fromScale) * t },
      ],
    };
  });
}

export function LoadingScreen() {
  const { resolvedScheme } = useAppTheme();
  const { brand, text } = COLORS[resolvedScheme];
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }),
      -1,
      false,
    );
  }, [progress]);

  const group = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, FADE_OUT, [1, 0], "clamp"),
  }));
  const dropStyle = useEnter(progress, DROP_IN, -28, 0.7);
  const outerStyle = useEnter(progress, WAVE_IN[0], 0, 0.7);
  const middleStyle = useEnter(progress, WAVE_IN[1], 0, 0.7);
  const innerStyle = useEnter(progress, WAVE_IN[2], 0, 0.7);
  const wordStyle = useEnter(progress, WORD_IN, 8);
  const barFill = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, FADE_OUT[0]], [0, BAR_WIDTH], "clamp"),
  }));

  const iconSvg = (children: React.ReactNode) => (
    <Svg
      width={ICON_WIDTH}
      height={ICON_HEIGHT}
      viewBox="20 20 169 139"
      fill="none"
    >
      {children}
    </Svg>
  );
  const wave = (index: number) =>
    iconSvg(
      <Path
        d={WAVES[index].d}
        opacity={WAVES[index].opacity}
        stroke={brand}
        strokeWidth={13.44}
        strokeLinecap="round"
      />,
    );

  return (
    <View
      className="absolute inset-0 bg-background"
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
    >
      <Animated.View className="flex-1 items-center justify-center" style={group}>
        {/* O símbolo fica no centro exato da tela, como na splash nativa. */}
        <View style={{ width: ICON_WIDTH, height: ICON_HEIGHT }}>
          <Animated.View className="absolute" style={outerStyle}>
            {wave(0)}
          </Animated.View>
          <Animated.View className="absolute" style={middleStyle}>
            {wave(1)}
          </Animated.View>
          <Animated.View className="absolute" style={innerStyle}>
            {wave(2)}
          </Animated.View>
          <Animated.View className="absolute" style={dropStyle}>
            {iconSvg(<Path d={DROP} fill={brand} />)}
          </Animated.View>
        </View>

        <Animated.View
          className="absolute items-center"
          style={[{ top: "50%", marginTop: ICON_HEIGHT / 2 + 20 }, wordStyle]}
        >
          <Svg
            width={WORD_WIDTH}
            height={WORD_HEIGHT}
            viewBox="212 38 632 104"
            fill="none"
          >
            <Path d={WORD_AQUA} fill={text} />
            <Path d={WORD_SENSE} fill={brand} />
          </Svg>
          <Text className="mt-2 text-xs text-muted-foreground">
            Seu consumo de água na palma da mão.
          </Text>
        </Animated.View>

        <View
          className="absolute bottom-20 h-0.5 overflow-hidden rounded-pill bg-track"
          style={{ width: BAR_WIDTH }}
        >
          <Animated.View
            className="h-full rounded-pill bg-primary"
            style={barFill}
          />
        </View>
      </Animated.View>
    </View>
  );
}
