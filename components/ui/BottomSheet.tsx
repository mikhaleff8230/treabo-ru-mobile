import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, sizes, spacing } from "../../src/theme";
import { AppText } from "./AppText";

type Props = { visible: boolean; title: string; onClose: () => void; children: React.ReactNode };

export function BottomSheet({ visible, title, onClose, children }: Props) {
  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable accessibilityRole="button" accessibilityLabel="Закрыть" style={styles.backdrop} onPress={onClose} />
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="section" style={styles.title}>{title}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Закрыть" onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={sizes.icon.lg} color={colors.textPrimary} />
            </Pressable>
          </View>
          <View style={styles.content}>{children}</View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.special, borderTopRightRadius: radius.special },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginTop: spacing.sm },
  header: { minHeight: sizes.header, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  title: { flex: 1 },
  close: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, gap: spacing.md },
});
