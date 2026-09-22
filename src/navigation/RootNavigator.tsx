import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { TreaboLogo } from "../../components/TreaboLogo";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme, useFocusEffect, useNavigation, type LinkingOptions, type Theme } from "@react-navigation/native";
import { createNativeStackNavigator, type NativeStackNavigationProp } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { colors, radius, spacing, typography } from "../theme";
import { listConversations } from "../services/messenger";
import { useMessengerBadgeStore } from "../store/messengerBadgeStore";
import WelcomeAuthScreen from "../../screens/auth/WelcomeAuthScreen";
import AuthOptionsScreen from "../../screens/auth/AuthOptionsScreen";
import PhoneAuthScreen from "../../screens/auth/PhoneAuthScreen";
import LoginStubScreen from "../../screens/LoginStubScreen";
import HomePlacesScreen from "../../screens/HomePlacesScreen";
import PlacesMapScreen from "../../screens/PlacesMapScreen";
import PlaceSearchScreen from "../../screens/PlaceSearchScreen";
import PlaceDetailScreen from "../../screens/PlaceDetailScreen";
import CreatePlaceScreen from "../../screens/CreatePlaceScreen";
import PlacePublishedScreen from "../../screens/PlacePublishedScreen";
import RequestsHubScreen from "../../screens/RequestsHubScreen";
import ProfileHubScreen from "../../screens/ProfileHubScreen";
import MyPlacesScreen from "../../screens/MyPlacesScreen";
import ProfessionalProfileScreen from "../../screens/ProfessionalProfileScreen";
import NotificationsScreen from "../../screens/NotificationsScreen";
import NotificationDetailScreen from "../../screens/NotificationDetailScreen";
import NotificationSettingsScreen from "../../screens/NotificationSettingsScreen";
import BalanceHistoryScreen from "../../screens/BalanceHistoryScreen";
import WorkCompletionScreen from "../../screens/WorkCompletionScreen";
import ReviewComposerScreen from "../../screens/ReviewComposerScreen";
import FavoritesScreen from "../../screens/FavoritesScreen";
import MapScreen from "../../screens/MapScreen";
import TasksListScreen from "../../screens/TasksListScreen";
import TaskSearchScreen from "../../screens/TaskSearchScreen";
import TaskFilterScreen from "../../screens/TaskFilterScreen";
import ProfileScreen from "../../screens/ProfileScreen";
import MessengerListScreen from "../../screens/MessengerListScreen";
import MessengerChatScreen from "../../screens/MessengerChatScreen";
import MessengerArchiveScreen from "../../screens/MessengerArchiveScreen";
import MessengerSearchScreen from "../../screens/MessengerSearchScreen";
import MessengerContactScreen from "../../screens/MessengerContactScreen";
import MessengerCallScreen from "../../screens/MessengerCallScreen";
import MessengerForwardScreen from "../../screens/MessengerForwardScreen";
import MessengerMediaScreen from "../../screens/MessengerMediaScreen";
import AiCreateRequestScreen from "../../screens/AiCreateRequestScreen";
import RequestPublishedScreen from "../../screens/RequestPublishedScreen";
import SuitableMastersScreen from "../../screens/SuitableMastersScreen";
import ApplicationsScreen from "../../screens/ApplicationsScreen";
import ApplicationDetailScreen from "../../screens/ApplicationDetailScreen";
import MasterSelectedScreen from "../../screens/MasterSelectedScreen";
import TaskDetailScreen from "../../screens/TaskDetailScreen";
import TaskApplyScreen from "../../screens/TaskApplyScreen";
import CreateTaskScreen from "../../screens/CreateTaskScreen";
import ChatDetailScreen from "../../screens/ChatDetailScreen";
import SpecialistProfileScreen from "../../screens/SpecialistProfileScreen";
import WalletScreen from "../../screens/WalletScreen";
import PhoneChangeScreen from "../../screens/PhoneChangeScreen";
import IdentityVerificationScreen from "../../screens/IdentityVerificationScreen";
import MyReviewsScreen from "../../screens/MyReviewsScreen";
import DesignSystemShowcaseScreen from "../../screens/DesignSystemShowcaseScreen";
import type {
  AuthStackParamList,
  MainTabParamList,
  RootStackParamList,
} from "./types";
import { getTabBarStyle } from "./tabBar";
import { CreateActionSheet } from "./CreateActionSheet";

// TREABO unified navigation shell.

const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const AppStackNav = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.white, card: colors.white, primary: colors.black, text: colors.black, border: colors.neutral100 },
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["treabo-client://", "treabo://"],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: "home",
          SearchTab: "search",
          Messages: "messages",
          Profile: "profile",
        },
      },
      DesignSystemShowcase: "design-system",
      PlacesMap: "map",
      Map: "task-map",
      Search: "search/results",
      MyRequests: "requests",
      PlaceDetail: "place/:placeId",
      CreatePlace: "place/new",
      Chat: "chat/:chatId",
      TaskDetail: "task/:taskId",
      Applications: "task/:taskId/applications",
      PublicProfile: "specialist/:specialistId",
      MessengerChat: "messenger/:conversationId",
      MessengerCall: "messenger/:conversationId/call",
    },
  },
};

