import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, sizes, spacing } from "../../src/theme";
import { AppText } from "./AppText";

type Props = { title: string; description?: string; icon?: keyof typeof Ionicons.glyphMap; action?: React.ReactNode };

export function EmptyState({ title, description, icon = "images-outline", action }: Props) {
  return <View style={styles.root}><View style={styles.icon}><Ionicons name={icon} size={sizes.icon.lg} color={colors.textSecondary} /></View><AppText variant="section" style={styles.center}>{title}</AppText>{description ? <AppText variant="secondary" tone="secondary" style={styles.center}>{description}</AppText> : null}{action}</View>;
}

const styles = StyleSheet.create({
  root: { alignItems: "center", padding: spacing.xxl, gap: spacing.sm },
  icon: { width: 48, height: 48, borderRadius: radius.special, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
  center: { textAlign: "center" },
});
