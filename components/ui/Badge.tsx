import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../../src/theme";
import { AppText } from "./AppText";

type Tone = "neutral" | "accent" | "success" | "danger";
type Props = { label: string | number; tone?: Tone; dot?: boolean };

export function Badge({ label, tone = "neutral", dot = false }: Props) {
  return (
    <View style={[styles.base, styles[tone]]}>
      {dot ? <View style={[styles.dot, styles[`${tone}Dot`]]} /> : null}
      <AppText variant="meta" style={[styles.label, tone === "success" && styles.successLabel, tone === "danger" && styles.dangerLabel]}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 22, flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.full },
  neutral: { backgroundColor: colors.surfaceSecondary },
  accent: { backgroundColor: colors.accent },
  success: { backgroundColor: colors.successSoft },
  danger: { backgroundColor: colors.dangerSoft },
  dot: { width: 6, height: 6, borderRadius: 3 },
  neutralDot: { backgroundColor: colors.textSecondary },
  accentDot: { backgroundColor: colors.textPrimary },
  successDot: { backgroundColor: colors.success },
  dangerDot: { backgroundColor: colors.danger },
  label: { fontWeight: "500" },
  successLabel: { color: colors.success },
  dangerLabel: { color: colors.danger },
});
