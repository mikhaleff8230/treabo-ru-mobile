import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppText, Button, Chip, Skeleton } from "../components/ui";
import { apiFetch, fileUrl } from "../src/api";
import { colors, radius, spacing } from "../src/theme";
import type { Task } from "../src/types/proffi";
import type { RootStackParamList } from "../src/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "RequestPublished">;

export default function RequestPublishedScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const [task, setTask] = useState<Task | null>(null);
  useEffect(() => { apiFetch(`/tasks/${params.taskId}`, { method: "GET" }).then(setTask).catch(() => setTask(null)); }, [params.taskId]);
  const photo = fileUrl(task?.photos?.[0]);
  return <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.check}><Ionicons name="checkmark" size={58} color={colors.success} /></View>
      <AppText variant="display" style={styles.center}>Заявка опубликована!</AppText>
      <AppText variant="body" tone="secondary" style={styles.subtitle}>Подходящие мастера увидят её и смогут откликнуться. Мы покажем рекомендации уже сейчас.</AppText>
      {task ? <View style={styles.taskCard}>{photo ? <Image source={{ uri: photo }} style={styles.taskImage} /> : null}<View style={styles.taskCopy}><AppText variant="section" numberOfLines={2}>{task.title}</AppText><View style={styles.meta}><Ionicons name="location-outline" size={17} color={colors.textSecondary} /><AppText variant="secondary" tone="secondary" numberOfLines={1}>{task.city}{task.address ? `, ${task.address}` : ""}</AppText></View><View style={styles.chips}><Chip label={task.work_title || "Заявка"} /><Chip label={task.budget_label || "По договорённости"} /></View></View></View> : <Skeleton style={styles.taskSkeleton} />}
      <View style={styles.info}><View style={styles.infoIcon}><Ionicons name="notifications-outline" size={23} color={colors.textPrimary} /></View><View style={styles.taskCopy}><AppText variant="bodyMedium">Сообщим о новых откликах</AppText><AppText variant="meta" tone="secondary">Уведомления и все предложения будут доступны в профиле, в разделе «Мои заявки».</AppText></View></View>
      <Button label="Посмотреть мастеров" onPress={() => navigation.replace("SuitableMasters", { taskId: params.taskId })} style={styles.primary} />
      <Button label="Перейти к моим заявкам" variant="secondary" onPress={() => navigation.navigate("MyRequests", { tab: "mine" })} style={styles.secondary} />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background }, content: { flexGrow: 1, alignItems: "center", padding: spacing.xl, paddingTop: 64, paddingBottom: spacing.xxl }, center: { textAlign: "center", marginTop: spacing.lg }, subtitle: { maxWidth: 330, textAlign: "center", marginTop: spacing.sm }, check: { width: 116, height: 116, borderRadius: 58, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }, taskCard: { width: "100%", minHeight: 150, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, flexDirection: "row", gap: spacing.md, padding: spacing.md, marginTop: spacing.xl }, taskSkeleton: { width: "100%", height: 150, borderRadius: radius.xl, marginTop: spacing.xl }, taskImage: { width: 106, height: 122, borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary }, taskCopy: { flex: 1 }, meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm }, chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm }, info: { width: "100%", flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.accentSoft, padding: spacing.md, borderRadius: radius.xl, marginTop: spacing.lg }, infoIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }, primary: { marginTop: "auto" }, secondary: { marginTop: spacing.sm } });
