import * as React from "react";
import { PanResponder, View } from "react-native";

import { cn } from "@/utils/cn";

export type SliderProps = {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange: (value: number) => void;
  onSlidingStart?: () => void;
  onSlidingEnd?: () => void;
  className?: string;
};

const THUMB_SIZE = 24;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function Slider({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  onSlidingStart,
  onSlidingEnd,
  className,
}: SliderProps) {
  const trackRef = React.useRef<React.ComponentRef<typeof View>>(null);
  const [trackWidth, setTrackWidth] = React.useState(0);
  const [trackPageX, setTrackPageX] = React.useState(0);

  const panResponder = React.useMemo(() => {
    const updateFromPageX = (pageX: number) => {
      const usableWidth = trackWidth - THUMB_SIZE;
      if (usableWidth <= 0) return;

      const ratio = clamp(
        (pageX - trackPageX - THUMB_SIZE / 2) / usableWidth,
        0,
        1,
      );
      const rawValue = minimumValue + ratio * (maximumValue - minimumValue);
      const steppedValue = Math.round(rawValue / step) * step;

      onValueChange(clamp(steppedValue, minimumValue, maximumValue));
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        onSlidingStart?.();
        updateFromPageX(event.nativeEvent.pageX);
      },
      onPanResponderMove: (event) => updateFromPageX(event.nativeEvent.pageX),
      onPanResponderRelease: () => onSlidingEnd?.(),
      onPanResponderTerminate: () => onSlidingEnd?.(),
    });
  }, [
    trackWidth,
    trackPageX,
    minimumValue,
    maximumValue,
    step,
    onValueChange,
    onSlidingStart,
    onSlidingEnd,
  ]);

  const ratio =
    maximumValue === minimumValue
      ? 0
      : clamp((value - minimumValue) / (maximumValue - minimumValue), 0, 1);
  const usableWidth = Math.max(trackWidth - THUMB_SIZE, 0);
  const thumbOffset = ratio * usableWidth;

  return (
    <View
      ref={trackRef}
      className={cn("justify-center py-2", className)}
      style={{ paddingHorizontal: THUMB_SIZE / 2 }}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        setTrackWidth(width);
        trackRef.current?.measure((_x, _y, _width, _height, pageX) => {
          setTrackPageX(pageX);
        });
      }}
      {...panResponder.panHandlers}
    >
      <View
        pointerEvents="none"
        className="h-2 rounded-pill bg-track overflow-hidden"
      >
        <View
          className="h-full rounded-pill bg-primary"
          style={{ width: thumbOffset + THUMB_SIZE / 2 }}
        />
      </View>
      <View
        pointerEvents="none"
        className="absolute rounded-full bg-card border-2 border-primary shadow-sm"
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          left: thumbOffset,
        }}
      />
    </View>
  );
}

export { Slider };
