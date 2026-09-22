import { create } from "zustand";
import type { MessengerConversation } from "../services/messenger";

type MessengerBadgeState = {
  unreadCount: number;
  setFromConversations: (conversations: MessengerConversation[]) => void;
};

export const useMessengerBadgeStore = create<MessengerBadgeState>((set) => ({
  unreadCount: 0,
  setFromConversations: (conversations) => set({
    unreadCount: conversations.reduce((count, conversation) => count + Number(conversation.unread_count || 0), 0),
  }),
}));
