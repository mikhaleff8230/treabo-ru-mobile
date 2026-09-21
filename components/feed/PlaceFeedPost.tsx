import React, { memo, useState } from "react";
import { Pressable, Share, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fileUrl } from "../../src/api";
import { AppText, Avatar, Button, Chip, Divider } from "../ui";
import { colors, sizes, spacing } from "../../src/theme";
import type { Place } from "../../src/types/place";
import { PlaceMediaCarousel } from "./PlaceMediaCarousel";

type Props = {
  place: Place;
  width: number;
  visible: boolean;
  requestBusy: boolean;
  onOpen: () => void;
  onOpenAuthor: () => void;
  onFavorite: () => void;
  onLike: () => void;
  onRequestSame: () => void;
};

function publishedLabel(value?: string | null): string {
  if (!value) return "Недавно";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Недавно";
  const days = Math.max(0, Math.floor((Date.now() - time) / 86400000));
  if (days === 0) return "Сегодня";
  if (days === 1) return "Вчера";
  if (days < 5) return `${days} дня назад`;
  return `${days} дней назад`;
}

export const PlaceFeedPost = memo(function PlaceFeedPost({ place, width, visible, requestBusy, onOpen, onOpenAuthor, onFavorite, onLike, onRequestSame }: Props) {
  const [expanded, setExpanded] = useState(false);
  const author = place.author ?? place.author_details;
  const longDescription = (place.description?.length ?? 0) > 130;
  const distance = place.distance != null ? (place.distance < 1 ? `${Math.round(place.distance * 1000)} м` : `${place.distance} км`) : null;

  const share = () => Share.share({ message: `${place.title}\ntreabo-client://place/${place.id}` });

  return (
    <View style={styles.post}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onOpenAuthor} style={({ pressed }) => [styles.author, pressed && styles.pressed]}>
          <Avatar name={author?.name || "Мастер"} source={fileUrl(author?.avatar) ? { uri: fileUrl(author?.avatar)! } : undefined} size="md" online={author?.online} />
          <View style={styles.authorCopy}>
            <AppText variant="bodyMedium" numberOfLines={1}>{author?.name || "Мастер TREABO"}</AppText>
            <AppText variant="meta" tone="secondary" numberOfLines={1}>{place.work?.title || place.category?.name || "Мастер"} · {place.city || "Город не указан"}</AppText>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Меню Плейса" hitSlop={8} onPress={onOpen} style={styles.iconButton}>
          <Ionicons name="ellipsis-horizontal" size={sizes.icon.lg} color={colors.textPrimary} />
        </Pressable>
      </View>

      <PlaceMediaCarousel place={place} width={width} visible={visible} onOpen={onOpen} />

      <View style={styles.actions}>
        <View style={styles.actionGroup}>
          <Action icon={place.is_liked ? "heart" : "heart-outline"} label={String(place.likes_count ?? 0)} active={place.is_liked} onPress={onLike} />
          <Action icon="chatbubble-outline" label={String(place.comments_count ?? 0)} onPress={onOpen} />
          <Action icon="paper-plane-outline" label="Поделиться" hideLabel onPress={share} />
        </View>
        <Action icon={place.is_favorite ? "bookmark" : "bookmark-outline"} label="Сохранить" hideLabel active={place.is_favorite} onPress={onFavorite} />
      </View>

      <View style={styles.content}>
        <Pressable accessibilityRole="button" onPress={onOpen} style={({ pressed }) => pressed && styles.pressed}>
          <AppText variant="section">{place.title}</AppText>
        </Pressable>
        {place.description ? (
          <View>
            <AppText variant="secondary" tone="secondary" numberOfLines={expanded ? undefined : 3}>{place.description}</AppText>
            {longDescription && !expanded ? <Pressable accessibilityRole="button" onPress={() => setExpanded(true)} hitSlop={6}><AppText variant="secondary" tone="tertiary">ещё</AppText></Pressable> : null}
          </View>
        ) : null}
        <AppText variant="bodyMedium">{place.price_label || "Цена по запросу"}</AppText>
        <View style={styles.chips}>
          {[place.category?.name, place.work?.title].filter((value): value is string => Boolean(value)).map((label) => <Chip key={label} label={label} />)}
        </View>
        <View style={styles.meta}>
          <View style={styles.location}><Ionicons name="location-outline" size={16} color={colors.textSecondary} /><AppText variant="meta" tone="secondary">{place.city || "Местоположение не указано"}{distance ? `, ${distance} от вас` : ""}</AppText></View>
          <AppText variant="meta" tone="tertiary">{publishedLabel(place.published_at)}</AppText>
        </View>
        <Button label="Хочу так же" onPress={onRequestSame} loading={requestBusy} />
      </View>
      <Divider style={styles.divider} />
    </View>
  );
});

function Action({ icon, label, hideLabel = false, active = false, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; hideLabel?: boolean; active?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Ionicons name={icon} size={sizes.icon.lg} color={active ? colors.danger : colors.textPrimary} />{hideLabel ? null : <AppText variant="meta">{label}</AppText>}</Pressable>;
}

const styles = StyleSheet.create({
  post: { backgroundColor: colors.background },
  header: { minHeight: 60, flexDirection: "row", alignItems: "center", paddingHorizontal: sizes.screenPadding, paddingVertical: spacing.sm },
  author: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  authorCopy: { flex: 1 },
  iconButton: { width: sizes.control.md, height: sizes.control.md, alignItems: "center", justifyContent: "center" },
  actions: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: sizes.screenPadding },
  actionGroup: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  action: { minWidth: 28, minHeight: sizes.control.sm, flexDirection: "row", alignItems: "center", gap: spacing.xs, justifyContent: "center" },
  content: { paddingHorizontal: sizes.screenPadding, paddingBottom: spacing.xxl, gap: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  location: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  divider: { height: 8, backgroundColor: colors.surfaceSecondary },
  pressed: { opacity: 0.58 },
});
