import { AuthUser } from '@/store/auth-store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5292/api';

interface LoginResponse {
  token: string;
  user:  AuthUser;
}

// ── Helper: fetch dengan error handling ──────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error(
      `Tidak bisa terhubung ke API (${BASE_URL}). Pastikan backend ASP.NET sedang berjalan.`
    );
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Gunakan pesan dari API jika ada, fallback ke status HTTP
    const msg: string =
      body?.message ??
      body?.title ??
      `Request gagal (${res.status})`;
    throw new Error(msg);
  }

  return body as T;
}

// ── Auth API ─────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    }),

  register: (nama: string, email: string, password: string) =>
    apiFetch<LoginResponse>('/auth/register', {
      method: 'POST',
      body:   JSON.stringify({ nama, email, password }),
    }),
};