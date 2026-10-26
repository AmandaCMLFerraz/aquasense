import { ChevronDown, Search } from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { cn } from "@/utils/cn";
import { useThemeColors } from "@/utils/colors";

export type SelectOption = {
  label: string;
  value: string;
  description?: string;
};

export type SelectProps = {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  footer?: React.ReactNode;
};

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function Select({
  label,
  required = false,
  placeholder = "Selecione",
  value,
  options,
  onChange,
  loading = false,
  searchable = false,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado",
  footer,
}: SelectProps) {
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const selected = options.find((option) => option.value === value);

  const filteredOptions =
    searchable && query.trim().length > 0
      ? options.filter((option) =>
          normalizeText(option.label).includes(normalizeText(query)),
        )
      : options;

  return (
    <View>
      <Text className="text-xs font-bold text-subtle-foreground uppercase mb-1">
        {label}
        {required && " *"}
      </Text>

      <Pressable
        onPress={() => {
          setQuery("");
          setIsOpen(true);
        }}
        disabled={loading}
        className={cn(
          "h-14 w-full flex-row items-center justify-between rounded-md border border-input bg-card px-4",
          loading && "opacity-50",
        )}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text
            className={cn(
              "flex-1 text-base",
              selected ? "text-foreground" : "text-muted-foreground",
            )}
            numberOfLines={1}
          >
            {selected ? selected.label : value || placeholder}
          </Text>
        )}
        <ChevronDown size={18} color={colors.mutedForeground} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 px-8"
          onPress={() => setIsOpen(false)}
        >
          <Pressable
            style={{ maxHeight: "80%" }}
            className="w-full rounded-xl border border-border bg-card p-card shadow-sm"
            onPress={(event) => event.stopPropagation()}
          >
            <Text className="text-callout font-bold text-foreground mb-3">
              {label}
            </Text>

            {searchable && (
              <View className="h-11 flex-row items-center gap-2 rounded-md border border-input bg-background px-3 mb-3">
                <Search size={16} color={colors.mutedForeground} />
                <TextInput
                  autoFocus
                  value={query}
                  onChangeText={setQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.mutedForeground}
                  className="flex-1 text-base text-foreground"
                />
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-2">
                {filteredOptions.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "rounded-md border-2 px-4 py-3 active:opacity-80",
                        isSelected
                          ? "border-primary bg-primary-soft"
                          : "border-border bg-card",
                      )}
                    >
                      <Text
                        className={cn(
                          "font-bold",
                          isSelected ? "text-primary" : "text-foreground",
                        )}
                      >
                        {option.label}
                      </Text>
                      {option.description && (
                        <Text className="text-footnote text-muted-foreground mt-0.5">
                          {option.description}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
                {filteredOptions.length === 0 && (
                  <Text className="text-footnote text-muted-foreground text-center py-4">
                    {emptyMessage}
                  </Text>
                )}
              </View>
            </ScrollView>

            {footer && <View className="mt-3">{footer}</View>}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export { Select };
