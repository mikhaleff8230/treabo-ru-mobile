import { apiFetch } from "../api";
import type { Place, PlaceDraft, PlaceFilters, PlacePage } from "../types/place";
import { clientDraftId } from "./requestAssistant";

function unwrapList(payload: any): Place[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function queryString(filters: PlaceFilters = {}): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  });
  return params.toString();
}

export async function listPlaces(filters: PlaceFilters = {}): Promise<Place[]> {
  const query = queryString({ per_page: 30, ...filters });
  return unwrapList(await apiFetch(`/places${query ? `?${query}` : ""}`, { method: "GET" }));
}

export async function listPlacesPage(filters: PlaceFilters = {}): Promise<PlacePage> {
  const query = queryString({ per_page: 6, ...filters });
  const payload = await apiFetch(`/places${query ? `?${query}` : ""}`, { method: "GET" });
  const meta = payload?.meta ?? {};
  const items = unwrapList(payload);
  return {
    items,
    page: Number(meta.current_page ?? filters.page ?? 1),
    lastPage: Number(meta.last_page ?? (items.length ? filters.page ?? 1 : 1)),
    perPage: Number(meta.per_page ?? filters.per_page ?? 6),
    total: Number(meta.total ?? items.length),
  };
}

export async function getPlace(placeId: string): Promise<Place> {
  const payload = await apiFetch(`/places/${placeId}`, { method: "GET" });
  return (payload?.data ?? payload) as Place;
}

export async function createPlace(draft: PlaceDraft): Promise<Place> {
  const payload = await apiFetch("/places", { method: "POST", body: JSON.stringify(draft) });
  return (payload?.data ?? payload) as Place;
}

export async function setPlaceFavorite(placeId: string, favorite: boolean): Promise<void> {
  await apiFetch(`/places/${placeId}/favorite`, { method: favorite ? "POST" : "DELETE" });
}

export async function setPlaceLike(placeId: string, liked: boolean): Promise<void> {
  await apiFetch(`/places/${placeId}/like`, { method: liked ? "POST" : "DELETE" });
}

export async function createRequestFromPlace(placeId: string): Promise<any> {
  const draftId = await clientDraftId();
  return apiFetch(`/places/${placeId}/create-request`, {
    method: "POST",
    body: JSON.stringify({
      client_draft_id: draftId,
      idempotency_key: `place-${placeId}-${draftId}-${Date.now()}`,
    }),
  });
}
