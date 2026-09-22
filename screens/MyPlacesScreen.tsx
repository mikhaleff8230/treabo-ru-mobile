import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, ImageBackground, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fileUrl } from "../src/api";
import { useAuth } from "../src/context/AuthContext";
import { listPlaces } from "../src/services/places";
import { colors, radius, spacing, typography } from "../src/theme";
import type { RootStackParamList } from "../src/navigation/types";
import type { Place } from "../src/types/place";

type Nav = NativeStackNavigationProp<RootStackParamList>;
const fallback = require("../assets/intro-interior.png");

export default function MyPlacesScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [tab, setTab] = useState<"mine" | "favorites">("mine");
  const [mine, setMine] = useState<Place[]>([]);
  const [favorites, setFavorites] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (!user) return;
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [own, saved] = await Promise.all([
        listPlaces({ author: String(user.id), per_page: 100 }),
        listPlaces({ favorites: true, per_page: 100 }),
      ]);
      setMine(own);
      setFavorites(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить Плейсы");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const places = useMemo(() => tab === "mine" ? mine : favorites, [favorites, mine, tab]);

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={27} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>Мои Плейсы</Text>
        <TouchableOpacity style={styles.back} onPress={() => navigation.navigate("CreatePlace")}><Ionicons name="add" size={27} color={colors.textPrimary} /></TouchableOpacity>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === "mine" && styles.activeTab]} onPress={() => setTab("mine")}><Text style={styles.tabText}>Мои Плейсы</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === "favorites" && styles.activeTab]} onPress={() => setTab("favorites")}><Text style={styles.tabText}>Избранное</Text></TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator style={styles.loader} color={colors.textPrimary} /> : (
        <FlatList
          data={places}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.textPrimary} />}
          renderItem={({ item }) => <PlaceTile place={item} onPress={() => navigation.navigate("PlaceDetail", { placeId: item.id })} />}
          ListEmptyComponent={<Empty error={error} tab={tab} onRetry={() => void load()} onCreate={() => navigation.navigate("CreatePlace")} />}
          ListFooterComponent={tab === "mine" && places.length > 0 ? (
            <TouchableOpacity style={styles.addCard} onPress={() => navigation.navigate("CreatePlace")}>
              <View style={styles.addIcon}><Ionicons name="add" size={30} color={colors.textPrimary} /></View>
              <Text style={styles.addTitle}>Добавить новую работу</Text>
              <Text style={styles.addText}>Покажите свои навыки и найдите новых клиентов</Text>
            </TouchableOpacity>
          ) : null}
        />
      )}
    </SafeAreaView>
  );
}

function PlaceTile({ place, onPress }: { place: Place; onPress: () => void }) {
  const uri = fileUrl(place.cover?.thumbnail || place.cover?.url);
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.88}>
      <ImageBackground source={uri ? { uri } : fallback} style={styles.image} imageStyle={styles.imageRadius}>
        <View style={styles.scrim} />
        <View style={styles.more}><Ionicons name="ellipsis-horizontal" size={18} color={colors.white} /></View>
        <View style={styles.tileBottom}>
          <Text numberOfLines={2} style={styles.tileTitle}>{place.title}</Text>
          <Text style={styles.date}>{place.published_at ? new Date(place.published_at).toLocaleDateString("ru-RU") : "Черновик"}</Text>
          <View style={styles.metrics}>
            <Ionicons name="eye-outline" size={17} color={colors.white} /><Text style={styles.metric}>—</Text>
            <Ionicons name="heart-outline" size={17} color={colors.white} /><Text style={styles.metric}>{place.likes_count || place.favorites_count || 0}</Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

function Empty({ error, tab, onRetry, onCreate }: { error: string | null; tab: "mine" | "favorites"; onRetry: () => void; onCreate: () => void }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={error ? "cloud-offline-outline" : tab === "mine" ? "images-outline" : "heart-outline"} size={42} color={colors.textTertiary} />
      <Text style={styles.emptyTitle}>{error ? "Не удалось загрузить" : tab === "mine" ? "Пока нет Плейсов" : "Избранное пусто"}</Text>
      <Text style={styles.emptyText}>{error || (tab === "mine" ? "Опубликуйте первую работу, чтобы её увидели клиенты." : "Сохраняйте работы, к которым хотите вернуться.")}</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={error ? onRetry : onCreate}><Text style={styles.emptyButtonText}>{error ? "Повторить" : tab === "mine" ? "Создать Плейс" : "Перейти в ленту"}</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md },
  back: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  title: { ...typography.screenTitle, color: colors.textPrimary },
  tabs: { flexDirection: "row", marginHorizontal: spacing.lg, backgroundColor: colors.surfaceSecondary, padding: 3, borderRadius: radius.lg },
  tab: { flex: 1, height: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  activeTab: { backgroundColor: colors.accent },
  tabText: { ...typography.button, color: colors.textPrimary },
  loader: { marginTop: 80 },
  grid: { padding: spacing.lg, paddingBottom: 48, flexGrow: 1 },
  row: { gap: spacing.sm, marginBottom: spacing.sm },
  tile: { flex: 1, aspectRatio: 0.82, maxWidth: "50%" },
  image: { flex: 1, justifyContent: "space-between" },
  imageRadius: { borderRadius: radius.lg },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,.22)", borderRadius: radius.lg },
  more: { alignSelf: "flex-end", margin: spacing.sm, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,.46)", alignItems: "center", justifyContent: "center" },
  tileBottom: { padding: spacing.md },
  tileTitle: { ...typography.bodyMedium, color: colors.white },
  date: { ...typography.meta, color: colors.white, marginTop: 2 },
  metrics: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  metric: { ...typography.meta, color: colors.white, marginRight: spacing.sm },
  addCard: { minHeight: 190, borderRadius: radius.xl, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, alignItems: "center", justifyContent: "center", padding: spacing.xl, marginTop: spacing.md },
  addIcon: { width: 58, height: 58, borderRadius: radius.full, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  addTitle: { ...typography.section, color: colors.textPrimary, marginTop: spacing.md },
  addText: { ...typography.secondary, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs },
  empty: { alignItems: "center", paddingHorizontal: spacing.xl, paddingTop: 90 },
  emptyTitle: { ...typography.section, color: colors.textPrimary, marginTop: spacing.md },
  emptyText: { ...typography.secondary, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs },
  emptyButton: { minWidth: 170, height: 48, backgroundColor: colors.accent, borderRadius: radius.full, alignItems: "center", justifyContent: "center", marginTop: spacing.lg, paddingHorizontal: spacing.xl },
  emptyButtonText: { ...typography.button, color: colors.textPrimary },
});
