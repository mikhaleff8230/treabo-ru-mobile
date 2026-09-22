import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppText, Button, Chip } from "../components/ui";
import { apiFetch } from "../src/api";
import { colors, radius, spacing } from "../src/theme";
import type { RootStackParamList } from "../src/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "TaskFilter">;
type R = RouteProp<RootStackParamList, "TaskFilter">;
type Category = { id: string; name_ru?: string; name?: string };

export default function TaskFilterScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const [category, setCategory] = useState(route.params?.category_id || route.params?.category || "");
  const [city, setCity] = useState(route.params?.city || "");
  const [min, setMin] = useState(route.params?.budget_min || "");
  const [max, setMax] = useState(route.params?.budget_max || "");
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => { apiFetch("/categories", { method: "GET", auth: false }).then((data) => setCategories(Array.isArray(data) ? data : data?.data || [])).catch(() => setCategories([])); }, []);
  const reset = () => { setCategory(""); setCity(""); setMin(""); setMax(""); };
  const apply = () => navigation.navigate("TasksList", { category_id: category || undefined, q: route.params?.q, city: city.trim() || undefined, budget_min: min || undefined, budget_max: max || undefined });
  return <SafeAreaView style={styles.root} edges={["top", "bottom", "left", "right"]}>
    <View style={styles.handle} />
    <View style={styles.header}><AppText variant="screenTitle" style={styles.flex}>Фильтры</AppText><TouchableOpacity onPress={reset}><AppText variant="secondary" tone="secondary">Сбросить всё</AppText></TouchableOpacity><TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}><Ionicons name="close" size={25} color={colors.textPrimary} /></TouchableOpacity></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <AppText variant="bodyMedium" style={styles.label}>Категория</AppText>
      <View style={styles.chips}><Chip label="Все" selected={!category} onPress={() => setCategory("")} />{categories.map((item) => <Chip key={String(item.id)} label={item.name_ru || item.name || "Категория"} selected={String(item.id) === String(category)} onPress={() => setCategory(String(item.id))} />)}</View>
      <AppText variant="bodyMedium" style={styles.label}>Локация</AppText>
      <View style={styles.inputRow}><Ionicons name="location-outline" size={21} color={colors.textPrimary} /><TextInput style={styles.textInput} placeholder="Москва" placeholderTextColor={colors.textTertiary} value={city} onChangeText={setCity} /></View>
      <AppText variant="bodyMedium" style={styles.label}>Бюджет</AppText>
      <View style={styles.priceRow}><View style={styles.priceField}><AppText variant="meta" tone="secondary">От</AppText><TextInput style={styles.numberInput} placeholder="0 ₽" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" value={min} onChangeText={(value) => setMin(value.replace(/\D/g, ""))} /></View><View style={styles.priceField}><AppText variant="meta" tone="secondary">До</AppText><TextInput style={styles.numberInput} placeholder="Без ограничений" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" value={max} onChangeText={(value) => setMax(value.replace(/\D/g, ""))} /></View></View>
      <View style={styles.info}><Ionicons name="information-circle-outline" size={21} color={colors.textSecondary} /><AppText variant="secondary" tone="secondary" style={styles.flex}>Результаты используют реальные категории, город и бюджет заявки.</AppText></View>
    </ScrollView>
    <View style={styles.footer}><Button label="Показать заявки" onPress={apply} /></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 }, handle: { width: 52, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginTop: spacing.sm }, header: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg }, close: { width: 40, height: 40, alignItems: "center", justifyContent: "center" }, content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }, label: { marginTop: spacing.lg, marginBottom: spacing.sm }, chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, inputRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md }, textInput: { flex: 1, color: colors.textPrimary, fontSize: 15 }, priceRow: { flexDirection: "row", gap: spacing.md }, priceField: { flex: 1, minHeight: 62, borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary, paddingHorizontal: spacing.md, justifyContent: "center" }, numberInput: { color: colors.textPrimary, fontSize: 15, paddingVertical: 2 }, info: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, marginTop: spacing.xl }, footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.divider } });
