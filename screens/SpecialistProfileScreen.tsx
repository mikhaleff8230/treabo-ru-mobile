import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ImageBackground, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { apiFetch, fileUrl } from "../src/api";
import { listPlaces } from "../src/services/places";
import { colors, radius, spacing, typography } from "../src/theme";
import type { RootStackParamList } from "../src/navigation/types";
import type { Place } from "../src/types/place";
import type { Specialist, SpecialistReview } from "../src/types/proffi";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "SpecialistProfile">;
type Tab = "works" | "reviews" | "about";
const fallback = require("../assets/intro-interior.png");

export default function SpecialistProfileScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { specialistId, chatId } = route.params;
  const [spec, setSpec] = useState<Specialist | null>(null);
  const [reviews, setReviews] = useState<SpecialistReview[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [tab, setTab] = useState<Tab>("works");
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [profile, reviewPayload, placePayload] = await Promise.all([
        apiFetch(`/specialists/${specialistId}`, { method: "GET" }),
        apiFetch(`/specialists/${specialistId}/reviews`, { method: "GET" }).catch(() => []),
        listPlaces({ author: specialistId, per_page: 100 }),
      ]);
      setSpec(profile as Specialist);
      setReviews(Array.isArray(reviewPayload) ? reviewPayload : Array.isArray(reviewPayload?.data) ? reviewPayload.data : []);
      setPlaces(placePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить профиль");
    } finally { setLoading(false); }
  }, [specialistId]);

  useEffect(() => { void load(); }, [load]);

  const startMessage = async () => {
    if (chatId) { navigation.navigate("ChatDetail", { chatId }); return; }
    setMessaging(true);
    try {
      const payload = await apiFetch("/messenger/conversations/direct", {
        namespace: "root", method: "POST", body: JSON.stringify({ user_id: Number(specialistId) }),
      });
      const conversationId = String(payload?.data?.id || "");
      if (!conversationId) throw new Error("Диалог не создан");
      navigation.navigate("MessengerChat", { conversationId });
    } catch (e) {
      Alert.alert("Не удалось открыть диалог", e instanceof Error ? e.message : String(e));
    } finally { setMessaging(false); }
  };

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator color={colors.textPrimary} /></SafeAreaView>;
  if (!spec || error) return <SafeAreaView style={styles.center}><Ionicons name="alert-circle-outline" size={42} color={colors.textTertiary} /><Text style={styles.errorTitle}>Профиль не найден</Text><Text style={styles.errorText}>{error}</Text><TouchableOpacity style={styles.retry} onPress={() => void load()}><Text style={styles.retryText}>Повторить</Text></TouchableOpacity></SafeAreaView>;

  const avatar = fileUrl(spec.avatar);
  const heroUri = fileUrl(places[0]?.cover?.url || places[0]?.cover?.thumbnail || spec.portfolio?.[0]);
  const online = Boolean(spec.is_online || spec.last_seen_label?.startsWith("Сейчас"));
  const services = spec.services || [];

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <ScrollView stickyHeaderIndices={[2]} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          <ImageBackground source={heroUri ? { uri: heroUri } : fallback} style={styles.hero}>
            <View style={styles.scrim} />
            <TouchableOpacity style={styles.heroButton} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={26} color={colors.white} /></TouchableOpacity>
            <TouchableOpacity style={[styles.heroButton, styles.more]}><Ionicons name="ellipsis-horizontal" size={24} color={colors.white} /></TouchableOpacity>
          </ImageBackground>
          <View style={styles.avatarFrame}>
            {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarLetter}>{spec.name.charAt(0).toUpperCase()}</Text></View>}
            {online ? <View style={styles.onlineDot} /> : null}
          </View>
        </View>

        <View style={styles.profile}>
          <View style={styles.nameLine}><Text style={styles.name}>{spec.name}</Text>{spec.is_verified || spec.passport_verified ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : null}</View>
          <Text style={styles.speciality}>{services[0] || "Мастер"}</Text>
          <View style={styles.locationLine}><Ionicons name="location-outline" size={17} color={colors.textSecondary} /><Text style={styles.location}>{spec.city || "Город не указан"}</Text>{online ? <><View style={styles.dot} /><Text style={styles.onlineText}>В сети</Text></> : null}</View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={startMessage} disabled={messaging}>{messaging ? <ActivityIndicator color={colors.textPrimary} /> : <><Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textPrimary} /><Text style={styles.secondaryText}>Написать</Text></>}</TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton}><Text style={styles.primaryText}>Подписаться</Text></TouchableOpacity>
          </View>
          <View style={styles.stats}>
            <Stat value={places.length} label="Работы" />
            <Stat value={spec.reviews_count || reviews.length} label="Отзывы" />
            <Stat value={Number(spec.rating || 0).toFixed(1)} label="Рейтинг" />
            <Stat value={spec.created_at ? new Date().getFullYear() - new Date(spec.created_at).getFullYear() : "—"} label="Лет опыта" last />
          </View>
        </View>

        <View style={styles.tabs}>
          <TabButton label="Работы" active={tab === "works"} onPress={() => setTab("works")} />
          <TabButton label={`Отзывы ${reviews.length || spec.reviews_count || ""}`} active={tab === "reviews"} onPress={() => setTab("reviews")} />
          <TabButton label="О мастере" active={tab === "about"} onPress={() => setTab("about")} />
        </View>

        {tab === "works" ? <Works places={places} navigation={navigation} /> : null}
        {tab === "reviews" ? <Reviews reviews={reviews} /> : null}
        {tab === "about" ? <About specialist={spec} services={services} onCall={chatId ? () => void Linking.openURL(`tel:${String(spec.phone || "").replace(/[^+\d]/g, "")}`) : undefined} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label, last }: { value: string | number; label: string; last?: boolean }) { return <View style={[styles.stat, last && styles.statLast]}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <TouchableOpacity style={[styles.tab, active && styles.activeTab]} onPress={onPress}><Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text></TouchableOpacity>; }

