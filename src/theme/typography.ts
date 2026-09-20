import type { TextStyle } from "react-native";

export const typography = {
  display: { fontSize: 24, lineHeight: 30, fontWeight: "600", letterSpacing: -0.3 },
  screenTitle: { fontSize: 20, lineHeight: 26, fontWeight: "600", letterSpacing: -0.2 },
  section: { fontSize: 17, lineHeight: 22, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 21, fontWeight: "400" },
  bodyMedium: { fontSize: 15, lineHeight: 21, fontWeight: "500" },
  secondary: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
  meta: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
  button: { fontSize: 15, lineHeight: 20, fontWeight: "600" },

  // Compatibility names used by the current screens.
  title: { fontSize: 24, lineHeight: 30, fontWeight: "600", letterSpacing: -0.3 },
  headline: { fontSize: 20, lineHeight: 26, fontWeight: "600" },
  small: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "600" },
  tab: { fontSize: 10, lineHeight: 14, fontWeight: "600" },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
