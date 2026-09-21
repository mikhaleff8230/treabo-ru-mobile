import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, View, useWindowDimensions, type ViewToken } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TabScreenLayout } from "../components/TabScreenLayout";
import { PlaceCategoryRail, PlaceFeedPost, PlacesFeedHeader, type FeedCategory } from "../components/feed";
import { AppText, Button, EmptyState, Skeleton } from "../components/ui";
import { apiFetch } from "../src/api";
import { colors, radius, sizes, spacing } from "../src/theme";
import { createRequestFromPlace, listPlacesPage, setPlaceFavorite, setPlaceLike } from "../src/services/places";
import type { Place } from "../src/types/place";
import type { RootStackParamList } from "../src/navigation/types";
import { useAuth } from "../src/context/AuthContext";
import * as Location from "expo-location";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Category = { id: string; name_ru: string };

export default function HomePlacesScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [previews, setPreviews] = useState<Record<string, string | null>>({});
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [loadMoreError, setLoadMoreError] = useState("");
  const [requestingPlaceId, setRequestingPlaceId] = useState<string | null>(null);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const generationRef = useRef(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    apiFetch("/categories", { method: "GET", auth: false })
      .then((payload) => setCategories(Array.isArray(payload) ? payload : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(async ({ status }) => {
      if (status !== "granted") return;
      const position = await Location.getLastKnownPositionAsync() ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (position) setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
    }).catch(() => undefined);
  }, []);

  const rememberPreviews = useCallback((items: Place[]) => {
    setPreviews((current) => {
      const next = { ...current };
      for (const place of items) {
        const preview = place.cover?.thumbnail || place.cover?.url || null;
        if (!("all" in next) && preview) next.all = preview;
        if (place.category?.id && !(place.category.id in next) && preview) next[place.category.id] = preview;
      }
      return next;
    });
  }, []);

  const loadFirst = useCallback(async (refresh = false) => {
    const generation = ++generationRef.current;
    refresh ? setRefreshing(true) : setLoading(true);
    setError("");
    setLoadMoreError("");
    try {
      const result = await listPlacesPage({ category_id: categoryId || undefined, sort: "new", page: 1, per_page: 6, lat: coords?.lat, lng: coords?.lng });
      if (generation !== generationRef.current) return;
      setPlaces(result.items);
      setPage(result.page);
      setLastPage(result.lastPage);
      rememberPreviews(result.items);
    } catch (reason) {
      if (generation !== generationRef.current) return;
      setPlaces([]);
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить Плейсы");
    } finally {
      if (generation === generationRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [categoryId, coords?.lat, coords?.lng, rememberPreviews]);

  useEffect(() => { void loadFirst(); }, [loadFirst]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || loading || refreshing || page >= lastPage) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError("");
    const generation = generationRef.current;
    try {
      const result = await listPlacesPage({ category_id: categoryId || undefined, sort: "new", page: page + 1, per_page: 6, lat: coords?.lat, lng: coords?.lng });
      if (generation !== generationRef.current) return;
      setPlaces((current) => {
        const known = new Set(current.map((place) => place.id));
        return [...current, ...result.items.filter((place) => !known.has(place.id))];
      });
      setPage(result.page);
      setLastPage(result.lastPage);
      rememberPreviews(result.items);
    } catch (reason) {
      if (generation === generationRef.current) setLoadMoreError(reason instanceof Error ? reason.message : "Не удалось загрузить следующую страницу");
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [categoryId, coords?.lat, coords?.lng, lastPage, loading, page, refreshing, rememberPreviews]);

  const feedCategories = useMemo<FeedCategory[]>(() => [
    { id: "", name: "Для вас", preview: previews.all },
    ...categories.map((category) => ({ id: category.id, name: category.name_ru, preview: previews[category.id] })),
  ], [categories, previews]);

  const updatePlace = useCallback((id: string, mutate: (place: Place) => Place) => {
    setPlaces((current) => current.map((place) => place.id === id ? mutate(place) : place));
  }, []);

  const toggleFavorite = useCallback(async (place: Place) => {
    const next = !place.is_favorite;
    updatePlace(place.id, (row) => ({ ...row, is_favorite: next, favorites_count: Math.max(0, Number(row.favorites_count || 0) + (next ? 1 : -1)) }));
    try {
      await setPlaceFavorite(place.id, next);
    } catch {
      updatePlace(place.id, (row) => ({ ...row, is_favorite: !next, favorites_count: Math.max(0, Number(row.favorites_count || 0) + (next ? -1 : 1)) }));
    }
  }, [updatePlace]);

  const toggleLike = useCallback(async (place: Place) => {
    const next = !place.is_liked;
    updatePlace(place.id, (row) => ({ ...row, is_liked: next, likes_count: Math.max(0, Number(row.likes_count || 0) + (next ? 1 : -1)) }));
    try {
      await setPlaceLike(place.id, next);
    } catch {
      updatePlace(place.id, (row) => ({ ...row, is_liked: !next, likes_count: Math.max(0, Number(row.likes_count || 0) + (next ? -1 : 1)) }));
    }
  }, [updatePlace]);

  const requestSame = useCallback(async (place: Place) => {
    setRequestingPlaceId(place.id);
    try {
      await createRequestFromPlace(place.id);
      navigation.navigate("AIRequest");
    } catch (reason) {
      Alert.alert("Не удалось создать заявку", reason instanceof Error ? reason.message : String(reason));
    } finally {
      setRequestingPlaceId(null);
    }
  }, [navigation]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<Place>[] }) => {
    setVisibleIds(new Set(viewableItems.filter((token) => token.isViewable).map((token) => token.item.id)));
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 45 }).current;

  const header = <>
    <PlacesFeedHeader city={user?.city || "Москва"} onSearch={() => navigation.navigate("Search")} />
    <PlaceCategoryRail categories={feedCategories} activeId={categoryId} onSelect={setCategoryId} />
  </>;

  if (loading) {
    return <TabScreenLayout>{header}<FeedLoading width={width} /></TabScreenLayout>;
  }

  if (error) {
    return <TabScreenLayout>{header}<View style={styles.state}><EmptyState title="Не удалось загрузить ленту" description={error} action={<Button label="Повторить" onPress={() => void loadFirst()} />} /></View></TabScreenLayout>;
  }

  if (places.length === 0) {
    return <TabScreenLayout>{header}<View style={styles.state}><EmptyState title="Плейсов пока нет" description="Выберите другое направление или опубликуйте первую работу." action={categoryId ? <Button label="Показать все" variant="secondary" onPress={() => setCategoryId("")} /> : undefined} /></View></TabScreenLayout>;
  }

  return (
    <TabScreenLayout>
      <FlatList
        data={places}
        keyExtractor={(place) => place.id}
        renderItem={({ item }) => (
          <PlaceFeedPost
            place={item}
            width={width}
            visible={visibleIds.has(item.id)}
            requestBusy={requestingPlaceId === item.id}
            onOpen={() => navigation.navigate("PlaceDetail", { placeId: item.id })}
            onOpenAuthor={() => item.author?.id && navigation.navigate("PublicProfile", { specialistId: item.author.id })}
            onFavorite={() => void toggleFavorite(item)}
            onLike={() => void toggleLike(item)}
            onRequestSame={() => void requestSame(item)}
          />
        )}
        ListHeaderComponent={header}
        ListFooterComponent={<FeedFooter loading={loadingMore} error={loadMoreError} hasMore={page < lastPage} onRetry={() => void loadMore()} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadFirst(true)} tintColor={colors.textPrimary} colors={[colors.accentPressed]} />}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.65}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={80}
        windowSize={5}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
      />
    </TabScreenLayout>
  );
}

