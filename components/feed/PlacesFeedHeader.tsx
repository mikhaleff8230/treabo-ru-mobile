import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../ui";
import { colors, sizes, spacing } from "../../src/theme";

const logo = require("../../assets/treabo-logo-official.png");

export function PlacesFeedHeader({ city = "Москва", onSearch }: { city?: string; onSearch: () => void }) {
  return (
    <View style={styles.root}>
      <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityLabel="TREABO" />
      <View style={styles.location}>
        <Ionicons name="location-outline" size={sizes.icon.sm} color={colors.textPrimary} />
        <AppText variant="secondary" numberOfLines={1}>{city}</AppText>
        <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Поиск" hitSlop={8} onPress={onSearch} style={({ pressed }) => [styles.search, pressed && styles.pressed]}>
        <Ionicons name="search" size={sizes.icon.lg} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { minHeight: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: sizes.screenPadding, gap: spacing.md, backgroundColor: colors.background },
  logo: { width: 108, height: 34 },
  location: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs },
  search: { width: sizes.control.md, height: sizes.control.md, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.55 },
});
