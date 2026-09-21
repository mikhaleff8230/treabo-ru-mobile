import type { EdgeInsets } from "react-native-safe-area-context";
import { colors, sizes, spacing } from "../theme";

/** Высота области с иконками/подписями (без системного отступа снизу). */
export const TAB_BAR_BASE_HEIGHT = sizes.bottomNavigation;
export const TAB_BAR_PADDING_TOP = spacing.xs;

/** Стиль нижней панели вкладок с учётом home indicator / gesture bar. */
export function getTabBarStyle(insets: EdgeInsets) {
  const bottom = insets.bottom;
  return {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
    paddingTop: TAB_BAR_PADDING_TOP,
    paddingBottom: bottom,
    height: TAB_BAR_BASE_HEIGHT + bottom,
  };
}
