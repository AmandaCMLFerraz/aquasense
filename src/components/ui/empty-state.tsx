import { Text } from "react-native";

type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <Text className="text-muted-foreground text-center mt-8">{message}</Text>
  );
}
