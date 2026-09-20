import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "../../src/theme";

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View accessibilityElementsHidden style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({ divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider } });
