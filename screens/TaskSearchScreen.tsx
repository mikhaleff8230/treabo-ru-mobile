import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenLayout } from "../components/ScreenLayout";
import { colors, spacing } from "../src/theme";
import type { RootStackParamList } from "../src/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "TaskSearch">;

const SUGGESTIONS = ["разработка веб-приложений", "капитальный ремонт квартир", "покраска деревянных домов"];
const HISTORY = ["создание сайта", "создание приложени", "создание разработка веб-приложений", "капитальный ремонт квартир", "покраска деревянных домов"];

export default function TaskSearchScreen() {
  const navigation = useNavigation<Nav>();
  const [q, setQ] = useState("");

  const submit = (value = q) => {
    navigation.navigate("TasksList", { q: value.trim() || undefined });
  };

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.neutral500} />
          <TextInput style={styles.input} value={q} onChangeText={setQ} autoFocus onSubmitEditing={() => submit()} />
        </View>

        <View style={styles.chips}>
          {SUGGESTIONS.map((item) => (
            <TouchableOpacity key={item} style={styles.chip} onPress={() => submit(item)}>
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.geoChip}><Text style={styles.chipText}>рядом со мной</Text></TouchableOpacity>
          <TouchableOpacity style={styles.geoChip}><Text style={styles.chipText}>сегодня</Text></TouchableOpacity>
        </View>

        <Text style={styles.historyTitle}>История запроса</Text>
        {HISTORY.map((item) => (
          <TouchableOpacity key={item} style={styles.historyRow} onPress={() => submit(item)}>
            <Ionicons name="time-outline" size={20} color={colors.neutral400} />
            <Text style={styles.historyText}>{item}</Text>
            <Ionicons name="close-outline" size={20} color={colors.neutral400} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.count}>52 заказа</Text>
        <TouchableOpacity onPress={() => submit()}><Text style={styles.find}>Найти</Text></TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.lg, paddingBottom: 90 },
  searchBox: { height: 48, borderRadius: 12, backgroundColor: colors.lavender50, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, marginBottom: 12 },
  input: { flex: 1, fontSize: 16, color: colors.black },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 22 },
  chip: { backgroundColor: colors.lavender50, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  geoChip: { backgroundColor: colors.lavender100, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  chipText: { fontSize: 13, color: colors.neutral700 },
  historyTitle: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  historyText: { flex: 1, fontSize: 15, color: colors.black },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, height: 64, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.neutral100 },
  count: { color: colors.neutral400, fontSize: 14 },
  find: { color: colors.black, fontSize: 16, fontWeight: "700" },
});
