import * as React from "react";
import { Pressable, Text } from "react-native";

import { cn } from "@/utils/cn";

export type LinkProps = React.ComponentProps<typeof Pressable> & {
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
};

const Link = React.forwardRef<React.ComponentRef<typeof Pressable>, LinkProps>(
  ({ children, className, textClassName, disabled, ...props }, ref) => (
    <Pressable
      ref={ref}
      disabled={disabled}
      className={cn("self-end", disabled && "opacity-50", className)}
      {...props}
    >
      <Text
        className={cn(
          "text-sm font-bold text-primary border-b border-primary active:opacity-80",
          textClassName,
        )}
      >
        {children}
      </Text>
    </Pressable>
  ),
);

Link.displayName = "Link";

export { Link };