function Works({ places, navigation }: { places: Place[]; navigation: Nav }) {
  if (!places.length) return <View style={styles.empty}><Ionicons name="images-outline" size={38} color={colors.textTertiary} /><Text style={styles.emptyTitle}>Работы пока не опубликованы</Text></View>;
  return <View style={styles.works}>{places.map((place) => { const uri = fileUrl(place.cover?.thumbnail || place.cover?.url); return <TouchableOpacity key={place.id} style={styles.workTile} onPress={() => navigation.navigate("PlaceDetail", { placeId: place.id })}><ImageBackground source={uri ? { uri } : fallback} style={styles.workImage} imageStyle={styles.workRadius}><View style={styles.workScrim} /><View style={styles.workLikes}><Ionicons name="heart-outline" size={17} color={colors.white} /><Text style={styles.workLikeText}>{place.likes_count || place.favorites_count || 0}</Text></View></ImageBackground></TouchableOpacity>; })}</View>;
}

function Reviews({ reviews }: { reviews: SpecialistReview[] }) {
  if (!reviews.length) return <View style={styles.empty}><Ionicons name="star-outline" size={38} color={colors.textTertiary} /><Text style={styles.emptyTitle}>Отзывов пока нет</Text></View>;
  return <View style={styles.reviewList}>{reviews.map((review) => <View key={review.id} style={styles.review}><View style={styles.reviewHead}><View style={styles.reviewAvatar}><Text style={styles.reviewLetter}>{(review.customer_name || review.author_name || "К").charAt(0)}</Text></View><View style={styles.reviewCopy}><Text style={styles.reviewName}>{review.customer_name || review.author_name || "Клиент"}</Text><View style={styles.stars}>{Array.from({ length: 5 }).map((_, index) => <Ionicons key={index} name={index < review.rating ? "star" : "star-outline"} size={14} color="#F8B800" />)}</View></View><Text style={styles.reviewDate}>{review.created_at ? new Date(review.created_at).toLocaleDateString("ru-RU") : ""}</Text></View>{review.comment || review.text ? <Text style={styles.reviewText}>{review.comment || review.text}</Text> : null}</View>)}</View>;
}

