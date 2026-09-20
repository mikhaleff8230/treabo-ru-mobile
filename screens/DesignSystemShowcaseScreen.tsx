import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  AppHeader,
  AppText,
  Avatar,
  Badge,
  BottomNavigation,
  BottomSheet,
  Button,
  Chip,
  Divider,
  EmptyState,
  Input,
  ListItem,
  Skeleton,
  type BottomNavigationKey,
} from "../components/ui";
import { colors, radius, sizes, spacing } from "../src/theme";
import type { RootStackParamList } from "../src/navigation/types";

export default function DesignSystemShowcaseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Все");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<BottomNavigationKey>("home");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <AppHeader
        title="Design System 2.0"
        subtitle="TREABO · foundation"
        onBack={() => navigation.canGoBack() && navigation.goBack()}
        actions={[{ icon: "ellipsis-horizontal", label: "Ещё", onPress: () => setSheetVisible(true) }]}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <AppText variant="display">Компактный интерфейс</AppText>
          <AppText variant="body" tone="secondary">
            Единые токены, спокойная иерархия и лаймовый акцент только для ключевых действий.
          </AppText>
        </View>

        <Section title="Типографика">
          <AppText variant="screenTitle">Заголовок экрана</AppText>
          <AppText variant="section">Заголовок секции</AppText>
          <AppText variant="body">Основной текст 15/400</AppText>
          <AppText variant="bodyMedium">Акцентный текст 15/500</AppText>
          <AppText variant="secondary" tone="secondary">Вторичный текст 14/400</AppText>
          <AppText variant="meta" tone="tertiary">Мета-информация 12/400</AppText>
        </Section>

        <Divider />

        <Section title="Ввод и фильтры">
          <Input
            label="Поиск"
            value={query}
            onChangeText={setQuery}
            placeholder="Работы, мастера, услуги"
            leading={<Ionicons name="search" size={sizes.icon.sm} color={colors.textSecondary} />}
            helperText="Состояния focus, error и disabled используют те же токены."
          />
          <View style={styles.chips}>
            {["Все", "Ремонт", "Красота"].map((item) => (
              <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />
            ))}
            <Chip label="Проверен" status="success" />
          </View>
        </Section>

        <Section title="Список и профиль" flush>
          <ListItem
            title="Александр"
            subtitle="Ремонт квартир · онлайн"
            leading={<Avatar name="Александр Волков" size="md" online verified />}
            trailing={<Chip label="4.9" status="warning" />}
            onPress={() => setSheetVisible(true)}
          />
          <Divider style={styles.insetDivider} />
          <ListItem
            title="Уведомления"
            subtitle="Заявки, сообщения и статусы"
            leading={<View style={styles.listIcon}><Ionicons name="notifications-outline" size={sizes.icon.md} color={colors.textPrimary} /></View>}
            trailing={<Badge label={3} tone="danger" />}
            onPress={() => setSheetVisible(true)}
          />
        </Section>

        <Section title="Действия">
          <Button label="Открыть bottom sheet" onPress={() => setSheetVisible(true)} />
          <Button label="Вторичное действие" variant="secondary" onPress={() => undefined} />
          <Button label="Недоступное действие" disabled onPress={() => undefined} />
        </Section>

        <Section title="Состояния загрузки">
          <View style={styles.skeletonRow}>
            <Skeleton style={styles.skeletonAvatar} />
            <View style={styles.skeletonCopy}>
              <Skeleton style={styles.skeletonTitle} />
              <Skeleton style={styles.skeletonSubtitle} />
            </View>
          </View>
        </Section>

        <Section title="Пустое состояние">
          <EmptyState title="Пока ничего нет" description="Новые элементы появятся здесь после первого действия." />
        </Section>
      </ScrollView>

      <BottomNavigation active={activeTab} onChange={setActiveTab} />

      <BottomSheet visible={sheetVisible} title="Быстрое действие" onClose={() => setSheetVisible(false)}>
        <AppText variant="body" tone="secondary">
          Bottom sheet использует общий заголовок, разделитель, отступы и безопасную область.
        </AppText>
        <ListItem
          title="Создать заявку"
          subtitle="Опишите задачу с AI-помощником"
          leading={<View style={styles.listIcon}><Ionicons name="sparkles-outline" size={sizes.icon.md} color={colors.textPrimary} /></View>}
          onPress={() => setSheetVisible(false)}
        />
        <Button label="Готово" onPress={() => setSheetVisible(false)} />
      </BottomSheet>
    </SafeAreaView>
  );
}

function Section({ title, children, flush = false }: { title: string; children: React.ReactNode; flush?: boolean }) {
  return (
    <View style={styles.section}>
      <AppText variant="section" style={styles.sectionTitle}>{title}</AppText>
      <View style={[styles.sectionBody, flush && styles.sectionBodyFlush]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: sizes.screenPadding, paddingBottom: spacing.xxxl, gap: spacing.xxl },
  intro: { gap: spacing.sm },
  section: { gap: spacing.md },
  sectionTitle: { paddingHorizontal: spacing.xs },
  sectionBody: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider },
  sectionBodyFlush: { padding: 0, overflow: "hidden" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  insetDivider: { marginLeft: sizes.screenPadding + sizes.avatar.md + spacing.md },
  listIcon: { width: sizes.avatar.md, height: sizes.avatar.md, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  skeletonRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  skeletonAvatar: { width: sizes.avatar.md, height: sizes.avatar.md, borderRadius: sizes.avatar.md / 2 },
  skeletonCopy: { flex: 1, gap: spacing.sm },
  skeletonTitle: { width: "58%" },
  skeletonSubtitle: { width: "84%", height: 12 },
});
