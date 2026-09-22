import { apiFetch } from "../api";

export type NotificationType = "message" | "request" | "application" | "favorite" | "comment" | "like" | "follower" | "system";
export type AppNotification = { id: string; type: NotificationType; title: string; body?: string | null; data: Record<string, unknown>; read_at?: string | null; created_at?: string | null };
export type NotificationPreferences = { push_enabled: boolean; messages: boolean; requests: boolean; applications: boolean; favorites: boolean; comments: boolean; likes: boolean; followers: boolean };

export async function getNotifications(type?: NotificationType | "all", unread = false): Promise<{ items: AppNotification[]; unreadCount: number }> {
  const params = new URLSearchParams();
  if (type && type !== "all") params.set("type", type);
  if (unread) params.set("unread", "1");
  const payload = await apiFetch(`/notifications${params.toString() ? `?${params}` : ""}`, { method: "GET" });
  return { items: Array.isArray(payload?.data) ? payload.data : [], unreadCount: Number(payload?.meta?.unread_count || 0) };
}

export async function getNotification(id: string): Promise<AppNotification> {
  const payload = await apiFetch(`/notifications/${id}`, { method: "GET" });
  return payload?.data as AppNotification;
}

export async function readAllNotifications(): Promise<void> { await apiFetch("/notifications/read-all", { method: "POST" }); }
export async function getNotificationPreferences(): Promise<NotificationPreferences> { return apiFetch("/notifications/preferences", { method: "GET" }); }
export async function updateNotificationPreferences(value: Partial<NotificationPreferences>): Promise<NotificationPreferences> { return apiFetch("/notifications/preferences", { method: "PATCH", body: JSON.stringify(value) }); }
