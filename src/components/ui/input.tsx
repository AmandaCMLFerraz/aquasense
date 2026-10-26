import * as React from "react";
import { Eye, EyeOff } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";

import { cn } from "@/utils/cn";

export type InputProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  required?: boolean;
};

const Input = React.forwardRef<
  React.ComponentRef<typeof TextInput>,
  InputProps
>(
  (
    {
      className,
      editable = true,
      label,
      required = false,
      secureTextEntry,
      style,
      ...props
    },
    ref,
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const isPassword = !!secureTextEntry;
    const EyeIcon = isPasswordVisible ? EyeOff : Eye;

    return (
      <View>
        <Text className="text-xs font-bold text-subtle-foreground uppercase mb-1">
          {label}
          {required && " *"}
        </Text>
        <View className="justify-center">
          <TextInput
            ref={ref}
            editable={editable}
            secureTextEntry={isPassword && !isPasswordVisible}
            textAlignVertical="center"
            style={[{ paddingVertical: 0, includeFontPadding: false }, style]}
            className={cn(
              "h-14 w-full rounded-md border border-input bg-card px-4 text-[16px] text-foreground",
              "placeholder:text-muted-foreground",
              "focus:border-ring",
              isPassword && "pr-12",
              !editable && "opacity-50",
              className,
            )}
            {...props}
          />
          {isPassword && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isPasswordVisible ? "Ocultar senha" : "Mostrar senha"
              }
              hitSlop={8}
              disabled={!editable}
              onPress={() => setIsPasswordVisible((visible) => !visible)}
              className="absolute right-4"
            >
              <EyeIcon size={20} color="#888" />
            </Pressable>
          )}
        </View>
      </View>
    );
  },
);
Input.displayName = "Input";

export { Input };
