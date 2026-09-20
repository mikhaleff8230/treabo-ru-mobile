import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, sizes, spacing } from "../../src/theme";
import { AppText } from "./AppText";

type HeaderAction = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void };

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: HeaderAction[];
};

export function AppHeader({ title, subtitle, onBack, actions = [] }: Props) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Назад" hitSlop={8} onPress={onBack} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={sizes.icon.lg} color={colors.textPrimary} />
        </Pressable>
      ) : null}
      <View style={styles.copy}>
        <AppText variant="screenTitle" numberOfLines={1}>{title}</AppText>
        {subtitle ? <AppText variant="meta" tone="secondary" numberOfLines={1}>{subtitle}</AppText> : null}
      </View>
      <View style={styles.actions}>
        {actions.slice(0, 2).map((action) => (
          <Pressable key={action.label} accessibilityRole="button" accessibilityLabel={action.label} hitSlop={8} onPress={action.onPress} style={styles.iconButton}>
            <Ionicons name={action.icon} size={sizes.icon.lg} color={colors.textPrimary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: sizes.header,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: sizes.screenPadding,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 },
  actions: { flexDirection: "row", alignItems: "center" },
});
