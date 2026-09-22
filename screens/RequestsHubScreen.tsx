import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TabScreenLayout } from "../components/TabScreenLayout";
import { TaskCardRow, type TaskItem } from "../components/TaskCardRow";
import { AppText, Button, EmptyState, Skeleton } from "../components/ui";
import { apiFetch } from "../src/api";
import { useAuth } from "../src/context/AuthContext";
import { colors, radius, spacing } from "../src/theme";
import type { RootStackParamList } from "../src/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = "mine" | "responses" | "available";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "available", label: "Доступные" },
  { id: "mine", label: "Мои" },
  { id: "responses", label: "Отклики" },
];

export default function RequestsHubScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, "MyRequests">>();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>(route.params?.tab ?? (user?.role === "specialist" ? "available" : "mine"));
  const [items, setItems] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setTab(route.params?.tab ?? (user?.role === "specialist" ? "available" : "mine")); }, [route.params?.tab, user?.role]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const path = tab === "mine" ? "/tasks/mine" : tab === "responses" ? "/applications/mine" : "/tasks";
      const data = await apiFetch(path, { method: "GET" });
      const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setItems(tab === "responses" ? raw.map((row: any) => row.task || row.proffi_task || row).filter((row: any) => row?.id) : raw);
    } catch (requestError) {
      setItems([]);
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить заявки");
    } finally { setLoading(false); }
  }, [tab]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return <TabScreenLayout>
    <View style={styles.header}><View style={styles.headerTitle}><TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate("MainTabs", { screen: "Profile" })} accessibilityLabel="Назад к профилю"><Ionicons name="chevron-back" size={24} color={colors.textPrimary} /></TouchableOpacity><AppText variant="display">Заявки</AppText></View><TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate("MainTabs", { screen: "Messages" })} accessibilityLabel="Сообщения"><Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.textPrimary} /></TouchableOpacity></View>
    <View style={styles.tabs}>{tabs.map((item) => <TouchableOpacity key={item.id} style={[styles.tab, tab === item.id && styles.tabActive]} onPress={() => setTab(item.id)}><AppText variant="secondary" style={tab === item.id ? styles.tabTextActive : undefined}>{item.label}</AppText></TouchableOpacity>)}</View>
    <View style={styles.filters}><TouchableOpacity style={styles.filter} onPress={() => navigation.navigate("TaskFilter")}><Ionicons name="options-outline" size={18} color={colors.textPrimary} /><AppText variant="meta">Все категории</AppText><Ionicons name="chevron-down" size={15} color={colors.textSecondary} /></TouchableOpacity><TouchableOpacity style={styles.filter} onPress={() => navigation.navigate("PlacesMap", { mode: "tasks" })}><Ionicons name="location-outline" size={18} color={colors.textPrimary} /><AppText variant="meta">Рядом</AppText></TouchableOpacity></View>
    {loading ? <View style={styles.skeletons}>{[0, 1, 2, 3].map((item) => <Skeleton key={item} style={styles.skeleton} />)}</View> : <FlatList data={items} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => <TaskCardRow task={item} onPress={() => navigation.navigate("TaskDetail", { taskId: String(item.id) })} />} contentContainerStyle={[styles.content, items.length === 0 && styles.emptyContent]} ItemSeparatorComponent={() => <View style={styles.separator} />} showsVerticalScrollIndicator={false} ListEmptyComponent={<EmptyState title={error ? "Заявки недоступны" : tab === "mine" ? "У вас пока нет заявок" : tab === "responses" ? "Откликов пока нет" : "Нет доступных заявок"} description={error || (tab === "mine" ? "Создайте заявку с помощью AI." : "Новые предложения появятся здесь.")} icon={error ? "cloud-offline-outline" : "document-text-outline"} action={error ? <Button label="Повторить" variant="secondary" onPress={() => void load()} /> : tab === "mine" ? <Button label="Создать заявку" onPress={() => navigation.navigate("AIRequest")} /> : undefined} />} />}
  </TabScreenLayout>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md }, headerTitle: { flexDirection: "row", alignItems: "center", gap: spacing.xs }, backButton: { width: 32, height: 42, alignItems: "center", justifyContent: "center" }, headerButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }, tabs: { flexDirection: "row", marginHorizontal: spacing.md, padding: 3, borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary }, tab: { flex: 1, minHeight: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" }, tabActive: { backgroundColor: colors.accent }, tabTextActive: { fontWeight: "600" }, filters: { flexDirection: "row", gap: spacing.sm, padding: spacing.md }, filter: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: radius.full, backgroundColor: colors.surfaceSecondary, paddingHorizontal: spacing.md }, skeletons: { padding: spacing.md, gap: spacing.md }, skeleton: { height: 132, borderRadius: radius.lg }, content: { padding: spacing.md, paddingBottom: spacing.xxl }, emptyContent: { flexGrow: 1, justifyContent: "center" }, separator: { height: spacing.md } });