function EmptyActionRoute() {
  return <View style={styles.emptyActionRoute} />;
}

function SearchTabScreen() {
  return <PlaceSearchScreen asTab />;
}

function MainTabs() {
  const { t } = useLang();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "MainTabs">>();
  const insets = useSafeAreaInsets();
  const [createOpen, setCreateOpen] = useState(false);
  const unreadChats = useMessengerBadgeStore((state) => state.unreadCount);
  const setUnreadChats = useMessengerBadgeStore((state) => state.setFromConversations);

  useFocusEffect(useCallback(() => {
    const refreshUnread = () => {
      void listConversations().then(setUnreadChats).catch(() => undefined);
    };
    refreshUnread();
    const timer = setInterval(refreshUnread, 30_000);
    return () => clearInterval(timer);
  }, [setUnreadChats]));

  return (
    <>
      <Tab.Navigator
        safeAreaInsets={{ top: 0, right: 0, bottom: insets.bottom, left: 0 }}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: colors.textPrimary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: getTabBarStyle(insets),
          tabBarItemStyle: styles.tabItem,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ color, focused }) => {
            if (route.name === "CreateAction") return null;

            const iconNames: Record<Exclude<keyof MainTabParamList, "CreateAction">, keyof typeof Ionicons.glyphMap> = {
              Home: "home-outline",
              SearchTab: "search-outline",
              Messages: "chatbubble-ellipses-outline",
              Profile: "person-outline",
            };
            const iconName = iconNames[route.name as Exclude<keyof MainTabParamList, "CreateAction">];

            return (
              <View style={styles.iconFrame}>
                {route.name === "Home" && focused ? <View style={styles.homeAccent} /> : null}
                <Ionicons name={iconName} size={27} color={color} />
                {route.name === "Messages" && unreadChats > 0 ? <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{unreadChats > 99 ? "99+" : unreadChats}</Text></View> : null}
              </View>
            );
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomePlacesScreen}
          options={{ title: t("tab_home"), tabBarLabel: t("tab_home") }}
        />
        <Tab.Screen
          name="SearchTab"
          component={SearchTabScreen}
          options={{ title: t("tab_search"), tabBarLabel: t("tab_search") }}
        />
        <Tab.Screen
          name="CreateAction"
          component={EmptyActionRoute}
          options={{
            title: t("tab_add"),
            tabBarLabel: () => null,
            tabBarButton: (props) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("tab_add")}
                accessibilityState={props.accessibilityState}
                onPress={props.onPress as () => void}
                style={({ pressed }) => [styles.createTab, pressed && styles.createTabPressed]}
              >
                <View style={styles.createCircle}>
                  <Ionicons name="add" size={42} color={colors.black} />
                </View>
                <Text style={styles.createLabel}>{t("tab_add")}</Text>
              </Pressable>
            ),
          }}
          listeners={{
            tabPress: (event) => {
              event.preventDefault();
              setCreateOpen(true);
            },
          }}
        />
        <Tab.Screen
          name="Messages"
          component={MessengerListScreen}
          options={{ title: t("tab_messages"), tabBarLabel: t("tab_messages") }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileHubScreen}
          options={{ title: t("tab_profile"), tabBarLabel: t("tab_profile") }}
        />
      </Tab.Navigator>

      <CreateActionSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onShowWork={() => {
          setCreateOpen(false);
          requestAnimationFrame(() => navigation.navigate("CreatePlace"));
        }}
        onFindMaster={() => {
          setCreateOpen(false);
          requestAnimationFrame(() => navigation.navigate("AIRequest"));
        }}
      />
    </>
  );
}