function About({ specialist, services, onCall }: { specialist: Specialist; services: string[]; onCall?: () => void }) {
  return <View style={styles.about}><Text style={styles.sectionTitle}>О себе</Text><Text style={styles.aboutText}>{specialist.bio || "Мастер ещё не добавил описание."}</Text>{services.length ? <><Text style={styles.sectionTitle}>Услуги</Text><View style={styles.chips}>{services.map((service) => <View key={service} style={styles.chip}><Text style={styles.chipText}>{service}</Text></View>)}</View></> : null}<View style={styles.verified}><Ionicons name="shield-checkmark" size={28} color={colors.success} /><View style={styles.verifiedCopy}><Text style={styles.verifiedTitle}>{specialist.passport_verified || specialist.is_verified ? "Проверенный мастер" : "Профиль мастера"}</Text><Text style={styles.verifiedText}>{specialist.passport_verified || specialist.is_verified ? "Документы и контакты проверены Treabo" : "Отзывы и Плейсы доступны в профиле"}</Text></View></View>{onCall && specialist.phone ? <TouchableOpacity style={styles.callButton} onPress={onCall}><Ionicons name="call-outline" size={20} color={colors.textPrimary} /><Text style={styles.secondaryText}>Позвонить</Text></TouchableOpacity> : null}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white }, center: { flex: 1, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", padding: spacing.xl }, content: { paddingBottom: 48 },
  errorTitle: { ...typography.section, color: colors.textPrimary, marginTop: spacing.md }, errorText: { ...typography.secondary, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs }, retry: { marginTop: spacing.lg, height: 48, paddingHorizontal: spacing.xl, borderRadius: radius.full, backgroundColor: colors.accent, justifyContent: "center" }, retryText: { ...typography.button },
  heroWrap: { height: 245, marginBottom: 48 }, hero: { flex: 1, flexDirection: "row", justifyContent: "space-between", padding: spacing.md }, scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,.16)" }, heroButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,.44)", alignItems: "center", justifyContent: "center" }, more: { marginLeft: "auto" },
  avatarFrame: { position: "absolute", left: spacing.lg, bottom: -46 }, avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: colors.white, backgroundColor: colors.surfaceSecondary }, avatarFallback: { alignItems: "center", justifyContent: "center" }, avatarLetter: { ...typography.display, color: colors.textPrimary }, onlineDot: { position: "absolute", right: 5, bottom: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.success, borderWidth: 3, borderColor: colors.white },
  profile: { paddingHorizontal: spacing.lg }, nameLine: { flexDirection: "row", alignItems: "center", gap: spacing.xs }, name: { ...typography.screenTitle, color: colors.textPrimary }, speciality: { ...typography.body, color: colors.textSecondary, marginTop: 2 }, locationLine: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm }, location: { ...typography.secondary, color: colors.textSecondary }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.success, marginLeft: spacing.xs }, onlineText: { ...typography.meta, color: colors.success },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }, secondaryButton: { flex: 1, height: 50, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm }, secondaryText: { ...typography.button, color: colors.textPrimary }, primaryButton: { flex: 1, height: 50, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }, primaryText: { ...typography.button, color: colors.textPrimary },
  stats: { flexDirection: "row", marginTop: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.divider }, stat: { flex: 1, alignItems: "center", borderRightWidth: 1, borderRightColor: colors.divider }, statLast: { borderRightWidth: 0 }, statValue: { ...typography.section, color: colors.textPrimary }, statLabel: { ...typography.meta, color: colors.textSecondary, marginTop: 2 },
  tabs: { height: 52, flexDirection: "row", alignItems: "stretch", backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.divider, marginTop: spacing.lg, paddingHorizontal: spacing.lg, zIndex: 3 }, tab: { flex: 1, alignItems: "center", justifyContent: "center", borderBottomWidth: 2, borderBottomColor: "transparent" }, activeTab: { borderBottomColor: colors.success }, tabText: { ...typography.secondary, color: colors.textSecondary }, activeTabText: { ...typography.bodyMedium, color: colors.textPrimary },
  works: { flexDirection: "row", flexWrap: "wrap", padding: 1 }, workTile: { width: "50%", aspectRatio: 1, padding: 1 }, workImage: { flex: 1, justifyContent: "flex-end" }, workRadius: { borderRadius: 3 }, workScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,.08)" }, workLikes: { flexDirection: "row", alignItems: "center", gap: 4, padding: spacing.sm }, workLikeText: { ...typography.meta, color: colors.white },
  empty: { alignItems: "center", padding: 70 }, emptyTitle: { ...typography.secondary, color: colors.textSecondary, marginTop: spacing.sm, textAlign: "center" }, reviewList: { padding: spacing.lg }, review: { paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider }, reviewHead: { flexDirection: "row", alignItems: "center" }, reviewAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }, reviewLetter: { ...typography.bodyMedium }, reviewCopy: { flex: 1, marginLeft: spacing.sm }, reviewName: { ...typography.bodyMedium }, stars: { flexDirection: "row", marginTop: 2 }, reviewDate: { ...typography.meta, color: colors.textSecondary }, reviewText: { ...typography.secondary, color: colors.textPrimary, marginTop: spacing.sm },
  about: { padding: spacing.lg }, sectionTitle: { ...typography.section, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.md }, aboutText: { ...typography.body, color: colors.textSecondary }, chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, chip: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, chipText: { ...typography.meta, color: colors.textPrimary }, verified: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.accentSoft, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.xl }, verifiedCopy: { flex: 1 }, verifiedTitle: { ...typography.bodyMedium }, verifiedText: { ...typography.meta, color: colors.textSecondary, marginTop: 2 }, callButton: { height: 50, borderRadius: radius.full, backgroundColor: colors.surfaceSecondary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.lg },
});
