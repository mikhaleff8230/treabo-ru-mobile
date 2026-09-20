import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radius, sizes, spacing } from "../../src/theme";
import { AppText } from "./AppText";

type Variant = "primary" | "secondary" | "text" | "danger";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const foreground: Record<Variant, string> = {
  primary: colors.textPrimary,
  secondary: colors.textPrimary,
  text: colors.textPrimary,
  danger: colors.danger,
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  fullWidth = true,
  leftIcon,
  style,
}: Props) {
  const unavailable = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        pressed && !unavailable && styles.pressed,
        unavailable && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={foreground[variant]} />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <AppText variant="button" style={{ color: foreground[variant] }}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.control.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
  },
  fullWidth: { width: "100%" },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  text: { backgroundColor: "transparent" },
  danger: { backgroundColor: colors.dangerSoft },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.42 },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
});
