import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, sizes, spacing } from "../../src/theme";
import { AppText } from "./AppText";

type Props = {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
};

export function ListItem({ title, subtitle, leading, trailing, onPress }: Props) {
  const content = <><View>{leading}</View><View style={styles.copy}><AppText variant="bodyMedium" numberOfLines={1}>{title}</AppText>{subtitle ? <AppText variant="secondary" tone="secondary" numberOfLines={2}>{subtitle}</AppText> : null}</View>{trailing ?? (onPress ? <Ionicons name="chevron-forward" size={sizes.icon.sm} color={colors.textTertiary} /> : null)}</>;
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>{content}</Pressable> : <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  row: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.surface },
  copy: { flex: 1, gap: 1 },
  pressed: { backgroundColor: colors.surfacePressed },
});
