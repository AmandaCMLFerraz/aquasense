import * as React from "react";
import { Pressable, Text } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "flex-row items-center justify-center gap-2 rounded-md active:opacity-80 disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary",
        soft: "bg-primary-soft",
        outline: "border border-border bg-card",
      },
      size: {
        default: "h-14 px-4 py-2",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonTextVariants = cva("text-md font-bold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      soft: "text-primary",
      outline: "text-primary",
    },
    size: {
      default: "text-[16px]",
      icon: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

type ButtonProps = React.ComponentProps<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    textClassName?: string;
  };

const Button = React.forwardRef<React.ComponentRef<typeof Pressable>, ButtonProps>(
  ({ className, textClassName, variant, size, children, ...props }, ref) => (
    <Pressable ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {typeof children === "string" ? (
        <Text className={cn(buttonTextVariants({ variant, size }), textClassName)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants, buttonTextVariants };
export type { ButtonProps };
