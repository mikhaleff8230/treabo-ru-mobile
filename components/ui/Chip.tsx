import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../../src/theme";
import { AppText } from "./AppText";

type Props = { label: string; selected?: boolean; status?: "neutral" | "success" | "warning"; onPress?: () => void };

export function Chip({ label, selected = false, status = "neutral", onPress }: Props) {
  const content = (
    <AppText variant="meta" style={selected ? styles.selectedText : status === "success" ? styles.successText : status === "warning" ? styles.warningText : undefined}>{label}</AppText>
  );
  const style = [styles.base, selected && styles.selected, status === "success" && styles.success, status === "warning" && styles.warning];
  return onPress ? <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [style, pressed && styles.pressed]}>{content}</Pressable> : <View style={style}>{content}</View>;
}

const styles = StyleSheet.create({
  base: { minHeight: 32, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center", borderRadius: radius.full, backgroundColor: colors.surfaceSecondary },
  selected: { backgroundColor: colors.accent },
  success: { backgroundColor: colors.successSoft },
  warning: { backgroundColor: colors.warningSoft },
  selectedText: { color: colors.textPrimary, fontWeight: "600" },
  successText: { color: colors.success, fontWeight: "500" },
  warningText: { color: colors.warning, fontWeight: "500" },
  pressed: { opacity: 0.72 },
});