function LoggedInStack() {
  return (
    <AppStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AppStackNav.Screen name="MainTabs" component={MainTabs} />
      <AppStackNav.Screen name="DesignSystemShowcase" component={DesignSystemShowcaseScreen} />

      <AppStackNav.Screen name="AIRequest" component={AiCreateRequestScreen} />
      <AppStackNav.Screen name="RequestPublished" component={RequestPublishedScreen} />
      <AppStackNav.Screen name="SuitableMasters" component={SuitableMastersScreen} />
      <AppStackNav.Screen name="Search" component={PlaceSearchScreen} />
      <AppStackNav.Screen name="PlacesMap" component={PlacesMapScreen} />
      <AppStackNav.Screen name="MyRequests" component={RequestsHubScreen} />
      <AppStackNav.Screen name="CreatePlace" component={CreatePlaceScreen} />
      <AppStackNav.Screen name="PlacePublished" component={PlacePublishedScreen} />
      <AppStackNav.Screen name="PlaceDetail" component={PlaceDetailScreen} />
      <AppStackNav.Screen name="Applications" component={ApplicationsScreen} />
      <AppStackNav.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
      <AppStackNav.Screen name="MasterSelected" component={MasterSelectedScreen} />
      <AppStackNav.Screen name="ChatList" component={MessengerListScreen} />
      <AppStackNav.Screen name="Chat" component={ChatDetailScreen} />
      <AppStackNav.Screen name="MessengerChat" component={MessengerChatScreen} />
      <AppStackNav.Screen name="MessengerArchive" component={MessengerArchiveScreen} />
      <AppStackNav.Screen name="MessengerSearch" component={MessengerSearchScreen} />
      <AppStackNav.Screen name="MessengerContact" component={MessengerContactScreen} />
      <AppStackNav.Screen name="MessengerCall" component={MessengerCallScreen} />
      <AppStackNav.Screen name="MessengerForward" component={MessengerForwardScreen} />
      <AppStackNav.Screen name="MessengerMedia" component={MessengerMediaScreen} />
      <AppStackNav.Screen name="PublicProfile" component={SpecialistProfileScreen} />
      <AppStackNav.Screen name="MyPlaces" component={MyPlacesScreen} />
      <AppStackNav.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
      <AppStackNav.Screen name="Notifications" component={NotificationsScreen} />
      <AppStackNav.Screen name="NotificationDetail" component={NotificationDetailScreen} />
      <AppStackNav.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <AppStackNav.Screen name="Balance" component={WalletScreen} />
      <AppStackNav.Screen name="BalanceHistory" component={BalanceHistoryScreen} />
      <AppStackNav.Screen name="WorkCompletion" component={WorkCompletionScreen} />
      <AppStackNav.Screen name="ReviewComposer" component={ReviewComposerScreen} />
      <AppStackNav.Screen name="Favorites" component={FavoritesScreen} />
      <AppStackNav.Screen name="Settings" component={ProfileScreen} />

      <AppStackNav.Screen name="AiCreateRequest" component={AiCreateRequestScreen} />
      <AppStackNav.Screen name="PaymentReturn" component={WalletScreen} />
      <AppStackNav.Screen name="Map" component={MapScreen} />
      <AppStackNav.Screen name="TasksList" component={TasksListScreen} />
      <AppStackNav.Screen name="TaskSearch" component={TaskSearchScreen} />
      <AppStackNav.Screen name="TaskFilter" component={TaskFilterScreen} />
      <AppStackNav.Screen name="TaskDetail" component={TaskDetailScreen} />
      <AppStackNav.Screen name="TaskApply" component={TaskApplyScreen} />
      <AppStackNav.Screen name="CreateTask" component={CreateTaskScreen} />
      <AppStackNav.Screen name="ChatDetail" component={ChatDetailScreen} />
      <AppStackNav.Screen name="SpecialistProfile" component={SpecialistProfileScreen} />
      <AppStackNav.Screen name="Wallet" component={WalletScreen} />
      <AppStackNav.Screen name="PhoneChange" component={PhoneChangeScreen} />
      <AppStackNav.Screen name="IdentityVerification" component={IdentityVerificationScreen} />
      <AppStackNav.Screen name="MyReviews" component={MyReviewsScreen} />
    </AppStackNav.Navigator>
  );
}

export function RootNavigator() {
  const { user, loading } = useAuth();
  const [introVisible, setIntroVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const splashScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(splashOpacity, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.spring(splashScale, { toValue: 1, tension: 42, friction: 8, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => setIntroVisible(false), 1200);
    return () => clearTimeout(timer);
  }, [splashOpacity, splashScale]);

  if (loading || introVisible) {
    return <SafeAreaView style={styles.splash} edges={["top", "bottom", "left", "right"]}><Animated.View style={{ opacity: splashOpacity, transform: [{ scale: splashScale }] }}><TreaboLogo size="splash" /></Animated.View></SafeAreaView>;
  }

  return (
    <NavigationContainer
      theme={navTheme}
      linking={linking}
    >
      {user ? <LoggedInStack /> : (
        <AuthStackNav.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
          <AuthStackNav.Screen name="Welcome" component={WelcomeAuthScreen} />
          <AuthStackNav.Screen name="AuthOptions" component={AuthOptionsScreen} />
          <AuthStackNav.Screen name="PhoneEntry" component={PhoneAuthScreen} />
          <AuthStackNav.Screen name="Login" component={LoginStubScreen} />
        </AuthStackNav.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.white },
  emptyActionRoute: { flex: 1, backgroundColor: colors.white },
  tabItem: { paddingTop: spacing.xs },
  tabLabel: { ...typography.meta, fontWeight: "500", marginTop: 0 },
  iconFrame: { width: 34, height: 31, alignItems: "center", justifyContent: "center" },
  homeAccent: {
    position: "absolute",
    width: 24,
    height: 22,
    borderRadius: 7,
    backgroundColor: colors.accent,
  },
  unreadBadge: {
    position: "absolute",
    top: -5,
    right: -7,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.danger,
    borderWidth: 1,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  unreadBadgeText: { color: colors.white, fontSize: 9, fontWeight: "600" },
  createTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    minWidth: 74,
  },
  createTabPressed: { opacity: 0.78 },
  createCircle: {
    width: 54,
    height: 54,
    borderRadius: radius.full,
    marginTop: -16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  createLabel: {
    color: colors.textSecondary,
    ...typography.meta,
    fontWeight: "500",
    marginTop: spacing.xs,
  },
});
