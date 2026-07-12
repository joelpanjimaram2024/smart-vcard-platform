const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with '/': ${path}`);
  }

  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function missingBackendMessage(path: string): string {
  if (!API_BASE_URL) {
    return `The API endpoint ${path} is unavailable. This Netlify deployment only serves the frontend build; it does not run Express from server.ts. Deploy the backend separately and set VITE_API_BASE_URL before building.`;
  }

  return `The API endpoint ${path} is unavailable. Check that VITE_API_BASE_URL points to a live backend and that CORS allows this frontend.`;
}

export async function readJsonResponse<T = any>(response: Response, path: string): Promise<T> {
  const text = await response.text();

  if (!text) {
    throw new Error(missingBackendMessage(path));
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(missingBackendMessage(path));
  }
}
