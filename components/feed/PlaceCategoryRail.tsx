import React, { memo } from "react";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fileUrl } from "../../src/api";
import { AppText } from "../ui";
import { colors, radius, sizes, spacing } from "../../src/theme";

export type FeedCategory = { id: string; name: string; preview?: string | null };

export const PlaceCategoryRail = memo(function PlaceCategoryRail({ categories, activeId, onSelect }: { categories: FeedCategory[]; activeId: string; onSelect: (id: string) => void }) {
  return (
    <View style={styles.root}>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.id || "all"}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        renderItem={({ item }) => {
          const selected = item.id === activeId;
          const preview = fileUrl(item.preview);
          return (
            <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={() => onSelect(item.id)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <View style={[styles.previewFrame, selected && styles.previewFrameSelected]}>
                {preview ? <Image source={{ uri: preview }} style={styles.preview} /> : <View style={styles.fallback}><Ionicons name={item.id ? "construct-outline" : "add"} size={sizes.icon.lg} color={colors.textPrimary} /></View>}
              </View>
              <AppText variant="meta" numberOfLines={1} style={[styles.label, selected && styles.labelSelected]}>{item.name}</AppText>
            </Pressable>
          );
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider, backgroundColor: colors.background },
  content: { paddingHorizontal: sizes.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.md },
  item: { width: 64, alignItems: "center", gap: spacing.xs },
  previewFrame: { width: sizes.avatar.lg + 4, height: sizes.avatar.lg + 4, borderRadius: radius.full, padding: 2, borderWidth: 1, borderColor: colors.border },
  previewFrameSelected: { borderWidth: 2, borderColor: colors.accentPressed },
  preview: { width: "100%", height: "100%", borderRadius: radius.full },
  fallback: { flex: 1, borderRadius: radius.full, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  label: { maxWidth: 64, textAlign: "center" },
  labelSelected: { fontWeight: "600" },
  pressed: { opacity: 0.62 },
});
