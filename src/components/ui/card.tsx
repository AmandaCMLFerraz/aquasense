import * as React from "react";
import { View } from "react-native";

import { cn } from "@/utils/cn";

export type CardProps = React.ComponentProps<typeof View>;

const Card = React.forwardRef<React.ComponentRef<typeof View>, CardProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-card p-card shadow-sm",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export { Card };
