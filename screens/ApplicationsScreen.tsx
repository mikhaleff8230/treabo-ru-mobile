import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppText, Chip, EmptyState, Skeleton } from "../components/ui";
import { apiFetch, fileUrl } from "../src/api";
import { colors, radius, spacing } from "../src/theme";
import type { Application, Task } from "../src/types/proffi";
import type { RootStackParamList } from "../src/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "Applications">;
type Filter = "all" | "pending" | "accepted";

export default function ApplicationsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const [task, setTask] = useState<Task | null>(null);
  const [items, setItems] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { const [taskData, applications] = await Promise.all([apiFetch(`/tasks/${params.taskId}`, { method: "GET" }), apiFetch(`/tasks/${params.taskId}/applications`, { method: "GET" })]); setTask(taskData); setItems(Array.isArray(applications) ? applications : []); } finally { setLoading(false); } }, [params.taskId]);
  useEffect(() => { void load(); }, [load]);
  const visible = useMemo(() => filter === "all" ? items : items.filter((item) => item.status === filter), [filter, items]);
  const taskPhoto = fileUrl(task?.photos?.[0]);
  return <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
    <View style={styles.header}><TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={colors.textPrimary} /></TouchableOpacity><AppText variant="screenTitle" style={styles.headerTitle}>Отклики на заявку</AppText><View style={styles.iconButton} /></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {task ? <TouchableOpacity style={styles.taskCard} onPress={() => navigation.navigate("TaskDetail", { taskId: params.taskId })}>{taskPhoto ? <Image source={{ uri: taskPhoto }} style={styles.taskImage} /> : null}<View style={styles.flex}><AppText variant="bodyMedium" numberOfLines={2}>{task.title}</AppText><AppText variant="meta" tone="secondary">{task.city} · {task.budget_label || "По договорённости"}</AppText></View><Ionicons name="chevron-forward" size={20} color={colors.textSecondary} /></TouchableOpacity> : <Skeleton style={styles.taskSkeleton} />}
      <View style={styles.filters}><Chip label={`Все ${items.length}`} selected={filter === "all"} onPress={() => setFilter("all")} /><Chip label="Новые" selected={filter === "pending"} onPress={() => setFilter("pending")} /><Chip label="В работе" selected={filter === "accepted"} onPress={() => setFilter("accepted")} /></View>
      {loading ? [0, 1, 2].map((item) => <Skeleton key={item} style={styles.rowSkeleton} />) : visible.length ? visible.map((item) => <ApplicationRow key={item.id} item={item} onPress={() => navigation.navigate("ApplicationDetail", { taskId: params.taskId, applicationId: item.id })} />) : <EmptyState title="Откликов пока нет" description="Мы сообщим, когда мастера предложат выполнить работу." icon="people-outline" />}
    </ScrollView>
  </SafeAreaView>;
}

function ApplicationRow({ item, onPress }: { item: Application; onPress: () => void }) {
  const specialist = item.specialist;
  const avatar = fileUrl(specialist?.avatar);
  return <TouchableOpacity style={styles.row} activeOpacity={0.78} onPress={onPress}>{avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <View style={styles.avatarFallback}><AppText variant="section">{item.specialist_name.charAt(0)}</AppText></View>}<View style={styles.flex}><View style={styles.nameLine}><AppText variant="bodyMedium" style={styles.flex}>{item.specialist_name}</AppText>{item.price ? <AppText variant="bodyMedium">{Number(item.price).toLocaleString("ru-RU")} ₽</AppText> : null}</View><View style={styles.rating}>{specialist ? <><Ionicons name="star" size={14} color="#F5B800" /><AppText variant="meta">{Number(specialist.rating || 0).toFixed(1)} ({specialist.reviews_count || 0})</AppText></> : null}{item.specialist_city ? <AppText variant="meta" tone="secondary">· {item.specialist_city}</AppText> : null}</View><AppText variant="secondary" tone="secondary" numberOfLines={2}>{item.message}</AppText><View style={styles.status}><Chip label={item.status === "accepted" ? "Выбран" : item.status === "rejected" ? "Закрыт" : "Новый"} status={item.status === "accepted" ? "success" : "neutral"} /></View></View><Ionicons name="chevron-forward" size={20} color={colors.textTertiary} /></TouchableOpacity>;
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 }, header: { minHeight: 62, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm }, iconButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" }, headerTitle: { flex: 1, textAlign: "center" }, content: { padding: spacing.md, paddingBottom: spacing.xxl }, taskCard: { minHeight: 92, flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary, padding: spacing.sm }, taskImage: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surfacePressed }, taskSkeleton: { height: 92, borderRadius: radius.lg }, filters: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.lg }, rowSkeleton: { height: 142, borderRadius: radius.lg, marginBottom: spacing.md }, row: { minHeight: 142, flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider }, avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.surfaceSecondary }, avatarFallback: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }, nameLine: { flexDirection: "row", alignItems: "center", gap: spacing.sm }, rating: { minHeight: 19, flexDirection: "row", alignItems: "center", gap: 3 }, status: { alignSelf: "flex-start", marginTop: spacing.sm } });
