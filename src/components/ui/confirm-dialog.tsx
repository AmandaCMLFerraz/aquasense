import * as React from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-8">
        <Card className="w-full">
          <Text className="text-callout font-bold text-foreground">
            {title}
          </Text>
          {description && (
            <Text className="text-footnote text-muted-foreground mt-2">
              {description}
            </Text>
          )}
          <View className="flex-row gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onPress={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              className={cn("flex-1", destructive && "bg-destructive")}
              textClassName={
                destructive ? "text-destructive-foreground" : undefined
              }
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="white" /> : confirmLabel}
            </Button>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

export { ConfirmDialog };
