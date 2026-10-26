import { BlurView } from "expo-blur";
import { EllipsisVertical } from "lucide-react-native";
import * as React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { useThemeColors } from "@/utils/colors";

export type ActionMenuItem = {
  label: string;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  destructive?: boolean;
  onPress: () => void;
};

export type ActionMenuProps = {
  items: ActionMenuItem[];
  renderTrigger?: (open: () => void) => React.ReactNode;
};

type Anchor = { x: number; y: number; width: number; height: number };

const MENU_GAP = 8;
const SCREEN_MARGIN = 20;

function ActionMenu({ items, renderTrigger }: ActionMenuProps) {
  const colors = useThemeColors();
  const { width: windowWidth } = useWindowDimensions();
  const [trigger, setTrigger] =
    React.useState<React.ComponentRef<typeof View> | null>(null);
  const [anchor, setAnchor] = React.useState<Anchor | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const open = () => {
    trigger?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setIsOpen(true);
    });
  };

  const menuRight = anchor
    ? Math.max(SCREEN_MARGIN, windowWidth - (anchor.x + anchor.width))
    : SCREEN_MARGIN;
  const close = () => setIsOpen(false);

  const renderTriggerNode = (onPress: () => void) =>
    renderTrigger ? (
      renderTrigger(onPress)
    ) : (
      <Button size="icon" variant="outline" onPress={onPress}>
        <EllipsisVertical color={colors.primary} />
      </Button>
    );

  const menuTop = anchor ? anchor.y + anchor.height + MENU_GAP : 0;

  return (
    <>
      <View ref={setTrigger} collapsable={false}>
        {renderTriggerNode(open)}
      </View>

      <Modal
        visible={isOpen}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1"
          onPress={() => setIsOpen(false)}
        >
          <BlurView
            intensity={30}
            tint="systemMaterial"
            blurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <View className="absolute inset-0 bg-black/20" pointerEvents="none" />

          {/* Cópia do gatilho no mesmo lugar, acima do blur, para ele continuar nítido. */}
          {anchor && (
            <View
              style={{
                position: "absolute",
                left: anchor.x,
                top: anchor.y,
                width: anchor.width,
                height: anchor.height,
              }}
            >
              {renderTriggerNode(close)}
            </View>
          )}

          <Pressable
            className="absolute w-48 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            style={{ top: menuTop, right: menuRight }}
            onPress={(event) => event.stopPropagation()}
          >
            {items.map((item, index) => {
              const Icon = item.icon;
              const itemColor = item.destructive
                ? colors.destructive
                : colors.mutedForeground;

              return (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    setIsOpen(false);
                    item.onPress();
                  }}
                  className={cn(
                    "flex-row items-center gap-3 px-4 py-3 active:opacity-70",
                    index > 0 && "border-t border-border",
                  )}
                >
                  {Icon && <Icon size={18} color={itemColor} />}
                  <Text className="font-bold" style={{ color: itemColor }}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export { ActionMenu };
