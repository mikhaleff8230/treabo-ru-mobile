import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { TreaboHeader } from "../components/TreaboHeader";
import { AppText, Button, Chip, EmptyState } from "../components/ui";
import { apiFetch, fileUrl } from "../src/api";
import { listPlaces } from "../src/services/places";
import { buildMapCenterScript, buildMapUpdateScript, buildYandexMapShellHtml, toYandexPoints, yandexMapsApiKey, type YandexMapPoint } from "../src/maps/yandexMapHtml";
import { colors, radius, spacing } from "../src/theme";
import type { Place } from "../src/types/place";
import type { Task } from "../src/types/proffi";
import type { RootStackParamList } from "../src/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Mode = "places" | "tasks";

export default function PlacesMapScreen() {
  const navigation = useNavigation<Nav>();
  const webRef = useRef<WebView>(null);
  const [mode, setMode] = useState<Mode>("places");
  const [places, setPlaces] = useState<Place[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const html = useMemo(() => buildYandexMapShellHtml(yandexMapsApiKey()), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "places") setPlaces(await listPlaces({ per_page: 50 }));
      else {
        const data = await apiFetch("/tasks", { method: "GET", auth: false });
        setTasks(Array.isArray(data) ? data : data?.data || []);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить карту");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { void load(); }, [load]);

  const points = useMemo<YandexMapPoint[]>(() => mode === "places"
    ? places.filter((place) => place.lat != null && place.lng != null).map((place) => ({ id: place.id, title: place.title, priceLabel: place.price_label, city: place.city, photoUrl: fileUrl(place.cover?.thumbnail || place.cover?.url), lat: Number(place.lat), lng: Number(place.lng) }))
    : toYandexPoints(tasks, (path) => fileUrl(path)), [mode, places, tasks]);

  useEffect(() => { if (ready) webRef.current?.injectJavaScript(buildMapUpdateScript(points, selected)); }, [points, ready, selected]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === "ready") setReady(true);
      if (message.type === "select") setSelected(String(message.payload.id));
    } catch { /* ignored: messages may come from map SDK internals */ }
  };

  const locate = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") return;
    const current = await Location.getCurrentPositionAsync({});
    webRef.current?.injectJavaScript(buildMapCenterScript(current.coords.latitude, current.coords.longitude, 12));
  };

  const visible: Array<Place | Task> = mode === "places" ? places : tasks;
  const current = visible.find((item) => String(item.id) === selected);
  const openCurrent = () => {
    if (!current) return;
    if (mode === "places") navigation.navigate("PlaceDetail", { placeId: String(current.id) });
    else navigation.navigate("TaskDetail", { taskId: String(current.id) });
  };
  const openFilters = () => {
    if (mode === "places") navigation.navigate("Search", { filtersOpen: true });
    else navigation.navigate("TaskFilter");
  };

  return (
    <View style={styles.root}>
      <WebView ref={webRef} originWhitelist={["*"]} source={{ html }} onMessage={onMessage} javaScriptEnabled domStorageEnabled style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.overlay} edges={["top"]} pointerEvents="box-none">
        <TreaboHeader compact onSearch={() => navigation.navigate("Search")} />
        <View style={styles.mode}>
          <TouchableOpacity style={[styles.modeButton, mode === "places" && styles.modeActive]} onPress={() => { setMode("places"); setSelected(null); }}><AppText variant="bodyMedium">Работы</AppText></TouchableOpacity>
          <TouchableOpacity style={[styles.modeButton, mode === "tasks" && styles.modeActive]} onPress={() => { setMode("tasks"); setSelected(null); }}><AppText variant="bodyMedium">Заявки</AppText></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <TouchableOpacity style={styles.filterIcon} onPress={openFilters}><Ionicons name="options-outline" size={20} color={colors.textPrimary} /></TouchableOpacity>
          <Chip label="Все категории" onPress={openFilters} />
          <Chip label="Рядом" />
          <Chip label={mode === "places" ? "Цена" : "Срочные"} />
        </ScrollView>
      </SafeAreaView>

      <View style={styles.mapActions}>
        <TouchableOpacity style={styles.mapAction} onPress={() => void locate()}><Ionicons name="navigate" size={22} color={colors.textPrimary} /></TouchableOpacity>
        <TouchableOpacity style={styles.mapAction}><Ionicons name="add" size={24} color={colors.textPrimary} /></TouchableOpacity>
        <TouchableOpacity style={styles.mapAction}><Ionicons name="remove" size={24} color={colors.textPrimary} /></TouchableOpacity>
      </View>

      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.textPrimary} /></View> : null}
      {error && !loading ? <View style={styles.errorCard}><EmptyState title="Карта недоступна" description={error} icon="map-outline" action={<Button label="Повторить" variant="secondary" onPress={() => void load()} />} /></View> : null}

      {!error ? <SafeAreaView style={styles.bottom} edges={["bottom"]}>
        {current ? <SelectedPreview item={current} mode={mode} onClose={() => setSelected(null)} onOpen={openCurrent} /> : <NearbyList items={visible} mode={mode} onSelect={(id) => setSelected(id)} onAll={() => navigation.navigate(mode === "places" ? "Search" : "TasksList")} />}
      </SafeAreaView> : null}
    </View>
  );
}

