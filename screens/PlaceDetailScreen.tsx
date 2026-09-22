import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fileUrl } from "../src/api";
import { AppText, Avatar, Button, Chip, Divider, EmptyState, Skeleton } from "../components/ui";
import { PlaceMediaCarousel } from "../components/feed";
import { colors, radius, sizes, spacing } from "../src/theme";
import { createRequestFromPlace, getPlace, listPlaces, setPlaceFavorite } from "../src/services/places";
import type { Place } from "../src/types/place";
import type { RootStackParamList } from "../src/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "PlaceDetail">;

function dateLabel(value?: string | null): string {
  if (!value) return "Недавно";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "Недавно";
}

export default function PlaceDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { width } = useWindowDimensions();
  const [place, setPlace] = useState<Place | null>(null);
  const [related, setRelated] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const current = await getPlace(params.placeId);
      setPlace(current);
      if (current.author?.id) {
        const items = await listPlaces({ author: current.author.id, per_page: 8 }).catch(() => []);
        setRelated(items.filter((item) => item.id !== current.id).slice(0, 6));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось открыть Плейс");
    } finally { setLoading(false); }
  }, [params.placeId]);

  useEffect(() => { void load(); }, [load]);

  const tags = useMemo(() => place ? [place.category?.name, place.work?.title].filter((tag): tag is string => Boolean(tag)) : [], [place]);

  if (loading) return <PlaceDetailSkeleton />;
  if (!place || error) return <SafeAreaView style={styles.state} edges={["top", "bottom"]}><EmptyState title="Плейс не открылся" description={error} action={<Button label="Повторить" onPress={() => void load()} />} /></SafeAreaView>;

  const author = place.author ?? place.author_details;
  const distance = place.distance != null ? `${place.distance < 1 ? Math.round(place.distance * 1000) + " м" : place.distance + " км"} от вас` : null;

  const favorite = async () => {
    const next = !place.is_favorite;
    setPlace({ ...place, is_favorite: next });
    try { await setPlaceFavorite(place.id, next); }
    catch { setPlace((current) => current ? { ...current, is_favorite: !next } : current); }
  };

  const requestSame = async () => {
    setBusy(true);
    try { await createRequestFromPlace(place.id); navigation.navigate("AIRequest"); }
    catch (reason) { Alert.alert("Не удалось создать заявку", reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Назад" hitSlop={8} style={styles.headerButton} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={26} color={colors.textPrimary} /></Pressable>
        <Pressable style={styles.headerAuthor} onPress={() => author?.id && navigation.navigate("PublicProfile", { specialistId: author.id })}>
          <Avatar size="sm" name={author?.name || "Мастер"} source={fileUrl(author?.avatar) ? { uri: fileUrl(author?.avatar)! } : undefined} online={author?.online} />
          <View style={styles.headerCopy}><AppText variant="bodyMedium" numberOfLines={1}>{author?.name || "Мастер TREABO"}</AppText><AppText variant="meta" tone="secondary" numberOfLines={1}>{place.work?.title || "Мастер"} · {place.city || "Россия"}</AppText></View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Поделиться" hitSlop={8} style={styles.headerButton} onPress={() => void Share.share({ message: `${place.title}\ntreabo-client://place/${place.id}` })}><Ionicons name="share-outline" size={24} color={colors.textPrimary} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Меню" hitSlop={8} style={styles.headerButton}><Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} /></Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <PlaceMediaCarousel place={place} width={width} visible onOpen={() => undefined} />
        <View style={styles.summary}>
          <View style={styles.titleRow}><AppText variant="display" style={styles.title}>{place.title}</AppText><Pressable accessibilityRole="button" accessibilityLabel="Сохранить" hitSlop={8} onPress={() => void favorite()}><Ionicons name={place.is_favorite ? "bookmark" : "bookmark-outline"} size={27} color={colors.textPrimary} /></Pressable></View>
          <View style={styles.location}><Ionicons name="location-outline" size={18} color={colors.textSecondary} /><AppText variant="secondary" tone="secondary">{place.city || place.location?.name || "Местоположение не указано"}{distance ? `, ${distance}` : ""}</AppText></View>
          {place.reviews_summary ? <View style={styles.rating}><Ionicons name="star" size={18} color="#F4B400" /><AppText variant="secondary">{place.reviews_summary.rating.toFixed(1)} ({place.reviews_summary.count})</AppText></View> : null}
          <AppText variant="body" tone="secondary">{place.description || "Мастер пока не добавил подробное описание работы."}</AppText>
          <View style={styles.tags}>{tags.map((tag) => <Chip key={tag} label={tag} />)}</View>
          <AppText variant="meta" tone="tertiary">Опубликовано {dateLabel(place.published_at || place.created_at)}</AppText>
        </View>

        <Divider />
        <View style={styles.details}><AppText variant="section">О проекте</AppText><DetailRow icon="time-outline" label="Срок выполнения" value={place.duration_days ? `${place.duration_days} дней` : "По договорённости"} /><DetailRow icon="construct-outline" label="Тип работы" value={place.work?.title || place.category?.name || "Не указан"} /><DetailRow icon="cash-outline" label="Стоимость" value={place.price_label || "Цена по запросу"} /></View>
        <Divider />

        <Pressable style={styles.authorCard} onPress={() => author?.id && navigation.navigate("PublicProfile", { specialistId: author.id })}>
          <Avatar size="lg" name={author?.name || "Мастер"} source={fileUrl(author?.avatar) ? { uri: fileUrl(author?.avatar)! } : undefined} online={author?.online} />
          <View style={styles.authorCopy}><AppText variant="section">{author?.name || "Мастер TREABO"}</AppText><AppText variant="secondary" tone="secondary">{place.work?.title || "Профессиональный мастер"}</AppText><View style={styles.authorRating}><Ionicons name="star" size={17} color="#F4B400" /><AppText variant="meta">{Number(place.reviews_summary?.rating || place.author?.rating || 0).toFixed(1)} · {place.reviews_summary?.count || place.author?.reviews_count || 0} отзывов</AppText></View></View>
          <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
        </Pressable>

        {related.length ? <View style={styles.section}><View style={styles.sectionHead}><AppText variant="section">Другие работы мастера</AppText><Pressable onPress={() => author?.id && navigation.navigate("PublicProfile", { specialistId: author.id })}><AppText variant="secondary" tone="secondary">Все</AppText></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRail}>{related.map((item) => <RelatedPlace key={item.id} item={item} onPress={() => navigation.push("PlaceDetail", { placeId: item.id })} />)}</ScrollView></View> : null}

        {place.reviews_summary?.reviews?.length ? <View style={styles.section}><View style={styles.sectionHead}><AppText variant="section">Отзывы</AppText><AppText variant="secondary" tone="secondary">{place.reviews_summary.count}</AppText></View>{place.reviews_summary.reviews.map((review) => <View key={review.id} style={styles.review}><View style={styles.reviewHead}><Avatar size="sm" name={review.customer?.name || "Клиент"} source={fileUrl(review.customer?.avatar) ? { uri: fileUrl(review.customer?.avatar)! } : undefined} /><View style={styles.reviewCopy}><AppText variant="bodyMedium">{review.customer?.name || "Клиент"}</AppText><View style={styles.reviewRating}>{Array.from({ length: 5 }).map((_, index) => <Ionicons key={index} name="star" size={14} color={index < review.rating ? "#F4B400" : colors.border} />)}<AppText variant="meta" tone="tertiary">{dateLabel(review.created_at)}</AppText></View></View></View>{review.comment ? <AppText variant="secondary" tone="secondary">{review.comment}</AppText> : null}</View>)}</View> : null}
      </ScrollView>

      <SafeAreaView style={styles.actionBar} edges={["bottom"]}>
        <View style={styles.priceCopy}><AppText variant="meta" tone="secondary">Цена</AppText><AppText variant="section">{place.price_label || "Цена по запросу"}</AppText></View>
        <Button label="Написать" variant="secondary" fullWidth={false} leftIcon={<Ionicons name="chatbubble-outline" size={20} color={colors.textPrimary} />} onPress={() => author?.id && navigation.navigate("PublicProfile", { specialistId: author.id })} />
        <Button label="Хочу так же" fullWidth={false} loading={busy} onPress={() => void requestSame()} />
      </SafeAreaView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) { return <View style={styles.detailRow}><Ionicons name={icon} size={21} color={colors.textSecondary} /><AppText variant="secondary" tone="secondary" style={styles.detailLabel}>{label}</AppText><AppText variant="secondary" style={styles.detailValue}>{value}</AppText></View>; }
