import React, { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, radius, sizes, spacing, typography } from "../../src/theme";
import { AppText } from "./AppText";

type Props = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

export function Input({ label, error, helperText, leading, trailing, editable = true, style, onFocus, onBlur, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.block}>
      {label ? <AppText variant="secondary" style={styles.label}>{label}</AppText> : null}
      <View style={[styles.field, focused && styles.focused, !!error && styles.errored, !editable && styles.disabled]}>
        {leading}
        <TextInput
          {...props}
          editable={editable}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.textPrimary}
          style={[styles.input, style]}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        />
        {trailing}
      </View>
      {error ? <AppText variant="meta" tone="danger">{error}</AppText> : helperText ? <AppText variant="meta" tone="secondary">{helperText}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.xs },
  label: { fontWeight: "500" },
  field: {
    minHeight: sizes.control.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.surfaceSecondary,
  },
  focused: { borderColor: colors.textPrimary, backgroundColor: colors.surface },
  errored: { borderColor: colors.danger },
  disabled: { opacity: 0.48 },
  input: { ...typography.body, color: colors.textPrimary, flex: 1, paddingVertical: 0 },
});
