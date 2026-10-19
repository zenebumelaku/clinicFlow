export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
  correlationId?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  gender?: string;
}

export interface PaginatedData<T> {
  data: T[];
  meta: PaginationMeta;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
    readonly correlationId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const ACCESS_TOKEN_KEY = "ClinicFlow_access_token";
const REFRESH_TOKEN_KEY = "ClinicFlow_refresh_token";
const SESSION_EVENT = "ClinicFlow-auth-change";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  authenticated?: boolean;
  retryUnauthorized?: boolean;
};

let refreshInFlight: Promise<boolean> | null = null;

export const tokenStore = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

function apiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configured) {
    throw new Error(
      "VITE_API_BASE_URL is not configured. Set it in the frontend environment.",
    );
  }
  return configured.replace(/\/+$/, "");
}

function toQueryString(
  params?: Record<string, string | number | boolean | undefined>,
): string {
  if (!params) return "";
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

async function readPayload<T>(response: Response): Promise<ApiEnvelope<T>> {
  const payload = (await response.json().catch(() => null)) as
    | (Partial<ApiEnvelope<T>> & {
        message?: string | string[];
        error?: unknown;
      })
    | null;

  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join(". ")
      : payload?.message || response.statusText || "The request failed";
    throw new ApiError(
      message,
      response.status,
      payload?.error,
      payload?.correlationId,
    );
  }

  if (!payload || payload.success !== true || !("data" in payload)) {
    throw new ApiError(
      "The server returned an invalid response.",
      response.status,
    );
  }
  return payload as ApiEnvelope<T>;
}

async function rotateRefreshToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return false;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${apiBaseUrl()}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const result = (
        await readPayload<{
          accessToken: string;
          refreshToken: string;
          user: AuthUser;
        }>(response)
      ).data;
      tokenStore.setTokens(result.accessToken, result.refreshToken);
      localStorage.setItem("ClinicFlow_user", JSON.stringify(result.user));
      window.dispatchEvent(new Event(SESSION_EVENT));
      return true;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      tokenStore.clear();
      localStorage.removeItem("ClinicFlow_user");
      window.dispatchEvent(new Event(SESSION_EVENT));
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export interface AuthUser {
  id: string;
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "RECEPTIONIST" | "DOCTOR" | "PATIENT";
  isActive: boolean;
  createdAt: string;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await apiFetch(path, options);
  return (await readPayload<T>(response)).data;
}

async function apiFetch(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const { authenticated = true, retryUnauthorized = true, ...init } = options;

  const send = () => {
    const headers = new Headers(init.headers);
    if (init.body !== undefined)
      headers.set("Content-Type", "application/json");

    if (authenticated) {
      const accessToken = tokenStore.getAccessToken();
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
    }

    return fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  };

  let response = await send();
  if (response.status === 401 && authenticated && retryUnauthorized) {
    if (await rotateRefreshToken()) {
      response = await send();
    } else {
      window.location.assign("/login");
    }
  }

  return response;
}

export function apiPath(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  return `${path}${toQueryString(params)}`;
}

export async function apiPaginated<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<PaginatedData<T>> {
  const response = await readPayload<T[]>(
    await apiFetch(apiPath(path, params)),
  );
  if (!Array.isArray(response.data)) {
    throw new ApiError(
      "The server returned an invalid paginated response.",
      200,
    );
  }
  return {
    data: response.data,
    meta: response.meta || {
      total: response.data.length,
      page: 1,
      limit: response.data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}
