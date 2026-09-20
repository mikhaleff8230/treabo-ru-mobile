import React from "react";
import { Image, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, sizes } from "../../src/theme";
import { AppText } from "./AppText";

type AvatarSize = keyof typeof sizes.avatar;

type Props = {
  source?: ImageSourcePropType;
  name: string;
  size?: AvatarSize;
  online?: boolean;
  verified?: boolean;
};

export function Avatar({ source, name, size = "md", online, verified }: Props) {
  const dimension = sizes.avatar[size];
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  return (
    <View style={{ width: dimension, height: dimension }} accessibilityLabel={name}>
      {source ? <Image source={source} style={[styles.image, { width: dimension, height: dimension, borderRadius: dimension / 2 }]} /> : (
        <View style={[styles.fallback, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}>
          <AppText variant={size === "sm" ? "meta" : "bodyMedium"}>{initials || "T"}</AppText>
        </View>
      )}
      {online ? <View style={[styles.online, { right: size === "lg" ? 1 : -1 }]} /> : null}
      {verified ? <View style={styles.verified}><Ionicons name="checkmark" size={10} color={colors.white} /></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { resizeMode: "cover" },
  fallback: { alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSoft },
  online: { position: "absolute", bottom: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.white },
  verified: { position: "absolute", top: -2, right: -2, width: 15, height: 15, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.success, borderWidth: 1, borderColor: colors.white },
});