function itemImage(item: Place | Task, mode: Mode) {
  return mode === "places" ? fileUrl((item as Place).cover?.thumbnail || (item as Place).cover?.url) : fileUrl((item as Task).photos?.[0]);
}

function itemPrice(item: Place | Task, mode: Mode) {
  return mode === "places" ? (item as Place).price_label || "Цена по запросу" : (item as Task).budget_label || "По договорённости";
}

function SelectedPreview({ item, mode, onClose, onOpen }: { item: Place | Task; mode: Mode; onClose: () => void; onOpen: () => void }) {
  const uri = itemImage(item, mode);
  return <View style={styles.preview}>
    <View style={styles.previewTop}><View style={styles.handle} /><TouchableOpacity style={styles.close} onPress={onClose}><Ionicons name="close" size={22} color={colors.textPrimary} /></TouchableOpacity></View>
    <View style={styles.previewRow}>{uri ? <Image source={{ uri }} style={styles.previewImage} /> : <View style={styles.previewImage} />}<View style={styles.previewCopy}><AppText variant="section" numberOfLines={2}>{item.title}</AppText><AppText variant="secondary" tone="secondary" numberOfLines={1}>{item.city || "Рядом"}</AppText><AppText variant="bodyMedium" style={styles.previewPrice}>{itemPrice(item, mode)}</AppText></View></View>
    <Button label={mode === "places" ? "Открыть" : "Откликнуться"} onPress={onOpen} />
  </View>;
}

function NearbyList({ items, mode, onSelect, onAll }: { items: Array<Place | Task>; mode: Mode; onSelect: (id: string) => void; onAll: () => void }) {
  return <View><View style={styles.handle} /><View style={styles.bottomHead}><AppText variant="section">{mode === "places" ? "Работы рядом" : "Заявки рядом"}</AppText><View style={styles.count}><AppText variant="meta" tone="secondary">{items.length}</AppText></View><TouchableOpacity style={styles.allButton} onPress={onAll}><AppText variant="secondary" tone="secondary">Смотреть все</AppText><Ionicons name="chevron-forward" size={16} color={colors.textSecondary} /></TouchableOpacity></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.miniTrack}>{items.slice(0, 8).map((item) => { const uri = itemImage(item, mode); return <TouchableOpacity key={String(item.id)} style={styles.mini} activeOpacity={0.8} onPress={() => onSelect(String(item.id))}>{uri ? <Image source={{ uri }} style={styles.miniImage} /> : <View style={styles.miniImage} />}<AppText variant="meta" numberOfLines={2} style={styles.miniTitle}>{item.title}</AppText><AppText variant="meta" numberOfLines={1}>{itemPrice(item, mode)}</AppText></TouchableOpacity>; })}</ScrollView></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EDF0E9" }, overlay: { position: "absolute", left: 0, right: 0, top: 0, backgroundColor: "rgba(255,255,255,.96)" },
  mode: { flexDirection: "row", alignSelf: "center", backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: 3, marginTop: -60, marginBottom: 22 }, modeButton: { width: 104, height: 42, alignItems: "center", justifyContent: "center", borderRadius: radius.md }, modeActive: { backgroundColor: colors.accent },
  filters: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.sm }, filterIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  mapActions: { position: "absolute", right: spacing.md, top: 250, gap: spacing.sm }, mapAction: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: .09, shadowRadius: 8, elevation: 3 },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.15)" }, errorCard: { position: "absolute", left: spacing.md, right: spacing.md, top: "34%", backgroundColor: colors.surface, borderRadius: radius.xl },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 200, backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: spacing.sm }, handle: { width: 52, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center" },
  bottomHead: { flexDirection: "row", alignItems: "center", padding: spacing.md, gap: spacing.sm }, count: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 }, allButton: { marginLeft: "auto", flexDirection: "row", alignItems: "center" }, miniTrack: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.sm }, mini: { width: 138 }, miniImage: { width: 138, height: 82, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary }, miniTitle: { marginTop: spacing.xs, fontWeight: "600" },
  preview: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm }, previewTop: { height: 24, justifyContent: "center" }, close: { position: "absolute", right: 0, top: -2, width: 32, height: 32, alignItems: "center", justifyContent: "center" }, previewRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md }, previewImage: { width: 104, height: 96, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary }, previewCopy: { flex: 1, gap: 3 }, previewPrice: { marginTop: spacing.xs },
});
