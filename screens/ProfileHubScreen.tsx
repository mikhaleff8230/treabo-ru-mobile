import React, { useCallback, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TabScreenLayout } from "../components/TabScreenLayout";
import { TreaboLogo } from "../components/TreaboLogo";
import { apiFetch, fileUrl } from "../src/api";
import { useAuth } from "../src/context/AuthContext";
import { listPlaces } from "../src/services/places";
import { colors, radius, spacing, typography } from "../src/theme";
import type { RootStackParamList } from "../src/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileHubScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [works, setWorks] = useState(0);
  const [requests, setRequests] = useState(0);
  const [favorites, setFavorites] = useState(0);

  const load = useCallback(() => {
    if (!user) return;
    void Promise.all([
      listPlaces({ author: String(user.id), per_page: 100 }).then((items) => setWorks(items.length)),
      listPlaces({ favorites: true, per_page: 100 }).then((items) => setFavorites(items.length)),
      apiFetch("/tasks/mine", { method: "GET" }).then((payload) => {
        const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        setRequests(items.length);
      }),
    ]).catch(() => undefined);
  }, [user]);

  useFocusEffect(load);
  if (!user) return null;

  const avatar = fileUrl(user.avatar);
  const isMaster = user.role === "specialist";
  const bio = user.bio?.trim() || (isMaster ? "Расскажите клиентам о своём опыте и услугах." : "Находите мастеров и сохраняйте понравившиеся работы.");

  return (
    <TabScreenLayout>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <TreaboLogo size="compact" />
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Notifications")}>
              <Ionicons name="notifications-outline" size={23} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Settings")}>
              <Ionicons name="settings-outline" size={23} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.identity}>
          {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : (
            <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarLetter}>{user.name.charAt(0).toUpperCase()}</Text></View>
          )}
          <View style={styles.identityCopy}>
            <View style={styles.nameRow}>
              <Text numberOfLines={1} style={styles.name}>{user.name}</Text>
              {user.is_verified ? <Ionicons name="checkmark-circle" size={18} color={colors.success} /> : null}
            </View>
            <Text style={styles.handle}>@{String(user.name).toLowerCase().replace(/\s+/g, "_")}</Text>
            <Text numberOfLines={2} style={styles.bio}>{bio}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat value={isMaster ? works : requests} label={isMaster ? "Плейсы" : "Заявки"} />
          <Stat value={favorites} label="Избранное" />
          <Stat value={isMaster ? Number(user.rating || 0).toFixed(1) : 0} label={isMaster ? "Рейтинг" : "Подписки"} />
          <Stat value={user.reviews_count || 0} label={isMaster ? "Отзывы" : "Подписчики"} last />
        </View>

        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate("Settings")}>
          <Ionicons name="pencil-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.editText}>Редактировать профиль</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.professionalCard} onPress={() => navigation.navigate("ProfessionalProfile")} activeOpacity={0.86}>
          <View style={styles.professionalIcon}><Ionicons name="ribbon-outline" size={25} color={colors.textPrimary} /></View>
          <View style={styles.professionalCopy}>
            <Text style={styles.professionalTitle}>{isMaster ? "Профессиональный профиль" : "Стать мастером на Treabo"}</Text>
            <Text style={styles.professionalText}>{isMaster ? "Услуги, районы работы и способы связи" : "Показывайте работы и находите новых клиентов"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.menu}>
          <Menu icon="images-outline" label="Мои Плейсы" value={String(works)} onPress={() => navigation.navigate("MyPlaces")} />
          <Menu icon="document-text-outline" label="Мои заявки" value={String(requests)} onPress={() => navigation.navigate("MyRequests", { tab: "mine" })} />
          {isMaster ? <Menu icon="list-outline" label="Мои отклики" onPress={() => navigation.navigate("MyRequests", { tab: "responses" })} /> : null}
          <Menu icon="heart-outline" label="Избранное" value={String(favorites)} onPress={() => navigation.navigate("Favorites")} />
          <Menu icon="chatbubble-outline" label="Сообщения" onPress={() => navigation.navigate("MainTabs", { screen: "Messages" })} />
          <Menu icon="notifications-outline" label="Уведомления" onPress={() => navigation.navigate("Notifications")} />
          <Menu icon="wallet-outline" label="Баланс и платежи" onPress={() => navigation.navigate("Balance")} />
          <Menu icon="star-outline" label="Мои отзывы" onPress={() => navigation.navigate("MyReviews")} />
          <Menu icon="settings-outline" label="Настройки" onPress={() => navigation.navigate("Settings")} last />
        </View>
      </ScrollView>
    </TabScreenLayout>
  );
}

function Stat({ value, label, last }: { value: string | number; label: string; last?: boolean }) {
  return <View style={[styles.stat, last && styles.statLast]}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Menu({ icon, label, value, onPress, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.menuRow, last && styles.menuRowLast]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={21} color={colors.textPrimary} />
      <Text style={styles.menuLabel}>{label}</Text>
      {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  topbar: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topActions: { flexDirection: "row", gap: spacing.xs },
  iconButton: { width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginTop: spacing.md },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.surfaceSecondary },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarLetter: { ...typography.display, color: colors.textPrimary },
  identityCopy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  name: { ...typography.screenTitle, color: colors.textPrimary, flexShrink: 1 },
  handle: { ...typography.meta, color: colors.textSecondary, marginTop: 1 },
  bio: { ...typography.secondary, color: colors.textSecondary, marginTop: spacing.xs },
  stats: { flexDirection: "row", marginTop: spacing.xl, paddingVertical: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.divider },
  stat: { flex: 1, alignItems: "center", borderRightWidth: 1, borderRightColor: colors.divider },
  statLast: { borderRightWidth: 0 },
  statValue: { ...typography.section, color: colors.textPrimary },
  statLabel: { ...typography.meta, color: colors.textSecondary, marginTop: 2 },
  editButton: { height: 48, borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.lg },
  editText: { ...typography.button, color: colors.textPrimary },
  professionalCard: { minHeight: 82, borderRadius: radius.xl, backgroundColor: colors.accentSoft, flexDirection: "row", alignItems: "center", padding: spacing.md, marginTop: spacing.lg, gap: spacing.md },
  professionalIcon: { width: 48, height: 48, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  professionalCopy: { flex: 1 },
  professionalTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  professionalText: { ...typography.meta, color: colors.textSecondary, marginTop: 2 },
  menu: { marginTop: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  menuRow: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider },
  menuRowLast: { borderBottomWidth: 0 },
  menuLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  menuValue: { ...typography.meta, color: colors.textSecondary },
});
