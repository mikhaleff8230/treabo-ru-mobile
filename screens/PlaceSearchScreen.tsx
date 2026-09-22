import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PlaceCard } from "../components/PlaceCard";
import { AppText, Button, Chip, EmptyState, Skeleton } from "../components/ui";
import { apiFetch, fileUrl } from "../src/api";
import { listPlaces } from "../src/services/places";
import { colors, radius, spacing } from "../src/theme";
import type { Place } from "../src/types/place";
import type { Specialist, Task } from "../src/types/proffi";
import type { RootStackParamList } from "../src/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "Search">;
type Category = { id: string; name_ru?: string; name?: string };
type SearchMode = "places" | "specialists" | "tasks";

const modes: Array<{ id: SearchMode; label: string }> = [
  { id: "places", label: "Плейсы" },
  { id: "specialists", label: "Мастера" },
  { id: "tasks", label: "Заявки" },
];

function categoryName(category: Category) {
  return category.name_ru || category.name || "Категория";
}

function SpecialistRow({ specialist, onPress }: { specialist: Specialist; onPress: () => void }) {
  const avatar = fileUrl(specialist.avatar);
  const works = (specialist.portfolio || []).slice(0, 4);
  return (
    <TouchableOpacity style={styles.personRow} activeOpacity={0.78} onPress={onPress}>
      {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Ionicons name="person" size={24} color={colors.textSecondary} /></View>}
      <View style={styles.personCopy}>
        <View style={styles.titleLine}>
          <AppText variant="bodyMedium" numberOfLines={1} style={styles.flex}>{specialist.name}</AppText>
          {specialist.is_online ? <View style={styles.onlineDot} /> : null}
        </View>
        <View style={styles.metaLine}>
          <Ionicons name="star" size={15} color="#F5B800" />
          <AppText variant="meta">{Number(specialist.rating || 0).toFixed(1)} ({specialist.reviews_count || 0})</AppText>
          {specialist.city ? <AppText variant="meta" tone="secondary">· {specialist.city}</AppText> : null}
        </View>
        <AppText variant="meta" tone="secondary" numberOfLines={1}>{specialist.services?.join(" · ") || specialist.bio || "Мастер TREABO"}</AppText>
        {works.length ? <View style={styles.portfolioRow}>{works.map((work, index) => { const uri = fileUrl(work); return uri ? <Image key={`${uri}-${index}`} source={{ uri }} style={styles.portfolioImage} /> : null; })}</View> : null}
      </View>
      <View style={styles.messageIcon}><Ionicons name="chatbubble-ellipses-outline" size={21} color={colors.textPrimary} /></View>
    </TouchableOpacity>
  );
}

