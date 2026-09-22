import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppText, Button, Chip, Skeleton } from "../components/ui";
import { TreaboLogo } from "../components/TreaboLogo";
import { fileUrl } from "../src/api";
import { getPlace } from "../src/services/places";
import { colors, radius, spacing } from "../src/theme";
import type { Place } from "../src/types/place";
import type { RootStackParamList } from "../src/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "PlacePublished">;

export default function PlacePublishedScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const [place, setPlace] = useState<Place | null>(null);
  useEffect(() => { getPlace(params.placeId).then(setPlace).catch(() => setPlace(null)); }, [params.placeId]);
  const image = fileUrl(place?.cover?.thumbnail || place?.cover?.url);
  return <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
    <View style={styles.top}><TreaboLogo size="compact" /><TouchableOpacity onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}><AppText variant="secondary" tone="secondary">Продолжить</AppText></TouchableOpacity></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.check}><Ionicons name="checkmark" size={58} color={colors.success} /></View>
      <AppText variant="display" style={styles.center}>Работа опубликована!</AppText>
      <AppText variant="body" tone="secondary" style={styles.subtitle}>Ваш Плейс уже доступен в ленте, поиске и на карте.</AppText>

      {place ? <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => navigation.navigate("PlaceDetail", { placeId: place.id })}>
        {image ? <Image source={{ uri: image }} style={styles.image} /> : <View style={styles.image}><Skeleton style={StyleSheet.absoluteFill} /></View>}
        <View style={styles.cardCopy}><AppText variant="section" numberOfLines={2}>{place.title}</AppText><View style={styles.location}><Ionicons name="location-outline" size={17} color={colors.textSecondary} /><AppText variant="secondary" tone="secondary">{place.city || "Город не указан"}</AppText></View>{place.category?.name ? <View style={styles.chip}><Chip label={place.category.name} /></View> : null}</View>
        <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
      </TouchableOpacity> : <Skeleton style={styles.cardSkeleton} />}

      <View style={styles.promo}><View style={styles.promoIcon}><Ionicons name="sparkles-outline" size={24} color={colors.textPrimary} /></View><View style={styles.cardCopy}><AppText variant="bodyMedium">Больше клиентов с PRO</AppText><AppText variant="meta" tone="secondary">Плейсы в PRO-профиле получают больше просмотров.</AppText></View><Ionicons name="chevron-forward" size={20} color={colors.textSecondary} /></View>

      <Button label="Посмотреть Плейс" onPress={() => navigation.navigate("PlaceDetail", { placeId: params.placeId })} style={styles.firstButton} />
      <Button label="Добавить ещё одну работу" variant="secondary" onPress={() => navigation.replace("CreatePlace")} style={styles.secondaryButton} />
      <Button label="Перейти на карту" variant="text" onPress={() => navigation.navigate("MainTabs", { screen: "Map" })} />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, top: { minHeight: 60, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, content: { alignItems: "center", padding: spacing.lg, paddingBottom: spacing.xxl }, center: { textAlign: "center", marginTop: spacing.lg }, subtitle: { maxWidth: 310, textAlign: "center", marginTop: spacing.sm },
  check: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center", marginTop: spacing.lg },
  card: { width: "100%", minHeight: 142, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.sm, marginTop: spacing.xl }, cardSkeleton: { width: "100%", height: 142, borderRadius: radius.xl, marginTop: spacing.xl }, image: { width: 124, height: 122, borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary, overflow: "hidden" }, cardCopy: { flex: 1 }, location: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm }, chip: { alignSelf: "flex-start", marginTop: spacing.sm },
  promo: { width: "100%", minHeight: 82, borderRadius: radius.xl, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.accentSoft, marginTop: spacing.lg }, promoIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  firstButton: { marginTop: spacing.xl }, secondaryButton: { marginTop: spacing.sm },
});
