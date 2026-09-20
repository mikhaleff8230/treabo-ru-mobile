import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, sizes, spacing } from "../../src/theme";
import { AppText } from "./AppText";

export type BottomNavigationKey = "home" | "map" | "create" | "requests" | "profile";
type Item = { key: BottomNavigationKey; label: string; icon: keyof typeof Ionicons.glyphMap };

const items: Item[] = [
  { key: "home", label: "Главная", icon: "home-outline" },
  { key: "map", label: "Карта", icon: "location-outline" },
  { key: "create", label: "Добавить", icon: "add" },
  { key: "requests", label: "Заявки", icon: "chatbox-outline" },
  { key: "profile", label: "Профиль", icon: "person-outline" },
];

export function BottomNavigation({ active = "home", onChange }: { active?: BottomNavigationKey; onChange?: (key: BottomNavigationKey) => void }) {
  return <View style={styles.root}>{items.map((item) => {
    const selected = item.key === active;
    const create = item.key === "create";
    return <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={item.label} onPress={() => onChange?.(item.key)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <View style={[styles.icon, create && styles.create]}><Ionicons name={item.icon} size={create ? 30 : sizes.icon.lg} color={selected || create ? colors.textPrimary : colors.textSecondary} /></View>
      {!create ? <AppText variant="meta" tone={selected ? "primary" : "secondary"} style={selected && styles.selectedLabel}>{item.label}</AppText> : null}
    </Pressable>;
  })}</View>;
}

const styles = StyleSheet.create({
  root: { minHeight: sizes.bottomNavigation, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, paddingTop: spacing.xs, paddingBottom: spacing.sm, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 1 },
  icon: { width: 34, height: 30, alignItems: "center", justifyContent: "center" },
  create: { width: 48, height: 48, marginTop: -18, borderRadius: radius.full, backgroundColor: colors.accent },
  selectedLabel: { fontWeight: "600" },
  pressed: { opacity: 0.65 },
});
