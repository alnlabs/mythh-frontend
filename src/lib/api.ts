import type {
  Advertisement,
  Category,
  Comment,
  MeResponse,
  Myth,
  Profile,
  RelatedMyth,
} from "./types";
import { ANONYMOUS_HEADER, anonymousIdForRequest, persistAnonymousId } from "./anonymous-id";

const LOCAL_API_URL = "http://localhost:3001/api/v1";
const PRODUCTION_API_URL = "https://api.mythh.in/api/v1";

function isLocalApiUrl(value?: string) {
  if (!value) return true;
  try {
    const host = new URL(value).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return true;
  }
}

function resolveApiUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  const production = process.env.VERCEL || process.env.NODE_ENV === "production";

  if (configured && !isLocalApiUrl(configured)) {
    return configured.replace(/\/$/, "");
  }

  return production ? PRODUCTION_API_URL : LOCAL_API_URL;
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public payload: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const anonymousId = await anonymousIdForRequest();
  if (anonymousId) headers.set(ANONYMOUS_HEADER, anonymousId);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: init?.cache ?? "no-store",
  });

  const returnedId = response.headers.get(ANONYMOUS_HEADER);
  if (returnedId) persistAnonymousId(returnedId);

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    code?: string;
    [key: string]: unknown;
  };

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload.code ?? "REQUEST_FAILED",
      payload.message ?? "Request failed",
      payload,
    );
  }

  return payload as T;
}

export function googleLoginUrl(next = "/", origin = "") {
  const path = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const params = new URLSearchParams({ next: path });
  if (origin) params.set("origin", origin);
  return `${API_URL}/auth/google?${params.toString()}`;
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  me: () => request<MeResponse>("/me"),
  updateMe: (body: { countryCode?: string | null; defaultCategoryId?: string | null }) =>
    request<{ profile: Profile }>("/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  myMyths: () =>
    request<{
      myths: Array<{
        id: string;
        title: string;
        slug: string;
        verdict: string;
        status: string;
        created_at: string;
      }>;
    }>("/me/myths"),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  myths: (query = "") => request<{ myths: Myth[] }>(`/myths${query}`),
  pickMyth: (query = "") => request<{ slug: string }>(`/myths/random${query}`),
  relatedMyths: (q: string) =>
    request<{ myths: RelatedMyth[] }>(`/myths/related?limit=5&q=${encodeURIComponent(q)}`),
  myth: (idOrSlug: string) => request<{ myth: Myth }>(`/myths/${idOrSlug}`),
  comments: (idOrSlug: string) =>
    request<{ comments: Comment[] }>(`/myths/${idOrSlug}/comments`),
  categories: () => request<{ categories: Category[] }>("/categories"),
  category: (slug: string) =>
    request<{ category: Category; myths: Myth[] }>(`/categories/${slug}`),
  search: (q: string) =>
    request<{ myths: Myth[] }>(`/search?q=${encodeURIComponent(q)}`),
  advertisements: () =>
    request<{ advertisements: Advertisement[] }>("/advertisements"),
  vote: async (idOrSlug: string, value: "TRUE" | "FALSE") => {
    try {
      return await request<{
        vote: { id: string; value: "TRUE" | "FALSE" };
        isCorrect: boolean;
        correctAnswer: "TRUE" | "FALSE" | null;
        alreadyAnswered: boolean;
        myth: Myth;
      }>(`/myths/${idOrSlug}/votes`, {
        method: "POST",
        body: JSON.stringify({ value }),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && error.payload.myth) {
        return error.payload as {
          vote: { id: string; value: "TRUE" | "FALSE" };
          isCorrect: boolean;
          correctAnswer: "TRUE" | "FALSE" | null;
          alreadyAnswered: boolean;
          myth: Myth;
        };
      }
      throw error;
    }
  },
  comment: (idOrSlug: string, content: string) =>
    request<{ comment: { id: string; content: string; created_at: string } }>(
      `/myths/${idOrSlug}/comments`,
      { method: "POST", body: JSON.stringify({ content }) },
    ),
  submitMyth: (body: {
    title: string;
    explanation: string;
    categoryId: string;
    countryCode?: string | null;
    verdict?: "TRUE" | "FALSE" | "PARTIALLY_TRUE" | "UNCERTAIN";
    sources?: { title?: string; url: string }[];
  }) =>
    request<{ myth: { id: string; slug: string; status: string } }>("/myths", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  dashboard: () =>
    request<{
      stats: {
        myths: { pending: number; approved: number; rejected: number };
        comments: number;
        openReports: number;
        users: number;
        advertisements: number;
        votes: number;
      };
      admin: Profile | null;
    }>("/admin/dashboard"),
  pendingMyths: () =>
    request<{
      myths: Array<{
        id: string;
        title: string;
        slug: string;
        verdict: string;
        explanation: string;
        status: string;
      }>;
    }>("/admin/myths/pending"),
  approveMyth: (id: string) =>
    request<{ myth: { id: string; status: string } }>(
      `/admin/myths/${id}/approve`,
      { method: "PATCH" },
    ),
  rejectMyth: (id: string) =>
    request<{ myth: { id: string; status: string } }>(
      `/admin/myths/${id}/reject`,
      { method: "PATCH" },
    ),
  adminComments: () =>
    request<{
      comments: Array<{
        id: string;
        content: string;
        status: "VISIBLE" | "HIDDEN";
        created_at: string;
        myth_id: string;
        user: { id: string; display_name: string | null; email: string | null } | null;
      }>;
    }>("/admin/comments"),
  setCommentStatus: (id: string, status: "VISIBLE" | "HIDDEN") =>
    request<{ comment: { id: string; status: string } }>(`/admin/comments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteAdminComment: (id: string) =>
    request<void>(`/admin/comments/${id}`, { method: "DELETE" }),
  adminReports: () =>
    request<{
      reports: Array<{
        id: string;
        target: string;
        reason: string;
        status: "OPEN" | "REVIEWED" | "DISMISSED";
        myth_id: string | null;
        comment_id: string | null;
        created_at: string;
        reporter: { id: string; display_name: string | null; email: string | null } | null;
      }>;
    }>("/admin/reports"),
  setReportStatus: (id: string, status: "OPEN" | "REVIEWED" | "DISMISSED") =>
    request<{ report: { id: string; status: string } }>(`/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  adminUsers: () =>
    request<{
      users: Array<{
        id: string;
        email: string | null;
        display_name: string | null;
        role: "USER" | "ADMIN";
        status: "ACTIVE" | "SUSPENDED";
        created_at: string;
      }>;
    }>("/admin/users"),
  setUserStatus: (id: string, status: "ACTIVE" | "SUSPENDED") =>
    request<{ user: { id: string; status: string } }>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  adminAdvertisements: () =>
    request<{
      advertisements: Array<{
        id: string;
        title: string;
        body: string | null;
        link_url: string | null;
        is_active: boolean;
        created_at: string;
      }>;
    }>("/admin/advertisements"),
  createAdvertisement: (body: { title: string; body?: string; linkUrl?: string; isActive?: boolean }) =>
    request<{ advertisement: { id: string } }>("/admin/advertisements", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  setAdvertisementActive: (id: string, isActive: boolean) =>
    request<{ advertisement: { id: string; is_active?: boolean } }>(
      `/admin/advertisements/${id}`,
      { method: "PATCH", body: JSON.stringify({ isActive }) },
    ),
  deleteAdvertisement: (id: string) =>
    request<void>(`/admin/advertisements/${id}`, { method: "DELETE" }),
};
