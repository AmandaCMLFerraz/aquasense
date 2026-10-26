import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { BRAZILIAN_STATES } from "@/constants/brazilian-states";
import { ApiError, useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { consumerUnitsApi } from "@/lib/api";
import {
  consumerUnitSchema,
  firstFieldErrors,
  type ConsumerUnitFormInput,
} from "@/lib/validation";
import { fetchAddressByCep, fetchCitiesByState } from "@/lib/viacep";
import { useThemeColors } from "@/utils/colors";

const DAILY_LIMIT_MIN = 0;
const DAILY_LIMIT_MAX = 1100;
const MAX_RESIDENTS = 10;
const DAILY_LIMIT_PER_RESIDENT = 110;

type FieldErrors = Partial<Record<keyof ConsumerUnitFormInput, string>>;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function ConsumerUnitFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const colors = useThemeColors();
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(isEditing);
  const [name, setName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isLookingUpZipCode, setIsLookingUpZipCode] = useState(false);
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cityOptions, setCityOptions] = useState<SelectOption[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [numberResidents, setNumberResidents] = useState("1");
  const [dailyConsumptionLimit, setDailyConsumptionLimit] = useState(
    DAILY_LIMIT_PER_RESIDENT,
  );
  const [dailyLimitText, setDailyLimitText] = useState(
    String(DAILY_LIMIT_PER_RESIDENT),
  );
  const [leakMinutes, setLeakMinutes] = useState("60");
  const [deviceCount, setDeviceCount] = useState(0);
  const hourlyLimit = Math.round((dailyConsumptionLimit / 24) * 10) / 10;
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);

  const loadCitiesForState = useCallback(async (uf: string) => {
    if (!uf) {
      setCityOptions([]);
      return [] as SelectOption[];
    }

    setIsLoadingCities(true);
    try {
      const cities = await fetchCitiesByState(uf);
      setCityOptions(cities);
      return cities;
    } catch {
      setCityOptions([]);
      return [];
    } finally {
      setIsLoadingCities(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isEditing || !accessToken || !id) return;

      let isActive = true;
      setIsLoading(true);

      consumerUnitsApi
        .get(accessToken, id)
        .then((unit) => {
          if (!isActive) return;
          setName(unit.name);
          setZipCode(unit.address.zipCode ?? "");
          setStreet(unit.address.street);
          setNumber(unit.address.number);
          setNeighborhood(unit.address.neighborhood ?? "");
          setCity(unit.address.city);
          setState(unit.address.state);
          setNumberResidents(String(unit.numberResidents));
          setDailyConsumptionLimit(unit.dailyConsumptionLimit);
          setDailyLimitText(String(unit.dailyConsumptionLimit));
          setLeakMinutes(String(unit.leakDurationMinutes));
          setDeviceCount(unit.deviceCount);
          void loadCitiesForState(unit.address.state);
        })
        .catch(() => {
          showToast("Não foi possível carregar esta residência.");
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });

      return () => {
        isActive = false;
      };
    }, [isEditing, accessToken, id, showToast, loadCitiesForState]),
  );

  const clearError = (field: keyof ConsumerUnitFormInput) => {
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleZipCodeChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    const formatted =
      digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setZipCode(formatted);
    clearError("zipCode");

    if (digits.length === 8) {
      void handleZipCodeLookup(digits);
    }
  };

  const handleZipCodeLookup = async (digits: string) => {
    setIsLookingUpZipCode(true);
    try {
      const address = await fetchAddressByCep(digits);
      if (!address) {
        showToast("CEP não encontrado.");
        return;
      }

      setStreet(address.logradouro || street);
      setNeighborhood(address.bairro || neighborhood);
      setState(address.uf);
      clearError("street");
      clearError("city");
      clearError("state");

      const cities = await loadCitiesForState(address.uf);
      const matchedCity = cities.find(
        (option) => option.label === address.localidade,
      );
      setCity(matchedCity ? matchedCity.value : address.localidade);
    } catch {
      showToast("Não foi possível buscar o CEP. Tente novamente.");
    } finally {
      setIsLookingUpZipCode(false);
    }
  };

  const handleStateChange = (nextState: string) => {
    setState(nextState);
    setCity("");
    clearError("state");
    void loadCitiesForState(nextState);
  };

  const handleNumberResidentsChange = (text: string) => {
    const digitsOnly = text.replace(/[^0-9]/g, "");
    const parsed = Number.parseInt(digitsOnly, 10);
    const residents = Number.isNaN(parsed)
      ? 0
      : Math.min(parsed, MAX_RESIDENTS);

    setNumberResidents(digitsOnly === "" ? "" : String(residents));
    clearError("numberResidents");

    if (!residents) return;

    const suggested = clamp(
      residents * DAILY_LIMIT_PER_RESIDENT,
      DAILY_LIMIT_MIN,
      DAILY_LIMIT_MAX,
    );
    setDailyConsumptionLimit(suggested);
    setDailyLimitText(String(suggested));
    clearError("dailyConsumptionLimit");
  };

  const handleDailyLimitChange = (nextValue: number) => {
    setDailyConsumptionLimit(nextValue);
    setDailyLimitText(String(nextValue));
    clearError("dailyConsumptionLimit");
  };

  const adjustDailyLimit = (delta: number) => {
    const next = clamp(
      dailyConsumptionLimit + delta,
      DAILY_LIMIT_MIN,
      DAILY_LIMIT_MAX,
    );
    setDailyConsumptionLimit(next);
    setDailyLimitText(String(next));
    clearError("dailyConsumptionLimit");
  };

  const commitDailyLimitText = () => {
    const digitsOnly = dailyLimitText.replace(/[^0-9]/g, "");
    const parsed = digitsOnly
      ? Number.parseInt(digitsOnly, 10)
      : dailyConsumptionLimit;
    const next = clamp(parsed, DAILY_LIMIT_MIN, DAILY_LIMIT_MAX);
    setDailyConsumptionLimit(next);
    setDailyLimitText(String(next));
    if (next !== dailyConsumptionLimit) clearError("dailyConsumptionLimit");
  };

  const handleSubmit = async () => {
    if (isSubmitting || !accessToken) return;

    const result = consumerUnitSchema.safeParse({
      name,
      street,
      number,
      neighborhood,
      city,
      state,
      zipCode,
      numberResidents,
      dailyConsumptionLimit,
      hourlyConsumptionLimit: hourlyLimit,
      leakDurationMinutes: leakMinutes,
    });
    if (!result.success) {
      setErrors(firstFieldErrors(result.error));
      return;
    }
    setErrors({});

    const input = {
      name: result.data.name,
      address: {
        street: result.data.street,
        number: result.data.number,
        neighborhood: result.data.neighborhood || undefined,
        city: result.data.city,
        state: result.data.state.toUpperCase(),
        zipCode: result.data.zipCode || undefined,
      },
      numberResidents: result.data.numberResidents,
      dailyConsumptionLimit: result.data.dailyConsumptionLimit,
      hourlyConsumptionLimit: result.data.hourlyConsumptionLimit,
      leakDurationMinutes: result.data.leakDurationMinutes,
    };

    setIsSubmitting(true);
    try {
      if (isEditing && id) {
        await consumerUnitsApi.update(accessToken, id, input);
        showToast("Residência atualizada com sucesso.", "success");
      } else {
        await consumerUnitsApi.create(accessToken, input);
        showToast("Residência cadastrada com sucesso.", "success");
      }
      router.back();
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : "Não foi possível salvar a residência. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!accessToken || !id) return;

    setIsRemoving(true);
    try {
      await consumerUnitsApi.remove(accessToken, id);
      setIsDeleteDialogVisible(false);
      router.back();
    } catch (err) {
      setIsDeleteDialogVisible(false);
      showToast(
        err instanceof ApiError
          ? err.message
          : "Não foi possível excluir a residência.",
      );
    } finally {
      setIsRemoving(false);
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
          <ChevronLeft color={colors.primary} />
        </Button>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pt-4 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-foreground text-2xl font-bold">
          {isEditing ? "Editar residência" : "Nova residência"}
        </Text>
        <Text className="text-muted-foreground mt-1 mb-6">
          Essas informações ajudam a definir seu limite de consumo.
        </Text>

        <View className="gap-4">
          <View>
            <Input
              label="Nome"
              required
              placeholder="Ex: Casa da praia"
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
              label="CEP"
              placeholder="00000-000"
              keyboardType="numeric"
              maxLength={9}
              value={zipCode}
              onChangeText={handleZipCodeChange}
            />
            {isLookingUpZipCode && (
              <View className="flex-row items-center gap-2 mt-1">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-footnote text-muted-foreground">
                  Buscando endereço...
                </Text>
              </View>
            )}
            {errors.zipCode && (
              <Text className="text-xs font-bold text-destructive mt-1">
                {errors.zipCode}
              </Text>
            )}
          </View>

          <View className="flex-row gap-3">
            <View className="flex-[2]">
              <Input
                label="Rua"
                required
                value={street}
                onChangeText={(text) => {
                  setStreet(text);
                  clearError("street");
                }}
              />
              {errors.street && (
                <Text className="text-xs font-bold text-destructive mt-1">
                  {errors.street}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Input
                label="Número"
                required
                keyboardType="numeric"
                value={number}
                onChangeText={(text) => {
                  setNumber(text.replace(/[^0-9]/g, ""));
                  clearError("number");
                }}
              />
              {errors.number && (
                <Text className="text-xs font-bold text-destructive mt-1">
                  {errors.number}
                </Text>
              )}
            </View>
          </View>

          <View>
            <Input
              label="Bairro"
              value={neighborhood}
              onChangeText={setNeighborhood}
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Select
                label="Cidade"
                required
                searchable
                searchPlaceholder="Buscar cidade..."
                placeholder="Selecione a cidade"
                emptyMessage={
                  !state
                    ? "Selecione o estado primeiro"
                    : "Nenhuma cidade encontrada"
                }
                value={city || null}
                options={cityOptions}
                onChange={(nextCity) => {
                  setCity(nextCity);
                  clearError("city");
                }}
                loading={isLoadingCities}
              />
              {errors.city && (
                <Text className="text-xs font-bold text-destructive mt-1">
                  {errors.city}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Select
                label="UF"
                required
                searchable
                searchPlaceholder="Buscar estado..."
                placeholder="UF"
                value={state || null}
                options={BRAZILIAN_STATES}
                onChange={handleStateChange}
              />
              {errors.state && (
                <Text className="text-xs font-bold text-destructive mt-1">
                  {errors.state}
                </Text>
              )}
            </View>
          </View>

          <View>
            <Input
              label="Número de moradores (máx. 10)"
              required
              keyboardType="numeric"
              value={numberResidents}
              onChangeText={handleNumberResidentsChange}
            />
            {errors.numberResidents && (
              <Text className="text-xs font-bold text-destructive mt-1">
                {errors.numberResidents}
              </Text>
            )}
          </View>

          <View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold text-subtle-foreground uppercase">
                Limite diário *
              </Text>
              <Text className="text-title3 font-bold text-primary">
                {dailyConsumptionLimit} L
              </Text>
            </View>
            <Slider
              className="mt-2"
              value={clamp(dailyConsumptionLimit, DAILY_LIMIT_MIN, DAILY_LIMIT_MAX)}
              minimumValue={DAILY_LIMIT_MIN}
              maximumValue={DAILY_LIMIT_MAX}
              step={1}
              onValueChange={handleDailyLimitChange}
              onSlidingStart={() => navigation.setOptions({ gestureEnabled: false })}
              onSlidingEnd={() => navigation.setOptions({ gestureEnabled: true })}
            />
            <View className="flex-row items-center justify-between">
              <Text className="text-footnote text-muted-foreground">
                {DAILY_LIMIT_MIN} L
              </Text>
              <Text className="text-footnote text-muted-foreground">
                {DAILY_LIMIT_MAX} L
              </Text>
            </View>

            <View className="flex-row gap-2 mt-3">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => adjustDailyLimit(-25)}
              >
                -25
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => adjustDailyLimit(-1)}
              >
                -1
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => adjustDailyLimit(1)}
              >
                +1
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => adjustDailyLimit(25)}
              >
                +25
              </Button>
            </View>

            <View className="mt-3">
              <Input
                label="Ou digite o valor manualmente (L)"
                keyboardType="numeric"
                value={dailyLimitText}
                onChangeText={(text) =>
                  setDailyLimitText(text.replace(/[^0-9]/g, ""))
                }
                onEndEditing={commitDailyLimitText}
                onBlur={commitDailyLimitText}
              />
            </View>

            {errors.dailyConsumptionLimit && (
              <Text className="text-xs font-bold text-destructive mt-2">
                {errors.dailyConsumptionLimit}
              </Text>
            )}
          </View>

          <View>
            <Input
              label="Limite de consumo por hora (L)"
              editable={false}
              value={String(hourlyLimit).replace(".", ",")}
            />
            {errors.hourlyConsumptionLimit && (
              <Text className="text-xs font-bold text-destructive mt-1">
                {errors.hourlyConsumptionLimit}
              </Text>
            )}
          </View>
          <View>
            <Input
              label="Tempo de fluxo contínuo para alertar vazamento (min)"
              keyboardType="numeric"
              value={leakMinutes}
              onChangeText={(text) => {
                setLeakMinutes(text.replace(/[^0-9]/g, ""));
                clearError("leakDurationMinutes");
              }}
            />
            {errors.leakDurationMinutes && (
              <Text className="text-xs font-bold text-destructive mt-1">
                {errors.leakDurationMinutes}
              </Text>
            )}
          </View>
        </View>

        <Button
          className="w-full mt-8"
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : isEditing ? (
            "Salvar alterações"
          ) : (
            "Cadastrar residência"
          )}
        </Button>

        {isEditing && (
          <Button
            variant="outline"
            className="w-full mt-3 border-destructive"
            textClassName="text-destructive"
            onPress={() => setIsDeleteDialogVisible(true)}
          >
            Excluir residência
          </Button>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={isDeleteDialogVisible}
        title="Excluir residência"
        description={
          deviceCount > 0
            ? `Essa ação também excluirá ${deviceCount} ${deviceCount === 1 ? "dispositivo vinculado" : "dispositivos vinculados"} a esta residência e todo o histórico de consumo registrado. Essa ação não pode ser desfeita.`
            : "Tem certeza que deseja excluir esta residência? Essa ação não pode ser desfeita."
        }
        confirmLabel="Excluir"
        destructive
        isLoading={isRemoving}
        onConfirm={handleRemove}
        onCancel={() => setIsDeleteDialogVisible(false)}
      />
    </SafeAreaView>
  );
}
