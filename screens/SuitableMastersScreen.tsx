import React, { useCallback, useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppText, Button, EmptyState, Skeleton } from "../components/ui";
import { apiFetch, fileUrl } from "../src/api";
import { colors, radius, spacing } from "../src/theme";
import type { Specialist } from "../src/types/proffi";
import type { RootStackParamList } from "../src/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "SuitableMasters">;
type RankedSpecialist = Specialist & { score?: number; rank?: number };

export default function SuitableMastersScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const [items, setItems] = useState<RankedSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { const data = await apiFetch(`/tasks/${params.taskId}/recommended-specialists`, { method: "GET" }); setItems(Array.isArray(data) ? data : data?.data || []); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Не удалось найти мастеров"); } finally { setLoading(false); } }, [params.taskId]);
  useEffect(() => { void load(); }, [load]);
  return <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
    <View style={styles.header}><TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("MainTabs", { screen: "Requests" })}><Ionicons name="chevron-back" size={24} color={colors.textPrimary} /></TouchableOpacity><View style={styles.headerCopy}><AppText variant="screenTitle">Подходящие мастера</AppText><AppText variant="meta" tone="secondary">По вашей заявке</AppText></View><TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("MainTabs", { screen: "Map" })}><Ionicons name="map-outline" size={22} color={colors.textPrimary} /></TouchableOpacity></View>
    {loading ? <View style={styles.loading}><View style={styles.radar}><Ionicons name="people-outline" size={38} color={colors.success} /></View><AppText variant="screenTitle" style={styles.center}>Подбираем лучших специалистов…</AppText><AppText variant="secondary" tone="secondary" style={styles.center}>Учитываем категорию, опыт, отзывы и доступность мастеров.</AppText>{[0, 1, 2].map((item) => <Skeleton key={item} style={styles.rowSkeleton} />)}</View> : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{items.length ? items.map((item) => <MasterRow key={item.id} item={item} onOpen={() => navigation.navigate("PublicProfile", { specialistId: item.id })} />) : <EmptyState title={error ? "Не удалось выполнить подбор" : "Подбор ещё идёт"} description={error || "Рекомендации появятся здесь, а новые отклики — в вашей заявке."} icon={error ? "cloud-offline-outline" : "time-outline"} action={error ? <Button label="Повторить" variant="secondary" onPress={() => void load()} /> : <Button label="Открыть заявку" onPress={() => navigation.navigate("TaskDetail", { taskId: params.taskId })} />} />}</ScrollView>}
  </SafeAreaView>;
}

function MasterRow({ item, onOpen }: { item: RankedSpecialist; onOpen: () => void }) {
  const avatar = fileUrl(item.avatar);
  const portfolio = (item.portfolio || []).slice(0, 4);
  return <TouchableOpacity style={styles.master} activeOpacity={0.78} onPress={onOpen}>{avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Ionicons name="person" size={25} color={colors.textSecondary} /></View>}<View style={styles.masterCopy}><View style={styles.nameRow}><AppText variant="bodyMedium" style={styles.flex}>{item.name}</AppText>{item.is_online ? <View style={styles.online} /> : null}</View><View style={styles.rating}><Ionicons name="star" size={15} color="#F5B800" /><AppText variant="meta">{Number(item.rating || 0).toFixed(1)} ({item.reviews_count || 0})</AppText>{item.city ? <AppText variant="meta" tone="secondary">· {item.city}</AppText> : null}</View><AppText variant="meta" tone="secondary" numberOfLines={1}>{item.services?.join(" · ") || "Мастер TREABO"}</AppText>{portfolio.length ? <View style={styles.portfolio}>{portfolio.map((photo, index) => { const uri = fileUrl(photo); return uri ? <Image key={`${uri}-${index}`} source={{ uri }} style={styles.portfolioImage} /> : null; })}</View> : null}</View><View style={styles.chatButton}><Ionicons name="chatbubble-ellipses-outline" size={21} color={colors.textPrimary} /></View></TouchableOpacity>;
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 }, center: { textAlign: "center" }, header: { minHeight: 62, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm }, iconButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" }, headerCopy: { flex: 1, alignItems: "center" }, loading: { padding: spacing.xl, alignItems: "center", gap: spacing.sm }, radar: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center", marginVertical: spacing.xl }, rowSkeleton: { width: "100%", height: 132, borderRadius: radius.xl, marginTop: spacing.md }, content: { padding: spacing.md, paddingBottom: spacing.xxl }, master: { minHeight: 138, flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider }, avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surfaceSecondary }, avatarFallback: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }, masterCopy: { flex: 1, gap: 3 }, nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs }, online: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }, rating: { flexDirection: "row", alignItems: "center", gap: 4 }, portfolio: { flexDirection: "row", gap: 4, marginTop: spacing.xs }, portfolioImage: { width: 52, height: 42, borderRadius: radius.sm, backgroundColor: colors.surfaceSecondary }, chatButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" } });
