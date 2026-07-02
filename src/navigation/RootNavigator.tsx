import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme, type Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { colors } from "../theme";
import { useChatStore } from "../store/chatStore";
import WelcomeAuthScreen from "../../screens/auth/WelcomeAuthScreen";
import PhoneAuthScreen from "../../screens/auth/PhoneAuthScreen";
import LoginStubScreen from "../../screens/LoginStubScreen";
import HomeScreen from "../../screens/HomeScreen";
import ChatsScreen from "../../screens/ChatsScreen";
import ProfileScreen from "../../screens/ProfileScreen";
import WalletScreen from "../../screens/WalletScreen";
import MapScreen from "../../screens/MapScreen";
import TasksListScreen from "../../screens/TasksListScreen";
import TaskSearchScreen from "../../screens/TaskSearchScreen";
import TaskFilterScreen from "../../screens/TaskFilterScreen";
import TaskDetailScreen from "../../screens/TaskDetailScreen";
import TaskApplyScreen from "../../screens/TaskApplyScreen";
import CreateTaskScreen from "../../screens/CreateTaskScreen";
import ChatDetailScreen from "../../screens/ChatDetailScreen";
import SpecialistProfileScreen from "../../screens/SpecialistProfileScreen";
import type { AuthStackParamList, MainTabParamList, RootStackParamList } from "./types";
import { getTabBarStyle } from "./tabBar";
import { fetchAccountSummary, type AccountSummary } from "../services/account";

const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const AppStackNav = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.white,
    card: colors.white,
    primary: colors.black,
    text: colors.black,
    border: colors.neutral100,
  },
};

function MainTabs() {
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const tabBarStyle = getTabBarStyle(insets);
  const unreadChats = useChatStore((s) => s.chats.reduce((sum, chat) => sum + Number(chat.unread_count || 0), 0));
  const [account, setAccount] = useState<AccountSummary | null>(null);

  useEffect(() => {
    fetchAccountSummary().then(setAccount).catch(() => setAccount(null));
  }, []);

  return (
    <Tab.Navigator
      safeAreaInsets={{ top: 0, right: 0, bottom: insets.bottom, left: 0 }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.black,
        tabBarInactiveTintColor: colors.neutral400,
        tabBarStyle,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => {
          const map: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Home: "home-outline",
            Wallet: "wallet-outline",
            Chats: "chatbubble-ellipses-outline",
            Profile: "person-outline",
          };
          const name = map[route.name as keyof MainTabParamList];
          if (route.name === "Wallet") {
            return (
              <View style={styles.walletIconWrap}>
                <Ionicons name={name} size={size ?? 22} color={color} />
                <Text style={styles.walletBalance}>{Math.round(account?.balance ?? 0)}₽</Text>
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>{account?.free_remaining_today ?? 5}</Text>
                </View>
              </View>
            );
          }
          return <Ionicons name={name} size={size ?? 22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t("tab_home"), tabBarLabel: t("tab_home") }} />
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ title: "Кошелек", tabBarLabel: "Кошелек" }} />
      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
        options={{
          title: t("tab_chats"),
          tabBarLabel: t("tab_chats"),
          tabBarBadge: unreadChats > 0 ? (unreadChats > 99 ? "99+" : unreadChats) : undefined,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t("tab_profile"), tabBarLabel: t("tab_profile") }} />
    </Tab.Navigator>
  );
}

function LoggedInStack() {
  return (
    <AppStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AppStackNav.Screen name="MainTabs" component={MainTabs} />
      <AppStackNav.Screen name="Map" component={MapScreen} />
      <AppStackNav.Screen name="TasksList" component={TasksListScreen} />
      <AppStackNav.Screen name="TaskSearch" component={TaskSearchScreen} />
      <AppStackNav.Screen name="TaskFilter" component={TaskFilterScreen} />
      <AppStackNav.Screen name="TaskDetail" component={TaskDetailScreen} />
      <AppStackNav.Screen name="TaskApply" component={TaskApplyScreen} />
      <AppStackNav.Screen name="CreateTask" component={CreateTaskScreen} />
      <AppStackNav.Screen name="ChatDetail" component={ChatDetailScreen} />
      <AppStackNav.Screen name="SpecialistProfile" component={SpecialistProfileScreen} />
    </AppStackNav.Navigator>
  );
}

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={styles.splash} edges={["top", "bottom", "left", "right"]}>
        <ActivityIndicator size="large" color={colors.black} />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {user ? (
        <LoggedInStack />
      ) : (
        <AuthStackNav.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
          <AuthStackNav.Screen name="Welcome" component={WelcomeAuthScreen} />
          <AuthStackNav.Screen name="PhoneEntry" component={PhoneAuthScreen} />
          <AuthStackNav.Screen name="Login" component={LoginStubScreen} />
        </AuthStackNav.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.shell },
  walletIconWrap: { alignItems: "center", justifyContent: "center", minWidth: 46 },
  walletBalance: { fontSize: 9, fontWeight: "700", color: colors.black, marginTop: -2 },
  freeBadge: {
    position: "absolute",
    top: -7,
    right: 2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#D9F36B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.white,
  },
  freeBadgeText: { fontSize: 10, fontWeight: "800", color: colors.black },
});
