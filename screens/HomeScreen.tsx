import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { TabScreenLayout } from "../components/TabScreenLayout";
import { PrimaryButton } from "../components/PrimaryButton";
import { TaskCardRow, type TaskItem } from "../components/TaskCardRow";
import { apiFetch } from "../src/api";
import { useAuth } from "../src/context/AuthContext";
import { useLang } from "../src/context/LangContext";
import { colors, spacing } from "../src/theme";
import type { CategoryTileData } from "../components/CategoryTile";
import type { MainTabParamList, RootStackParamList } from "../src/navigation/types";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

const PROMOS = [
  { title: "Про новую жизнь", color: "#394150" },
  { title: "Время силы", color: "#D7A948" },
  { title: "Бонусы в Директе", color: "#4B67D9" },
  { title: "Почти отлично", color: "#7A95C7" },
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { t } = useLang();
  const [categories, setCategories] = useState<CategoryTileData[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, ts] = await Promise.all([
        apiFetch("/categories", { method: "GET" }),
        apiFetch("/tasks", { method: "GET" }),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setTasks(Array.isArray(ts) ? ts : []);
    } catch {
      setCategories([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <TabScreenLayout>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.segment}>
          <View style={styles.segmentOn}>
            <Text style={styles.segmentOnText}>Список</Text>
          </View>
          <TouchableOpacity style={styles.segmentOff} onPress={() => navigation.navigate("Map")}>
            <Text style={styles.segmentOffText}>Карта</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoTrack}>
          {PROMOS.map((item) => (
            <TouchableOpacity key={item.title} style={[styles.promoCard, { backgroundColor: item.color }]}>
              <View style={styles.promoDot} />
              <Text style={styles.promoText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.searchRow}>
          <TouchableOpacity style={styles.searchFake} onPress={() => navigation.navigate("TaskSearch")}>
            <Ionicons name="search-outline" size={20} color={colors.neutral500} />
            <Text style={styles.searchText}>Какой заказ ищете?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterBtn} onPress={() => navigation.navigate("TaskFilter")}>
            <Ionicons name="options-outline" size={22} color={colors.black} />
          </TouchableOpacity>
        </View>

        {user?.role === "customer" && (
          <PrimaryButton title={t("create_task")} onPress={() => navigation.navigate("CreateTask")} style={styles.createBtn} />
        )}

        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.neutral400} />
        ) : tasks.length === 0 ? (
          <Text style={styles.empty}>{t("no_tasks")}</Text>
        ) : (
          <View style={styles.taskList}>
            {tasks.map((task) => (
              <TaskCardRow
                key={String(task.id)}
                task={task}
                category={categories.find((c) => String(c.id) === String(task.category_id || task.category))}
                onPress={() => navigation.navigate("TaskDetail", { taskId: String(task.id) })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.lavender50 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 32 },
  segment: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: colors.lavender100,
    borderRadius: 14,
    padding: 3,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  segmentOn: { backgroundColor: colors.white, borderRadius: 11, paddingHorizontal: 18, paddingVertical: 8 },
  segmentOff: { borderRadius: 11, paddingHorizontal: 18, paddingVertical: 8 },
  segmentOnText: { fontSize: 13, fontWeight: "700", color: colors.black },
  segmentOffText: { fontSize: 13, fontWeight: "700", color: colors.neutral500 },
  promoTrack: { gap: 8, paddingBottom: spacing.md },
  promoCard: { width: 72, height: 72, borderRadius: 14, padding: 8, justifyContent: "flex-end" },
  promoText: { color: colors.white, fontSize: 10, fontWeight: "800", lineHeight: 12 },
  promoDot: { position: "absolute", top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: "#EF3856" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: spacing.md },
  searchFake: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  searchText: { fontSize: 14, color: colors.neutral500 },
  filterBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  createBtn: { marginBottom: spacing.md },
  taskList: { gap: 12 },
  loader: { marginVertical: 24 },
  empty: { textAlign: "center", color: colors.neutral400, paddingVertical: 24, fontSize: 14 },
});
