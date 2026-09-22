import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing, typography } from "../src/theme";
import { getNotifications, readAllNotifications, type AppNotification, type NotificationType } from "../src/services/notifications";
import type { RootStackParamList } from "../src/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = "all" | "application" | "message" | "like" | "follower" | "system";
const filters: Array<{ key: Filter; label: string }> = [{ key: "all", label: "Все" }, { key: "application", label: "Заявки" }, { key: "message", label: "Сообщения" }, { key: "like", label: "Лайки" }, { key: "follower", label: "Подписки" }, { key: "system", label: "Системные" }];

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true); setError(null);
    try { const result = await getNotifications(filter as NotificationType | "all"); setItems(result.items); setUnread(result.unreadCount); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось загрузить уведомления"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const groups = useMemo(() => groupDates(items), [items]);
  const markAll = async () => { await readAllNotifications(); setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() }))); setUnread(0); };

  return <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
    <View style={styles.header}><TouchableOpacity style={styles.icon} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={27} color={colors.textPrimary} /></TouchableOpacity><Text style={styles.title}>Уведомления</Text><TouchableOpacity style={styles.icon} onPress={() => navigation.navigate("NotificationSettings")}><Ionicons name="settings-outline" size={23} color={colors.textPrimary} /></TouchableOpacity></View>
    <View style={styles.toolbar}><Text style={styles.count}>{unread ? `Новых: ${unread}` : "Всё прочитано"}</Text>{unread ? <TouchableOpacity onPress={() => void markAll()}><Text style={styles.readAll}>Прочитать все</Text></TouchableOpacity> : null}</View>
    <View style={styles.filters}>{filters.map((item) => <TouchableOpacity key={item.key} style={[styles.filter, filter === item.key && styles.filterActive]} onPress={() => setFilter(item.key)}><Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text></TouchableOpacity>)}</View>
    {loading ? <ActivityIndicator style={styles.loader} color={colors.textPrimary} /> : <FlatList data={groups} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />} renderItem={({ item }) => item.kind === "header" ? <Text style={styles.groupTitle}>{item.label}</Text> : <NotificationRow item={item.notification} onPress={() => navigation.navigate("NotificationDetail", { notificationId: item.notification.id })} />} ListEmptyComponent={<View style={styles.empty}><Ionicons name={error ? "cloud-offline-outline" : "notifications-outline"} size={44} color={colors.textTertiary} /><Text style={styles.emptyTitle}>{error ? "Не удалось загрузить" : "Уведомлений пока нет"}</Text><Text style={styles.emptyText}>{error || "Здесь появятся сообщения, отклики и события ваших Плейсов."}</Text>{error ? <TouchableOpacity style={styles.retry} onPress={() => void load()}><Text style={styles.retryText}>Повторить</Text></TouchableOpacity> : null}</View>} />}
  </SafeAreaView>;
}

type Row = { id: string; kind: "header"; label: string } | { id: string; kind: "item"; notification: AppNotification };
function groupDates(items: AppNotification[]): Row[] { const rows: Row[] = []; let group = ""; for (const item of items) { const next = dateGroup(item.created_at); if (next !== group) { group = next; rows.push({ id: `h-${group}`, kind: "header", label: group }); } rows.push({ id: `n-${item.id}`, kind: "item", notification: item }); } return rows; }
function dateGroup(value?: string | null) { if (!value) return "Ранее"; const date = new Date(value); const now = new Date(); if (date.toDateString() === now.toDateString()) return "Сегодня"; const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1); if (date.toDateString() === yesterday.toDateString()) return "Вчера"; return "Ранее"; }
function iconFor(type: NotificationType): keyof typeof Ionicons.glyphMap { return ({ message: "chatbubble-outline", request: "document-text-outline", application: "people-outline", favorite: "heart-outline", like: "heart", follower: "person-add-outline", comment: "chatbox-ellipses-outline", system: "notifications-outline" } as const)[type] || "notifications-outline"; }
function NotificationRow({ item, onPress }: { item: AppNotification; onPress: () => void }) { const unread = !item.read_at; return <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.72}>{unread ? <View style={styles.unreadDot} /> : null}<View style={[styles.rowIcon, item.type === "like" && styles.likeIcon]}><Ionicons name={iconFor(item.type)} size={24} color={item.type === "like" ? colors.danger : colors.textPrimary} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{item.title}</Text>{item.body ? <Text numberOfLines={2} style={styles.rowBody}>{item.body}</Text> : null}<Text style={styles.time}>{item.created_at ? new Date(item.created_at).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }) : ""}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textTertiary} /></TouchableOpacity>; }

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.white }, header: { height: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md }, icon: { width: 42, height: 42, alignItems: "center", justifyContent: "center" }, title: { ...typography.screenTitle, color: colors.textPrimary }, toolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, marginTop: spacing.xs }, count: { ...typography.meta, color: colors.textSecondary }, readAll: { ...typography.secondary, color: "#3777D6" }, filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, padding: spacing.lg }, filter: { paddingHorizontal: spacing.md, height: 38, borderRadius: radius.full, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }, filterActive: { backgroundColor: colors.accent }, filterText: { ...typography.meta, color: colors.textSecondary }, filterTextActive: { color: colors.textPrimary, fontWeight: "600" }, loader: { marginTop: 70 }, list: { paddingHorizontal: spacing.lg, paddingBottom: 42, flexGrow: 1 }, groupTitle: { ...typography.section, marginTop: spacing.md, marginBottom: spacing.sm }, row: { minHeight: 82, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider, paddingVertical: spacing.md }, unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }, rowIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }, likeIcon: { backgroundColor: colors.dangerSoft }, rowCopy: { flex: 1 }, rowTitle: { ...typography.bodyMedium, color: colors.textPrimary }, rowBody: { ...typography.secondary, color: colors.textSecondary, marginTop: 1 }, time: { ...typography.meta, color: colors.textTertiary, marginTop: 2 }, empty: { alignItems: "center", paddingTop: 90, paddingHorizontal: spacing.xl }, emptyTitle: { ...typography.section, marginTop: spacing.md }, emptyText: { ...typography.secondary, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs }, retry: { marginTop: spacing.lg, backgroundColor: colors.accent, borderRadius: radius.full, height: 46, justifyContent: "center", paddingHorizontal: spacing.xl }, retryText: { ...typography.button } });
