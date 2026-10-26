import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Plus } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError, useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { consumerUnitsApi, devicesApi, type ConsumerUnit } from "@/lib/api";
import {
  createDeviceSchema,
  DEFAULT_CALIBRATION_FACTOR,
  firstFieldErrors,
  updateDeviceSchema,
  type CreateDeviceInput,
} from "@/lib/validation";
import { useThemeColors } from "@/utils/colors";

function formatMacAddress(text: string) {
  const hex = text
    .replace(/[^0-9a-fA-F]/g, "")
    .toUpperCase()
    .slice(0, 12);
  return (hex.match(/.{1,2}/g) ?? []).join(":");
}

export default function AddDeviceFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const colors = useThemeColors();
  const { accessToken } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(isEditing);
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [calibrationFactor, setCalibrationFactor] = useState(
    String(DEFAULT_CALIBRATION_FACTOR),
  );
  const [consumerUnits, setConsumerUnits] = useState<ConsumerUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateDeviceInput, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;

      let isActive = true;
      consumerUnitsApi
        .list(accessToken)
        .then((units) => {
          if (!isActive) return;
          setConsumerUnits(units);
          setSelectedUnitId((current) =>
            current && units.some((unit) => unit.id === current)
              ? current
              : (units[0]?.id ?? null),
          );
        })
        .catch(() => {
          showToast("Não foi possível carregar suas residências.");
        })
        .finally(() => {
          if (isActive) setIsLoadingUnits(false);
        });

      return () => {
        isActive = false;
      };
    }, [accessToken, showToast]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!isEditing || !accessToken || !id) return;

      let isActive = true;
      setIsLoading(true);

      devicesApi
        .get(accessToken, id)
        .then((device) => {
          if (!isActive) return;
          setIdentifier(device.identifier);
          setName(device.name);
          setDescription(device.description ?? "");
          setCalibrationFactor(String(device.calibrationFactor));
          setSelectedUnitId(device.consumerUnitId);
        })
        .catch(() => {
          showToast("Não foi possível carregar este dispositivo.");
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });

      return () => {
        isActive = false;
      };
    }, [isEditing, accessToken, id, showToast]),
  );

  const clearError = (field: keyof CreateDeviceInput) => {
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || !accessToken) return;

    if (!selectedUnitId) {
      showToast("Cadastre uma residência antes de adicionar um dispositivo.");
      return;
    }

    if (isEditing && id) {
      const result = updateDeviceSchema.safeParse({
        name,
        description,
        calibrationFactor,
      });
      if (!result.success) {
        setErrors(firstFieldErrors(result.error));
        return;
      }
      setErrors({});

      setIsSubmitting(true);
      try {
        await devicesApi.update(accessToken, id, {
          name: result.data.name,
          description: result.data.description,
          calibrationFactor: result.data.calibrationFactor,
          consumerUnitId: selectedUnitId,
        });
        showToast("Dispositivo atualizado com sucesso.", "success");
        router.back();
      } catch (err) {
        showToast(
          err instanceof ApiError
            ? err.message
            : "Não foi possível salvar o dispositivo. Tente novamente.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const result = createDeviceSchema.safeParse({
      identifier,
      name,
      description,
      calibrationFactor,
    });
    if (!result.success) {
      setErrors(firstFieldErrors(result.error));
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    try {
      await devicesApi.create(accessToken, {
        identifier: result.data.identifier.toUpperCase(),
        name: result.data.name,
        description: result.data.description,
        calibrationFactor: result.data.calibrationFactor,
        consumerUnitId: selectedUnitId,
      });
      showToast("Dispositivo cadastrado com sucesso.", "success");
      router.dismissTo("/devices");
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : "Não foi possível cadastrar o dispositivo. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 px-screen bg-background">
      <View className="items-start pt-4">
        <Button size="icon" variant="outline" onPress={() => router.back()}>
          <ChevronLeft />
        </Button>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pt-4 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-foreground text-2xl font-bold">
          {isEditing ? "Editar dispositivo" : "Novo dispositivo"}
        </Text>
        <Text className="text-muted-foreground mt-1 mb-6">
          {isEditing
            ? "Atualize as informações deste dispositivo."
            : "Informe o identificador e o fator de calibração (K) exibidos na página de configuração Wi-Fi do dispositivo."}
        </Text>

        <View className="gap-4">
          <View>
            {isLoadingUnits ? (
              <Select
                label="Residência"
                required
                value={null}
                options={[]}
                onChange={() => {}}
                loading
              />
            ) : consumerUnits.length === 0 ? (
              <>
                <Text className="text-xs font-bold text-subtle-foreground uppercase mb-1">
                  Residência *
                </Text>
                <View className="rounded-md border border-dashed border-border px-4 py-3">
                  <Text className="text-footnote text-muted-foreground mb-2">
                    Você ainda não cadastrou nenhuma residência.
                  </Text>
                  <Pressable
                    onPress={() => router.push("/consumer-unit-form")}
                    className="flex-row items-center gap-2 active:opacity-70"
                  >
                    <Plus size={16} color={colors.primary} />
                    <Text className="font-bold text-primary">
                      Cadastrar residência
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Select
                label="Residência"
                required
                value={selectedUnitId}
                options={consumerUnits.map((unit) => ({
                  label: unit.name,
                  value: unit.id,
                  description: `${unit.address.city}/${unit.address.state}`,
                }))}
                onChange={setSelectedUnitId}
                footer={
                  <Pressable
                    onPress={() => router.push("/consumer-unit-form")}
                    className="flex-row items-center gap-2 active:opacity-70"
                  >
                    <Plus size={16} color={colors.primary} />
                    <Text className="font-bold text-primary">
                      Cadastrar outra residência
                    </Text>
                  </Pressable>
                }
              />
            )}
          </View>
          <View>
            <Input
              label="Identificador (MAC)"
              required
              editable={!isEditing}
              placeholder="AA:BB:CC:DD:EE:FF"
              autoCapitalize="characters"
              autoCorrect={false}
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(formatMacAddress(text));
                clearError("identifier");
              }}
            />
            {!isEditing && (
              <Text className="text-footnote text-muted-foreground mt-1">
                Aparece na página de configuração do aparelho (rede
                AquaSense-Setup), junto do fator de calibração.
              </Text>
            )}
            {errors.identifier && (
              <Text className="text-xs font-bold text-destructive mt-1">
                {errors.identifier}
              </Text>
            )}
          </View>
          <View>
            <Input
              label="Nome"
              required
              placeholder="Ex: Caixa d'água"
              value={name}
              onChangeText={(text) => {
                setName(text);
                clearError("name");
              }}
            />
            {errors.name && (
              <Text className="text-xs font-bold text-destructive mt-1">
                {errors.name}
              </Text>
            )}
          </View>
          <View>
            <Input
              label="Descrição / local"
              required
              placeholder="Ex: Área externa"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                clearError("description");
              }}
            />
            {errors.description && (
              <Text className="text-xs font-bold text-destructive mt-1">
                {errors.description}
              </Text>
            )}
          </View>
          <View>
            <Input
              label="Fator de calibração (pulsos/L)"
              required
              placeholder={String(DEFAULT_CALIBRATION_FACTOR)}
              keyboardType="numeric"
              value={calibrationFactor}
              onChangeText={(text) => {
                const sanitized = text
                  .replace(/[^0-9.]/g, "")
                  .replace(/(\..*)\./g, "$1");
                setCalibrationFactor(sanitized);
                clearError("calibrationFactor");
              }}
            />
            {errors.calibrationFactor && (
              <Text className="text-xs font-bold text-destructive mt-1">
                {errors.calibrationFactor}
              </Text>
            )}
          </View>
        </View>

        <Button
          className="w-full mt-10"
          onPress={handleSubmit}
          disabled={
            identifier.trim().length === 0 ||
            name.trim().length === 0 ||
            description.trim().length === 0 ||
            calibrationFactor.trim().length === 0 ||
            !selectedUnitId ||
            isSubmitting
          }
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : isEditing ? (
            "Salvar alterações"
          ) : (
            "Cadastrar"
          )}
        </Button>

        {isEditing && (
          <Button
            variant="outline"
            className="w-full mt-3"
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