function FeedLoading({ width }: { width: number }) {
  return <View style={styles.loading}><View style={styles.loadingHeader}><Skeleton style={styles.avatarSkeleton} /><View style={styles.loadingCopy}><Skeleton style={styles.nameSkeleton} /><Skeleton style={styles.metaSkeleton} /></View></View><Skeleton style={{ width, height: Math.min(Math.round(width * 0.94), 470), borderRadius: 0 }} /><View style={styles.loadingContent}><Skeleton style={styles.actionSkeleton} /><Skeleton style={styles.titleSkeleton} /><Skeleton style={styles.textSkeleton} /><Skeleton style={styles.buttonSkeleton} /></View></View>;
}

function FeedFooter({ loading, error, hasMore, onRetry }: { loading: boolean; error: string; hasMore: boolean; onRetry: () => void }) {
  if (loading) return <View style={styles.footer}><ActivityIndicator color={colors.textPrimary} /></View>;
  if (error) return <View style={styles.footer}><AppText variant="meta" tone="secondary" style={styles.footerText}>{error}</AppText><Button label="Повторить" variant="text" fullWidth={false} onPress={onRetry} /></View>;
  if (!hasMore) return <View style={styles.footer}><AppText variant="meta" tone="tertiary">Вы посмотрели все Плейсы</AppText></View>;
  return null;
}

const styles = StyleSheet.create({
  state: { flex: 1, justifyContent: "center" },
  loading: { flex: 1 },
  loadingHeader: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: sizes.screenPadding },
  avatarSkeleton: { width: sizes.avatar.md, height: sizes.avatar.md, borderRadius: radius.full },
  loadingCopy: { flex: 1, gap: spacing.sm },
  nameSkeleton: { width: "44%" },
  metaSkeleton: { width: "66%", height: 12 },
  loadingContent: { padding: sizes.screenPadding, gap: spacing.md },
  actionSkeleton: { width: "35%" },
  titleSkeleton: { width: "70%", height: 20 },
  textSkeleton: { width: "92%", height: 36 },
  buttonSkeleton: { width: "100%", height: sizes.control.lg, borderRadius: radius.lg },
  footer: { minHeight: 76, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.xs },
  footerText: { textAlign: "center" },
});
