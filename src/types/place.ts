export type PlaceImage = {
  id?: string;
  url?: string | null;
  thumbnail?: string | null;
  is_cover?: boolean;
  sort_order?: number;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
};

export type PlaceVideo = {
  id?: string;
  url?: string | null;
  preview?: string | null;
  poster?: string | null;
  thumbnail?: string | null;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
};

export type PlaceAuthor = {
  id: string;
  name: string;
  avatar?: string | null;
  rating?: number;
  reviews_count?: number;
  online?: boolean;
};

export type Place = {
  id: string;
  title: string;
  description?: string | null;
  cover?: PlaceImage | null;
  gallery?: PlaceImage[];
  videos?: PlaceVideo[];
  price?: number | null;
  hide_price?: boolean;
  price_label?: string;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  distance?: number | null;
  category?: { id: string; name: string; icon?: string | null } | null;
  work?: { id: number; title: string; slug?: string | null } | null;
  author?: PlaceAuthor | null;
  author_details?: PlaceAuthor & { bio?: string | null; city?: string | null };
  works_count?: number;
  author_places_count?: number;
  favorites_count?: number;
  is_favorite?: boolean;
  likes_count?: number;
  is_liked?: boolean;
  comments_count?: number;
  duration_days?: number | null;
  status?: string;
  published_at?: string | null;
};

export type PlacePage = {
  items: Place[];
  page: number;
  lastPage: number;
  perPage: number;
  total: number;
};

export type PlaceFilters = {
  search?: string;
  category_id?: string;
  city?: string;
  price_from?: number;
  price_to?: number;
  with_photo?: boolean;
  favorites?: boolean;
  lat?: number;
  lng?: number;
  sort?: "new" | "nearby" | "popular";
  page?: number;
  per_page?: number;
};

export type PlaceDraft = {
  title: string;
  description?: string;
  category_id: string;
  work_id: number;
  price?: number | null;
  hide_price?: boolean;
  city: string;
  duration_days?: number | null;
  status?: "draft" | "published";
  images?: Array<{ url: string; thumbnail_url?: string; is_cover?: boolean; sort_order?: number }>;
};