function TaskRow({ task, onPress }: { task: Task; onPress: () => void }) {
  const photo = fileUrl(task.photos?.[0]);
  return (
    <TouchableOpacity style={styles.taskRow} activeOpacity={0.78} onPress={onPress}>
      {photo ? <Image source={{ uri: photo }} style={styles.taskImage} /> : <View style={styles.taskImageFallback}><Ionicons name="document-text-outline" size={26} color={colors.textSecondary} /></View>}
      <View style={styles.flex}>
        <AppText variant="bodyMedium" numberOfLines={2}>{task.title}</AppText>
        <AppText variant="secondary" tone="secondary" numberOfLines={2} style={styles.description}>{task.description}</AppText>
        <View style={styles.metaLine}><Ionicons name="location-outline" size={15} color={colors.textSecondary} /><AppText variant="meta" tone="secondary">{task.city}{task.distance_km != null ? `, ${task.distance_km} км` : ""}</AppText></View>
        <AppText variant="bodyMedium" style={styles.price}>{task.budget_label || "По договорённости"}</AppText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

export default function PlaceSearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const [mode, setMode] = useState<SearchMode>("places");
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [online, setOnline] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(Boolean(route.params?.filtersOpen));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/categories", { method: "GET", auth: false })
      .then((data) => setCategories(Array.isArray(data) ? data : data?.data || []))
      .catch(() => setCategories([]));
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "places") {
        setPlaces(await listPlaces({ search: query || undefined, category_id: categoryId || undefined, price_from: priceFrom ? Number(priceFrom) : undefined, price_to: priceTo ? Number(priceTo) : undefined, sort: "new", per_page: 30 }));
      } else if (mode === "specialists") {
        const suffix = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
        const data = await apiFetch(`/specialists${suffix}`, { method: "GET", auth: false });
        const items: Specialist[] = Array.isArray(data) ? data : data?.data || [];
        setSpecialists(online ? items.filter((item) => item.is_online) : items);
      } else {
        const suffix = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
        const data = await apiFetch(`/tasks${suffix}`, { method: "GET", auth: false });
        setTasks(Array.isArray(data) ? data : data?.data || []);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось выполнить поиск");
      if (mode === "places") setPlaces([]);
      if (mode === "specialists") setSpecialists([]);
      if (mode === "tasks") setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, mode, online, priceFrom, priceTo, query]);

  useEffect(() => { const timer = setTimeout(() => void search(), 260); return () => clearTimeout(timer); }, [search]);

  const data = useMemo(() => mode === "places" ? places : mode === "specialists" ? specialists : tasks, [mode, places, specialists, tasks]);
  const reset = () => { setCategoryId(""); setPriceFrom(""); setPriceTo(""); setOnline(false); };
  const placeholder = mode === "places" ? "Поиск плейсов" : mode === "specialists" ? "Поиск мастеров" : "Поиск заявок";

  const renderItem = ({ item }: { item: Place | Specialist | Task }) => {
    if (mode === "places") { const place = item as Place; return <PlaceCard place={place} variant="row" onPress={() => navigation.navigate("PlaceDetail", { placeId: place.id })} />; }
    if (mode === "specialists") { const specialist = item as Specialist; return <SpecialistRow specialist={specialist} onPress={() => navigation.navigate("PublicProfile", { specialistId: specialist.id })} />; }
    const task = item as Task;
    return <TaskRow task={task} onPress={() => navigation.navigate("TaskDetail", { taskId: task.id })} />;
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={colors.textPrimary} /></TouchableOpacity>
        <View style={styles.searchBox}><Ionicons name="search" size={20} color={colors.textSecondary} /><TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder={placeholder} placeholderTextColor={colors.textTertiary} returnKeyType="search" onSubmitEditing={() => void search()} />{query ? <TouchableOpacity onPress={() => setQuery("")}><Ionicons name="close-circle" size={19} color={colors.textTertiary} /></TouchableOpacity> : null}</View>
      </View>
      <View style={styles.tabs}>{modes.map((item) => <Pressable key={item.id} onPress={() => setMode(item.id)} style={[styles.tab, mode === item.id && styles.tabActive]}><AppText variant="secondary" style={mode === item.id ? styles.tabActiveText : undefined}>{item.label}</AppText></Pressable>)}</View>
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarTrack}>
          <Chip label="Рядом" />
          {mode === "places" ? <Chip label={categoryId ? categoryName(categories.find((item) => String(item.id) === categoryId) || { id: categoryId }) : "Категория"} selected={Boolean(categoryId)} onPress={() => setFiltersOpen(true)} /> : null}
          {mode === "places" ? <Chip label={priceFrom || priceTo ? "Цена задана" : "Цена"} selected={Boolean(priceFrom || priceTo)} onPress={() => setFiltersOpen(true)} /> : null}
          {mode === "specialists" ? <Chip label="Сейчас онлайн" selected={online} onPress={() => setOnline((value) => !value)} /> : null}
        </ScrollView>
        <TouchableOpacity style={styles.smallIconButton} onPress={() => mode === "places" ? setFiltersOpen(true) : navigation.navigate("MainTabs", { screen: "Map" })}><Ionicons name={mode === "places" ? "options-outline" : "map-outline"} size={20} color={colors.textPrimary} /></TouchableOpacity>
      </View>
      <View style={styles.resultHead}><AppText variant="section">Найдено {data.length}</AppText><AppText variant="meta" tone="secondary">Сначала новые</AppText></View>
      {loading ? <View style={styles.skeletons}>{[0, 1, 2].map((item) => <Skeleton key={item} style={styles.resultSkeleton} />)}</View> : <FlatList data={data as Array<Place | Specialist | Task>} keyExtractor={(item) => `${mode}-${item.id}`} renderItem={renderItem} contentContainerStyle={[styles.results, data.length === 0 && styles.emptyResults]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" ItemSeparatorComponent={() => <View style={styles.separator} />} ListEmptyComponent={<EmptyState title={error ? "Поиск временно недоступен" : "Ничего не найдено"} description={error || "Измените запрос или параметры фильтра."} icon={error ? "cloud-offline-outline" : "search-outline"} action={error ? <Button label="Повторить" variant="secondary" onPress={() => void search()} style={styles.retry} /> : undefined} />} />}
      <Modal visible={filtersOpen} transparent animationType="slide" onRequestClose={() => setFiltersOpen(false)}>
        <View style={styles.modalRoot}><Pressable style={styles.backdrop} onPress={() => setFiltersOpen(false)} /><SafeAreaView style={styles.sheet} edges={["bottom"]}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}><AppText variant="screenTitle" style={styles.flex}>Фильтры</AppText><TouchableOpacity onPress={reset}><AppText variant="secondary" tone="secondary">Сбросить всё</AppText></TouchableOpacity><TouchableOpacity onPress={() => setFiltersOpen(false)}><Ionicons name="close" size={26} color={colors.textPrimary} /></TouchableOpacity></View>
          <AppText variant="bodyMedium" style={styles.fieldTitle}>Категория</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTrack}><Chip label="Все" selected={!categoryId} onPress={() => setCategoryId("")} />{categories.map((category) => <Chip key={String(category.id)} label={categoryName(category)} selected={String(category.id) === categoryId} onPress={() => setCategoryId(String(category.id))} />)}</ScrollView>
          <AppText variant="bodyMedium" style={styles.fieldTitle}>Цена</AppText>
          <View style={styles.priceRow}><View style={styles.priceInput}><AppText variant="meta" tone="secondary">От</AppText><TextInput value={priceFrom} onChangeText={setPriceFrom} keyboardType="numeric" placeholder="0 ₽" placeholderTextColor={colors.textTertiary} style={styles.numberInput} /></View><View style={styles.priceInput}><AppText variant="meta" tone="secondary">До</AppText><TextInput value={priceTo} onChangeText={setPriceTo} keyboardType="numeric" placeholder="Любая" placeholderTextColor={colors.textTertiary} style={styles.numberInput} /></View></View>
          <View style={styles.switchRow}><Ionicons name="flash-outline" size={22} color={colors.textPrimary} /><AppText variant="bodyMedium" style={styles.flex}>Мастер сейчас онлайн</AppText><Switch value={online} onValueChange={setOnline} trackColor={{ false: colors.border, true: colors.accent }} thumbColor={colors.surface} /></View>
          <Button label="Показать результаты" onPress={() => { setFiltersOpen(false); void search(); }} style={styles.applyButton} />
        </SafeAreaView></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  searchBox: { flex: 1, height: 44, borderRadius: radius.full, backgroundColor: colors.surfaceSecondary, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md }, searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 0 },
  tabs: { flexDirection: "row", marginHorizontal: spacing.md, padding: 3, borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary }, tab: { flex: 1, minHeight: 38, borderRadius: radius.md, alignItems: "center", justifyContent: "center" }, tabActive: { backgroundColor: colors.accent }, tabActiveText: { fontWeight: "600" },
  toolbar: { flexDirection: "row", alignItems: "center", paddingLeft: spacing.md, paddingRight: spacing.sm, paddingVertical: spacing.sm, gap: spacing.sm }, toolbarTrack: { gap: spacing.sm, paddingRight: spacing.xs }, smallIconButton: { width: 38, height: 38, borderRadius: radius.full, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  resultHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, skeletons: { padding: spacing.md, gap: spacing.md }, resultSkeleton: { height: 148, borderRadius: radius.lg }, results: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }, emptyResults: { flexGrow: 1, justifyContent: "center" }, separator: { height: spacing.md }, retry: { marginTop: spacing.sm, alignSelf: "center" },
  personRow: { minHeight: 116, flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: spacing.sm }, avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.surfaceSecondary }, avatarFallback: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }, personCopy: { flex: 1, gap: 3 }, titleLine: { flexDirection: "row", alignItems: "center", gap: spacing.xs }, onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }, metaLine: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }, portfolioRow: { flexDirection: "row", gap: 4, marginTop: spacing.xs }, portfolioImage: { width: 52, height: 38, borderRadius: radius.sm, backgroundColor: colors.surfaceSecondary }, messageIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  taskRow: { minHeight: 132, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm }, taskImage: { width: 92, height: 112, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary }, taskImageFallback: { width: 92, height: 112, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }, description: { marginTop: 3 }, price: { marginTop: spacing.xs },
  modalRoot: { flex: 1, justifyContent: "flex-end" }, backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay }, sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: "82%" }, handle: { width: 52, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: spacing.md }, sheetHead: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }, fieldTitle: { marginBottom: spacing.sm }, categoryTrack: { gap: spacing.sm, paddingBottom: spacing.lg }, priceRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md }, priceInput: { flex: 1, minHeight: 62, borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary, paddingHorizontal: spacing.md, justifyContent: "center" }, numberInput: { color: colors.textPrimary, fontSize: 16, fontWeight: "500", paddingVertical: 2 }, switchRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary, paddingHorizontal: spacing.md }, applyButton: { marginTop: spacing.lg },
});
