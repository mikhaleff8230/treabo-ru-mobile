import React from "react";
import { Text, type TextProps } from "react-native";
import { colors, typography, type TypographyVariant } from "../../src/theme";

type Props = TextProps & {
  variant?: TypographyVariant;
  tone?: "primary" | "secondary" | "tertiary" | "danger" | "success";
};

const tones = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  tertiary: colors.textTertiary,
  danger: colors.danger,
  success: colors.success,
};

export function AppText({ variant = "body", tone = "primary", style, ...props }: Props) {
  return <Text {...props} style={[typography[variant], { color: tones[tone] }, style]} />;
}
