import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../src/navigation/types";
import { fileUrl } from "../src/api";
import { colors, spacing, typography } from "../src/theme";
import { forwardMessengerMessage, listConversations, type MessengerConversation } from "../src/services/messenger";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "MessengerForward">;

export default function MessengerForwardScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [items, setItems] = useState<MessengerConversation[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { listConversations().then(setItems).catch(() => setItems([])); }, []);
  const forward = async (conversation: MessengerConversation) => { setBusy(conversation.id); try { await forwardMessengerMessage(conversation.id, route.params.messageId); navigation.replace("MessengerChat", { conversationId: conversation.id }); } catch (e) { Alert.alert("Не удалось переслать", e instanceof Error ? e.message : String(e)); } finally { setBusy(null); } };
  return <SafeAreaView style={styles.root}><View style={styles.header}><TouchableOpacity style={styles.icon} onPress={() => navigation.goBack()}><Ionicons name="close" size={27} /></TouchableOpacity><Text style={styles.title}>Переслать</Text><View style={styles.icon} /></View><FlatList data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => { const uri = fileUrl(item.contact.avatar); return <TouchableOpacity style={styles.row} onPress={() => void forward(item)} disabled={Boolean(busy)}>{uri ? <Image source={{ uri }} style={styles.avatar} /> : <View style={[styles.avatar, styles.fallback]}><Text>{item.contact.name?.charAt(0)}</Text></View>}<View style={styles.copy}><Text style={styles.name}>{item.contact.name}</Text><Text numberOfLines={1} style={styles.preview}>{item.last_message?.body || "Личный диалог"}</Text></View>{busy === item.id ? <ActivityIndicator /> : <Ionicons name="paper-plane-outline" size={22} color={colors.textPrimary} />}</TouchableOpacity>; }} ListEmptyComponent={<Text style={styles.empty}>Нет доступных диалогов</Text>} /></SafeAreaView>;
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.white }, header: { height: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider }, icon: { width: 42, height: 42, alignItems: "center", justifyContent: "center" }, title: { ...typography.section }, list: { paddingHorizontal: spacing.lg }, row: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider }, avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.surfaceSecondary }, fallback: { alignItems: "center", justifyContent: "center" }, copy: { flex: 1 }, name: { ...typography.bodyMedium }, preview: { ...typography.secondary, color: colors.textSecondary, marginTop: 2 }, empty: { ...typography.secondary, color: colors.textSecondary, textAlign: "center", marginTop: 80 } });
