const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers = {}, ...customConfig } = options;

  // Get token from localStorage if available
  const storedToken = typeof window !== "undefined" ? localStorage.getItem("evalia_token") : null;
  const authToken = token || storedToken;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    defaultHeaders["Authorization"] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    method: options.method || "GET",
    headers: {
      ...defaultHeaders,
      ...(headers as Record<string, string>),
    },
    ...customConfig,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // If token expired or unauthorized, clear storage
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("evalia_token");
      localStorage.removeItem("evalia_user");
    }
    const errorMessage = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  if (data && typeof data === "object" && data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return { ...data.data, _raw: data, message: data.message, success: data.success };
  }

  return data;
}

export const api = {
  get: <T = any>(endpoint: string, token?: string) => apiRequest<T>(endpoint, { method: "GET", token }),
  post: <T = any>(endpoint: string, body: any, token?: string) =>
    apiRequest<T>(endpoint, { method: "POST", body: JSON.stringify(body), token }),
  put: <T = any>(endpoint: string, body: any, token?: string) =>
    apiRequest<T>(endpoint, { method: "PUT", body: JSON.stringify(body), token }),
  delete: <T = any>(endpoint: string, token?: string) => apiRequest<T>(endpoint, { method: "DELETE", token }),
};

export default api;
