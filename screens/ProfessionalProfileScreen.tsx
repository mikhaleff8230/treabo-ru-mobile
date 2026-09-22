import React from "react";
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../src/context/AuthContext";
import { colors, radius, spacing, typography } from "../src/theme";
import type { RootStackParamList } from "../src/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
const hero = require("../assets/intro-interior.png");

export default function ProfessionalProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const isMaster = user?.role === "specialist";
  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.icon} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={27} color={colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Профессиональный профиль</Text><View style={styles.icon} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ImageBackground source={hero} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.scrim} /><Text style={styles.heroTitle}>Находите клиентов.{"\n"}Показывайте работы.{"\n"}Развивайтесь на Treabo.</Text>
        </ImageBackground>
        <Benefit icon="images-outline" title="Публикуйте свои работы" text="Добавляйте фото и видео, рассказывайте об услугах." />
        <Benefit icon="document-text-outline" title="Получайте заявки" text="Клиенты рядом смогут выбрать вас и написать напрямую." />
        <Benefit icon="options-outline" title="Управляйте профилем" text="Настройте услуги, город, описание и способы связи." />
        <Benefit icon="trending-up-outline" title="Растите вместе с Treabo" text="Больше реальных работ — больше доверия клиентов." />
        <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate("Settings")}>
          <Text style={styles.primaryText}>{isMaster ? "Настроить профиль" : "Стать мастером"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate("MyPlaces")} disabled={!isMaster}>
          <Text style={[styles.linkText, !isMaster && styles.linkTextMuted]}>{isMaster ? "Перейти к моим Плейсам" : "После регистрации профиль появится здесь"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Benefit({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  return <View style={styles.benefit}><View style={styles.benefitIcon}><Ionicons name={icon} size={24} color={colors.textPrimary} /></View><View style={styles.benefitCopy}><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.benefitText}>{text}</Text></View></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: { height: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md },
  icon: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  headerTitle: { ...typography.section, color: colors.textPrimary },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  hero: { height: 230, justifyContent: "flex-end", padding: spacing.xl, marginBottom: spacing.xl },
  heroImage: { borderRadius: radius.xl },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,.38)", borderRadius: radius.xl },
  heroTitle: { ...typography.display, color: colors.white },
  benefit: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl },
  benefitIcon: { width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  benefitCopy: { flex: 1 },
  benefitTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  benefitText: { ...typography.secondary, color: colors.textSecondary, marginTop: 2 },
  primary: { height: 54, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginTop: spacing.sm },
  primaryText: { ...typography.button, color: colors.textPrimary },
  link: { alignItems: "center", padding: spacing.lg },
  linkText: { ...typography.secondary, color: colors.textPrimary },
  linkTextMuted: { color: colors.textSecondary },
});
