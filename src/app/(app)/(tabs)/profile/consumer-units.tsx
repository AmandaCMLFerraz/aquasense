import { router, useFocusEffect, useNavigation } from "expo-router";
import { ChevronLeft, Home, Plus } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { consumerUnitsApi, type ConsumerUnit } from "@/lib/api";
import { useTabBarClearance } from "@/hooks/use-tab-bar-clearance";
import { useThemeColors } from "@/utils/colors";

function formatAddress(unit: ConsumerUnit) {
  const { street, number, neighborhood, city, state } = unit.address;
  const line = neighborhood
    ? `${street}, ${number} · ${neighborhood}`
    : `${street}, ${number}`;

  return `${line} · ${city}/${state}`;
}

export default function ConsumerUnitsScreen() {
  const colors = useThemeColors();
  const tabBarClearance = useTabBarClearance();
  const navigation = useNavigation();

  useEffect(() => {
    const tabNavigation = navigation.getParent<{
      addListener: (
        type: "tabPress",
        callback: (event: { preventDefault: () => void }) => void,
      ) => () => void;
    }>();

    return tabNavigation?.addListener("tabPress", (event) => {
      if (!navigation.isFocused()) return;
      event.preventDefault();
      navigation.goBack();
    });
  }, [navigation]);
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const [units, setUnits] = useState<ConsumerUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasShownErrorRef = useRef(false);

  const loadUnits = useCallback(async () => {
    if (!accessToken) return;

    try {
      const data = await consumerUnitsApi.list(accessToken);
      setUnits(data);
    } catch {
      if (!hasShownErrorRef.current) {
        hasShownErrorRef.current = true;
        showToast("Não foi possível carregar suas residências.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, showToast]);

  useFocusEffect(
    useCallback(() => {
      hasShownErrorRef.current = false;
      loadUnits();
    }, [loadUnits]),
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-background"
    >
      <View className="items-start px-screen pt-4">
        <Button size="icon" variant="outline" onPress={() => router.back()}>
          <ChevronLeft color={colors.primary} />
        </Button>
      </View>

      <View className="px-screen pt-4">
        <Text className="text-2xl font-bold text-foreground">Residências</Text>
        <Text className="text-muted-foreground mt-1">
          {units.length}{" "}
          {units.length === 1
            ? "unidade consumidora"
            : "unidades consumidoras"}{" "}
          na sua conta.
        </Text>
      </View>

      <View
        className="flex-1"
        style={{ paddingBottom: tabBarClearance }}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-screen gap-4 pt-4"
          showsVerticalScrollIndicator={false}
        >
          {!isLoading && units.length === 0 && (
            <EmptyState message="Você ainda não tem residências cadastradas." />
          )}

          {units.map((unit) => (
            <Pressable
              key={unit.id}
              onPress={() =>
                router.push({
                  pathname: "/consumer-unit-form",
                  params: { id: unit.id },
                })
              }
              className="active:opacity-80"
            >
              <Card>
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-sm bg-primary-soft">
                    <Home size={18} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-foreground">
                      {unit.name}
                    </Text>
                    <Text className="text-footnote text-muted-foreground">
                      {formatAddress(unit)}
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-border my-3" />

                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-overline font-bold uppercase text-muted-foreground">
                      Moradores
                    </Text>
                    <Text className="font-bold text-foreground mt-1">
                      {unit.numberResidents}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-overline font-bold uppercase text-muted-foreground">
                      Limite diário
                    </Text>
                    <Text className="font-bold text-foreground mt-1">
                      {unit.dailyConsumptionLimit} L
                    </Text>
                  </View>
                  <View>
                    <Text className="text-overline font-bold uppercase text-muted-foreground">
                      Dispositivos
                    </Text>
                    <Text className="font-bold text-foreground mt-1">
                      {unit.deviceCount}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))}

          <Pressable
            onPress={() => router.push("/consumer-unit-form")}
            className="items-center justify-center gap-2 rounded-xl border border-dashed border-border py-6 active:opacity-70"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
              <Plus size={20} color={colors.primary} />
            </View>
            <Text className="font-bold text-foreground">
              Adicionar residência
            </Text>
            <Text className="text-footnote text-muted-foreground">
              Cadastre outra unidade consumidora.
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
