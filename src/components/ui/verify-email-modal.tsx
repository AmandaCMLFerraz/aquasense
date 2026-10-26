import * as React from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type VerifyEmailModalProps = {
  visible: boolean;
  email: string;
  isSubmitting: boolean;
  isResending: boolean;
  error?: string;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onClose: () => void;
};

function VerifyEmailModal({
  visible,
  email,
  isSubmitting,
  isResending,
  error,
  onSubmit,
  onResend,
  onClose,
}: VerifyEmailModalProps) {
  const [code, setCode] = React.useState("");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-8">
        <Card className="w-full">
          <Text className="text-callout font-bold text-foreground">
            Confirme seu e-mail
          </Text>
          <Text className="text-footnote text-muted-foreground mt-2">
            Enviamos um código de 6 dígitos para {email}. Informe-o abaixo
            para confirmar sua conta.
          </Text>
          <View className="mt-4">
            <Input
              label="Código"
              required
              value={code}
              onChangeText={(text) => setCode(text)}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            {error && (
              <Text className="text-xs font-bold text-destructive mt-1">
                {error}
              </Text>
            )}
          </View>
          <Button
            className="mt-2 h-auto w-auto self-start border-0 bg-transparent p-0"
            textClassName="text-sm font-bold text-primary border-b border-primary"
            onPress={onResend}
            disabled={isResending || isSubmitting}
          >
            {isResending ? "Reenviando..." : "Reenviar código"}
          </Button>
          <View className="flex-row gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onPress={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onPress={() => onSubmit(code)}
              disabled={code.trim().length !== 6 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                "Confirmar"
              )}
            </Button>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

export { VerifyEmailModal };