function RelatedPlace({ item, onPress }: { item: Place; onPress: () => void }) { const uri = fileUrl(item.cover?.thumbnail || item.cover?.url); return <Pressable style={styles.relatedCard} onPress={onPress}>{uri ? <Image source={{ uri }} style={styles.relatedImage} /> : <View style={styles.relatedImage} />}<AppText variant="secondary" numberOfLines={2}>{item.title}</AppText></Pressable>; }
function PlaceDetailSkeleton() { return <SafeAreaView style={styles.root} edges={["top", "left", "right"]}><View style={styles.header}><Skeleton style={styles.backSkeleton} /><View style={styles.skeletonHeader}><Skeleton style={styles.avatarSkeleton} /><Skeleton style={styles.nameSkeleton} /></View></View><Skeleton style={styles.heroSkeleton} /><View style={styles.skeletonBody}><Skeleton style={styles.titleSkeleton} /><Skeleton style={styles.lineSkeleton} /><Skeleton style={styles.copySkeleton} /></View></SafeAreaView>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, state: { flex: 1, justifyContent: "center", backgroundColor: colors.background, padding: sizes.screenPadding },
  header: { minHeight: sizes.header + 8, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, backgroundColor: colors.surface }, headerButton: { width: sizes.control.md, height: sizes.control.md, alignItems: "center", justifyContent: "center" }, headerAuthor: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: spacing.sm }, headerCopy: { flex: 1, minWidth: 0 },
  scroll: { paddingBottom: 126 }, summary: { padding: sizes.screenPadding, gap: spacing.sm }, titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md }, title: { flex: 1 }, location: { flexDirection: "row", alignItems: "center", gap: spacing.xs }, rating: { flexDirection: "row", alignItems: "center", gap: spacing.xs }, tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  details: { padding: sizes.screenPadding, gap: spacing.md }, detailRow: { minHeight: 28, flexDirection: "row", alignItems: "center", gap: spacing.sm }, detailLabel: { flex: 1 }, detailValue: { maxWidth: "52%", textAlign: "right" },
  authorCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: sizes.screenPadding }, authorCopy: { flex: 1, minWidth: 0, gap: 2 }, authorRating: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  section: { paddingVertical: spacing.lg }, sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: sizes.screenPadding, marginBottom: spacing.md }, relatedRail: { paddingHorizontal: sizes.screenPadding, gap: spacing.sm }, relatedCard: { width: 148, gap: spacing.xs }, relatedImage: { width: 148, height: 112, borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary },
  review: { marginHorizontal: sizes.screenPadding, paddingVertical: spacing.md, gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider }, reviewHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm }, reviewCopy: { flex: 1 }, reviewRating: { flexDirection: "row", alignItems: "center", gap: 2 },
  actionBar: { position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 74, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: sizes.screenPadding, paddingTop: spacing.sm, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }, priceCopy: { flex: 1, minWidth: 88 },
  backSkeleton: { width: 36, height: 36, borderRadius: radius.full }, skeletonHeader: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, marginLeft: spacing.sm }, avatarSkeleton: { width: 34, height: 34, borderRadius: radius.full }, nameSkeleton: { width: 120 }, heroSkeleton: { width: "100%", height: 390, borderRadius: 0 }, skeletonBody: { padding: sizes.screenPadding, gap: spacing.md }, titleSkeleton: { width: "78%", height: 28 }, lineSkeleton: { width: "52%" }, copySkeleton: { width: "100%", height: 72 },
});
