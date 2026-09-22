import { apiFetch } from "../api";

export type CallMode = "audio" | "video";
export type MessengerCall = {
  id: string;
  conversation_id: string;
  initiated_by: string;
  mode: CallMode;
  status: "ringing" | "accepted" | "declined" | "ended" | "missed";
  server_url: string;
  token: string;
  created_at?: string | null;
  accepted_at?: string | null;
  ended_at?: string | null;
};

export interface CallProvider {
  start(conversationId: string, mode: CallMode): Promise<MessengerCall>;
  get(callId: string): Promise<MessengerCall>;
  accept(callId: string): Promise<MessengerCall>;
  end(callId: string): Promise<MessengerCall>;
}

const request = (path: string, options: RequestInit = {}) => apiFetch(`/messenger${path}`, { namespace: "root", ...options });

export const liveKitCallProvider: CallProvider = {
  async start(conversationId, mode) {
    const response = await request(`/conversations/${conversationId}/calls`, { method: "POST", body: JSON.stringify({ mode }) });
    return response.data;
  },
  async get(callId) {
    const response = await request(`/calls/${callId}`, { method: "GET" });
    return response.data;
  },
  async accept(callId) {
    const response = await request(`/calls/${callId}/accept`, { method: "POST" });
    return response.data;
  },
  async end(callId) {
    const response = await request(`/calls/${callId}/end`, { method: "POST" });
    return response.data;
  },
};
