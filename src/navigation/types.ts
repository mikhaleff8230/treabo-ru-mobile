import type { NavigatorScreenParams } from "@react-navigation/native";

export type TaskRouteParams =
  | {
      category?: string;
      category_id?: string;
      q?: string;
      city?: string;
      budget_min?: string;
      budget_max?: string;
    }
  | undefined;

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  DesignSystemShowcase: undefined;

  // Canonical TREABO routes.
  AIRequest: undefined;
  RequestPublished: { taskId: string };
  SuitableMasters: { taskId: string };
  CreatePlace: undefined;
  PlacePublished: { placeId: string };
  PlaceDetail: { placeId: string };
  Search: { filtersOpen?: boolean } | undefined;
  PlacesMap: { mode?: "places" | "tasks" } | undefined;
  MyRequests: { tab?: "mine" | "responses" | "available" } | undefined;
  Applications: { taskId: string };
  ApplicationDetail: { taskId: string; applicationId: string };
  MasterSelected: { taskId: string; specialistId: string; chatId?: string };
  ChatList: undefined;
  Chat: { chatId: string };
  PublicProfile: { specialistId: string; chatId?: string };
  MyPlaces: undefined;
  ProfessionalProfile: undefined;
  Notifications: undefined;
  NotificationDetail: { notificationId: string };
  NotificationSettings: undefined;
  MessengerChat: { conversationId: string };
  MessengerArchive: undefined;
  MessengerSearch: undefined;
  MessengerContact: { conversationId: string };
  MessengerCall: { conversationId: string; mode: "audio" | "video"; callId?: string };
  MessengerForward: { messageId: string };
  MessengerMedia: { conversationId: string };
  Favorites: undefined;
  Balance: undefined;
  BalanceHistory: undefined;
  WorkCompletion: { taskId: string };
  ReviewComposer: { taskId: string; specialistId: string };
  Settings: undefined;

  // Compatibility routes used by existing screens and external links.
  AiCreateRequest: undefined;
  PaymentReturn: { result?: string } | undefined;
  Map: TaskRouteParams;
  TasksList: TaskRouteParams;
  TaskSearch: undefined;
  TaskFilter: TaskRouteParams;
  TaskDetail: { taskId: string };
  TaskApply: { taskId: string; title?: string };
  CreateTask: undefined;
  ChatDetail: { chatId: string };
  CustomerProfile: {
    chatId?: string;
    customerId?: string;
    customerName?: string;
    customerAvatar?: unknown;
    taskTitle?: string;
  };
  SpecialistProfile: { specialistId: string; chatId?: string };
  Wallet: undefined;
  PhoneChange: undefined;
  IdentityVerification: undefined;
  MyReviews: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  SearchTab: undefined;
  CreateAction: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type TasksStackParamList = {
  TasksHome: undefined;
  Map: TaskRouteParams;
  TasksList: TaskRouteParams;
  TaskSearch: undefined;
  TaskFilter: TaskRouteParams;
};

export type AuthStackParamList = {
  Welcome: undefined;
  AuthOptions: undefined;
  PhoneEntry: { role?: "customer" | "specialist" };
  Login: undefined;
};
